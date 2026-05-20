'use strict';

(function(){
  var dsslTargetType = 'website';

  var TARGET_PRESETS = {
    website: {
      label: 'Website',
      placeholder: 'https://example.com/.well-known/dssl.json',
      help: 'Use a public HTTPS target that wallets and apps can verify.'
    },
    api: {
      label: 'API endpoint',
      placeholder: 'https://api.example.com/dssl/yourname.atom',
      help: 'Use a stable public endpoint that returns or proves the domain security state.'
    },
    ipfs: {
      label: 'IPFS',
      placeholder: 'ipfs://bafy...',
      help: 'Use an IPFS URI for immutable proof material or resolver content.'
    },
    arweave: {
      label: 'Arweave',
      placeholder: 'ar://transaction-id',
      help: 'Use an Arweave URI for permanent proof material.'
    },
    did: {
      label: 'DID',
      placeholder: 'did:cosmos:your-identifier',
      help: 'Use a DID target when the dSSL record should point to decentralized identity data.'
    },
    custom: {
      label: 'Custom',
      placeholder: 'custom-proof-target',
      help: 'Use a custom target only when the consuming app understands its format.'
    }
  };

  function byId(id){ return document.getElementById(id); }

  function getCfg(){ return window.CFG || {}; }
  function getDsslContract(){ var cfg = getCfg(); return cfg.DSSL || cfg.dssl || cfg.dsslContract || cfg.DSSL_CONTRACT || ''; }
  function getRegistryContract(){ var cfg = getCfg(); return cfg.REGISTRY || cfg.registry || cfg.registryContract || ''; }
  function getUserAddress(){
    if (window.userAddress) return window.userAddress;
    if (window.arUserAddress) return window.arUserAddress;
    if (window.walletAddress) return window.walletAddress;
    if (window.currentAddress) return window.currentAddress;
    if (window.address) return window.address;
    if (window.account && window.account.address) return window.account.address;
    if (window.wallet && (window.wallet.address || window.wallet.userAddress)) return window.wallet.address || window.wallet.userAddress;
    try { if (typeof userAddress !== 'undefined' && userAddress) return userAddress; } catch(e) {}
    return '';
  }

  function getPersistedWalletAddress(){
    var candidates = [];

    try {
      var sessionWallet = JSON.parse(sessionStorage.getItem('ar_wallet') || 'null');
      if (sessionWallet && sessionWallet.address) candidates.push(sessionWallet.address);
    } catch(e) {}

    try {
      var latestIdentity = JSON.parse(localStorage.getItem('ar_wallet_identity_latest') || 'null');
      if (latestIdentity && latestIdentity.address) candidates.push(latestIdentity.address);
    } catch(e) {}

    try {
      var searchWallet = localStorage.getItem('ar_search_wallet');
      if (searchWallet) candidates.push(searchWallet);
    } catch(e) {}

    for (var i = 0; i < candidates.length; i++) {
      var address = String(candidates[i] || '').trim();
      if (/^cosmos1[0-9a-z]{20,}$/i.test(address)) return address;
    }

    return '';
  }

  function waitForPromiseWithTimeout(promise, timeoutMs){
    return new Promise(function(resolve){
      var done = false;
      var timer = setTimeout(function(){
        if (done) return;
        done = true;
        resolve(false);
      }, timeoutMs || 5000);

      Promise.resolve(promise).then(function(value){
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(value);
      }).catch(function(){
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(false);
      });
    });
  }

  async function ensureDsslOwnerAddress(){
    var connected = getUserAddress();
    if (connected) return connected;

    if (window.walletRestorePromise && typeof window.walletRestorePromise.then === 'function') {
      await waitForPromiseWithTimeout(window.walletRestorePromise, 6000);
      connected = getUserAddress();
      if (connected) return connected;
    }

    if (!window.__dsslRestoreAttempted && typeof window.restoreWalletSession === 'function') {
      window.__dsslRestoreAttempted = true;
      try {
        await waitForPromiseWithTimeout(window.restoreWalletSession({ silent: true, force: true }), 6000);
      } catch(e) {}
      connected = getUserAddress();
      if (connected) return connected;
    }

    return getPersistedWalletAddress();
  }

  function normalizeDsslOwnedNameEntry(entry){
    if (typeof entry === 'string') return String(entry).trim().toLowerCase();
    if (!entry || typeof entry !== 'object') return '';
    return String(entry.name || entry.domain || entry.label || entry.full_name || entry.fullName || '').trim().toLowerCase();
  }

  function uniqueSortedDsslNames(entries){
    var seen = {};
    var names = [];

    (entries || []).forEach(function(entry){
      var name = normalizeDsslOwnedNameEntry(entry);
      if (!name || seen[name]) return;
      seen[name] = true;
      names.push(name);
    });

    return names.sort(function(a, b){
      var aIsTld = a.indexOf('.') === -1;
      var bIsTld = b.indexOf('.') === -1;
      if (aIsTld !== bIsTld) return aIsTld ? -1 : 1;
      return a.localeCompare(b);
    });
  }

  function renderOwnedDsslOptions(select, names){
    if (!select) return;

    if (!names.length) {
      select.innerHTML = '<option value="">No owned names found</option>';
      return;
    }

    select.innerHTML = names.map(function(name){
      var label = name.indexOf('.') === -1 ? '.' + name + ' · TLD' : name;
      return '<option value="' + esc(name) + '">' + esc(label) + '</option>';
    }).join('');
  }

  function getTxSteps(){ return window.TX_STEPS || ['Prepare', 'Sign', 'Broadcast', 'Confirm']; }
  function notify(message, tone){
    if(typeof window.toast === 'function') window.toast(message, tone || 'info');
    else console[(tone === 'error' ? 'error' : 'log')](message);
  }
  async function dsslQuery(contract, msg){
    if(!contract) throw new Error('Missing dSSL contract address. Check getDsslContract().');
    if(typeof window.queryContract !== 'function') throw new Error('queryContract is not available on this page.');
    return window.queryContract(contract, msg);
  }
  async function dsslExecuteTx(contract, msg, funds, stepsEl, barEl, steps){
    if(!contract) throw new Error('Missing dSSL contract address. Check getDsslContract().');
    if(typeof window.signAndBroadcastRegistry !== 'function') throw new Error('Wallet signer is not available on this page.');
    return window.signAndBroadcastRegistry(contract, msg, funds || 0, stepsEl, barEl, steps || getTxSteps());
  }

  function setText(id, value){
    var el = byId(id);
    if(el) el.textContent = value == null || value === '' ? '-' : String(value);
  }

  function setClass(el, base, state){
    if(!el) return;
    el.className = base + (state ? ' ' + state : '');
  }

  function setDsslHealth(msg, tone){
    tone = tone || 'warn';
    var el = byId('dsslHealth');
    if(!el) return;
    setClass(el, 'dssl-health-bar', tone === 'good' ? 'is-good' : tone === 'error' ? 'is-error' : 'is-warn');
    el.textContent = msg;
  }

  function setValidation(msg, tone){
    var el = byId('dsslRecordValidation');
    if(!el) return;
    tone = tone || 'neutral';
    setClass(el, 'dssl-v2-validation', tone === 'good' ? 'is-good' : tone === 'warn' ? 'is-warn' : tone === 'error' ? 'is-error' : 'is-neutral');
    el.innerHTML = '<i class="fas ' + (tone === 'good' ? 'fa-check-circle' : tone === 'error' ? 'fa-triangle-exclamation' : tone === 'warn' ? 'fa-circle-exclamation' : 'fa-circle-info') + '"></i><span>' + esc(msg) + '</span>';
  }

  function compactAddress(value){
    value = String(value || '');
    if(value.length <= 20) return value || '-';
    return value.slice(0, 10) + '…' + value.slice(-8);
  }

  function formatUnix(seconds){
    seconds = Number(seconds || 0);
    if(!seconds) return '-';
    var d = new Date(seconds * 1000);
    if(Number.isNaN(d.getTime())) return String(seconds);
    return d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  function unixToLocalInput(seconds){
    seconds = Number(seconds || 0);
    if(!seconds) return '';
    var d = new Date(seconds * 1000);
    if(Number.isNaN(d.getTime())) return '';
    var offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  }

  function localInputToUnix(value){
    if(!value) return 0;
    var d = new Date(value);
    if(Number.isNaN(d.getTime())) return 0;
    return Math.floor(d.getTime() / 1000);
  }

  function isoDateFromUnix(seconds){
    seconds = Number(seconds || 0);
    if(!seconds) return 'on-chain';
    var d = new Date(seconds * 1000);
    if(Number.isNaN(d.getTime())) return 'on-chain';
    return d.toISOString().slice(0, 10);
  }

  function getSelectedName(){
    var owned = byId('ownedDsslDomain') && byId('ownedDsslDomain').value;
    var lookup = byId('dsslDomain') && byId('dsslDomain').value;
    return String(owned || lookup || 'example.atom').trim() || 'example.atom';
  }

  function detectTargetType(target){
    target = String(target || '').trim();
    if(/^ipfs:\/\//i.test(target)) return 'ipfs';
    if(/^ar:\/\//i.test(target)) return 'arweave';
    if(/^did:/i.test(target)) return 'did';
    if(/^https:\/\/api\./i.test(target) || /\/api(\/|$)/i.test(target)) return 'api';
    if(/^https:\/\//i.test(target)) return 'website';
    return dsslTargetType || 'custom';
  }

  function updateManifestPreview(name, target, expiresAt, status){
    var code = byId('dsslManifestCode');
    if(!code) return;
    name = String(name || getSelectedName() || 'example.atom').trim() || 'example.atom';
    target = String(target || (byId('targetUri') && byId('targetUri').value) || TARGET_PRESETS[dsslTargetType].placeholder).trim();
    expiresAt = Number(expiresAt || (byId('expiresAt') && byId('expiresAt').value) || 0);
    status = status || 'draft';
    var type = detectTargetType(target);
    var nextManifest = [
      '[domain]',
      'name = "' + name + '"',
      'target = "' + target + '"',
      '',
      '[dssl]',
      'status = "' + status + '"',
      'target_type = "' + type + '"',
      'expires = "' + isoDateFromUnix(expiresAt) + '"',
      'attestations = true'
    ].join('\n');
    if(code.textContent !== nextManifest) code.textContent = nextManifest;
  }

  function copyManifestPreview(){
    var code = byId('dsslManifestCode');
    if(!code) return;
    var text = code.textContent || '';
    if(navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(function(){ notify('Manifest copied', 'success'); }).catch(function(){ notify('Could not copy manifest', 'warn'); });
      return;
    }
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); notify('Manifest copied', 'success'); }
    catch(e){ notify('Could not copy manifest', 'warn'); }
    document.body.removeChild(ta);
  }

  function getExpiryStatus(record){
    if(!record) return { label: 'No record', state: 'is-neutral', tone: 'neutral', tip: 'No dSSL record is currently published for this domain.' };
    if(record.active === false) return { label: 'Revoked', state: 'is-revoked', tone: 'error', tip: 'This record exists but is not active.' };
    var expires = Number(record.expires_at || 0);
    if(!expires) return { label: 'No expiry', state: 'is-expiring', tone: 'warn', tip: 'This record does not expose a clear expiry timestamp.' };
    var now = Math.floor(Date.now() / 1000);
    var days = Math.ceil((expires - now) / 86400);
    if(days < 0) return { label: 'Expired', state: 'is-expired', tone: 'error', tip: 'This dSSL target is past its expiry timestamp.' };
    if(days <= 30) return { label: 'Expiring soon', state: 'is-expiring', tone: 'warn', tip: 'This dSSL target expires in ' + days + ' day' + (days === 1 ? '' : 's') + '.' };
    return { label: 'Active', state: 'is-active', tone: 'good', tip: 'This dSSL target is active for about ' + days + ' day' + (days === 1 ? '' : 's') + '.' };
  }

  function normalizeScore(score){
    score = Number(score || 0);
    if(!Number.isFinite(score)) score = 0;
    return Math.max(0, Math.min(100, score));
  }

  function statCard(k, v, wide){
    return '<div class="dssl-v2-state-item' + (wide ? ' wide' : '') + '"><span class="dssl-v2-state-label">' + esc(k) + '</span><div class="dssl-v2-state-value">' + (v == null || v === '' ? '-' : esc(v)) + '</div></div>';
  }

  function normalizeAttestations(atts){
    if(!atts) return [];
    if(Array.isArray(atts)) return atts;
    if(Array.isArray(atts.attestations)) return atts.attestations;
    if(Array.isArray(atts.items)) return atts.items;
    return [];
  }

  function attestationHtml(att){
    var attestor = att && (att.attestor || att.address || att.wallet || att[0]) || 'Unknown attestor';
    var boost = att && (att.score_boost != null ? att.score_boost : att.boost != null ? att.boost : att[1]);
    var note = att && (att.note || att.memo || att[2]) || 'No public note provided.';
    return '<article class="dssl-v2-attestation-card">' +
      '<div class="dssl-v2-attestation-main"><strong title="' + esc(attestor) + '">' + esc(compactAddress(attestor)) + '</strong><p>' + esc(note) + '</p></div>' +
      '<span class="dssl-v2-boost">+' + esc(boost == null ? 0 : boost) + '</span>' +
      '</article>';
  }

  function renderAttestations(atts){
    var list = normalizeAttestations(atts);
    if(!list.length){
      return '<div class="dssl-v2-attestations"><h3>Attestations</h3><div class="dssl-v2-empty-state">No attestations found for this domain yet.</div></div>';
    }
    return '<div class="dssl-v2-attestations"><h3>Attestations</h3>' + list.slice(0, 8).map(attestationHtml).join('') +
      (list.length > 8 ? '<div class="dssl-v2-empty-state">Showing first 8 of ' + esc(list.length) + ' attestations. Use Advanced tools for raw queries.</div>' : '') +
      '</div>';
  }

  function updatePreview(name, record, agg){
    var status = getExpiryStatus(record);
    var score = normalizeScore(agg && agg.score);
    var count = agg && agg.attestor_count != null ? agg.attestor_count : 0;
    var badge = byId('dsslPreviewBadge');

    var isEmpty = !name;
    var certInner = byId('dsslCertInner');
    var sealIcon  = byId('dsslCertSealIcon');
    var emptyHint = byId('dsslEmptyHint');

    if(certInner) certInner.classList.toggle('is-empty', isEmpty);
    if(sealIcon)  sealIcon.className = isEmpty ? 'fas fa-file-shield' : (record ? 'fas fa-shield-halved' : 'fas fa-circle-question');
    if(emptyHint) emptyHint.style.display = isEmpty ? '' : 'none';

    setText('dsslPreviewName', name || 'No domain selected');
    setText('dsslPreviewTarget', record && record.target ? record.target : (name ? 'No active dSSL record found for this domain.' : 'Enter a domain on the left and click Verify to preview its dSSL certificate.'));
    setText('dsslPreviewStatus', status.label);
    setText('dsslPreviewExpiry', record && record.expires_at ? formatUnix(record.expires_at) : '-');
    setText('dsslPreviewAttestors', count);
    setText('dsslPreviewScore', agg && agg.score != null ? agg.score : 0);
    setText('dsslScoreValue', agg && agg.score != null ? agg.score : 0);
    setText('dsslScoreTips', status.tip);

    if(byId('dsslScoreBar')) byId('dsslScoreBar').style.width = score + '%';
    if(badge){
      setClass(badge, 'dssl-v2-status-badge', status.state);
      badge.textContent = status.label;
    }
    updateManifestPreview(name, record && record.target, record && record.expires_at, record ? status.label.toLowerCase().replace(/\s+/g, '_') : 'no_record');
  }

  function validateTargetValue(target){
    target = String(target || '').trim();
    if(!target) return { tone: 'warn', msg: 'Enter a target URI before saving.' };
    if(dsslTargetType === 'website' || dsslTargetType === 'api'){
      if(!/^https:\/\//i.test(target)) return { tone: 'warn', msg: 'HTTPS is recommended for website and API dSSL targets.' };
      return { tone: 'good', msg: 'Target looks valid for a public HTTPS dSSL record.' };
    }
    if(dsslTargetType === 'ipfs'){
      if(!/^ipfs:\/\//i.test(target)) return { tone: 'warn', msg: 'IPFS targets should usually start with ipfs://.' };
      return { tone: 'good', msg: 'IPFS target format looks valid.' };
    }
    if(dsslTargetType === 'arweave'){
      if(!/^ar:\/\//i.test(target)) return { tone: 'warn', msg: 'Arweave targets should usually start with ar://.' };
      return { tone: 'good', msg: 'Arweave target format looks valid.' };
    }
    if(dsslTargetType === 'did'){
      if(!/^did:/i.test(target)) return { tone: 'warn', msg: 'DID targets should start with did:.' };
      return { tone: 'good', msg: 'DID target format looks valid.' };
    }
    return { tone: 'good', msg: 'Custom target is ready. Make sure consuming apps understand this format.' };
  }

  function validateRecordEditor(){
    var target = byId('targetUri') && byId('targetUri').value;
    var expires = Number(byId('expiresAt') && byId('expiresAt').value || 0);
    var targetValidation = validateTargetValue(target);
    updateManifestPreview(getSelectedName(), target, expires, 'draft');
    if(!expires) return setValidation(targetValidation.msg + ' Add an expiry date before saving.', targetValidation.tone === 'error' ? 'error' : 'warn');
    if(expires <= Math.floor(Date.now() / 1000)) return setValidation('Expiry is in the past. Choose a future date before saving.', 'error');
    setValidation(targetValidation.msg + ' Expires ' + formatUnix(expires) + '.', targetValidation.tone);
  }

  function syncExpiryFromDate(){
    var dateInput = byId('expiresDate');
    var hiddenUnix = byId('expiresAt');
    if(!dateInput || !hiddenUnix) return;
    hiddenUnix.value = localInputToUnix(dateInput.value) || '';
    validateRecordEditor();
  }

  function setExpiryDays(days){
    var dateInput = byId('expiresDate');
    var hiddenUnix = byId('expiresAt');
    if(!dateInput || !hiddenUnix) return;
    var expires = Math.floor((Date.now() + Number(days) * 86400000) / 1000);
    hiddenUnix.value = expires;
    dateInput.value = unixToLocalInput(expires);
    validateRecordEditor();
  }

  function setTargetType(type){
    dsslTargetType = TARGET_PRESETS[type] ? type : 'custom';
    var preset = TARGET_PRESETS[dsslTargetType];
    var input = byId('targetUri');
    var help = byId('targetHelp');
    var hint = byId('dsslTargetHint');
    if(input) input.placeholder = preset.placeholder;
    if(help) help.textContent = preset.help;
    if(hint) hint.textContent = preset.label;
    Array.prototype.forEach.call(document.querySelectorAll('[data-target-type]'), function(btn){
      btn.classList.toggle('is-active', btn.getAttribute('data-target-type') === dsslTargetType);
    });
    validateRecordEditor();
    updateManifestPreview();
  }

  async function loadOwnedNamesForFunctionPages(ownerAddress){
    var address = ownerAddress || await ensureDsslOwnerAddress();
    if (!address) return [];

    var resp = await dsslQuery(getRegistryContract(), {
      names_by_owner: {
        owner: address,
        start_after: null,
        limit: 200
      }
    });

    if (Array.isArray(resp)) return uniqueSortedDsslNames(resp);
    if (resp && Array.isArray(resp.names)) return uniqueSortedDsslNames(resp.names);
    return [];
  }

  function requireWallet(){
    if(getUserAddress()) return true;
    notify('Connect wallet first', 'warn');
    if(typeof openWalletModal === 'function') openWalletModal();
    return false;
  }

  async function loadDsslConfig(){
    if(byId('dsslAddr')) byId('dsslAddr').textContent = getDsslContract();
    try{
      var cfg = await dsslQuery(getDsslContract(), { config: {} });
      if(byId('configOut')) byId('configOut').textContent = JSON.stringify(cfg, null, 2);
      setDsslHealth('dSSL config loaded. This page is connected to the production dSSL trust-record contract.', 'good');
      return cfg;
    } catch(e){
      if(byId('configOut')) byId('configOut').textContent = e.message || String(e);
      setDsslHealth('dSSL config query failed. Check the contract address or network connection.', 'error');
      throw e;
    }
  }

  async function loadDsslDomainState(){
    var name = (byId('dsslDomain') && byId('dsslDomain').value || '').trim().toLowerCase();
    if(!name) return notify('Enter a domain','warn');
    var out = byId('dsslState');
    if(out) out.innerHTML = '<div class="dssl-v2-empty-state">Loading dSSL state...</div>';
    try{
      var data = await Promise.all([
        dsslQuery(getDsslContract(), { record: { name: name } }),
        dsslQuery(getDsslContract(), { attestations: { name: name, limit: 50 } })
      ]);
      var recordTuple = data[0];
      var atts = data[1];
      var record = Array.isArray(recordTuple) ? recordTuple[0] : null;
      var agg = Array.isArray(recordTuple) ? recordTuple[1] : null;
      var status = getExpiryStatus(record);
      updatePreview(name, record, agg);

      if(out) out.innerHTML = [
        statCard('Name', name),
        statCard('Status', status.label),
        statCard('Target', record ? record.target : '-', true),
        statCard('Expires', record ? formatUnix(record.expires_at) : '-'),
        statCard('Active', record ? String(!!record.active) : 'false'),
        statCard('Attestor count', agg ? String(agg.attestor_count || 0) : '0'),
        statCard('Score', agg ? String(agg.score || 0) : '0'),
        renderAttestations(atts)
      ].join('');

      if(byId('dsslQueryOut')) byId('dsslQueryOut').textContent = JSON.stringify({ record_tuple: recordTuple, attestations: atts }, null, 2);
    } catch(e){
      if(out) out.innerHTML = '<div class="dssl-v2-empty-state text-red-400">' + esc(e.message || String(e)) + '</div>';
      updatePreview(name, null, null);
    }
  }

  async function loadOwnedDsslDomains(){
    var select = byId('ownedDsslDomain');
    if (!select) return;

    select.innerHTML = '<option value="">Loading owned names...</option>';

    var address = await ensureDsslOwnerAddress();
    if (!address) {
      select.innerHTML = '<option value="">Connect wallet to load owned names</option>';
      return;
    }

    try {
      var names = await loadOwnedNamesForFunctionPages(address);
      renderOwnedDsslOptions(select, names);

      if (names.length) {
        if (byId('dsslDomain') && !byId('dsslDomain').value) byId('dsslDomain').value = names[0];
        updateManifestPreview(names[0]);
      }
    } catch(e) {
      select.innerHTML = '<option value="">Could not load owned names</option>';
      notify(e.message || String(e), 'error');
    }
  }

  async function loadOwnedDsslRecord(){
    var name = byId('ownedDsslDomain') && byId('ownedDsslDomain').value;
    if(!name) return notify('Select an owned domain','warn');
    try{
      var tuple = await dsslQuery(getDsslContract(), { record: { name: name } });
      var rec = Array.isArray(tuple) ? tuple[0] : null;
      var agg = Array.isArray(tuple) ? tuple[1] : null;
      if(byId('dsslDomain')) byId('dsslDomain').value = name;
      if(!rec){
        updatePreview(name, null, agg);
        return notify('No record for this domain','warn');
      }
      if(byId('targetUri')) byId('targetUri').value = rec.target || '';
      if(byId('expiresAt')) byId('expiresAt').value = rec.expires_at || '';
      if(byId('expiresDate')) byId('expiresDate').value = unixToLocalInput(rec.expires_at || 0);
      if(rec.target) setTargetType(detectTargetType(rec.target));
      updatePreview(name, rec, agg);
      validateRecordEditor();
      notify('Loaded dSSL record', 'success');
    } catch(e){
      notify(e.message || String(e), 'error');
    }
  }

  async function upsertDsslRecord(){
    if(!requireWallet()) return;
    syncExpiryFromDate();
    var name = byId('ownedDsslDomain') && byId('ownedDsslDomain').value;
    var target = (byId('targetUri') && byId('targetUri').value || '').trim();
    var expires_at = Number((byId('expiresAt') && byId('expiresAt').value) || 0);
    if(!name) return notify('Select an owned domain','warn');
    if(!target) return notify('Enter a target value','warn');
    if(!expires_at) return notify('Choose an expiry date','warn');
    if(expires_at <= Math.floor(Date.now() / 1000)) return notify('Expiry must be in the future','warn');
    await dsslExecuteTx(getDsslContract(), { upsert_record: { name: name, target: target, expires_at: expires_at } }, 0, byId('dsslTxSteps'), byId('dsslTxBar'), getTxSteps());
  }

  async function revokeDsslRecord(){
    if(!requireWallet()) return;
    var name = byId('ownedDsslDomain') && byId('ownedDsslDomain').value;
    if(!name) return notify('Select an owned domain','warn');
    await dsslExecuteTx(getDsslContract(), { revoke_record: { name: name } }, 0, byId('dsslTxSteps'), byId('dsslTxBar'), getTxSteps());
  }

  async function submitDsslAttestation(){
    if(!requireWallet()) return;
    var name = (byId('attestDomain') && byId('attestDomain').value || '').trim().toLowerCase();
    if(!name) return notify('Enter a target domain','warn');
    await dsslExecuteTx(getDsslContract(), { attest: { name: name, score_boost: Number((byId('attestBoost') && byId('attestBoost').value) || 0), note: ((byId('attestNote') && byId('attestNote').value || '').trim() || null) } }, 0, byId('dsslTxSteps'), byId('dsslTxBar'), getTxSteps());
  }

  async function removeDsslAttestation(){
    if(!requireWallet()) return;
    var name = (byId('attestDomain') && byId('attestDomain').value || '').trim().toLowerCase();
    var attestor = (byId('removeAttestor') && byId('removeAttestor').value || '').trim();
    if(!name || !attestor) return notify('Enter domain and attestor address','warn');
    await dsslExecuteTx(getDsslContract(), { remove_attestation: { name: name, attestor: attestor } }, 0, byId('dsslTxSteps'), byId('dsslTxBar'), getTxSteps());
  }

  async function rawDsslQuery(){
    try{
      byId('dsslQueryOut').textContent = JSON.stringify(await dsslQuery(getDsslContract(), JSON.parse(byId('dsslQuery').value)), null, 2);
    } catch(e){
      byId('dsslQueryOut').textContent = e.message || String(e);
    }
  }

  async function rawDsslExecute(){
    if(!requireWallet()) return;
    await dsslExecuteTx(getDsslContract(), JSON.parse(byId('dsslExecute').value), 0, byId('dsslTxSteps'), byId('dsslTxBar'), getTxSteps());
  }

  function bindClick(id, handler){
    var el = byId(id);
    if(!el || el.dataset.dsslBound === '1') return;
    el.dataset.dsslBound = '1';
    el.addEventListener('click', async function(){
      if(el.disabled) return;
      el.disabled = true;
      el.classList.add('is-loading');
      try { await handler(); }
      finally { el.disabled = false; el.classList.remove('is-loading'); }
    });
  }

  function bindDsslEvents(){
    bindClick('loadDsslBtn', loadDsslDomainState);
    bindClick('loadOwnedRecordBtn', loadOwnedDsslRecord);
    bindClick('saveRecordBtn', upsertDsslRecord);
    bindClick('clearRecordBtn', revokeDsslRecord);
    bindClick('attestBtn', submitDsslAttestation);
    bindClick('removeAttestBtn', removeDsslAttestation);
    bindClick('dsslRunQuery', rawDsslQuery);
    bindClick('dsslRunExecute', rawDsslExecute);
    bindClick('refreshBtn', window.initDsslFunctionPage);
    bindClick('connectWalletBtn', function(){ if(typeof openWalletModal === 'function') openWalletModal(); });
    bindClick('disconnectBtn', function(){ if(typeof disconnect === 'function') disconnect(); });
    if(byId('expiresDate')) byId('expiresDate').onchange = syncExpiryFromDate;
    if(byId('targetUri')) byId('targetUri').oninput = validateRecordEditor;
    if(byId('copyDsslManifest')) byId('copyDsslManifest').onclick = copyManifestPreview;
    if(byId('dsslDomain')) byId('dsslDomain').onkeydown = function(e){ if(e.key === 'Enter') loadDsslDomainState(); };
    if(byId('ownedDsslDomain')) byId('ownedDsslDomain').onchange = function(){ if(byId('dsslDomain')) byId('dsslDomain').value = this.value || ''; updateManifestPreview(this.value || getSelectedName()); };

    Array.prototype.forEach.call(document.querySelectorAll('[data-target-type]'), function(btn){
      if(btn.dataset.dsslBound === '1') return;
      btn.dataset.dsslBound = '1';
      btn.addEventListener('click', function(){ setTargetType(btn.getAttribute('data-target-type')); });
    });

    Array.prototype.forEach.call(document.querySelectorAll('[data-expiry-days]'), function(btn){
      if(btn.dataset.dsslBound === '1') return;
      btn.dataset.dsslBound = '1';
      btn.addEventListener('click', function(){ setExpiryDays(btn.getAttribute('data-expiry-days')); });
    });

    if (!window.__dsslV2WalletEventsBound) {
      window.__dsslV2WalletEventsBound = true;
      document.addEventListener('wallet:connected', function(){
        if (typeof window.initDsslFunctionPage === 'function') window.initDsslFunctionPage();
      });
      document.addEventListener('wallet:disconnected', function(){
        var select = byId('ownedDsslDomain');
        if (select) select.innerHTML = '<option value="">Connect wallet to load owned names</option>';
        updatePreview('', null, null);
      });
    }

  }

  window.initDsslFunctionPage = async function(){
    bindDsslEvents();
    setTargetType(dsslTargetType);
    if(!byId('expiresAt') || !byId('expiresAt').value) setExpiryDays(90);
    updatePreview('', null, null);
    updateManifestPreview();
    try{ await loadDsslConfig(); }catch(e){}
    await loadOwnedDsslDomains();
  };
})();
