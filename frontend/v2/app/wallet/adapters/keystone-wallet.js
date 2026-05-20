'use strict';

async function loadKeystoneLibraries(){
  if(keystoneSdk && keystoneViewSdk) return {KeystoneSDK: keystoneSdk, view: keystoneViewSdk};
  var core = await import('https://esm.sh/@keystonehq/keystone-sdk@0.11.7?bundle');
  var ui = await import('https://esm.sh/@keystonehq/sdk@0.22.1?bundle');
  var KeystoneSDK = core.default || core.KeystoneSDK;
  keystoneSdk = new KeystoneSDK({ origin: 'Atom Registry' });
  var viewSdk = ui.default || ui.viewSdk;
  if(!keystoneBootstrapped){ viewSdk.bootstrap(); keystoneBootstrapped = true; }
  keystoneViewSdk = await viewSdk.getSdk();
  return {KeystoneSDK: KeystoneSDK, view: keystoneViewSdk, ui: ui};
}

function selectCosmosKeystoneAccount(multi){
  if(!multi || !multi.keys || !multi.keys.length) throw new Error('No accounts found in Keystone QR');
  var key = multi.keys.find(function(k){ return String(k.path||'').indexOf("44'/118'") >= 0; }) ||
            multi.keys.find(function(k){ return /cosmos|atom/i.test(String(k.chain||'') + ' ' + String(k.name||'')); });
  if(!key) throw new Error('Keystone QR does not contain a Cosmos Hub account. Export a Cosmos account QR from Keystone Pro.');
  return key;
}

async function deriveCosmosAddressFromPubKeyHex(pubHex){
  var amino = await import('https://esm.sh/@cosmjs/amino@0.38.1?bundle');
  var pubBytes = hexToBytes(pubHex);
  var pubkeyObj = amino.encodeSecp256k1Pubkey(pubBytes);
  return {
    address: amino.pubkeyToAddress(pubkeyObj, 'cosmos'),
    rawAddressHex: bytesToHex(amino.pubkeyToRawAddress(pubkeyObj)),
    pubBytes: pubBytes
  };
}

async function connectNativeKeystone(){
  var libs = await loadKeystoneLibraries();
  var SupportedResult = (await import('https://esm.sh/@keystonehq/sdk@0.22.1?bundle')).SupportedResult;
  toast('Scan the Cosmos account QR from Keystone Pro…','ok');
  var readResult = await libs.view.read([SupportedResult.UR_CRYPTO_MULTI_ACCOUNTS], {
    title: 'Scan Keystone Pro account',
    description: 'On Keystone Pro: Cosmos account → export / connect QR. This does not use Keplr.'
  });
  if(!readResult || readResult.status !== 'success') throw new Error('Keystone account scan cancelled');
  var multi = keystoneSdk.parseMultiAccounts(readResult.result);
  var acct = selectCosmosKeystoneAccount(multi);
  var derived = await deriveCosmosAddressFromPubKeyHex(acct.publicKey);
  userAddress = derived.address;
  pubKey = derived.pubBytes;
  walletType = 'keystone';
  walletPrefersAmino = true;
  keystoneAccount = {
    path: acct.path || "m/44'/118'/0'/0/0",
    xfp: acct.xfp || multi.masterFingerprint,
    rawAddressHex: derived.rawAddressHex,
    publicKeyHex: acct.publicKey,
    device: multi.device || 'Keystone Pro',
    name: acct.name || acct.label || multi.name || multi.device || 'Keystone'
  };
  if(!keystoneAccount.xfp) throw new Error('Keystone QR did not expose master fingerprint (xfp). Update firmware and export the Cosmos account QR again.');
  try{ sessionStorage.setItem('ar_keystone_account', JSON.stringify({address:userAddress, pubKey:bytesToHex(pubKey), account:keystoneAccount})); }catch(e){}
}

async function signWithNativeKeystone(ctx){
  if(!keystoneAccount) {
    try {
      var saved = JSON.parse(sessionStorage.getItem('ar_keystone_account') || 'null');
      if(saved && saved.account) keystoneAccount = saved.account;
    } catch(e) {}
  }
  if(!keystoneAccount) throw new Error('Keystone account metadata missing. Reconnect Keystone Pro natively.');
  var libs = await loadKeystoneLibraries();
  var ui = await import('https://esm.sh/@keystonehq/sdk@0.22.1?bundle');
  var core = await import('https://esm.sh/@keystonehq/keystone-sdk@0.11.7?bundle');
  var requestId = (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8);return v.toString(16);})).toUpperCase();
  var signDoc = buildAminoSignDoc(ctx.account, ctx.executeMsg, ctx.fundsUatom, ctx.contractAddr, ctx.feeAmount, ctx.gasLimit);
  var signJson = JSON.stringify(signDoc);
  var ur = keystoneSdk.cosmos.generateSignRequest({
    requestId: requestId,
    signData: stringToHex(signJson),
    dataType: core.KeystoneCosmosSDK.DataType.amino,
    accounts: [{
      path: keystoneAccount.path || "m/44'/118'/0'/0/0",
      xfp: keystoneAccount.xfp,
      address: keystoneAccount.rawAddressHex || userAddress
    }],
    origin: 'Atom Registry'
  });
  toast('Showing Keystone signing QR… scan it on Keystone Pro.','ok');
  var playStatus = await libs.view.play(ur, {
    title: 'Keystone Pro native signing',
    description: 'Scan this QR with Keystone Pro. Confirm on device, then click Finish here.',
    refreshSpeed: 110,
    maxFragmentLength: 350
  });
  if(playStatus !== ui.PlayStatus.success) throw new Error('Keystone signing QR cancelled');
  toast('Now scan the signature QR from Keystone Pro…','ok');
  var sigResult = await libs.view.read([ui.SupportedResult.UR_COSMOS_SIGNATURE], {
    title: 'Scan Keystone signature',
    description: 'After approving on Keystone Pro, scan the cosmos-signature QR shown on the device.',
    URTypeErrorMessage: 'This is not a Cosmos signature QR from Keystone.'
  });
  if(!sigResult || sigResult.status !== ui.ReadStatus.success) throw new Error('Keystone signature scan cancelled');
  var parsed = keystoneSdk.cosmos.parseSignature(sigResult.result);
  if(parsed.requestId && parsed.requestId.toUpperCase() !== requestId.toUpperCase()) throw new Error('Keystone signature requestId mismatch');
  var sig = hexToBytes(parsed.signature);
  sig = derToCompact(sig);
  if(parsed.publicKey) pubKey = hexToBytes(parsed.publicKey);
  return txRaw(ctx.bodyBytes, ctx.authBytesAmino, sig);
}

(function(){
  window.WalletAdapters.register('keystone', {
    id: 'keystone',
    label: 'Keystone',

    async isAvailable(){ return true; },

    async connect(){
      await connectNativeKeystone();
      return {
        address: userAddress,
        pubKey: pubKey,
        prefersAmino: true,
        meta: { account: keystoneAccount }
      };
    },

    async signTx(ctx){ return await signWithNativeKeystone(ctx); }
  });
})();
