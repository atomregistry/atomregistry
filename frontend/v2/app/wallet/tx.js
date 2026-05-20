'use strict';

function PW(){this.c=[];}
PW.prototype.v=function(n){var b=[];if(typeof n==='bigint'){while(n>127n){b.push(Number(n&0x7Fn)|0x80);n>>=7n;}b.push(Number(n));}else{n=Math.floor(n);while(n>127){b.push((n&0x7F)|0x80);n=Math.floor(n/128);}b.push(n&0x7F);}this.c.push(new Uint8Array(b));return this;};
PW.prototype.t=function(f,w){return this.v((f<<3)|w);};
PW.prototype.s=function(f,str){if(!str&&str!==0)return this;str=String(str);if(!str.length)return this;var e=new TextEncoder().encode(str);this.t(f,2).v(e.length).c.push(e);return this;};
PW.prototype.b=function(f,arr){if(!arr||!arr.length)return this;var u=arr instanceof Uint8Array?arr:new Uint8Array(arr);this.t(f,2).v(u.length).c.push(u);return this;};
PW.prototype.u64=function(f,n){var bn=typeof n==='bigint'?n:BigInt(Math.floor(Number(n)));if(bn===0n)return this;return this.t(f,0).v(bn);};
PW.prototype.fin=function(){var tot=0;for(var i=0;i<this.c.length;i++)tot+=this.c[i].length;var o=new Uint8Array(tot),p=0;for(var i=0;i<this.c.length;i++){o.set(this.c[i],p);p+=this.c[i].length;}return o;};

function toB64(u8){var s='';for(var i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s);}
function unb64(b){var s=atob(b);var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}

function derToCompact(der){

  if(typeof der === 'string') {
    var clean = der.startsWith('0x') ? der.slice(2) : der;
    if(/^[0-9a-fA-F]+$/.test(clean) && clean.length % 2 === 0) {
      var hexBytes = new Uint8Array(clean.length / 2);
      for(var hi=0; hi<clean.length; hi+=2) hexBytes[hi/2] = parseInt(clean.slice(hi, hi+2), 16);
      der = hexBytes;
    } else {
      der = unb64(clean);
    }
  }
  der = der instanceof Uint8Array ? der : new Uint8Array(der);
  if(der.length === 64) return der;
  if(der[0] !== 0x30) throw new Error('Ledger returned an unsupported signature format');
  var pos=4, rLen=der[3];
  if(der[pos]===0x00){pos++;rLen--;}
  var r=der.slice(pos,pos+rLen); pos+=rLen+2;
  var sLen=der[pos-1]; if(der[pos]===0x00){pos++;sLen--;}
  var s=der.slice(pos,pos+sLen);
  var out=new Uint8Array(64);
  out.set(r,32-r.length); out.set(s,64-s.length);
  return out;
}
function aminoSort(obj){
  if(typeof obj!=='object'||obj===null) return obj;
  if(Array.isArray(obj)) return obj.map(aminoSort);
  return Object.keys(obj).sort().reduce(function(a,k){a[k]=aminoSort(obj[k]);return a;},{});
}
function buildAminoSignDoc(acct, executeMsg, fundsUatom, contractAddr, feeAmount, gasLimit){
  return aminoSort({
    account_number: String(acct.accountNumber),
    chain_id: CFG.CHAIN_ID,
    fee: {
      amount: [{ amount: feeAmount || '10000', denom: CFG.DENOM }],
      gas: String(gasLimit || CFG.GAS_FALLBACK)
    },
    memo: '',
    msgs: [{
      type: 'wasm/MsgExecuteContract',
      value: {
        sender: userAddress,
        contract: contractAddr,
        msg: executeMsg,
        funds: fundsUatom > 0 ? [{ denom: CFG.DENOM, amount: String(fundsUatom) }] : []
      }
    }],
    sequence: String(acct.sequence)
  });
}

function walletKeyLooksHardware(k){
  if(!k) return false;
  var name = String(k.name || k.algo || '').toLowerCase();
  return !!(k.isNanoLedger || k.isKeystone || /ledger|nano|hardware|keystone/.test(name));
}

function getAminoResponsePubKey(aminoResp){
  try {
    var sig = aminoResp && aminoResp.signature ? aminoResp.signature : null;
    var pk = sig && (sig.pub_key || sig.pubKey || sig.public_key || sig.publicKey);
    if(!pk && aminoResp && aminoResp.pub_key) pk = aminoResp.pub_key;
    var value = pk && (pk.value || pk.key || pk.pubkey || pk.pubKey);
    if(value instanceof Uint8Array) return value;
    if(Array.isArray(value)) return new Uint8Array(value);
    if(typeof value === 'string' && value.length) return unb64(value);
  } catch(e) {}
  return null;
}
function ensurePubKeyFromAmino(aminoResp, acct){
  var extracted = getAminoResponsePubKey(aminoResp);
  if(extracted && extracted.length) pubKey = extracted;
  if((!pubKey || !pubKey.length) && acct && acct.pubKey && acct.pubKey.length) pubKey = acct.pubKey;
  if(!pubKey || !pubKey.length) {
    throw new Error('Wallet did not return a public key and none is available on-chain. Send one small transaction from this account first, or use Keplr/Keystone/Ledger where pubkey is exposed.');
  }
}
function extractAminoFeeAmount(signedDoc, fallbackFeeAmount){
  try {
    var amount = signedDoc && signedDoc.fee && signedDoc.fee.amount && signedDoc.fee.amount[0] && signedDoc.fee.amount[0].amount;
    return String(amount || fallbackFeeAmount || '10000');
  } catch(e) { return String(fallbackFeeAmount || '10000'); }
}
function extractAminoGas(signedDoc, fallbackGasLimit){
  try {
    return String((signedDoc && signedDoc.fee && signedDoc.fee.gas) || fallbackGasLimit || CFG.GAS_FALLBACK);
  } catch(e) { return String(fallbackGasLimit || CFG.GAS_FALLBACK); }
}
function extractAminoMemo(signedDoc){
  return String((signedDoc && signedDoc.memo) || '');
}
function rebuildTxRawFromAminoSignature(aminoResp, acct, contractAddr, fallbackExecuteMsg, fallbackFundsUatom, fallbackFeeAmount, fallbackGasLimit){
  var signedDoc = aminoResp && aminoResp.signed ? aminoResp.signed : null;
  var signedMsg = signedDoc && signedDoc.msgs && signedDoc.msgs[0] && signedDoc.msgs[0].value ? signedDoc.msgs[0].value : null;
  var executeMsgFinal = signedMsg && signedMsg.msg ? signedMsg.msg : fallbackExecuteMsg;
  var contractFinal = signedMsg && signedMsg.contract ? signedMsg.contract : contractAddr;
  var fundsFinal = fallbackFundsUatom;
  if(signedMsg && signedMsg.funds && signedMsg.funds[0] && signedMsg.funds[0].amount !== undefined) {
    fundsFinal = parseInt(signedMsg.funds[0].amount || '0');
  }
  var feeAmountFinal = extractAminoFeeAmount(signedDoc, fallbackFeeAmount);
  var gasLimitFinal = extractAminoGas(signedDoc, fallbackGasLimit);
  var memoFinal = extractAminoMemo(signedDoc);
  var msgBytesFinal = encodeMsgExecute(userAddress, contractFinal, executeMsgFinal, fundsFinal);
  var bodyBytesFinal = txBody(msgBytesFinal, memoFinal);
  var authBytesFinal = authInfoAmino(pubKey, acct.sequence, feeAmountFinal, gasLimitFinal);
  return txRaw(bodyBytesFinal, authBytesFinal, unb64(aminoResp.signature.signature));
}

async function walletSign(bodyBytes, authBytesDirect, authBytesAmino, acct, executeMsg, fundsUatom, contractAddr, feeAmount, gasLimit){
  console.log(`[walletSign] walletType=${walletType}, contract=${contractAddr}, amino=${walletPrefersAmino}`);

  var adapter = window.WalletAdapters && window.WalletAdapters.get ? window.WalletAdapters.get(walletType) : null;
  if(!adapter || typeof adapter.signTx !== 'function') {
    throw new Error('No signing adapter available for wallet: ' + (walletType || 'none'));
  }

  return await adapter.signTx({
    bodyBytes: bodyBytes,
    authBytesDirect: authBytesDirect,
    authBytesAmino: authBytesAmino,
    account: acct,
    executeMsg: executeMsg,
    fundsUatom: fundsUatom,
    contractAddr: contractAddr,
    feeAmount: feeAmount,
    gasLimit: gasLimit
  });
}
function encodeMsgExecute(sender, contract, msgObj, fundsUatom) {
  var pw = new PW().s(1,sender).s(2,contract).b(3,new TextEncoder().encode(JSON.stringify(msgObj)));
  if (fundsUatom && fundsUatom > 0) pw.b(5, new PW().s(1,CFG.DENOM).s(2,String(fundsUatom)).fin());
  return pw.fin();
}
function anyMsg(t,v){return new PW().s(1,t).b(2,v).fin();}
function txBody(msgBytes,memo){return new PW().b(1,anyMsg(CFG.TYPE_EXECUTE,msgBytes)).s(2,memo||'').fin();}
function signerInfoDirect(pk,seq){return new PW().b(1,anyMsg(CFG.TYPE_PUBKEY,new PW().b(1,pk).fin())).b(2,new PW().b(1,new PW().u64(1,1n).fin()).fin()).u64(3,seq).fin();}
function signerInfoAmino(pk,seq){return new PW().b(1,anyMsg(CFG.TYPE_PUBKEY,new PW().b(1,pk).fin())).b(2,new PW().b(1,new PW().u64(1,127n).fin()).fin()).u64(3,seq).fin();}
function feeMsg(amt,gas){return new PW().b(1,new PW().s(1,CFG.DENOM).s(2,String(amt)).fin()).u64(2,BigInt(gas)).fin();}
function authInfoDirect(pk,seq,fee,gas){return new PW().b(1,signerInfoDirect(pk,seq)).b(2,feeMsg(fee,gas)).fin();}
function authInfoAmino(pk,seq,fee,gas){return new PW().b(1,signerInfoAmino(pk,seq)).b(2,feeMsg(fee,gas)).fin();}
function txRaw(body,auth,sig){return new PW().b(1,body).b(2,auth).b(3,sig).fin();}

async function restFetch(path) {
  var last;
  for (var i=0;i<CFG.REST.length;i++) {
    try {
      var r = await fetch(CFG.REST[i]+path);
      if (!r.ok) continue;
      var json = await r.json();
      window.AR_NETWORK && (window.AR_NETWORK.online = true);
      try { document.dispatchEvent(new CustomEvent('ar:network', { detail: { online: true } })); } catch(_) {}
      return json;
    } catch(e) { last=e; }
  }
  window.AR_NETWORK && (window.AR_NETWORK.online = false);
  try { document.dispatchEvent(new CustomEvent('ar:network', { detail: { online: false } })); } catch(_) {}
  throw last||new Error('Cosmos Hub is unreachable - all REST endpoints failed. Check your connection or try again in a moment.');
}

async function queryContract(contract, query) {
  var enc = btoa(JSON.stringify(query));
  var d = await restFetch('/cosmwasm/wasm/v1/contract/'+contract+'/smart/'+enc);
  return d.data;
}

function pubKeyFromAny(pk){
  try {
    if(!pk) return null;
    var value = pk.value || pk.key || pk.pub_key || pk.pubKey;
    if(value instanceof Uint8Array) return value;
    if(Array.isArray(value)) return new Uint8Array(value);
    if(typeof value === 'string' && value.length) return unb64(value);
  } catch(e) {}
  return null;
}

async function getAccount(addr) {
  var d = await restFetch('/cosmos/auth/v1beta1/accounts/'+addr);
  var acc = (d&&d.account)||d;
  for(var g=0;g<5&&acc;g++){
    if(acc.base_vesting_account) acc=acc.base_vesting_account.base_account||acc.base_vesting_account;
    else if(acc.base_account) acc=acc.base_account;
    else break;
  }
  return {
    accountNumber: BigInt(acc.account_number||0),
    sequence: BigInt(acc.sequence||0),
    pubKey: pubKeyFromAny(acc.pub_key || acc.public_key || acc.pubKey)
  };
}

async function simulateGas(bodyBytes, authBytes) {
  var sim = new PW().b(1,bodyBytes).b(2,authBytes).b(3,new Uint8Array(64)).fin();
  for (var i=0;i<CFG.REST.length;i++) {
    try {
      var r = await fetch(CFG.REST[i]+'/cosmos/tx/v1beta1/simulate', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({tx_bytes: toB64(sim)})
      });
      if(!r.ok) continue;
      var j=await r.json();
      var gas=parseInt((j.gas_info||{}).gas_used||0);
      if(gas>50000) return Math.ceil(gas*CFG.GAS_ADJ);
    } catch(e){}
  }
  return CFG.GAS_FALLBACK;
}

async function broadcast(rawBytes) {
  var last;
  for(var i=0;i<CFG.REST.length;i++){
    try{
      var r=await fetch(CFG.REST[i]+'/cosmos/tx/v1beta1/txs',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({tx_bytes:toB64(rawBytes),mode:'BROADCAST_MODE_SYNC'})
      });
      if(!r.ok) throw new Error('HTTP '+r.status);
      var j=await r.json();
      var res=j.tx_response||j;
      return {code:parseInt(res.code||0),txhash:res.txhash||'',rawLog:res.raw_log||''};
    }catch(e){last=e;}
  }
  throw last||new Error('Broadcast failed');
}

async function signAndBroadcast(executeMsg, fundsUatom, stepsEl, barEl, stepLabels) {
  if (stepsEl) {
    stepsEl.innerHTML = '';
    stepLabels.forEach(function(label, idx) {
      var div = document.createElement('div');
      div.id = stepsEl.id+'_s'+(idx+1);
      div.className = 'flex items-center gap-2 text-xs text-gray-600';
      div.innerHTML = '<span class="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs si" style="min-width:1.25rem">'+(idx+1)+'</span><span>'+label+'</span>';
      stepsEl.appendChild(div);
    });
  }
  if(barEl) barEl.style.width='0%';

  function setStep(i, state) {
    if(!stepsEl) return;
    var el = stepsEl.querySelector('#'+stepsEl.id+'_s'+i);
    if(!el) return;
    el.className = 'flex items-center gap-2 text-xs '+(state==='active'?'text-white':state==='done'?'text-cyan-400':state==='error'?'text-red-400':'text-gray-600');
    el.querySelector('.si').textContent = state==='done'?'✓':state==='error'?'✗':String(i);
    if(barEl) barEl.style.width = (state==='done'?(i/stepLabels.length*100):(((i-0.5)/stepLabels.length)*100))+'%';
  }

  try {
    setStep(1,'active');
    var msgBytes  = encodeMsgExecute(userAddress, CFG.TLD_MANAGER, executeMsg, fundsUatom);
    var bodyBytes = txBody(msgBytes);
    setStep(1,'done');

    setStep(2,'active');
    if(walletType==='ledger'&&(!ledgerApp||!pubKey)) await reconnectLedgerDevice();
    var acct            = await getAccount(userAddress);
    var ph              = CFG.GAS_FALLBACK;
    var phFee           = String(Math.ceil(ph*CFG.GAS_PRICE));
    var authBytesDirect = pubKey ? authInfoDirect(pubKey, acct.sequence, phFee, ph) : new Uint8Array(0);
    var gasLimit        = pubKey ? await simulateGas(bodyBytes, authBytesDirect) : CFG.GAS_FALLBACK;
    var feeAmount       = String(Math.ceil(gasLimit*CFG.GAS_PRICE));
    authBytesDirect     = pubKey ? authInfoDirect(pubKey, acct.sequence, feeAmount, gasLimit) : new Uint8Array(0);
    var authBytesAmino  = pubKey ? authInfoAmino(pubKey, acct.sequence, feeAmount, gasLimit) : new Uint8Array(0);
    setStep(2,'done');

    setStep(3,'active');
    toast('Awaiting wallet signature…','ok');
    var rawBytes = await walletSign(bodyBytes,authBytesDirect,authBytesAmino,acct,executeMsg,fundsUatom,CFG.TLD_MANAGER,feeAmount,gasLimit);
    setStep(3,'done');

    setStep(4,'active');
    toast('Broadcasting to Cosmos Hub…','ok');
    var result = await broadcast(rawBytes);
    if(result.code!==0) throw new Error('Chain error ('+result.code+'): '+result.rawLog.slice(0,200));
    setStep(4,'done');
    if(barEl) barEl.style.width='100%';
    return result;
  } catch(e) {
    if(stepsEl) {
      var els = stepsEl.querySelectorAll('.text-white');
      els.forEach(function(el){ el.className=el.className.replace('text-white','text-red-400'); el.querySelector('.si').textContent='✗'; });
    }
    throw e;
  }
}

async function signAndBroadcastRegistry(contract, executeMsg, fundsUatom, stepsEl, barEl, stepLabels) {
  if(stepsEl) {
    stepsEl.innerHTML='';
    stepLabels.forEach(function(label,idx){
      var div=document.createElement('div');
      div.id=stepsEl.id+'_s'+(idx+1);
      div.className='flex items-center gap-2 text-xs text-gray-600';
      div.innerHTML='<span class="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-xs si" style="min-width:1.25rem">'+(idx+1)+'</span><span>'+label+'</span>';
      stepsEl.appendChild(div);
    });
  }
  if(barEl) barEl.style.width='0%';

  function setStep(i,state){
    if(!stepsEl) return;
    var el=stepsEl.querySelector('#'+stepsEl.id+'_s'+i);
    if(!el) return;
    el.className='flex items-center gap-2 text-xs '+(state==='active'?'text-white':state==='done'?'text-cyan-400':state==='error'?'text-red-400':'text-gray-600');
    el.querySelector('.si').textContent=state==='done'?'✓':state==='error'?'✗':String(i);
    if(barEl) barEl.style.width=(state==='done'?(i/stepLabels.length*100):(((i-0.5)/stepLabels.length)*100))+'%';
  }

  try {
    setStep(1,'active');
    var msgBytes=encodeMsgExecute(userAddress,contract,executeMsg,fundsUatom);
    var bodyBytes=txBody(msgBytes);
    setStep(1,'done');
    setStep(2,'active');
    if(walletType==='ledger'&&(!ledgerApp||!pubKey)) await reconnectLedgerDevice();
    var acct=await getAccount(userAddress);
    var ph=CFG.GAS_FALLBACK;
    var phFee=String(Math.ceil(ph*CFG.GAS_PRICE));
    var authBytesDirect=pubKey ? authInfoDirect(pubKey,acct.sequence,phFee,ph) : new Uint8Array(0);
    var gasLimit=pubKey ? await simulateGas(bodyBytes,authBytesDirect) : CFG.GAS_FALLBACK;
    var feeAmount=String(Math.ceil(gasLimit*CFG.GAS_PRICE));
    authBytesDirect=pubKey ? authInfoDirect(pubKey,acct.sequence,feeAmount,gasLimit) : new Uint8Array(0);
    var authBytesAmino=pubKey ? authInfoAmino(pubKey,acct.sequence,feeAmount,gasLimit) : new Uint8Array(0);
    setStep(2,'done');
    setStep(3,'active');
    toast('Awaiting wallet signature…','ok');
    var rawBytes=await walletSign(bodyBytes,authBytesDirect,authBytesAmino,acct,executeMsg,fundsUatom,contract,feeAmount,gasLimit);
    setStep(3,'done');
    setStep(4,'active');
    toast('Broadcasting…','ok');
    var result=await broadcast(rawBytes);
    if(result.code!==0) throw new Error('Chain error ('+result.code+'): '+result.rawLog.slice(0,200));
    setStep(4,'done');
    if(barEl) barEl.style.width='100%';
    return result;
  } catch(e) {
    if(stepsEl){var els=stepsEl.querySelectorAll('.text-white');els.forEach(function(el){el.className=el.className.replace('text-white','text-red-400');el.querySelector('.si').textContent='✗';});}
    throw e;
  }
}

var TX_STEPS = ['Building transaction','Fetching account & simulating gas','Awaiting wallet signature','Broadcasting to Cosmos Hub'];

async function executeContract(contract, msg, fundsUatom) {
  if (!contract) throw new Error("Missing contract address");
  if (!msg || typeof msg !== "object") throw new Error("Missing execute msg");
  if (!userAddress) throw new Error("Connect wallet first");
  if (!pubKey) throw new Error("Missing wallet public key");

  fundsUatom = Number(fundsUatom || 0);

  var msgBytes = encodeMsgExecute(userAddress, contract, msg, fundsUatom);
  var bodyBytes = txBody(msgBytes);
  var acct = await getAccount(userAddress);

  var ph = CFG.GAS_FALLBACK;
  var phFee = String(Math.ceil(ph * CFG.GAS_PRICE));
  var authBytesDirect = authInfoDirect(pubKey, acct.sequence, phFee, ph);
  var gasLimit = await simulateGas(bodyBytes, authBytesDirect);
  var feeAmount = String(Math.ceil(gasLimit * CFG.GAS_PRICE));
  authBytesDirect = authInfoDirect(pubKey, acct.sequence, feeAmount, gasLimit);
  var authBytesAmino = authInfoAmino(pubKey, acct.sequence, feeAmount, gasLimit);

  var rawBytes = await walletSign(bodyBytes, authBytesDirect, authBytesAmino, acct, msg, fundsUatom, contract, feeAmount, gasLimit);
  var result = await broadcast(rawBytes);

  if (result.code !== 0) {
    throw new Error("Chain error (" + result.code + "): " + String(result.rawLog || result.raw_log || "").slice(0, 200));
  }

  return result;
}

window.executeContract = executeContract;

