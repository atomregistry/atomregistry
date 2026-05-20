'use strict';

(function(){
  window.WalletAdapters.register('keplr', {
    id: 'keplr',
    label: 'Keplr',

    async isAvailable(){ return !!window.keplr; },

    async connect(){
      if(!window.keplr) throw new Error('Keplr not found');
      await window.keplr.enable(CFG.CHAIN_ID);
      var k = await window.keplr.getKey(CFG.CHAIN_ID);
      if(!k || !k.bech32Address) throw new Error('Keplr did not return an account');
      return {
        address: k.bech32Address,
        pubKey: k.pubKey,
        prefersAmino: walletKeyLooksHardware(k),
        meta: { key: k, accountName: k.name || '', providerName: 'Keplr' }
      };
    },

    async signTx(ctx){
      var w = window.keplr;
      if(!w) throw new Error('Keplr wallet not available');

      try {
        var key = await w.getKey(CFG.CHAIN_ID);
        if(walletKeyLooksHardware(key)) walletPrefersAmino = true;
      } catch(e) {}

      if(walletPrefersAmino){
        if(typeof w.signAmino !== 'function') throw new Error('Keplr signAmino unavailable. Update Keplr or use native Ledger.');
        console.log('[Keplr] Forcing Amino signing path for Ledger-compatible signing');
        var aminoResp = await w.signAmino(CFG.CHAIN_ID, userAddress, buildAminoSignDoc(ctx.account, ctx.executeMsg, ctx.fundsUatom, ctx.contractAddr, ctx.feeAmount, ctx.gasLimit), {
          preferNoSetFee: true,
          preferNoSetMemo: true
        });
        return rebuildTxRawFromAminoSignature(aminoResp, ctx.account, ctx.contractAddr, ctx.executeMsg, ctx.fundsUatom, ctx.feeAmount, ctx.gasLimit);
      }

      try {
        var resp = await w.signDirect(CFG.CHAIN_ID, userAddress, {
          bodyBytes: ctx.bodyBytes,
          authInfoBytes: ctx.authBytesDirect,
          chainId: CFG.CHAIN_ID,
          accountNumber: String(ctx.account.accountNumber)
        });
        var sig = unb64(resp.signature.signature);
        return txRaw(resp.signed.bodyBytes, resp.signed.authInfoBytes, sig);
      } catch(err) {
        var msg = err && err.message ? err.message : String(err || '');
        if(w && typeof w.signAmino === 'function' && (/SIGN_MODE_DIRECT/i.test(msg) || /Incompatible Signing Requested/i.test(msg) || /can'?t be signed on Ledger/i.test(msg) || /ledger/i.test(msg))) {
          walletPrefersAmino = true;
          console.log('[Keplr] Direct signing rejected by hardware-backed account, retrying with Amino');
          var fallbackResp = await w.signAmino(CFG.CHAIN_ID, userAddress, buildAminoSignDoc(ctx.account, ctx.executeMsg, ctx.fundsUatom, ctx.contractAddr, ctx.feeAmount, ctx.gasLimit), {
            preferNoSetFee: true,
            preferNoSetMemo: true
          });
          return rebuildTxRawFromAminoSignature(fallbackResp, ctx.account, ctx.contractAddr, ctx.executeMsg, ctx.fundsUatom, ctx.feeAmount, ctx.gasLimit);
        }
        throw err;
      }
    }
  });
})();
