'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['search'] = (function () {
  var SITE_REGISTRY = CFG.SITE_REGISTRY || 'cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt';
  var ATOM_REGISTRY  = CFG.REGISTRY;
  var ATOM_RESOLVER  = CFG.RESOLVER;

  var TLDS = ['atom', 'onchain', 'grok', 'btc', 'cosmos', 'dao'];
  var currentMode = 'all';
  var selectedSuggestion = -1;
  var currentBlobUrl = null;
  var lastOnchainHtml = '';
  var lastResolvedName = '';

  function safeText(id, value) { var el = $(id); if (el) el.textContent = value; }
  function safeClass(id, cls, add) { var el = $(id); if (el) el.classList[add ? 'add' : 'remove'](cls); }
  function htmlEsc(value) { return (window.esc || function (x) { return String(x).replace(/[&<>"']/g, function (m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[m]; }); })(value); }

  async function queryContractLocal(contract, msg) {
    try { return await queryContract(contract, msg); }
    catch (e) { return null; }
  }

  function normalizeQuery(raw) {
    var original = (raw || '').trim();
    var cleaned = original.toLowerCase();
    cleaned = cleaned.replace(/^web3:\/\//, '');
    cleaned = cleaned.replace(/^https?:\/\//, '');
    cleaned = cleaned.replace(/^atom:\/\//, '');
    cleaned = cleaned.split('?')[0].split('#')[0];
    cleaned = cleaned.replace(/^www\./, '');
    var path = '';
    if (cleaned.indexOf('/') !== -1) {
      path = cleaned.slice(cleaned.indexOf('/'));
      cleaned = cleaned.slice(0, cleaned.indexOf('/'));
    }
    cleaned = cleaned.replace(/[^a-z0-9._-]/g, '').replace(/^\.+|\.+$/g, '').replace(/\.{2,}/g, '.');
    return { original: original, name: cleaned, path: path };
  }

  function looksLikeAddress(value) {
    return /^(cosmos|osmo|juno|akash|stars|secret|terra)1[0-9a-z]{20,}$/i.test(value || '') || /^0x[a-f0-9]{40}$/i.test(value || '');
  }

  function baseName(name) {
    name = (name || '').replace(/^\*\./, '');
    return name.split('.')[0] || name;
  }

  function buildSuggestions(raw) {
    var n = normalizeQuery(raw).name;
    if (!n || looksLikeAddress(n)) return [];
    var base = baseName(n);
    var out = [];
    if (n.indexOf('.') === -1) {
      TLDS.forEach(function (tld) { out.push({ value: base + '.' + tld, label: base + '.' + tld, meta: 'try .' + tld }); });
    } else {
      out.push({ value: n, label: n, meta: 'exact lookup' });
      TLDS.forEach(function (tld) {
        var alt = base + '.' + tld;
        if (alt !== n) out.push({ value: alt, label: alt, meta: 'alternative' });
      });
    }
    return out.slice(0, 6);
  }

  function setHint(raw) {
    var hint = $('searchFormatHint');
    if (!hint) return;
    var n = normalizeQuery(raw).name;
    if (!n) {
      hint.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Paste a URL, domain or raw name - the resolver will normalize it.';
    } else if (looksLikeAddress(n)) {
      hint.innerHTML = '<i class="fas fa-triangle-exclamation"></i> This looks like a wallet address. Search expects a Web3 domain.';
    } else if (n.indexOf('*.') === 0) {
      hint.innerHTML = '<i class="fas fa-circle-info"></i> Wildcard lookup is not supported yet - try an exact domain.';
    } else if (normalizeQuery(raw).path) {
      hint.innerHTML = '<i class="fas fa-route"></i> URL path detected. The resolver will search the domain first.';
    } else if (n.indexOf('.') === -1) {
      hint.innerHTML = '<i class="fas fa-lightbulb"></i> No namespace yet. Pick a suggestion or press Enter to try .' + TLDS[0] + '.';
    } else {
      hint.innerHTML = '<i class="fas fa-circle-check"></i> Ready to resolve ' + htmlEsc(n) + '.';
    }
  }

  function renderSuggestions(raw) {
    var panel = $('suggestPanel');
    if (!panel) return;
    var items = buildSuggestions(raw);
    selectedSuggestion = -1;
    if (!raw || !raw.trim() || !items.length) {
      panel.classList.add('hidden');
      panel.innerHTML = '';
      return;
    }
    panel.innerHTML = items.map(function (item, i) {
      return '<button class="suggest-item" data-index="' + i + '" data-search="' + htmlEsc(item.value) + '" type="button">' +
        '<span><i class="fas fa-magnifying-glass"></i>' + htmlEsc(item.label) + '</span><small>' + htmlEsc(item.meta) + '</small></button>';
    }).join('');
    panel.classList.remove('hidden');
    panel.querySelectorAll('.suggest-item').forEach(function (btn) {
      btn.addEventListener('mousedown', function (e) {
        e.preventDefault();
        doSearch(btn.getAttribute('data-search'));
      });
    });
  }

  function moveSuggestion(dir) {
    var panel = $('suggestPanel');
    if (!panel || panel.classList.contains('hidden')) return null;
    var items = panel.querySelectorAll('.suggest-item');
    if (!items.length) return null;
    selectedSuggestion = (selectedSuggestion + dir + items.length) % items.length;
    items.forEach(function (el) { el.classList.remove('is-selected'); });
    items[selectedSuggestion].classList.add('is-selected');
    return items[selectedSuggestion].getAttribute('data-search');
  }

  function resetResolverSteps() {
    Array.prototype.forEach.call(document.querySelectorAll('.resolver-step'), function (el) {
      el.classList.remove('is-active', 'is-done');
    });
  }
  function setResolverStep(step, state) {
    var el = document.querySelector('.resolver-step[data-step="' + step + '"]');
    if (!el) return;
    el.classList.remove('is-active', 'is-done');
    if (state) el.classList.add(state === 'done' ? 'is-done' : 'is-active');
  }
  function terminal(line) {
    var el = $('resolverTerminal');
    if (!el) return;
    var rows = el.querySelectorAll('div');
    if (rows.length >= 4) el.removeChild(rows[0]);
    var row = document.createElement('div');
    row.textContent = '> ' + line;
    el.appendChild(row);
  }
  function clearTerminal() { var el = $('resolverTerminal'); if (el) el.innerHTML = ''; }
  function setProgress(pct, status, logLine) {
    var bar = $('progressBar');
    if (bar) bar.style.width = pct + '%';
    safeText('loadingStatus', status);
    if (logLine) terminal(logLine);
  }

  function hideResults() {
    ['loadingState', 'resultIP', 'resultRegistered', 'resultNotFound', 'resultPay'].forEach(function (id) { safeClass(id, 'hidden', true); });
    safeClass('resultOverlay', 'hidden', true);
  }

  function showLoading(name) {
    hideResults();
    resetResolverSteps();
    clearTerminal();
    safeText('loadingDomain', name);
    setProgress(0, 'QUERYING COSMOS HUB...', 'normalizing input: ' + name);
    safeClass('loadingState', 'hidden', false);
  }

  function showOnchain(name, site) {
    if (currentBlobUrl) { URL.revokeObjectURL(currentBlobUrl); currentBlobUrl = null; }
    lastOnchainHtml = site.html || '';
    lastResolvedName = name;
    var blob = new Blob([lastOnchainHtml], { type: 'text/html' });
    currentBlobUrl = URL.createObjectURL(blob);
    safeText('overlayDomain', name);
    var overlayInput = $('overlayInput'); if (overlayInput) overlayInput.value = name;
    safeText('overlayBadge', 'ON-CHAIN SITE');
    var overlayBadge = $('overlayBadge');
    if (overlayBadge) { overlayBadge.className = 'overlay-badge badge-onchain'; overlayBadge.classList.remove('hidden'); }
    safeClass('overlayDomain', 'hidden', false);
    var openBtn = $('overlayNewTab'); if (openBtn) openBtn.onclick = function () { window.open(currentBlobUrl, '_blank'); };
    var copyBtn = $('overlayCopyLink'); if (copyBtn) copyBtn.onclick = function () { copyShareLink(name); };
    var reloadBtn = $('overlayReload'); if (reloadBtn) reloadBtn.onclick = function () { reloadOverlay(); };
    var frame = $('resultFrame'); if (frame) frame.src = currentBlobUrl;
    safeClass('loadingState', 'hidden', true);
    safeClass('resultOverlay', 'hidden', false);
  }

  function reloadOverlay() {
    if (!lastOnchainHtml) return;
    if (currentBlobUrl) URL.revokeObjectURL(currentBlobUrl);
    currentBlobUrl = URL.createObjectURL(new Blob([lastOnchainHtml], { type: 'text/html' }));
    var frame = $('resultFrame'); if (frame) frame.src = currentBlobUrl;
    toast('Preview reloaded', 'ok');
  }

  function showDnsResult(name, ip, cname) {
    safeText('resultDomainIP', name);
    safeText('ipDomain', name);
    var aRow = $('ipARow'), cRow = $('ipCnameRow');
    if (ip) { safeText('ipAddress', ip); if (aRow) aRow.style.display = 'block'; if (cRow) cRow.style.display = 'none'; }
    else { safeText('ipCname', cname); if (cRow) cRow.style.display = 'block'; if (aRow) aRow.style.display = 'none'; }
    safeClass('loadingState', 'hidden', true);
    safeClass('resultIP', 'hidden', false);
  }

  function getShareUrl(name) {
    return window.location.origin + '/search?q=' + encodeURIComponent(name);
  }

  function copyShareLink(name) {
    var url = getShareUrl(name);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function () { toast('Share link copied!', 'ok'); }).catch(function () { toast('Copy failed', 'error'); });
    } else {
      toast('Copy not supported', 'error');
    }
  }

  function saveAvailabilityNotification(name) {
    var list = [];
    try { list = JSON.parse(localStorage.getItem('ar_notify') || '[]'); } catch (e) {}
    if (list.indexOf(name) === -1) { list.push(name); try { localStorage.setItem('ar_notify', JSON.stringify(list)); } catch (e) {} }
    toast('You\'ll be notified when ' + name + ' becomes available', 'ok');
  }

  function renderAlternatives(targetId, name) {
    var el = $(targetId);
    if (!el) return;
    var base = baseName(name);
    var items = TLDS.map(function (tld) { return base + '.' + tld; }).filter(function (alt) { return alt !== name; }).slice(0, 5);
    el.innerHTML = '<div class="alt-title"><i class="fas fa-wand-magic-sparkles"></i> Available alternatives to check</div>' +
      '<div class="alt-grid">' + items.map(function (alt) {
        return '<button class="alt-card" data-search="' + htmlEsc(alt) + '" type="button"><span>' + htmlEsc(alt) + '</span><small>check namespace</small></button>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-search]').forEach(function (btn) {
      btn.addEventListener('click', function () { doSearch(btn.getAttribute('data-search')); });
    });
  }

  function showRegisteredResult(name) {
    safeText('registeredDomain', name);
    safeText('registeredMsg', name + ' is registered on-chain, but has no public website or resolver record configured yet.');
    safeClass('loadingState', 'hidden', true);
    safeClass('resultRegistered', 'hidden', false);
    var actionsEl = $('registeredActions');
    if (actionsEl) {
      actionsEl.innerHTML = '<button class="search-action-btn" type="button" id="shareRegisteredBtn"><i class="fas fa-share-nodes"></i> Share</button>';
      var shareBtn = $('shareRegisteredBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () { copyShareLink(name); });
    }
    renderAlternatives('registeredAlternatives', name);
  }

  function showPayResult(name, recipient) {
    safeText('payResultDomain', name);
    safeText('payResultChain', recipient.chain);
    safeText('payResultDenom', recipient.denom);
    safeText('payResultAddress', window.ArPay.shortAddress(recipient.address, 12, 10));
    var labelRow = $('payResultLabelRow');
    if (recipient.label && recipient.source !== 'owner') {
      safeText('payResultLabel', recipient.label);
      if (labelRow) labelRow.hidden = false;
    } else if (labelRow) {
      labelRow.hidden = true;
    }
    safeText('payResultSource', recipient.source === 'metadata' ? 'Payment metadata' : 'Domain owner');
    var fallbackNote = $('payResultFallbackNote');
    if (fallbackNote) fallbackNote.hidden = recipient.source !== 'owner';
    var sub = $('payResultSub');
    if (sub) sub.textContent = recipient.source === 'metadata'
      ? 'Atom Registry Pay metadata found'
      : 'Using domain owner as fallback recipient';
    var actions = $('payResultActions');
    if (actions) {
      var payHref = window.ArPay.buildLink(name);
      actions.innerHTML =
        '<a class="result-primary-action" data-route="pay" href="' + payHref + '"><i class="fas fa-paper-plane"></i> Send ATOM</a>' +
        '<button class="result-secondary-action" type="button" id="payResultShowQrBtn"><i class="fas fa-qrcode"></i> Show QR</button>' +
        '<button class="result-secondary-action" type="button" id="payResultCopyLinkBtn"><i class="fas fa-link"></i> Copy Pay Link</button>' +
        '<button class="result-secondary-action" type="button" id="payResultCopyAddrBtn"><i class="fas fa-wallet"></i> Copy address</button>';
      var qrFrame = $('payResultQrFrame');
      var qrBtn = $('payResultShowQrBtn');
      if (qrBtn) qrBtn.addEventListener('click', function () {
        if (!qrFrame) return;
        if (!qrFrame.hidden) { qrFrame.hidden = true; qrBtn.innerHTML = '<i class="fas fa-qrcode"></i> Show QR'; return; }
        qrFrame.hidden = false;
        qrBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide QR';
        window.ArPay.renderQR(window.ArPay.absoluteLink(name), $('payResultQrCanvas'), { size: 220 }).catch(function (err) {
          toast('QR render failed: ' + (err.message || err), 'error');
          qrFrame.hidden = true;
        });
      });
      var copyLinkBtn = $('payResultCopyLinkBtn');
      if (copyLinkBtn) copyLinkBtn.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(window.ArPay.absoluteLink(name)).then(function(){ toast('Pay link copied', 'ok'); }, function(){ toast('Copy failed', 'error'); });
      });
      var copyAddrBtn = $('payResultCopyAddrBtn');
      if (copyAddrBtn) copyAddrBtn.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(recipient.address).then(function(){ toast('Address copied', 'ok'); }, function(){ toast('Copy failed', 'error'); });
      });
    }
    safeClass('loadingState', 'hidden', true);
    safeClass('resultPay', 'hidden', false);
  }

  function showNoPaymentResult(name, err) {
    safeText('notFoundDomain', name);
    safeText('notFoundMsg', err
      ? 'Could not query payment metadata: ' + (err.message || String(err))
      : name + ' has no payment metadata configured for Atom Registry Pay.');
    safeClass('loadingState', 'hidden', true);
    safeClass('resultNotFound', 'hidden', false);
    var actionsEl = $('notFoundActions');
    if (actionsEl) {
      actionsEl.innerHTML = '<button class="search-action-btn" type="button" id="shareNoPayBtn"><i class="fas fa-share-nodes"></i> Share</button>';
      var shareBtn = $('shareNoPayBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () { copyShareLink(name); });
    }
    var alt = $('notFoundAlternatives');
    if (alt) alt.innerHTML = '';
  }

  function showNotFoundResult(name) {
    safeText('notFoundDomain', name);
    safeText('notFoundMsg', name + ' is not registered on Atom Registry yet.');
    safeClass('loadingState', 'hidden', true);
    safeClass('resultNotFound', 'hidden', false);
    var actionsEl = $('notFoundActions');
    if (actionsEl) {
      actionsEl.innerHTML =
        '<button class="search-action-btn" type="button" id="shareNotFoundBtn"><i class="fas fa-share-nodes"></i> Share</button>' +
        '<button class="search-action-btn" type="button" id="notifyNotFoundBtn"><i class="fas fa-bell"></i> Notify me when available</button>';
      var shareBtn = $('shareNotFoundBtn');
      if (shareBtn) shareBtn.addEventListener('click', function () { copyShareLink(name); });
      var notifyBtn = $('notifyNotFoundBtn');
      if (notifyBtn) notifyBtn.addEventListener('click', function () { saveAvailabilityNotification(name); });
    }
    renderAlternatives('notFoundAlternatives', name);
  }

  function getRecent() { try { return JSON.parse(localStorage.getItem('ar_recent') || '[]'); } catch (e) { return []; } }
  function addRecent(name) {
    var r = getRecent().filter(function (x) { return x !== name; });
    r.unshift(name); r = r.slice(0, 6);
    try { localStorage.setItem('ar_recent', JSON.stringify(r)); } catch (e) {}
    renderRecent();
  }
  function renderRecent() {
    var el = $('recentDomains'); if (!el) return;
    var r = getRecent();
    el.innerHTML = r.map(function (n) {
      return '<button class="search-chip" data-search="' + htmlEsc(n) + '" type="button"><i class="fas fa-clock-rotate-left"></i>' + htmlEsc(n) + '</button>';
    }).join('');
    el.querySelectorAll('[data-search]').forEach(function (btn) {
      btn.addEventListener('click', function () { doSearch(btn.getAttribute('data-search')); });
    });
  }

  function setMode(mode) {
    currentMode = mode || 'all';
    document.querySelectorAll('.resolver-mode').forEach(function (btn) {
      btn.classList.toggle('is-active', btn.getAttribute('data-mode') === currentMode);
    });
  }

  async function doSearch(rawName) {
    var input = $('searchInput');
    var parsed = normalizeQuery(rawName || (input ? input.value : ''));
    var name = parsed.name;
    if (!name) { toast('Enter a domain name', 'warn'); return; }
    if (looksLikeAddress(name)) { toast('This looks like a wallet address. Try a domain such as onchain.atom.', 'warn'); return; }
    if (name.indexOf('*.') === 0) { toast('Wildcard search is not supported yet. Try an exact domain.', 'warn'); return; }
    if (name.indexOf('.') === -1) name = name + '.atom';

    var panel = $('suggestPanel'); if (panel) panel.classList.add('hidden');
    if (input) input.value = name;
    var overlayInput = $('overlayInput'); if (overlayInput) overlayInput.value = name;
    setHint(name);
    addRecent(name);
    showLoading(name);

    try {
      if (currentMode === 'pay') {
        setResolverStep('registry', 'active');
        setProgress(40, 'RESOLVING RECIPIENT...', 'metadata override, owner fallback');
        try {
          var recipient = await window.ArPay.findAddress(name);
          setResolverStep('registry', 'done');
          setProgress(100, recipient.source === 'metadata' ? 'PAYMENT METADATA RESOLVED ✓' : 'OWNER FALLBACK RESOLVED ✓', 'source: ' + recipient.source);
          showPayResult(name, recipient);
        } catch (err) {
          setResolverStep('registry', 'done');
          var label = err.code === 'no-recipient' ? 'NO RECIPIENT' : 'QUERY FAILED';
          setProgress(100, label, err.message || String(err));
          showNoPaymentResult(name, err);
        }
        return;
      }

      if (currentMode === 'all' || currentMode === 'site') {
        setResolverStep('site', 'active');
        setProgress(25, 'CHECKING ON-CHAIN SITE...', 'checking site registry');
        var site = await queryContractLocal(SITE_REGISTRY, { site: { name: name } });
        if (site && site.html) {
          setResolverStep('site', 'done');
          setProgress(100, 'SERVED FROM COSMOS HUB ✓', 'on-chain html found');
          showOnchain(name, site);
          return;
        }
        setResolverStep('site', 'done');
        if (currentMode === 'site') {
          setProgress(100, 'NO ON-CHAIN SITE FOUND', 'site registry returned empty');
          showNotFoundResult(name);
          return;
        }
      }

      if (currentMode === 'all' || currentMode === 'dns') {
        setResolverStep('dns', 'active');
        setProgress(55, 'CHECKING RESOLVER RECORDS...', 'querying A / CNAME / TXT records');
        var ip = null, cname = null;
        try { var a = await queryContractLocal(ATOM_RESOLVER, { text: { name: name, key: 'A' } }); if (a) ip = typeof a === 'string' ? a : (a.value || null); } catch (e) {}
        if (!ip) { try { var c = await queryContractLocal(ATOM_RESOLVER, { text: { name: name, key: 'CNAME' } }); if (c) cname = typeof c === 'string' ? c : (c.value || null); } catch (e) {} }
        if (!cname) { try { var t = await queryContractLocal(ATOM_RESOLVER, { text: { name: name, key: 'TXT' } }); var v = t ? (typeof t === 'string' ? t : (t.value || null)) : null; if (v && (v.indexOf('http') === 0 || v.indexOf('ipfs://') === 0)) cname = v; } catch (e) {} }
        if (ip || cname) {
          setResolverStep('dns', 'done');
          setProgress(100, 'DNS RECORD FOUND', 'resolver record matched');
          showDnsResult(name, ip, cname);
          return;
        }
        setResolverStep('dns', 'done');
        if (currentMode === 'dns') {
          setProgress(100, 'NO DNS RECORD FOUND', 'resolver returned empty');
          showNotFoundResult(name);
          return;
        }
      }

      if (currentMode === 'all' || currentMode === 'registry') {
        setResolverStep('registry', 'active');
        setProgress(85, 'CHECKING REGISTRY OWNERSHIP...', 'checking ownership status');
        try {
          var ex = await queryContractLocal(ATOM_REGISTRY, { exists: { name: name } });
          if (ex && ex.exists) {
            setResolverStep('registry', 'done');
            setProgress(100, 'REGISTERED', 'name exists on-chain');
            showRegisteredResult(name);
            return;
          }
        } catch (e) {}
        setResolverStep('registry', 'done');
      }

      setProgress(100, 'AVAILABLE / NOT FOUND', 'no matching records found');
      showNotFoundResult(name);
    } catch (e) {
      toast('Resolution failed: ' + (e.message || 'Unknown error'), 'error');
      safeClass('loadingState', 'hidden', true);
    }
  }

  function clearSearch() {
    hideResults();
    resetResolverSteps();
    clearTerminal();
    var input = $('searchInput'); if (input) input.value = '';
    setHint('');
    var panel = $('suggestPanel'); if (panel) panel.classList.add('hidden');
  }

  function bindInput(input) {
    if (!input) return;
    input.addEventListener('input', function () { setHint(input.value); renderSuggestions(input.value); });
    input.addEventListener('focus', function () { setHint(input.value); renderSuggestions(input.value); });
    input.addEventListener('blur', function () { setTimeout(function () { var p = $('suggestPanel'); if (p) p.classList.add('hidden'); }, 150); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggestion(1); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); moveSuggestion(-1); return; }
      if (e.key === 'Escape') { clearSearch(); return; }
      if (e.key === 'Enter') {
        var panel = $('suggestPanel');
        if (panel && !panel.classList.contains('hidden') && selectedSuggestion >= 0) {
          var selected = panel.querySelector('.suggest-item.is-selected');
          if (selected) { doSearch(selected.getAttribute('data-search')); return; }
        }
        doSearch(input.value);
      }
    });
  }

  return function init() {
    renderRecent();
    setMode('all');

    var searchBtn = $('searchBtn');
    if (searchBtn) searchBtn.addEventListener('click', function () { doSearch(); });

    var searchInput = $('searchInput');
    bindInput(searchInput);

    var overlayInput = $('overlayInput');
    if (overlayInput) overlayInput.addEventListener('keydown', function (e) { if (e.key === 'Enter') doSearch(overlayInput.value); });

    document.querySelectorAll('.resolver-mode').forEach(function (btn) {
      btn.addEventListener('click', function () { setMode(btn.getAttribute('data-mode')); });
    });

    document.addEventListener('keydown', function (e) {
      var tag = (document.activeElement && document.activeElement.tagName || '').toLowerCase();
      var isTyping = tag === 'input' || tag === 'textarea';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      } else if (!isTyping && e.key === '/') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
      }
    });

    var overlayClose = $('overlayClose');
    if (overlayClose) overlayClose.addEventListener('click', function () {
      hideResults();
      safeText('overlayDomain', '');
      var input = $('searchInput'); if (input) input.value = '';
    });

    var clearIP = $('clearIPBtn'); if (clearIP) clearIP.addEventListener('click', clearSearch);
    var clearReg = $('clearRegisteredBtn'); if (clearReg) clearReg.addEventListener('click', clearSearch);
    var clearNF = $('clearNotFoundBtn'); if (clearNF) clearNF.addEventListener('click', clearSearch);

    var view = document.getElementById('app-view') || document;
    view.querySelectorAll('[data-search]').forEach(function (btn) {
      btn.addEventListener('click', function () { doSearch(btn.getAttribute('data-search')); });
    });

    var q = new URLSearchParams(location.search).get('q') || new URLSearchParams(location.search).get('name');
    if (q) {
      if (searchInput) searchInput.value = q;
      doSearch(q);
    } else {
      setHint('');
    }
  };
})();
