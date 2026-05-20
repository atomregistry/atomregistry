'use strict';

var cosmostationProviderMode = null;
var cosmostationChainName = null;

function normalizeCosmostationAccount(acc) {
  if (!acc) return null;
  var address = acc.address || (acc.account && acc.account.address);
  var publicKey = acc.publicKey || acc.pubKey || acc.public_key || (acc.account && (acc.account.publicKey || acc.account.pubKey || acc.account.public_key));
  var accountName = acc.name || acc.walletName || acc.accountName || acc.label || (acc.account && (acc.account.name || acc.account.walletName || acc.account.accountName || acc.account.label));
  if (!address) return null;
  return { address: address, publicKey: publicKey || null, accountName: accountName || '' };
}

function getCosmostationChainCandidates() {
  var out = [];
  function add(v) {
    v = String(v || '').trim();
    if (v && out.indexOf(v) === -1) out.push(v);
  }
  add(CFG.CHAIN_ID || 'cosmoshub-4');
  add('cosmoshub');
  add('cosmos');
  return out;
}

async function getCosmostationSupportedChains(nativeCosmos) {
  if(!nativeCosmos) return null;
  try {
    var supported = await nativeCosmos.request({ method: 'cos_supportedChainIds' });
    console.log('[Cosmostation] supported chains:', supported);
    return supported;
  } catch(e) {
    console.warn('[Cosmostation] cos_supportedChainIds failed', e);
    return null;
  }
}

function buildCosmostationConnectError(lastErr, candidates) {
  var msg = lastErr && lastErr.message ? lastErr.message : String(lastErr || 'Unknown Cosmostation error');
  if (/internal json-rpc error|account|wallet|not initialized|not found/i.test(msg)) {
    return new Error(
      'Cosmostation is installed, but no Cosmos wallet/account seems available. ' +
      'Open Cosmostation in Chrome, create or import a wallet, enable Cosmos Hub / ATOM, refresh this page, and try again. ' +
      'Original error: ' + msg
    );
  }
  return new Error('Cosmostation failed after trying chain names [' + candidates.join(', ') + ']: ' + msg);
}

function extractCosmostationSignature(resp) {
  if (!resp) throw new Error('Cosmostation did not return a signature');
  if (typeof resp.signature === 'string') return resp.signature;
  if (Array.isArray(resp.signatures) && resp.signatures.length) {
    if (typeof resp.signatures[0] === 'string') return resp.signatures[0];
    if (resp.signatures[0] && typeof resp.signatures[0].signature === 'string') return resp.signatures[0].signature;
  }
  if (resp.signature && typeof resp.signature.signature === 'string') return resp.signature.signature;
  throw new Error('Unsupported Cosmostation signature response format');
}

(function(){
  window.WalletAdapters.register('cosmostation', {
    id: 'cosmostation',
    label: 'Cosmostation',

    async isAvailable(){
      return !!(
        window.cosmostation &&
        ((window.cosmostation.cosmos && typeof window.cosmostation.cosmos.request === 'function') ||
         (window.cosmostation.providers && window.cosmostation.providers.keplr))
      );
    },

    async connect(){
      var nativeCosmos = window.cosmostation && window.cosmostation.cosmos && typeof window.cosmostation.cosmos.request === 'function'
        ? window.cosmostation.cosmos
        : null;
      var cosmoKeplr = window.cosmostation && window.cosmostation.providers && window.cosmostation.providers.keplr
        ? window.cosmostation.providers.keplr
        : null;

      if(!nativeCosmos && !cosmoKeplr) throw new Error('Cosmostation extension not found');

      var connected = false;
      var lastErr = null;
      var candidates = getCosmostationChainCandidates();

      if(nativeCosmos) await getCosmostationSupportedChains(nativeCosmos);

      if(nativeCosmos){
        for(var ci=0; ci<candidates.length && !connected; ci++){
          try {
            var chainNameTry = candidates[ci];
            console.log('[Cosmostation] trying native cos_requestAccount with chainName=', chainNameTry);
            var rawAcc = await nativeCosmos.request({
              method: 'cos_requestAccount',
              params: { chainName: chainNameTry }
            });
            var acc = normalizeCosmostationAccount(rawAcc);
            if(!acc || !acc.address) throw new Error('Cosmostation native provider did not return an account');
            cosmostationProviderMode = 'native';
            cosmostationChainName = chainNameTry;
            connected = true;
            return {
              address: acc.address,
              pubKey: acc.publicKey,
              prefersAmino: false,
              meta: { providerMode: cosmostationProviderMode, chainName: cosmostationChainName, accountName: acc.accountName || '', providerName: 'Cosmostation' }
            };
          } catch(nativeErr) {
            lastErr = nativeErr;
            console.warn('[Cosmostation] native provider failed for chain candidate', candidates[ci], nativeErr);
          }
        }
      }

      if(!connected && cosmoKeplr){
        for(var ki=0; ki<candidates.length && !connected; ki++){
          try {
            var chainIdTry = candidates[ki] === 'cosmoshub' || candidates[ki] === 'cosmos' ? CFG.CHAIN_ID : candidates[ki];
            console.log('[Cosmostation] trying keplr-compatible provider with chainId=', chainIdTry);
            await cosmoKeplr.enable(chainIdTry);
            var ck = await cosmoKeplr.getKey(chainIdTry);
            if(!ck || !ck.bech32Address) throw new Error('Cosmostation Keplr-compatible provider did not return an account');
            cosmostationProviderMode = 'keplr-provider';
            cosmostationChainName = chainIdTry;
            connected = true;
            return {
              address: ck.bech32Address,
              pubKey: ck.pubKey,
              prefersAmino: false,
              meta: { providerMode: cosmostationProviderMode, chainName: cosmostationChainName, accountName: ck.name || '', providerName: 'Cosmostation', key: ck }
            };
          } catch(providerErr) {
            lastErr = providerErr;
            console.warn('[Cosmostation] keplr-compatible provider failed for chain candidate', candidates[ki], providerErr);
          }
        }
      }

      throw buildCosmostationConnectError(lastErr, candidates);
    },

    async signTx(ctx){
      var nativeCosmos = window.cosmostation && window.cosmostation.cosmos && typeof window.cosmostation.cosmos.request === 'function'
        ? window.cosmostation.cosmos
        : null;
      var cosmoKeplr = window.cosmostation && window.cosmostation.providers && window.cosmostation.providers.keplr
        ? window.cosmostation.providers.keplr
        : null;

      var signErr = null;
      var nativeChainCandidates = [];
      function addNativeChain(v){
        v = String(v || '').trim();
        if(v && nativeChainCandidates.indexOf(v) === -1) nativeChainCandidates.push(v);
      }
      addNativeChain(cosmostationChainName || (walletMeta && walletMeta.chainName));
      addNativeChain(CFG.CHAIN_ID);
      addNativeChain('cosmoshub');
      addNativeChain('cosmos');

      async function signWithNativeCosmostation(chainNameTry){
        var resp = await nativeCosmos.request({
          method: 'cos_signDirect',
          params: {
            chainName: chainNameTry,
            doc: {
              chain_id: CFG.CHAIN_ID,
              body_bytes: toB64(ctx.bodyBytes),
              auth_info_bytes: toB64(ctx.authBytesDirect),
              account_number: String(ctx.account.accountNumber)
            }
          }
        });
        return txRaw(ctx.bodyBytes, ctx.authBytesDirect, unb64(extractCosmostationSignature(resp)));
      }

      async function signWithKeplrCompatibleCosmostation(){
        var chainIdTry = cosmostationChainName && cosmostationProviderMode === 'keplr-provider' ? cosmostationChainName : CFG.CHAIN_ID;
        var resp = await cosmoKeplr.signDirect(chainIdTry, userAddress, {
          bodyBytes: ctx.bodyBytes,
          authInfoBytes: ctx.authBytesDirect,
          chainId: CFG.CHAIN_ID,
          accountNumber: String(ctx.account.accountNumber)
        });
        return txRaw(resp.signed.bodyBytes, resp.signed.authInfoBytes, unb64(resp.signature.signature));
      }

      if((cosmostationProviderMode || (walletMeta && walletMeta.providerMode)) === 'native' && nativeCosmos){
        for(var ni=0; ni<nativeChainCandidates.length; ni++){
          try { return await signWithNativeCosmostation(nativeChainCandidates[ni]); }
          catch(e){ signErr = e; console.warn('[Cosmostation] native signing failed for chainName', nativeChainCandidates[ni], e); }
        }
        if(cosmoKeplr) return await signWithKeplrCompatibleCosmostation();
      }

      if((cosmostationProviderMode || (walletMeta && walletMeta.providerMode)) === 'keplr-provider' && cosmoKeplr){
        try { return await signWithKeplrCompatibleCosmostation(); }
        catch(e){ signErr = e; console.warn('[Cosmostation] keplr-compatible signing failed, trying native provider', e); }
        if(nativeCosmos){
          for(var nj=0; nj<nativeChainCandidates.length; nj++){
            try { return await signWithNativeCosmostation(nativeChainCandidates[nj]); }
            catch(e2){ signErr = e2; console.warn('[Cosmostation] native fallback signing failed for chainName', nativeChainCandidates[nj], e2); }
          }
        }
      }

      if(nativeCosmos){
        for(var nk=0; nk<nativeChainCandidates.length; nk++){
          try { return await signWithNativeCosmostation(nativeChainCandidates[nk]); }
          catch(e3){ signErr = e3; console.warn('[Cosmostation] native last-resort signing failed for chainName', nativeChainCandidates[nk], e3); }
        }
      }

      if(cosmoKeplr){
        try { return await signWithKeplrCompatibleCosmostation(); }
        catch(e4){ signErr = e4; console.warn('[Cosmostation] keplr-compatible last-resort signing failed', e4); }
      }

      throw signErr || new Error('Cosmostation signing provider unavailable');
    }
  });
})();
