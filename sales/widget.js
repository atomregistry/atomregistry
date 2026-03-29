(function(global){
  'use strict';

  const DEFAULTS = {
    title: 'Pay with ATOM',
    buttonText: 'Pay in ATOM',
    description: 'Accept a Cosmos-native ATOM payment directly from this page.',
    walletAddress: '',
    amountAtom: '1',
    itemName: 'Order',
    imageUrl: '',
    memo: '',
    successUrl: '',
    downloadUrl: '',
    verifyEndpoint: '',
    postPaymentAction: 'redirect',
    mode: 'full',
    theme: 'registry',
    primaryColor: '#9333ea',
    accentColor: '#22d3ee',
    width: '420px',
    radius: 20,
    showQr: true,
    showCopy: true,
    showMintscan: true,
    thankYouMessage: 'Thank you. Once your ATOM payment is sent, click continue to complete the handoff.',
    enableKeplr: true,
    allowManualFallback: true,
    addressVisibility: 'checkout',
    chainId: 'cosmoshub-4',
    denom: 'uatom',
    gasPrice: 0.025,
    gasLimit: 110000,
    mintscanBase: 'https://www.mintscan.io/cosmos/tx/',
    restEndpoints: [
      'https://cosmos-rest.publicnode.com',
      'https://rest.cosmos.directory/cosmoshub',
      'https://cosmoshub-api.lavenderfive.com',
      'https://cosmos-api.polkachu.com'
    ]
  };

  let widgetCounter = 0;

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function isCosmosAddress(value) {
    return /^cosmos1[0-9a-z]{20,}$/i.test(String(value || '').trim());
  }

  function toMicroAtom(atom) {
    const n = Number(atom || 0);
    if (!isFinite(n) || n <= 0) return '0';
    return Math.round(n * 1000000).toString();
  }

  function buildPaymentText(cfg) {
    const lines = [
      `ATOM payment`,
      `To: ${cfg.walletAddress}`,
      `Amount: ${cfg.amountAtom} ATOM`,
      `Item: ${cfg.itemName}`
    ];
    if (cfg.memo) lines.push(`Memo: ${cfg.memo}`);
    return lines.join('\n');
  }

  function buildHandoffUrl(cfg, txhash) {
    if (!cfg.successUrl) return '';
    try {
      const url = new URL(cfg.successUrl, window.location.href);
      url.searchParams.set('wallet', cfg.walletAddress);
      url.searchParams.set('amount_atom', String(cfg.amountAtom));
      url.searchParams.set('amount_uatom', toMicroAtom(cfg.amountAtom));
      url.searchParams.set('item', cfg.itemName || 'Order');
      if (cfg.memo) url.searchParams.set('memo', cfg.memo);
      if (txhash) url.searchParams.set('txhash', txhash);
      return url.toString();
    } catch {
      return cfg.successUrl;
    }
  }

  function qrUrl(value) {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(value);
  }

  function getThemeVars(theme, cfg) {
    const themes = {
      registry: { bg:'#090412', panel:'rgba(255,255,255,0.04)', border:'rgba(255,255,255,0.08)', text:'#fff', muted:'#94a3b8' },
      neon: { bg:'#05070f', panel:'rgba(7,13,24,0.88)', border:'rgba(34,211,238,.24)', text:'#fff', muted:'#93c5fd' },
      light: { bg:'#f8fafc', panel:'#ffffff', border:'rgba(15,23,42,.08)', text:'#0f172a', muted:'#475569' },
      slate: { bg:'#0f172a', panel:'rgba(15,23,42,.88)', border:'rgba(148,163,184,.18)', text:'#fff', muted:'#94a3b8' }
    };
    const preset = themes[theme] || themes.registry;
    return {
      '--arw-bg': preset.bg,
      '--arw-panel': preset.panel,
      '--arw-border': preset.border,
      '--arw-text': preset.text,
      '--arw-muted': preset.muted,
      '--arw-primary': cfg.primaryColor,
      '--arw-accent': cfg.accentColor,
      '--arw-radius': (Number(cfg.radius) || 20) + 'px',
      '--arw-width': cfg.width || '420px'
    };
  }

  function ensureStyles() {
    if (document.getElementById('atom-sales-widget-styles')) return;
    const style = document.createElement('style');
    style.id = 'atom-sales-widget-styles';
    style.textContent = `
      .arw-shell{width:min(100%,var(--arw-width));max-width:100%;margin:0 auto;font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;background:radial-gradient(600px 360px at 0% 0%, color-mix(in srgb, var(--arw-primary) 18%, transparent), transparent 60%),radial-gradient(600px 360px at 100% 100%, color-mix(in srgb, var(--arw-accent) 18%, transparent), transparent 60%),var(--arw-bg);border:1px solid var(--arw-border);border-radius:var(--arw-radius);overflow:hidden;color:var(--arw-text);box-shadow:0 18px 60px rgba(0,0,0,.18)}
      .arw-inner{padding:22px}.arw-title{margin:0 0 10px;font-size:1.3rem;line-height:1.2;font-weight:800;text-align:center}.arw-desc{margin:0 0 18px;color:var(--arw-muted);font-size:.92rem;line-height:1.7}
      .arw-panel{background:var(--arw-panel);border:1px solid var(--arw-border);border-radius:calc(var(--arw-radius) - 6px);padding:16px}.arw-grid{display:grid;gap:12px}.arw-head{text-align:center}.arw-media{display:block;width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:calc(var(--arw-radius) - 4px);border:1px solid var(--arw-border);background:rgba(255,255,255,.03);margin-bottom:16px}
      .arw-row{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid color-mix(in srgb, var(--arw-border) 70%, transparent)}.arw-row:last-child{border-bottom:none}
      .arw-label{font-size:.7rem;text-transform:uppercase;letter-spacing:.08em;color:var(--arw-muted);font-weight:700}.arw-value{font-size:.92rem;line-height:1.7;color:var(--arw-text);text-align:right;word-break:break-word}
      .arw-cta{width:100%;border:none;border-radius:14px;padding:14px 16px;font-size:.95rem;font-weight:800;cursor:pointer;background:linear-gradient(90deg,var(--arw-primary),var(--arw-accent));color:#fff;margin-top:14px;box-shadow:0 14px 40px color-mix(in srgb, var(--arw-accent) 16%, transparent)}
      .arw-subcta{width:100%;border:none;border-radius:14px;padding:13px 16px;font-size:.9rem;font-weight:700;cursor:pointer;background:rgba(255,255,255,.05);color:var(--arw-text);border:1px solid var(--arw-border);margin-top:10px}
      .arw-meta{display:grid;gap:10px;margin-top:14px}.arw-amount-band{margin-top:14px;padding:12px 14px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid var(--arw-border);text-align:center}.arw-amount-label{display:block;font-size:.68rem;letter-spacing:.08em;text-transform:uppercase;color:var(--arw-muted);margin-bottom:6px}.arw-amount-value{font-size:1.1rem;font-weight:800;color:var(--arw-text)}.arw-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;background:rgba(255,255,255,.05);border:1px solid var(--arw-border);font-size:.72rem;color:var(--arw-muted);font-weight:700;letter-spacing:.06em;text-transform:uppercase}
      .arw-state{margin-top:14px;padding:12px 14px;border-radius:14px;font-size:.84rem;line-height:1.7;border:1px solid transparent;display:none}
      .arw-state.show{display:block}.arw-state.info{background:rgba(59,130,246,.1);border-color:rgba(59,130,246,.22);color:#bfdbfe}.arw-state.success{background:rgba(34,197,94,.1);border-color:rgba(34,197,94,.24);color:#bbf7d0}.arw-state.error{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.24);color:#fecaca}
      .arw-link{color:#67e8f9;text-decoration:none;font-weight:700}
      .arw-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(8px);z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px}
      .arw-modal{width:min(520px,calc(100vw - 24px));max-height:min(92vh,900px);background:radial-gradient(600px 360px at 10% 10%, color-mix(in srgb, var(--arw-primary) 12%, transparent), transparent 60%),radial-gradient(600px 360px at 90% 90%, color-mix(in srgb, var(--arw-accent) 12%, transparent), transparent 60%),var(--arw-bg);border:1px solid var(--arw-border);border-radius:24px;color:var(--arw-text);overflow:auto;box-shadow:0 24px 80px rgba(0,0,0,.35)}
      .arw-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:18px 18px 0}.arw-modal-body{padding:18px;display:grid;gap:14px;overflow-wrap:anywhere}.arw-close{appearance:none;border:none;background:transparent;color:var(--arw-muted);font-size:1.2rem;cursor:pointer}
      .arw-qr{display:block;width:min(220px,70vw);height:auto;aspect-ratio:1/1;max-width:100%;margin:0 auto;border-radius:18px;border:1px solid var(--arw-border);background:#fff;padding:10px}.arw-actions{display:grid;gap:10px}
      .arw-copy-row{display:grid;grid-template-columns:1fr auto;gap:10px}.arw-copy-box{border-radius:14px;border:1px solid var(--arw-border);padding:12px 14px;background:rgba(255,255,255,.04);font-size:.85rem;line-height:1.6;word-break:break-word;overflow-wrap:anywhere}.arw-copy-btn{border:none;border-radius:12px;padding:12px 14px;cursor:pointer;background:rgba(255,255,255,.05);border:1px solid var(--arw-border);color:var(--arw-text);font-weight:700}
      .arw-muted{color:var(--arw-muted);font-size:.82rem;line-height:1.7}.arw-compact .arw-inner{padding:18px}.arw-compact .arw-title{font-size:1.08rem}.arw-compact .arw-desc{font-size:.84rem;margin-bottom:12px}.arw-compact .arw-media{aspect-ratio:2/1;margin-bottom:12px}.arw-compact .arw-amount-band{margin-top:10px;padding:10px 12px}.arw-minimal .arw-inner{padding:16px}.arw-minimal .arw-title{font-size:1rem;margin-bottom:8px}.arw-minimal .arw-desc{display:none}.arw-minimal .arw-media{display:none}.arw-minimal .arw-panel{display:none}.arw-minimal .arw-amount-band{margin-top:0;padding:10px 12px}.arw-minimal .arw-meta{margin-top:10px}
      @media (max-width:640px){.arw-inner{padding:16px}.arw-title{font-size:1.08rem}.arw-desc{font-size:.84rem}.arw-modal-backdrop{padding:10px}.arw-row{flex-direction:column}.arw-value{text-align:left}.arw-copy-row{grid-template-columns:1fr}.arw-cta,.arw-subcta{padding:12px 14px;font-size:.88rem}}
    `;
    document.head.appendChild(style);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } finally { ta.remove(); }
    return Promise.resolve();
  }

  function PW(){this.c=[];}
  PW.prototype.v=function(n){var b=[];if(typeof n==='bigint'){while(n>127n){b.push(Number(n&0x7Fn)|0x80);n>>=7n;}b.push(Number(n));}else{n=Math.floor(n);while(n>127){b.push((n&0x7F)|0x80);n=Math.floor(n/128);}b.push(n&0x7F);}this.c.push(new Uint8Array(b));return this;};
  PW.prototype.t=function(f,w){return this.v((f<<3)|w);};
  PW.prototype.s=function(f,str){if(str==null)return this;str=String(str);var e=new TextEncoder().encode(str);this.t(f,2).v(e.length).c.push(e);return this;};
  PW.prototype.b=function(f,arr){if(!arr||!arr.length)return this;var u=arr instanceof Uint8Array?arr:new Uint8Array(arr);this.t(f,2).v(u.length).c.push(u);return this;};
  PW.prototype.u64=function(f,n){var bn=typeof n==='bigint'?n:BigInt(Math.floor(Number(n)));return this.t(f,0).v(bn);};
  PW.prototype.fin=function(){var tot=0;for(var i=0;i<this.c.length;i++)tot+=this.c[i].length;var o=new Uint8Array(tot),p=0;for(var i=0;i<this.c.length;i++){o.set(this.c[i],p);p+=this.c[i].length;}return o;};

  function unb64(b){var s=atob(b);var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i);return u;}
  function toB64(u8){var s='';for(var i=0;i<u8.length;i++)s+=String.fromCharCode(u8[i]);return btoa(s);}
  function anyMsg(t,v){return new PW().s(1,t).b(2,v).fin();}
  function modeInfoDirect(){return new PW().b(1,new PW().u64(1,1n).fin()).fin();}
  function signerInfo(pk,seq){return new PW().b(1,anyMsg('/cosmos.crypto.secp256k1.PubKey',new PW().b(1,pk).fin())).b(2,modeInfoDirect()).u64(3,seq).fin();}
  function feeMsg(denom,amt,gas){return new PW().b(1,new PW().s(1,denom).s(2,String(amt)).fin()).u64(2,BigInt(gas)).fin();}
  function authInfo(pk,seq,denom,fee,gas){return new PW().b(1,signerInfo(pk,seq)).b(2,feeMsg(denom,fee,gas)).fin();}
  function txRaw(body,auth,sig){return new PW().b(1,body).b(2,auth).b(3,sig).fin();}
  function txBody(msgBytes,memo){var pw=new PW().b(1,anyMsg('/cosmos.bank.v1beta1.MsgSend',msgBytes)); if(memo) pw.s(2,memo); return pw.fin();}
  function encodeMsgSend(from,to,denom,amount){return new PW().s(1,from).s(2,to).b(3,new PW().s(1,denom).s(2,String(amount)).fin()).fin();}

  async function restFetch(endpoints, path, options) {
    let last;
    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.replace(/\/$/, '') + path, options);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch (e) { last = e; }
    }
    throw last || new Error('All REST endpoints failed');
  }

  async function getAccount(cfg, addr) {
    const data = await restFetch(cfg.restEndpoints, '/cosmos/auth/v1beta1/accounts/' + addr);
    let acc = (data && data.account) || data;
    for(let i=0;i<5&&acc;i++){
      if(acc.base_vesting_account) acc=acc.base_vesting_account.base_account||acc.base_vesting_account;
      else if(acc.base_account) acc=acc.base_account;
      else break;
    }
    return { accountNumber: BigInt(acc.account_number || 0), sequence: BigInt(acc.sequence || 0) };
  }

  async function broadcast(cfg, rawBytes) {
    return await restFetch(cfg.restEndpoints, '/cosmos/tx/v1beta1/txs', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ tx_bytes: toB64(rawBytes), mode: 'BROADCAST_MODE_SYNC' })
    });
  }

  async function detectKeplr(cfg) {
    if (!cfg.enableKeplr) return { available:false };
    const keplr = global.keplr;
    if (!keplr || typeof keplr.enable !== 'function') return { available:false };
    try {
      await keplr.enable(cfg.chainId);
      const key = await keplr.getKey(cfg.chainId);
      return { available:true, address:key.bech32Address, pubKey:key.pubKey };
    } catch (e) {
      return { available:false, error:e };
    }
  }

  async function sendViaKeplr(cfg, senderAddress, pubKey) {
    const amount = toMicroAtom(cfg.amountAtom);
    const msgBytes = encodeMsgSend(senderAddress, cfg.walletAddress, cfg.denom, amount);
    const bodyBytes = txBody(msgBytes, cfg.memo || '');
    const acct = await getAccount(cfg, senderAddress);
    const feeAmount = String(Math.ceil(Number(cfg.gasLimit) * Number(cfg.gasPrice)));
    const authBytes = authInfo(pubKey, acct.sequence, cfg.denom, feeAmount, cfg.gasLimit);

    const signResp = await global.keplr.signDirect(cfg.chainId, senderAddress, {
      bodyBytes,
      authInfoBytes: authBytes,
      chainId: cfg.chainId,
      accountNumber: String(acct.accountNumber)
    });

    const sigBytes = unb64(signResp.signature.signature);
    const rawBytes = txRaw(signResp.signed.bodyBytes, signResp.signed.authInfoBytes, sigBytes);
    const result = await broadcast(cfg, rawBytes);
    const tx = result.tx_response || result;
    if (Number(tx.code || 0) !== 0) throw new Error(tx.raw_log || 'Broadcast failed');
    return { txhash: tx.txhash, senderAddress };
  }

  async function notifyVerifyEndpoint(cfg, payload) {
    if (!cfg.verifyEndpoint) return { skipped:true };
    const res = await fetch(cfg.verifyEndpoint, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, body: text };
  }

  function downloadKey(cfg) {
    return 'arw-download:' + btoa(unescape(encodeURIComponent((cfg.walletAddress || '') + '|' + (cfg.itemName || '') + '|' + (cfg.downloadUrl || ''))));
  }

  function markDownloadAuthorized(cfg, txhash) {
    if (!cfg.downloadUrl) return;
    try {
      localStorage.setItem(downloadKey(cfg), JSON.stringify({
        txhash: txhash || '',
        grantedAt: new Date().toISOString(),
        downloadUrl: cfg.downloadUrl
      }));
    } catch {}
  }

  function hasAuthorizedDownload(cfg) {
    if (!cfg.downloadUrl) return false;
    try {
      return !!localStorage.getItem(downloadKey(cfg));
    } catch {
      return false;
    }
  }

  function attemptDownload(url) {
    if (!url) return false;
    const popup = window.open(url, '_blank', 'noopener');
    return !!popup;
  }

  function createStateBox() {
    const el = document.createElement('div');
    el.className = 'arw-state';
    return {
      element: el,
      show(type, html) {
        el.className = 'arw-state show ' + type;
        el.innerHTML = html;
      },
      clear() {
        el.className = 'arw-state';
        el.innerHTML = '';
      }
    };
  }

  function createWidget(config) {
    const cfg = Object.assign({}, DEFAULTS, config || {});
    const paymentText = buildPaymentText(cfg);
    const shell = document.createElement('div');
    shell.className = 'arw-shell arw-' + cfg.mode;
    const vars = getThemeVars(cfg.theme, cfg);
    Object.keys(vars).forEach(key => shell.style.setProperty(key, vars[key]));
    const publicWallet = cfg.addressVisibility === 'public';

    shell.innerHTML = `
      <div class="arw-inner">
        <div class="arw-head">
          <div class="arw-pill">Accept ATOM</div>
          <h3 class="arw-title">${escapeHtml(cfg.title)}</h3>
        </div>
        ${cfg.imageUrl ? `<img class="arw-media" src="${escapeHtml(cfg.imageUrl)}" alt="${escapeHtml(cfg.itemName || cfg.title)}" />` : ''}
        <p class="arw-desc">${escapeHtml(cfg.description)}</p>
        ${cfg.memo ? `<div class="arw-panel"><div class="arw-row"><div class="arw-label">Memo</div><div class="arw-value">${escapeHtml(cfg.memo)}</div></div></div>` : ''}
        <div class="arw-amount-band"><span class="arw-amount-label">Amount</span><span class="arw-amount-value">${escapeHtml(cfg.amountAtom)} ATOM</span></div>
        <div class="arw-meta">
          <button class="arw-cta" type="button" data-role="open">${escapeHtml(cfg.buttonText)}</button>
        </div>
      </div>
    `;

    const state = createStateBox();
    shell.querySelector('.arw-meta').appendChild(state.element);

    if (hasAuthorizedDownload(cfg)) {
      const downloadAgainBtn = document.createElement('button');
      downloadAgainBtn.type = 'button';
      downloadAgainBtn.className = 'arw-subcta';
      downloadAgainBtn.textContent = 'Download again';
      downloadAgainBtn.addEventListener('click', () => {
        const opened = attemptDownload(cfg.downloadUrl);
        if (!opened) {
          state.show('info', 'Popup blocked. <a class="arw-link" target="_blank" rel="noopener" href="' + escapeHtml(cfg.downloadUrl) + '">Click here to download</a>');
        }
      });
      shell.querySelector('.arw-meta').appendChild(downloadAgainBtn);
    }

    detectKeplr(cfg).then(info => {
      if (info.available) {
        state.show('info', `Keplr detected for <strong>${escapeHtml(info.address)}</strong>. Buyers can pay directly from the widget.`);
      } else if (cfg.allowManualFallback) {
        state.show('info', 'Keplr not detected. Buyers can still use the manual payment panel.');
      } else {
        state.show('error', 'Keplr is required for this checkout flow.');
      }
    });

    shell.querySelector('[data-role="open"]').addEventListener('click', () => openModal(cfg, paymentText, shell, state));
    return shell;
  }

  function openModal(cfg, paymentText, shell, state) {
    const backdrop = document.createElement('div');
    backdrop.className = 'arw-modal-backdrop';
    const vars = getThemeVars(cfg.theme, cfg);
    Object.keys(vars).forEach(key => backdrop.style.setProperty(key, vars[key]));

    const showWalletInModal = cfg.addressVisibility !== 'hidden';

    backdrop.innerHTML = `
      <div class="arw-modal" role="dialog" aria-modal="true" aria-label="ATOM payment panel">
        <div class="arw-modal-head">
          <div>
            <div class="arw-pill">Payment details</div>
            <h3 class="arw-title" style="margin-top:10px">${escapeHtml(cfg.itemName)}</h3>
          </div>
          <button class="arw-close" type="button" aria-label="Close">✕</button>
        </div>
        <div class="arw-modal-body">
          ${cfg.showQr ? `<img class="arw-qr" alt="ATOM payment QR" src="${qrUrl(paymentText)}" />` : ''}
          ${cfg.imageUrl ? `<img class="arw-media" src="${escapeHtml(cfg.imageUrl)}" alt="${escapeHtml(cfg.itemName || cfg.title)}" />` : ''}
          <div class="arw-panel">
            <div class="arw-grid">
              ${showWalletInModal ? `<div class="arw-row"><div class="arw-label">Send to</div><div class="arw-value">${escapeHtml(cfg.walletAddress)}</div></div>` : ''}
              <div class="arw-row"><div class="arw-label">Amount</div><div class="arw-value">${escapeHtml(cfg.amountAtom)} ATOM</div></div>
              ${cfg.memo ? `<div class="arw-row"><div class="arw-label">Memo</div><div class="arw-value">${escapeHtml(cfg.memo)}</div></div>` : ''}
            </div>
          </div>
          <div class="arw-actions">
            ${showWalletInModal ? `<div class="arw-copy-row"><div class="arw-copy-box">${escapeHtml(cfg.walletAddress)}</div>${cfg.showCopy ? `<button class="arw-copy-btn" type="button" data-copy="wallet">Copy wallet</button>` : ''}</div>` : ''}
            <div class="arw-copy-row"><div class="arw-copy-box">${escapeHtml(cfg.amountAtom)} ATOM</div>${cfg.showCopy ? `<button class="arw-copy-btn" type="button" data-copy="amount">Copy amount</button>` : ''}</div>
            ${cfg.memo ? `<div class="arw-copy-row"><div class="arw-copy-box">${escapeHtml(cfg.memo)}</div>${cfg.showCopy ? `<button class="arw-copy-btn" type="button" data-copy="memo">Copy memo</button>` : ''}</div>` : ''}
          </div>
          <div class="arw-muted">${escapeHtml(cfg.thankYouMessage)}</div>
          <button class="arw-cta" type="button" data-role="keplr">Pay now with Keplr</button>
          ${cfg.allowManualFallback ? `<button class="arw-subcta" type="button" data-role="manual">I will pay manually</button>` : ''}
          <button class="arw-subcta" type="button" data-role="close">Close</button>
          <div class="arw-state" data-role="modalstate"></div>
        </div>
      </div>
    `;

    function close() { backdrop.remove(); }
    function modalState(type, html) {
      const el = backdrop.querySelector('[data-role="modalstate"]');
      el.className = 'arw-state show ' + type;
      el.innerHTML = html;
    }

    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    backdrop.querySelector('.arw-close').addEventListener('click', close);
    backdrop.querySelector('[data-role="close"]').addEventListener('click', close);

    if (cfg.showCopy) {
      const walletBtn = backdrop.querySelector('[data-copy="wallet"]');
      const amountBtn = backdrop.querySelector('[data-copy="amount"]');
      const memoBtn = backdrop.querySelector('[data-copy="memo"]');
      if (walletBtn) walletBtn.addEventListener('click', () => copyText(cfg.walletAddress).then(() => walletBtn.textContent = 'Copied'));
      if (amountBtn) amountBtn.addEventListener('click', () => copyText(cfg.amountAtom).then(() => amountBtn.textContent = 'Copied'));
      if (memoBtn) memoBtn.addEventListener('click', () => copyText(cfg.memo).then(() => memoBtn.textContent = 'Copied'));
    }

    backdrop.querySelector('[data-role="keplr"]').addEventListener('click', async () => {
      const btn = backdrop.querySelector('[data-role="keplr"]');
      btn.disabled = true;
      btn.textContent = 'Preparing wallet...';
      try {
        const detected = await detectKeplr(cfg);
        if (!detected.available) throw new Error('Keplr is not available in this browser.');
        btn.textContent = 'Awaiting wallet approval...';
        const sent = await sendViaKeplr(cfg, detected.address, detected.pubKey);
        const mintscanUrl = cfg.showMintscan ? (cfg.mintscanBase.replace(/\/$/, '') + '/' + sent.txhash) : '';
        let verifyMessage = '';
        if (cfg.verifyEndpoint) {
          btn.textContent = 'Verifying sale...';
          try {
            const verify = await notifyVerifyEndpoint(cfg, {
              txhash: sent.txhash,
              sender_address: sent.senderAddress,
              recipient_address: cfg.walletAddress,
              amount_atom: cfg.amountAtom,
              amount_uatom: toMicroAtom(cfg.amountAtom),
              memo: cfg.memo || '',
              item_name: cfg.itemName || 'Order',
              chain_id: cfg.chainId
            });
            verifyMessage = verify.ok ? '<div>Verification callback accepted by your endpoint.</div>' : '<div>Verification callback responded with status ' + verify.status + '.</div>';
          } catch (e) {
            verifyMessage = '<div>Verification callback failed: ' + escapeHtml(e.message || String(e)) + '</div>';
          }
        }
        const handoffUrl = buildHandoffUrl(cfg, sent.txhash);
        modalState('success', `Transaction broadcast successfully.${mintscanUrl ? ` <a class="arw-link" target="_blank" rel="noopener" href="${escapeHtml(mintscanUrl)}">View on Mintscan</a>` : ''}${verifyMessage}`);
        state.show('success', `Payment broadcast.${mintscanUrl ? ` <a class="arw-link" target="_blank" rel="noopener" href="${escapeHtml(mintscanUrl)}">${escapeHtml(sent.txhash)}</a>` : escapeHtml(sent.txhash)}`);
        if (cfg.downloadUrl) {
          markDownloadAuthorized(cfg, sent.txhash);
          const opened = attemptDownload(cfg.downloadUrl);
          if (!opened) {
            modalState('info', 'Transaction broadcast successfully.' + (mintscanUrl ? ' <a class="arw-link" target="_blank" rel="noopener" href="' + escapeHtml(mintscanUrl) + '">View on Mintscan</a>' : '') + ' Popup blocked the download. <a class="arw-link" target="_blank" rel="noopener" href="' + escapeHtml(cfg.downloadUrl) + '">Click here to download</a>');
            state.show('success', 'Payment broadcast. <a class="arw-link" target="_blank" rel="noopener" href="' + escapeHtml(cfg.downloadUrl) + '">Download again</a>');
          }
        }
        if (cfg.postPaymentAction === 'redirect' && handoffUrl) {
          setTimeout(() => { window.location.href = handoffUrl; }, 1200);
        } else if (cfg.postPaymentAction === 'download' && cfg.downloadUrl) {
          btn.textContent = 'Payment sent';
        } else {
          btn.textContent = 'Payment sent';
        }
      } catch (e) {
        btn.disabled = false;
        btn.textContent = 'Pay now with Keplr';
        modalState('error', escapeHtml(e.message || String(e)));
      }
    });

    const manual = backdrop.querySelector('[data-role="manual"]');
    if (manual) {
      manual.addEventListener('click', () => {
        const handoffUrl = buildHandoffUrl(cfg, 'manual');
        modalState('info', `Manual payment mode selected.${handoffUrl ? ` <a class="arw-link" href="${escapeHtml(handoffUrl)}">Continue</a>` : ''}`);
      });
    }

    document.body.appendChild(backdrop);
  }

  function mount(target, config) {
    ensureStyles();
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) throw new Error('Mount target not found.');
    const cfg = Object.assign({}, DEFAULTS, config || {});
    if (!isCosmosAddress(cfg.walletAddress)) throw new Error('Recipient wallet address is invalid.');
    if (!(Number(cfg.amountAtom) > 0)) throw new Error('Amount must be greater than zero.');
    el.innerHTML = '';
    const widget = createWidget(cfg);
    el.appendChild(widget);
    return widget;
  }

  global.AtomSalesWidget = { mount };
})(window);
