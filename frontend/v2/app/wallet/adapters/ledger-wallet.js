'use strict';

async function reconnectLedgerDevice(){
  if(CFG.LEDGER_MOCK){
    var mockPubKey = new Uint8Array([
      0x02,0x79,0xBE,0x66,0x7E,0xF9,0xDC,0xBB,0xAC,0x55,0xA0,0x62,0x95,0xCE,
      0x87,0x0B,0x07,0x02,0x9B,0xFC,0xDB,0x2D,0xCE,0x28,0xD9,0x59,0xF2,0x81,
      0x5B,0x16,0xF8,0x17,0x98
    ]);
    var mockPrivKey = new Uint8Array(32); mockPrivKey[31] = 1;
    ledgerApp = {
      sign: async function(path, docBytes){
        try {
          var key = await crypto.subtle.importKey('raw', mockPrivKey, {name:'ECDSA',namedCurve:'P-256'}, false, ['sign']);
          var derSig = new Uint8Array(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'}, key, docBytes));
          return {error_message:'No errors', signature: derSig};
        } catch(e){
          var fakeDer = new Uint8Array(72);
          fakeDer[0]=0x30; fakeDer[1]=0x44;
          fakeDer[2]=0x02; fakeDer[3]=0x20;
          fakeDer[36]=0x02; fakeDer[37]=0x20;
          return {error_message:'No errors', signature: fakeDer};
        }
      }
    };
    userAddress = CFG.LEDGER_MOCK_ADDR;
    pubKey = mockPubKey;
    walletType = 'ledger';
    return;
  }

  if(ledgerTransport){ try{ await ledgerTransport.close(); }catch(e){} ledgerTransport = null; }
  ledgerApp = null;
  toast('Opening Ledger - unlock device, open Cosmos app…','ok');
  var t = await import('https://esm.sh/@ledgerhq/hw-transport-webhid@6.34.0');
  var WebHID = t.default || t;
  var a = await import('https://esm.sh/@ledgerhq/hw-app-cosmos@6.35.1');
  var CosmosApp = a.default || a;
  ledgerTransport = await WebHID.create();
  ledgerApp = new CosmosApp(ledgerTransport);
  var addr = await ledgerApp.getAddress("44'/118'/0'/0/0",'cosmos');
  if(addr.error_message && addr.error_message !== 'No errors') throw new Error(addr.error_message);
  userAddress = addr.address;
  pubKey = addr.publicKey;
  walletType = 'ledger';
}

(function(){
  window.WalletAdapters.register('ledger', {
    id: 'ledger',
    label: 'Ledger',

    async isAvailable(){ return true; },

    async connect(){
      await reconnectLedgerDevice();
      return {
        address: userAddress,
        pubKey: pubKey,
        prefersAmino: true,
        meta: { providerName: 'Ledger', accountName: 'Ledger' }
      };
    },

    async signTx(ctx){
      if (!ledgerApp || !pubKey) await reconnectLedgerDevice();
      if (!ledgerApp) throw new Error('Ledger device not connected');

      console.log('[Ledger] Forcing Amino JSON signing path (bypassing Direct)');
      var signDoc = buildAminoSignDoc(ctx.account, ctx.executeMsg, ctx.fundsUatom, ctx.contractAddr, ctx.feeAmount, ctx.gasLimit);
      var signJson = JSON.stringify(signDoc);
      var signBytes = new TextEncoder().encode(signJson);
      var res = await ledgerApp.sign("44'/118'/0'/0/0", signBytes);

      if (!res || (res.error_message && res.error_message !== 'No errors') || (res.return_code && res.return_code !== 0x9000)) {
        throw new Error('Ledger signing failed: ' + (res && res.error_message ? res.error_message : 'Unknown error'));
      }

      var signature = derToCompact(res.signature);
      return txRaw(ctx.bodyBytes, ctx.authBytesAmino, signature);
    },

    async disconnect(){
      if(ledgerTransport){ try{ await ledgerTransport.close(); }catch(e){} ledgerTransport = null; }
      ledgerApp = null;
    }
  });
})();
