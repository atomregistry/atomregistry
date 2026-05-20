'use strict';

window.ArPay = (function () {
  var DEFAULT_CHAIN = 'cosmoshub-4';
  var DEFAULT_DENOM = 'uatom';
  var QR_CDN = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';

  function basePath() {
    var el = document.querySelector('base');
    var h = (el && el.getAttribute('href')) || '/';
    return h.replace(/\/+$/, '');
  }

  function buildLink(name, opts) {
    opts = opts || {};
    var url = basePath() + '/pay?to=' + encodeURIComponent(name);
    if (opts.chain && opts.chain !== DEFAULT_CHAIN) url += '&chain=' + encodeURIComponent(opts.chain);
    if (opts.amount) url += '&amount=' + encodeURIComponent(opts.amount);
    if (opts.denom && opts.denom !== DEFAULT_DENOM) url += '&denom=' + encodeURIComponent(opts.denom);
    if (opts.memo) url += '&memo=' + encodeURIComponent(opts.memo);
    if (opts.mode) url += '&mode=' + encodeURIComponent(opts.mode);
    return url;
  }

  function absoluteLink(name, opts) {
    return location.origin + buildLink(name, opts);
  }

  function parseLink(href) {
    var u;
    try { u = new URL(href, location.origin); } catch (e) { return { to: '', chain: DEFAULT_CHAIN, amount: '', denom: DEFAULT_DENOM, memo: '', mode: '' }; }
    return {
      to: (u.searchParams.get('to') || '').trim().toLowerCase(),
      chain: u.searchParams.get('chain') || DEFAULT_CHAIN,
      amount: u.searchParams.get('amount') || '',
      denom: u.searchParams.get('denom') || DEFAULT_DENOM,
      memo: u.searchParams.get('memo') || '',
      mode: (u.searchParams.get('mode') || '').toLowerCase()
    };
  }

  var ADDR_HISTORY_KEY = 'ar_pay_addr_history';
  var ADDR_HISTORY_MAX = 100;

  function loadAddrHistory() {
    try { return JSON.parse(localStorage.getItem(ADDR_HISTORY_KEY) || '{}') || {}; }
    catch (e) { return {}; }
  }
  function saveAddrHistory(map) {
    try { localStorage.setItem(ADDR_HISTORY_KEY, JSON.stringify(map)); } catch (e) {}
  }
  function addrKey(name, chain) { return name + ':' + (chain || DEFAULT_CHAIN); }

  function checkAddressChange(name, recipient) {
    if (!name || !recipient || !recipient.address) return { changed: false, firstSeen: true };
    var hist = loadAddrHistory();
    var key = addrKey(name, recipient.chain);
    var prev = hist[key];
    if (!prev) {

      hist[key] = {
        name: name,
        chain: recipient.chain,
        address: recipient.address,
        source: recipient.source,
        timestamp: Date.now()
      };

      var keys = Object.keys(hist);
      if (keys.length > ADDR_HISTORY_MAX) {
        keys.sort(function (a, b) { return (hist[a].timestamp || 0) - (hist[b].timestamp || 0); });
        for (var i = 0; i < keys.length - ADDR_HISTORY_MAX; i++) delete hist[keys[i]];
      }
      saveAddrHistory(hist);
      return { changed: false, firstSeen: true };
    }
    if (prev.address === recipient.address) {
      return { changed: false, firstSeen: false, previousTimestamp: prev.timestamp };
    }
    return {
      changed: true,
      firstSeen: false,
      previousAddress: prev.address,
      previousSource: prev.source,
      previousTimestamp: prev.timestamp
    };
  }

  function recordAddress(name, recipient) {
    if (!name || !recipient || !recipient.address) return;
    var hist = loadAddrHistory();
    hist[addrKey(name, recipient.chain)] = {
      name: name,
      chain: recipient.chain,
      address: recipient.address,
      source: recipient.source,
      timestamp: Date.now()
    };
    saveAddrHistory(hist);
  }

  function clearAddressHistory(name) {
    if (!name) return;
    var hist = loadAddrHistory();
    var prefix = String(name).trim().toLowerCase() + ':';
    var changed = false;
    Object.keys(hist).forEach(function (key) {
      if (key.indexOf(prefix) === 0) {
        delete hist[key];
        changed = true;
      }
    });
    if (changed) saveAddrHistory(hist);
  }

  function parseAmountATOM(value) {
    if (!value) return null;
    var n = Number(value);
    if (!isFinite(n) || n <= 0) return null;
    return n;
  }

  function atomToUatom(amountATOM) {
    var n = Number(amountATOM);
    if (!isFinite(n) || n <= 0) throw new Error('Invalid amount');
    return String(Math.round(n * 1e6));
  }

  function uatomToATOM(amountUatom) {
    var n = Number(amountUatom) / 1e6;
    if (!isFinite(n)) return '0';
    return String(n).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  }

  function readRow(row) {
    var key, value, isPublic = true;
    if (Array.isArray(row)) {
      key = row[0];
      var data = row[1] || {};
      value = data.value;
      isPublic = data.public !== false;
    } else if (row && typeof row === 'object') {
      key = row.key || row.k || row.name;
      value = row.value != null ? row.value : row.v;
      isPublic = row.public !== false;
    }
    return { key: key, value: value == null ? '' : String(value), public: isPublic };
  }

  async function fetchFieldsDirect(contract, query) {
    var endpoints = (window.CFG && Array.isArray(window.CFG.REST)) ? window.CFG.REST : [];
    if (!endpoints.length) throw new Error('No REST endpoints configured in CFG.REST.');
    var enc = btoa(JSON.stringify(query));
    var attempts = [];
    for (var i = 0; i < endpoints.length; i++) {
      var url = endpoints[i] + '/cosmwasm/wasm/v1/contract/' + contract + '/smart/' + enc;
      var attempt = { url: url, status: null, error: null };
      attempts.push(attempt);
      try {
        var res = await fetch(url);
        attempt.status = res.status;
        if (!res.ok) { attempt.error = 'HTTP ' + res.status; continue; }
        var json = await res.json();
        console.log('[ArPay] resolve hit', url, json);
        return { data: json && json.data !== undefined ? json.data : json, attempts: attempts };
      } catch (e) {
        attempt.error = (e && e.message) || String(e);
        console.warn('[ArPay] fetch failed for', url, e);
      }
    }
    var summary = attempts.map(function (a) {
      return '  - ' + a.url + ' → ' + (a.status ? ('HTTP ' + a.status) : a.error);
    }).join('\n');
    var msg = 'All REST endpoints failed to return contract data.\n' + summary;
    var err = new Error(msg);
    err.attempts = attempts;
    throw err;
  }

  async function resolve(name) {
    if (!name) return null;
    name = String(name).trim().toLowerCase().replace(/^\.+/, '');
    if (!window.CFG) {
      var e1 = new Error('App config not loaded - window.CFG is undefined.');
      console.error('[ArPay.resolve]', e1.message);
      throw e1;
    }
    var contract = window.CFG.METADATA;
    if (!contract) {
      var e2 = new Error('CFG.METADATA is not configured.');
      console.error('[ArPay.resolve]', e2.message);
      throw e2;
    }
    var query = { fields: { name: name, include_private: false, start_after: null, limit: 200 } };
    console.log('[ArPay.resolve] start', {
      name: name,
      metadataContract: contract,
      restEndpoints: window.CFG.REST,
      sampleQuery: query
    });
    var result;
    try {
      result = await fetchFieldsDirect(contract, query);
    } catch (e) {
      console.error('[ArPay.resolve] all endpoints failed', e);
      var pretty = new Error('Metadata query failed. ' + (e.message || String(e)) + ' - see console for per-endpoint details.');
      pretty.cause = e;
      pretty.attempts = e.attempts;
      throw pretty;
    }
    var resp = result.data;
    var rows = Array.isArray(resp) ? resp : (resp && resp.fields) || [];
    if (!Array.isArray(rows)) {
      console.warn('[ArPay.resolve] unexpected response shape', resp);
      rows = [];
    }
    var map = {};
    rows.forEach(function (raw) {
      var row = readRow(raw);
      if (row.key) map[row.key] = row.value;
    });
    var payments = {};
    Object.keys(map).forEach(function (k) {
      var m = /^payment\.([^.]+)\.(address|denom|label)$/.exec(k);
      if (!m) return;
      var chain = m[1], field = m[2];
      payments[chain] = payments[chain] || {};
      payments[chain][field] = map[k];
    });
    var resolution = {
      name: name,
      did: map['did'] || null,
      verificationMethod: map['verificationMethod'] || null,
      payments: payments,
      privacy: {
        hideAddress: String(map['privacy.hide_address'] || '').toLowerCase() === 'true'
      },
      raw: map
    };
    console.log('[ArPay.resolve] done', resolution);
    return resolution;
  }

  async function findOwner(name) {
    if (!name) return null;
    name = String(name).trim().toLowerCase().replace(/^\.+/, '');
    var contract = window.CFG && window.CFG.REGISTRY;
    if (!contract) throw new Error('Registry contract address (CFG.REGISTRY) is not configured.');
    console.log('[ArPay.findOwner] owner_of', { name: name, registry: contract });
    var result;
    try {
      result = await fetchFieldsDirect(contract, { owner_of: { name: name } });
    } catch (e) {
      console.error('[ArPay.findOwner] all endpoints failed', e);
      var err = new Error('Owner lookup failed: ' + (e.message || String(e)));
      err.cause = e;
      err.attempts = e.attempts;
      throw err;
    }
    var data = result.data;
    var owner = (data && data.owner) || (typeof data === 'string' ? data : null);
    console.log('[ArPay.findOwner] result', { name: name, owner: owner });
    return owner ? String(owner) : null;
  }

  async function findAddress(name, opts) {
    opts = opts || {};
    if (!name) throw new Error('Missing name');
    name = String(name).trim().toLowerCase();
    var chain = opts.chain || DEFAULT_CHAIN;

    var resolution = null;
    var resolveErr = null;
    try {
      resolution = await resolve(name);
    } catch (e) {
      console.warn('[ArPay.findAddress] metadata resolve failed; will try owner fallback', e);
      resolveErr = e;
    }

    if (resolution) {
      var payment = pickPayment(resolution, chain);
      if (payment) {
        return {
          name: name,
          chain: payment.chain,
          denom: payment.denom,
          address: payment.address,
          label: payment.label || '',
          source: 'metadata',
          resolution: resolution,
          privacyHidden: !!(resolution.privacy && resolution.privacy.hideAddress)
        };
      }
    }

    var owner = null;
    var ownerErr = null;
    try {
      owner = await findOwner(name);
    } catch (e) {
      console.warn('[ArPay.findAddress] owner lookup failed', e);
      ownerErr = e;
    }

    if (owner) {

      return {
        name: name,
        chain: DEFAULT_CHAIN,
        denom: DEFAULT_DENOM,
        address: owner,
        label: 'Domain owner',
        source: 'owner',
        resolution: resolution,
        privacyHidden: !!(resolution && resolution.privacy && resolution.privacy.hideAddress)
      };
    }

    if (resolveErr && ownerErr) {
      var both = new Error('Chain unreachable. Metadata and owner lookups both failed: ' + (ownerErr.message || String(ownerErr)));
      both.code = 'chain-unreachable';
      both.cause = { resolve: resolveErr, owner: ownerErr };
      throw both;
    }
    if (ownerErr) {

      var ownerFail = new Error('Owner lookup failed: ' + (ownerErr.message || String(ownerErr)));
      ownerFail.code = 'owner-query-failed';
      ownerFail.cause = ownerErr;
      throw ownerFail;
    }
    var noRecip = new Error('No payment address or owner address could be resolved for this name.');
    noRecip.code = 'no-recipient';
    throw noRecip;
  }

  function pickPayment(resolution, chain) {
    if (!resolution || !resolution.payments) return null;
    chain = chain || DEFAULT_CHAIN;
    var p = resolution.payments[chain];
    if (!p || !p.address) {
      var keys = Object.keys(resolution.payments);
      if (keys.length === 1 && resolution.payments[keys[0]].address) {
        p = resolution.payments[keys[0]];
        chain = keys[0];
      } else {
        return null;
      }
    }
    return {
      chain: chain,
      address: String(p.address).trim(),
      denom: p.denom || DEFAULT_DENOM,
      label: p.label || ''
    };
  }

  function validate(intent, payment) {
    var warnings = [];
    if (!payment || !payment.address) return { ok: false, warnings: ['no-payment-address'] };
    if (!/^cosmos1[a-z0-9]{30,}$/i.test(payment.address)) warnings.push('address-format');
    if (intent.denom && payment.denom && intent.denom !== payment.denom) warnings.push('denom-mismatch');
    if (intent.chain && payment.chain && intent.chain !== payment.chain) warnings.push('chain-mismatch');
    return { ok: true, warnings: warnings };
  }

  function encodeMsgSend(fromAddr, toAddr, denom, amount) {
    var coin = new window.PW().s(1, denom).s(2, String(amount)).fin();
    return new window.PW().s(1, fromAddr).s(2, toAddr).b(3, coin).fin();
  }

  function txBodySend(msgBytes, memo) {
    return new window.PW()
      .b(1, window.anyMsg('/cosmos.bank.v1beta1.MsgSend', msgBytes))
      .s(2, memo || '')
      .fin();
  }

  async function signAndBroadcastSend(toAddr, amountUatom, memo, stepsEl, barEl) {
    if (!window.userAddress) throw new Error('Wallet not connected.');
    if (!toAddr || !/^cosmos1[a-z0-9]{30,}$/i.test(toAddr)) throw new Error('Invalid recipient address.');
    if (!window.keplr || typeof window.keplr.signDirect !== 'function') {
      throw new Error('Atom Registry Pay currently requires a Keplr-compatible wallet that supports signDirect.');
    }

    function setStep(i, state) {
      if (!stepsEl) return;
      var el = stepsEl.querySelector('[data-pay-step="' + i + '"]');
      if (!el) return;
      el.dataset.state = state;
    }
    function setBar(pct) { if (barEl) barEl.style.width = pct + '%'; }

    setStep(1, 'active'); setBar(5);
    var msgBytes = encodeMsgSend(window.userAddress, toAddr, window.CFG.DENOM, String(amountUatom));
    var bodyBytes = txBodySend(msgBytes, memo);
    setStep(1, 'done'); setBar(25);

    setStep(2, 'active');
    var acct = await window.getAccount(window.userAddress);
    var ph = window.CFG.GAS_FALLBACK;
    var phFee = String(Math.ceil(ph * window.CFG.GAS_PRICE));
    var authBytesDirect = window.pubKey ? window.authInfoDirect(window.pubKey, acct.sequence, phFee, ph) : new Uint8Array(0);
    var gasLimit = window.pubKey ? await window.simulateGas(bodyBytes, authBytesDirect) : window.CFG.GAS_FALLBACK;
    var feeAmount = String(Math.ceil(gasLimit * window.CFG.GAS_PRICE));
    authBytesDirect = window.pubKey ? window.authInfoDirect(window.pubKey, acct.sequence, feeAmount, gasLimit) : new Uint8Array(0);
    setStep(2, 'done'); setBar(50);

    setStep(3, 'active');
    var resp = await window.keplr.signDirect(window.CFG.CHAIN_ID, window.userAddress, {
      bodyBytes: bodyBytes,
      authInfoBytes: authBytesDirect,
      chainId: window.CFG.CHAIN_ID,
      accountNumber: String(acct.accountNumber)
    });
    var sigBytes = atobToBytes(resp.signature.signature);
    var rawBytes = window.txRaw(resp.signed.bodyBytes, resp.signed.authInfoBytes, sigBytes);
    setStep(3, 'done'); setBar(75);

    setStep(4, 'active');
    var result = await window.broadcast(rawBytes);
    if (result.code !== 0) {
      setStep(4, 'error');
      throw new Error('Chain rejected the transfer (code ' + result.code + '): ' + (result.rawLog || '').slice(0, 240));
    }
    setStep(4, 'done'); setBar(100);
    return result;
  }

  function atobToBytes(b64) {
    var s = atob(b64);
    var u = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u[i] = s.charCodeAt(i);
    return u;
  }

  var _qrLibPromise = null;
  function ensureQRLib() {
    if (window.ArQR) return Promise.resolve(window.ArQR);
    if (window.qrcode) return Promise.resolve(window.qrcode);

    if (_qrLibPromise) return _qrLibPromise;
    _qrLibPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = QR_CDN;
      s.onload = function () { window.qrcode ? resolve(window.qrcode) : reject(new Error('QR library not present after load')); };
      s.onerror = function () { reject(new Error('QR library unavailable (offline + payload too large for vendored encoder).')); };
      document.head.appendChild(s);
    });
    return _qrLibPromise;
  }

  function renderViaLocal(text, canvas, opts) {
    var qr = window.ArQR.encode(text, opts.ecc || 'M');
    var modules = qr.size;
    var size = opts.size || 280;
    var cell = Math.max(1, Math.floor(size / (modules + 2)));
    var quiet = cell * 2;
    var dim = cell * modules + quiet * 2;
    canvas.width = dim;
    canvas.height = dim;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.bg || '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = opts.fg || '#020617';
    for (var y = 0; y < modules; y++) {
      for (var x = 0; x < modules; x++) {
        if (qr.isDark(y, x)) ctx.fillRect(quiet + x * cell, quiet + y * cell, cell, cell);
      }
    }
    return { size: dim, modules: modules, version: qr.version };
  }

  async function renderViaCdn(text, canvas, opts) {
    var qrcode = await ensureQRLib();
    var qr = qrcode(0, opts.ecc || 'M');
    qr.addData(String(text));
    qr.make();
    var modules = qr.getModuleCount();
    var size = opts.size || 280;
    var cell = Math.max(1, Math.floor(size / (modules + 2)));
    var quiet = cell * 2;
    var dim = cell * modules + quiet * 2;
    canvas.width = dim;
    canvas.height = dim;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = opts.bg || '#ffffff';
    ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = opts.fg || '#020617';
    for (var y = 0; y < modules; y++) {
      for (var x = 0; x < modules; x++) {
        if (qr.isDark(y, x)) ctx.fillRect(quiet + x * cell, quiet + y * cell, cell, cell);
      }
    }
    return { size: dim, modules: modules };
  }

  async function renderQRCanvas(text, canvas, opts) {
    opts = opts || {};
    if (window.ArQR) {
      try {
        return renderViaLocal(String(text), canvas, opts);
      } catch (e) {
        console.warn('[ArPay] local QR encoder failed, falling back to CDN:', e.message);
      }
    }
    return await renderViaCdn(String(text), canvas, opts);
  }

  function shortAddress(addr, head, tail) {
    if (!addr) return '';
    head = head || 10; tail = tail || 6;
    if (addr.length <= head + tail + 3) return addr;
    return addr.slice(0, head) + '...' + addr.slice(-tail);
  }

  var CHAIN_NAMES = {
    'cosmoshub-4': 'Cosmos Hub',
    'osmosis-1': 'Osmosis',
    'juno-1': 'Juno',
    'neutron-1': 'Neutron',
    'stargaze-1': 'Stargaze',
    'akashnet-2': 'Akash',
    'kaiyo-1': 'Kujira',
    'secret-4': 'Secret',
    'injective-1': 'Injective',
    'noble-1': 'Noble',
    'dydx-mainnet-1': 'dYdX',
    'celestia': 'Celestia',
    'archway-1': 'Archway',
    'stride-1': 'Stride',
    'regen-1': 'Regen Network'
  };
  function chainDisplayName(chainId) {
    return CHAIN_NAMES[chainId] || chainId;
  }

  return {
    DEFAULT_CHAIN: DEFAULT_CHAIN,
    DEFAULT_DENOM: DEFAULT_DENOM,
    buildLink: buildLink,
    absoluteLink: absoluteLink,
    parseLink: parseLink,
    parseAmountATOM: parseAmountATOM,
    atomToUatom: atomToUatom,
    uatomToATOM: uatomToATOM,
    resolve: resolve,
    pickPayment: pickPayment,
    findOwner: findOwner,
    findAddress: findAddress,
    checkAddressChange: checkAddressChange,
    recordAddress: recordAddress,
    clearAddressHistory: clearAddressHistory,
    validate: validate,
    signAndBroadcastSend: signAndBroadcastSend,
    renderQR: renderQRCanvas,
    ensureQRLib: ensureQRLib,
    shortAddress: shortAddress,
    chainDisplayName: chainDisplayName
  };
})();
