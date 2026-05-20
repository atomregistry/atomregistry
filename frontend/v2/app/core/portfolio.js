'use strict';

var currentManagedDomain = null;

function getTldPortfolioTier(name) {
  var clean = String(name || '').replace(/^\./, '').trim();
  var len = clean.length;
  if (len <= 2) return { key:'top',      badge:'TOP TIER',    title:'Top Tier TLD',      meta:'Ultra-short namespace built for flagship brands, premium identity and maximum scarcity.' };
  if (len <= 4) return { key:'prime',    badge:'PRIME TIER',  title:'Prime Tier TLD',    meta:'Short namespace with strong brandability, clean recall and broad commercial use.' };
  return           { key:'standard', badge:'STANDARD',    title:'Standard Tier TLD', meta:'Longer namespace suited for communities, products, campaigns and utility naming.' };
}

async function loadPortfolio() {
  var grid = $('portfolioGrid');
  if (!grid) return;
  grid.innerHTML = '<div class="ar-portfolio-state"><span class="spin-icon"></span><span>Syncing portfolio...</span></div>';
  try {
    var resp = await queryContract(CFG.REGISTRY, {names_by_owner:{owner:userAddress,start_after:null,limit:100}});
    var names = resp.names || [];
    var tlds = names.filter(function(n){ return n.indexOf('.') === -1; });
    var subs = names.filter(function(n){ return n.indexOf('.') !== -1; });
    var st;
    st = $('statTotalNames'); if (st) st.textContent = names.length;
    st = $('statTldsOwned');  if (st) st.textContent = tlds.length;
    st = $('statSubdomains'); if (st) st.textContent = subs.length;
    try {
      var pr = await queryContract(CFG.REGISTRY, {primary_of:{owner:userAddress}});
      st = $('statPrimary'); if (st) st.textContent = pr && pr.name ? pr.name : '-';
    } catch(e) { st = $('statPrimary'); if (st) st.textContent = '-'; }

    if (!names.length) {
      grid.innerHTML = '<div class="ar-portfolio-state"><strong>No names found</strong><span>Your wallet has no names yet.</span><button onclick="goToDomainRegistration()">Register a domain</button></div>';
      return;
    }
    grid.innerHTML = names.map(function(name) {
      var isTld = name.indexOf('.') === -1;
      var label = isTld ? name : name.split('.')[0];
      var parentTld = isTld ? '' : name.split('.').slice(1).join('.');
      var displayName = (isTld ? '.' : '') + esc(name);
      var tier = isTld ? getTldPortfolioTier(name) : null;
      var typeLabel = isTld ? tier.badge : 'NAME';
      var typeCopy = isTld ? tier.title : 'Registered domain';
      var metaCopy = isTld ? tier.meta : (parentTld ? 'Under .' + esc(parentTld) : 'Wallet-owned name');
      var tierClass = isTld ? ' is-tier-' + tier.key : '';
      var policyValue = String(
        name.registration_policy || name.registrationPolicy ||
        name.visibility || name.policy || ''
      ).toLowerCase();
      var isPublic =
        name.registration_open === true || name.registrationOpen === true ||
        name.open === true || name.policy_open === true || name.policyOpen === true ||
        policyValue === 'open' || policyValue === 'public';
      var visibilityBadge = isTld
        ? (isPublic
            ? '<span class="ar-portfolio-badge ar-portfolio-badge-status is-public"><i class="fas fa-lock-open"></i> PUBLIC</span>'
            : '<span class="ar-portfolio-badge ar-portfolio-badge-status is-private"><i class="fas fa-lock"></i> PRIVATE</span>')
        : '';
      var cardId = arSubId(name);
      return '<article id="' + cardId + '" class="ar-portfolio-card ' + (isTld ? 'is-tld' : 'is-name') + tierClass + '">' +
        '<div class="ar-portfolio-card-glow" aria-hidden="true"></div>' +
        '<div class="ar-portfolio-card-head">' +
          '<div class="ar-portfolio-avatar"><span>' + esc(label.charAt(0).toUpperCase()) + '</span></div>' +
          '<div class="ar-portfolio-badges">' +
            '<span class="ar-portfolio-badge ar-portfolio-badge-type' + tierClass + '">' + typeLabel + '</span>' +
            visibilityBadge +
          '</div>' +
        '</div>' +
        '<div class="ar-portfolio-card-body">' +
          '<div class="ar-portfolio-type">' + typeCopy + '</div>' +
          '<h3 class="ar-portfolio-name">' + displayName + '</h3>' +
          '<p class="ar-portfolio-meta">' + metaCopy + '</p>' +
        '</div>' +
        '<div class="ar-portfolio-actions">' +
          '<button onclick="openManage(\'' + esc(name) + '\',' + isTld + ')" class="ar-portfolio-action ar-portfolio-action-primary"><i class="fas fa-sliders-h"></i><span>Manage</span></button>' +
          '<button onclick="openSellOnMarket(\'' + esc(name) + '\')" class="ar-portfolio-action ar-portfolio-action-sell"><i class="fas fa-tag"></i><span>Sell</span></button>' +
          (isTld ? '<button onclick="openSubdomains(\'' + esc(name) + '\')" class="ar-portfolio-action ar-portfolio-action-sub"><i class="fas fa-network-wired"></i><span>Subdomains</span></button>' : '') +
          '<button onclick="openPayQrModal(\'' + esc(name) + '\')" class="ar-portfolio-action ar-portfolio-action-pay"><i class="fas fa-qrcode"></i><span>Pay QR</span></button>' +
        '</div>' +
      '</article>';
    }).join('');
  } catch(e) {
    grid.innerHTML = '<div class="ar-portfolio-state is-error"><strong>Error loading portfolio</strong><span>Try syncing again.</span></div>';
  }
}

window.goToDomainRegistration = function() {
  ArRouter.navigate('');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

window.openPayQrModal = async function(name) {
  if (!window.ArPay) return;
  var modal = document.getElementById('payQrModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'payQrModal';
    modal.className = 'ar-pay-modal hidden';
    modal.innerHTML =
      '<div class="ar-pay-modal-backdrop" data-close="1"></div>' +
      '<div class="ar-pay-modal-card" role="dialog" aria-modal="true">' +
        '<button class="ar-pay-modal-close" type="button" data-close="1" aria-label="Close"><i class="fas fa-xmark"></i></button>' +
        '<span class="ar-pay-modal-kicker"><i class="fas fa-paper-plane"></i> Atom Registry Pay</span>' +
        '<h2 class="ar-pay-modal-title" id="payQrModalTitle">Receive payments as -</h2>' +
        '<div class="ar-pay-modal-body" id="payQrModalBody">' +
          '<div class="ar-pay-modal-loading"><span class="spin-icon"></span> Resolving payment metadata…</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e){
      if (e.target.closest('[data-close]')) closePayQrModal();
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closePayQrModal();
    });
  }
  document.getElementById('payQrModalTitle').textContent = 'Receive payments as ' + name;
  var body = document.getElementById('payQrModalBody');
  body.innerHTML = '<div class="ar-pay-modal-loading"><span class="spin-icon"></span> Resolving payment metadata…</div>';
  modal.classList.remove('hidden');
  try {
    var recipient;
    try {
      recipient = await window.ArPay.findAddress(name);
    } catch (err) {
      if (err && err.code === 'no-recipient') {
        body.innerHTML =
          '<div class="ar-pay-modal-empty">' +
            '<i class="fas fa-triangle-exclamation"></i>' +
            '<strong>No payment address or owner address could be resolved for this name.</strong>' +
            '<span>The name may not be registered, or the registry is unreachable.</span>' +
            '<a class="ar-pay-modal-btn ar-pay-modal-btn-primary" data-route="wallet/metadata" href="/wallet/metadata"><i class="fas fa-plus"></i> Add payment metadata</a>' +
          '</div>';
        body.querySelectorAll('[data-route]').forEach(function(el){
          el.addEventListener('click', function(ev){ ev.preventDefault(); closePayQrModal(); ArRouter.navigate(el.getAttribute('data-route')); });
        });
        return;
      }
      throw err;
    }
    var link = window.ArPay.absoluteLink(name);
    var sourceBadge = recipient.source === 'metadata'
      ? '<span class="ar-pay-modal-source is-metadata">Payment metadata</span>'
      : '<span class="ar-pay-modal-source is-owner">Domain owner</span>';
    var fallbackNote = recipient.source === 'owner'
      ? '<div class="ar-pay-modal-warn"><i class="fas fa-info-circle"></i> No payment metadata configured. Using domain owner address. <a data-route="wallet/metadata" href="/wallet/metadata">Set a custom payment address →</a></div>'
      : '';
    body.innerHTML =
      fallbackNote +
      '<div class="ar-pay-modal-info">' +
        '<div class="ar-pay-modal-info-row"><span>Chain</span><strong>' + esc(recipient.chain) + '</strong></div>' +
        '<div class="ar-pay-modal-info-row"><span>Denom</span><strong>' + esc(recipient.denom) + '</strong></div>' +
        '<div class="ar-pay-modal-info-row"><span>Address</span><strong class="mono">' + esc(window.ArPay.shortAddress(recipient.address, 14, 10)) + '</strong></div>' +
        '<div class="ar-pay-modal-info-row"><span>Source</span><strong>' + sourceBadge + '</strong></div>' +
        '<div class="ar-pay-modal-info-row"><span>Pay link</span><strong class="mono break">' + esc(link) + '</strong></div>' +
      '</div>' +
      '<div class="ar-pay-modal-qr-frame" id="payQrModalFrame" hidden><canvas id="payQrModalCanvas" aria-label="Pay QR"></canvas></div>' +
      '<div class="ar-pay-modal-actions">' +
        '<button class="ar-pay-modal-btn ar-pay-modal-btn-primary" type="button" data-action="show-qr"><i class="fas fa-qrcode"></i> Show QR</button>' +
        '<button class="ar-pay-modal-btn" type="button" data-action="copy-link"><i class="fas fa-link"></i> Copy link</button>' +
        '<button class="ar-pay-modal-btn" type="button" data-action="download-qr" hidden><i class="fas fa-download"></i> Download QR</button>' +
        '<a class="ar-pay-modal-btn" data-route="pay" href="' + esc(window.ArPay.buildLink(name, { mode: 'receive' })) + '"><i class="fas fa-arrow-up-right-from-square"></i> Open Receive page</a>' +
      '</div>';
    body.querySelector('[data-action="show-qr"]').addEventListener('click', function(){
      var frame = document.getElementById('payQrModalFrame');
      var dlBtn = body.querySelector('[data-action="download-qr"]');
      if (!frame.hidden) { frame.hidden = true; if (dlBtn) dlBtn.hidden = true; return; }
      frame.hidden = false;
      window.ArPay.renderQR(link, document.getElementById('payQrModalCanvas'), { size: 260 })
        .then(function(){ if (dlBtn) dlBtn.hidden = false; })
        .catch(function(err){ frame.hidden = true; alert('QR render failed: ' + (err.message || err)); });
    });
    body.querySelector('[data-action="copy-link"]').addEventListener('click', function(){
      if (navigator.clipboard) navigator.clipboard.writeText(link);
    });
    body.querySelector('[data-action="download-qr"]').addEventListener('click', function(){
      var canvas = document.getElementById('payQrModalCanvas');
      if (!canvas) return;
      var a = document.createElement('a');
      a.download = 'atomregistry-pay-' + name + '.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
    });
    body.querySelectorAll('[data-route]').forEach(function(el){
      el.addEventListener('click', function(ev){ ev.preventDefault(); closePayQrModal(); ArRouter.navigate(el.getAttribute('data-route')); });
    });
  } catch (err) {
    body.innerHTML =
      '<div class="ar-pay-modal-empty">' +
        '<i class="fas fa-triangle-exclamation" style="color:#fca5a5"></i>' +
        '<strong>Could not resolve payment metadata</strong>' +
        '<span>' + esc((err && err.message) || String(err)) + '</span>' +
      '</div>';
  }
};

window.closePayQrModal = function() {
  var m = document.getElementById('payQrModal');
  if (m) m.classList.add('hidden');
};

window.openManage = function(name, isTld) {
  currentManagedDomain = name;
  ArRouter.navigate('wallet/manage-tlds');
  window._manageisTld = !!isTld;
};

window.quickTransfer = function(name) {
  window.openManage(name, name.indexOf('.') === -1);
  setTimeout(function(){ var r = $('transferRecipient'); if (r) r.focus(); }, 200);
};

function getManagedDomainConfirmLabel() {
  if (!currentManagedDomain) return '';
  var raw = String(currentManagedDomain || '').trim().toLowerCase();
  return raw.indexOf('.') === -1 ? '.' + raw : raw;
}

function policyVisibilityLabel(policy) {
  return (policy && policy.enabled && policy.registration_open) ? 'Public' : 'Private';
}

var currentPolicyState = null;

function formatPolicyAtomFromUatom(uatom) {
  var amount = parseInt(uatom || 0, 10);
  if (!isFinite(amount) || amount <= 0) return '-';
  var atom = amount / 1000000;
  if (atom >= 1000) return String(Math.round(atom)) + ' ATOM';
  if (atom >= 100)  return atom.toFixed(1).replace(/\.0$/, '') + ' ATOM';
  if (atom >= 10)   return atom.toFixed(2).replace(/\.00$/, '').replace(/0$/, '') + ' ATOM';
  return atom.toFixed(2) + ' ATOM';
}

function policyStateFromContract(policy) {
  if (!policy) return { hasPolicy:false, enabled:false, registrationOpen:false, priceUatom:0, maxPerAddress:'-', recipient:'' };
  return {
    hasPolicy: true,
    enabled: !!policy.enabled,
    registrationOpen: !!(policy.enabled && policy.registration_open),
    priceUatom: parseInt(policy.price || 0, 10) || 0,
    maxPerAddress: policy.max_per_address || '-',
    recipient: policy.recipient || ''
  };
}

function setManageVisibilityStatus(label) {
  var el = $('manageVisibilityStatus');
  if (!el) return;
  el.textContent = label || 'Active';
  el.classList.remove('is-public', 'is-private', 'is-active', 'is-loading');
  if (label === 'Public')           el.classList.add('is-public');
  else if (label === 'Private')     el.classList.add('is-private');
  else if (label === 'Checking...') el.classList.add('is-loading');
  else                              el.classList.add('is-active');
}

function setCurrentPolicyState(state) {
  currentPolicyState = state || null;
  updatePolicySummary();
}

function compactMiddle(value, start, end) {
  var s = String(value || '').trim();
  if (!s) return '-';
  start = start || 12; end = end || 6;
  if (s.length <= start + end + 3) return s;
  return s.slice(0, start) + '...' + s.slice(-end);
}

function updatePolicySummary() {
  var statusEl    = $('policySummaryStatus');
  var priceEl     = $('policySummaryPrice');
  var maxEl       = $('policySummaryMax');
  var recipientEl = $('policySummaryRecipient');
  if (!statusEl || !priceEl || !maxEl || !recipientEl) return;
  var state = currentPolicyState || policyStateFromContract(null);
  var hasActivePolicy = !!(state.hasPolicy && state.enabled);
  var recipient = state.recipient || '';
  statusEl.textContent = hasActivePolicy ? (state.registrationOpen ? 'Public' : 'Private') : 'Private';
  statusEl.className = state.registrationOpen ? 'is-open' : 'is-paused';
  priceEl.textContent = hasActivePolicy ? formatPolicyAtomFromUatom(state.priceUatom) : '-';
  maxEl.textContent = hasActivePolicy ? String(state.maxPerAddress || '-') : '-';
  recipientEl.textContent = recipient ? compactMiddle(recipient, 10, 6) : '-';
  recipientEl.title = recipient || '';
  var details = $('currentPolicyDisplay');
  if (details) {
    details.textContent = hasActivePolicy
      ? 'Current on-chain state for ' + getManagedDomainConfirmLabel() + '. Edit the fields above, then save to update it.'
      : 'No active subdomain policy is saved on-chain for ' + getManagedDomainConfirmLabel() + ' yet.';
  }
}

function setPolicyOpenMode(mode) {
  var select = $('policyOpen');
  if (!select) return;
  select.value = mode === 'closed' ? 'closed' : 'open';
  Array.prototype.forEach.call(document.querySelectorAll('[data-policy-open]'), function(btn){
    var active = btn.getAttribute('data-policy-open') === select.value;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  updatePolicySummary();
}

function updateTransferConfirmCopy() {
  var expected = getManagedDomainConfirmLabel();
  var label = $('transferConfirmLabel');
  var input = $('transferConfirmName');
  var hint  = $('transferConfirmHint');
  if (label) label.textContent = expected ? 'Confirm by typing "' + expected + '"' : 'Confirm Name';
  if (input) {
    input.placeholder = expected ? 'Type ' + expected + ' to confirm' : 'Type this name to confirm';
    input.setAttribute('aria-label', expected ? 'Type ' + expected + ' to confirm transfer' : 'Confirm transfer name');
  }
  if (hint && expected) hint.textContent = 'Enter a recipient and type "' + expected + '" exactly to unlock transfer.';
}

function updateTransferConfirmState() {
  var confirmInput = $('transferConfirmName');
  var btn  = $('transferBtn');
  var hint = $('transferConfirmHint');
  if (!confirmInput || !btn) return;
  var expected = getManagedDomainConfirmLabel();
  var typed = confirmInput.value.trim();
  var recipientValue = $('transferRecipient') ? $('transferRecipient').value.trim() : '';
  var ready = !!expected && !!recipientValue && typed.toLowerCase() === expected.toLowerCase();
  btn.disabled = !ready;
  if (hint) {
    hint.textContent = ready ? 'Transfer unlocked. Check the recipient address twice before signing.' : 'Enter a recipient and type "' + (expected || 'this name') + '" exactly to unlock transfer.';
    hint.classList.toggle('is-ready', ready);
  }
}

async function loadCurrentPolicy(name) {
  try {
    var p = await queryContract(CFG.REGISTRY, {subdomain_policy:{name:name}});
    if (p) {
      setCurrentPolicyState(policyStateFromContract(p));
      setPriceSliderValue('policy', p.price || 1000000);
      if (window.applyLengthTierPreset) applyLengthTierPreset('policy', name, p.price || 1000000);
      if (window.updateTierExamples)    updateTierExamples('policy', name);
      var pr = $('policyRecipient');  if (pr) pr.value = p.recipient || userAddress || '';
      var mx = $('policyMaxPerAddr'); if (mx) mx.value = p.max_per_address || '100';
      var po = $('policyOpen');       if (po) { po.value = (p.enabled && p.registration_open) ? 'open' : 'closed'; }
      setManageVisibilityStatus(policyVisibilityLabel(p));
      setPolicyOpenMode(($('policyOpen') || {}).value || 'closed');
    } else {
      _resetPolicyDefaults(name);
    }
  } catch(e) {
    _resetPolicyDefaults(name);
  }
}

function _resetPolicyDefaults(name) {
  setCurrentPolicyState(policyStateFromContract(null));
  setPriceSliderValue('policy', 1000000);
  if (window.applyLengthTierPreset) applyLengthTierPreset('policy', name, 1000000);
  var pr = $('policyRecipient');  if (pr) pr.value = userAddress || '';
  var mx = $('policyMaxPerAddr'); if (mx) mx.value = '100';
  setManageVisibilityStatus('Private');
  setPolicyOpenMode('closed');
}

function initDnsTypePicker() {
  var select  = $('dnsType');
  var picker  = $('dnsTypePicker');
  var trigger = $('dnsTypeTrigger');
  var current = $('dnsTypeCurrent');
  var hint    = $('dnsTypeHint');
  var menu    = $('dnsTypeMenu');
  if (!select || !picker || !trigger || !current || !hint || !menu) return;

  function closePicker() { picker.classList.remove('open'); trigger.setAttribute('aria-expanded', 'false'); }
  function setType(value, typeHint) {
    select.value = value;
    current.textContent = value;
    hint.textContent = typeHint || '';
    Array.prototype.forEach.call(menu.querySelectorAll('.manage-dns-type-option'), function(btn){
      var active = btn.getAttribute('data-value') === value;
      btn.classList.toggle('active', active);
      btn.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    closePicker();
  }
  trigger.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); var open = !picker.classList.contains('open'); picker.classList.toggle('open', open); trigger.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  Array.prototype.forEach.call(menu.querySelectorAll('.manage-dns-type-option'), function(btn){
    btn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); setType(btn.getAttribute('data-value'), btn.getAttribute('data-hint')); });
  });
  document.addEventListener('click', function(e){ if (!picker.contains(e.target)) closePicker(); });
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closePicker(); });
  var selected = menu.querySelector('.manage-dns-type-option[data-value="' + select.value + '"]') || menu.querySelector('.manage-dns-type-option');
  if (selected) setType(selected.getAttribute('data-value'), selected.getAttribute('data-hint'));
}

function initPolicyControls() {
  var select = $('policyOpen');
  if (!select) return;
  Array.prototype.forEach.call(document.querySelectorAll('[data-policy-open]'), function(btn){
    btn.addEventListener('click', function(e){ e.preventDefault(); setPolicyOpenMode(btn.getAttribute('data-policy-open')); });
  });
  select.addEventListener('change', function(){ setPolicyOpenMode(select.value); });
  ['policyRecipient','policyMaxPerAddr','policyPrice'].forEach(function(id){
    var el = $(id); if (el) el.addEventListener('input', updatePolicySummary);
  });
  var fallbackDisplay = $('policyTierFallbackDisplay');
  if (fallbackDisplay && window.MutationObserver) new MutationObserver(updatePolicySummary).observe(fallbackDisplay, { childList:true, characterData:true, subtree:true });
  setPolicyOpenMode(select.value || 'open');
}

function initTransferConfirmation() {
  var confirmInput = $('transferConfirmName');
  var recipient    = $('transferRecipient');
  if (confirmInput) confirmInput.addEventListener('input', updateTransferConfirmState);
  if (recipient)    recipient.addEventListener('input', updateTransferConfirmState);
  updateTransferConfirmState();
}

function initManagePage() {
  var title = $('manageDomainTitle');
  var isTld = !!window._manageisTld;
  window._manageisTld = undefined;

  if (!currentManagedDomain) {
    if (title) title.textContent = 'No domain selected';
    setManageVisibilityStatus('Active');
    var panel = $('subdomainPolicyPanel');
    if (panel) panel.classList.add('hidden');
    updatePolicySummary();
    return;
  }

  if (title) title.textContent = getManagedDomainConfirmLabel();
  setManageVisibilityStatus(isTld ? 'Checking...' : 'Active');
  if ($('transferConfirmName')) $('transferConfirmName').value = '';
  if ($('transferRecipient'))  $('transferRecipient').value  = '';
  updateTransferConfirmCopy();
  updateTransferConfirmState();

  var panel = $('subdomainPolicyPanel');
  if (isTld) {
    if (panel) panel.classList.remove('hidden');
    loadCurrentPolicy(currentManagedDomain);
  } else {
    if (panel) panel.classList.add('hidden');
  }
  updatePolicySummary();

  initDnsTypePicker();
  initPolicyControls();
  initTransferConfirmation();
  initDidPanel();
  if (window.initLengthTierPricingUi) window.initLengthTierPricingUi();

  var b;
  b = $('backToPortfolioBtn');
  if (b) b.addEventListener('click', function(){ currentManagedDomain = null; ArRouter.navigate('wallet/my-domains'); });

  b = $('setDnsBtn');
  if (b) b.addEventListener('click', async function(){
    if (!currentManagedDomain || !userAddress) { toast('Not ready', 'warn'); return; }
    var type = $('dnsType').value, value = $('dnsValue').value.trim();
    if (!value) { toast('Enter a value', 'warn'); return; }
    var btn = $('setDnsBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin-icon"></span>';
    try {
      await signAndBroadcastRegistry(CFG.RESOLVER, {set_text:{name:currentManagedDomain,key:type,value:value}}, 0, null, null, TX_STEPS);
      toast(type + ' record set!', 'ok');
      $('dnsValue').value = '';
    } catch(e) { toast('Failed: ' + (e.message || '').slice(0,80), 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i><span>Set Record</span>';
  });

  b = $('setPrimaryBtn');
  if (b) b.addEventListener('click', async function(){
    if (!currentManagedDomain || !userAddress) { toast('Not ready', 'warn'); return; }
    var btn = $('setPrimaryBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin-icon"></span>';
    try {
      await signAndBroadcastRegistry(CFG.REGISTRY, {set_primary:{name:currentManagedDomain}}, 0, null, null, TX_STEPS);
      toast('Primary name set!', 'ok');
    } catch(e) { toast('Failed: ' + (e.message || '').slice(0,80), 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-star"></i><span>Set as Primary</span>';
  });

  b = $('savePolicyBtn');
  if (b) b.addEventListener('click', async function(){
    if (!currentManagedDomain || !userAddress) { toast('Not ready', 'warn'); return; }
    var price = parseInt($('policyPrice').value) || 0;
    var recipient = $('policyRecipient').value.trim() || userAddress;
    var max = parseInt($('policyMaxPerAddr').value) || 100;
    var isOpen = $('policyOpen').value === 'open';
    if (!price) { toast('Enter a price in uatom', 'warn'); return; }
    var btn = $('savePolicyBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin-icon"></span>';
    try {
      await signAndBroadcastRegistry(CFG.REGISTRY, {
        set_subdomain_policy:{name:currentManagedDomain,policy:{enabled:true,registration_open:isOpen,denom:CFG.DENOM,price:String(price),recipient:recipient,max_per_address:max}}
      }, 0, null, null, TX_STEPS);
      if (window.saveLengthTierPreset && window.collectTierValues) saveLengthTierPreset(currentManagedDomain, collectTierValues('policy'));
      setCurrentPolicyState({hasPolicy:true, enabled:true, registrationOpen:isOpen, priceUatom:price, maxPerAddress:max, recipient:recipient});
      toast('Policy saved!', 'ok');
      setManageVisibilityStatus(isOpen ? 'Public' : 'Private');
      if (typeof loadTlds === 'function') loadTlds();
    } catch(e) { toast('Failed: ' + (e.message || '').slice(0,80), 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i><span>Save Policy</span>'; updatePolicySummary();
  });

  b = $('transferBtn');
  if (b) b.addEventListener('click', async function(){
    if (!currentManagedDomain || !userAddress) { toast('Not ready', 'warn'); return; }
    var to = $('transferRecipient').value.trim();
    if (!to) { toast('Enter recipient address', 'warn'); return; }
    var expected = getManagedDomainConfirmLabel();
    var typed = $('transferConfirmName') ? $('transferConfirmName').value.trim() : '';
    if (typed.toLowerCase() !== expected.toLowerCase()) { toast('Type ' + expected + ' to confirm transfer', 'warn'); updateTransferConfirmState(); return; }
    if (!confirm('Transfer ' + currentManagedDomain + ' to ' + to + '?')) return;
    var btn = $('transferBtn'); btn.disabled = true; btn.innerHTML = '<span class="spin-icon"></span>';
    try {
      await signAndBroadcastRegistry(CFG.REGISTRY, {transfer:{name:currentManagedDomain,to:to}}, 0, null, null, TX_STEPS);
      toast('Transfer successful!', 'ok');
      $('transferRecipient').value = '';
      if ($('transferConfirmName')) $('transferConfirmName').value = '';
      updateTransferConfirmState();
      currentManagedDomain = null;
      ArRouter.navigate('wallet/my-domains');
    } catch(e) { toast('Failed: ' + (e.message || '').slice(0,80), 'error'); }
    btn.disabled = false; btn.innerHTML = '<i class="fas fa-arrow-right"></i><span>Transfer</span>'; updateTransferConfirmState();
  });
}

window.openSellOnMarket = function(name) {
  window._marketplacePendingSell = name;
  ArRouter.navigate('marketplace');
};

function arSubId(name) {
  return 'arcard_' + String(name).replace(/[^a-zA-Z0-9]/g, '_');
}

window.openSubdomains = function(tldName) {
  var panelId = 'ar-sub-panel-' + arSubId(tldName);
  var existing = document.getElementById(panelId);
  document.querySelectorAll('.ar-subdomain-panel').forEach(function(el) { el.remove(); });
  if (existing) return;

  var card = document.getElementById(arSubId(tldName));
  if (!card) return;

  var sid = arSubId(tldName);
  var panel = document.createElement('div');
  panel.className = 'ar-subdomain-panel';
  panel.id = panelId;
  panel.innerHTML =
    '<div class="ar-sub-panel-head">' +
      '<div class="ar-sub-panel-title">' +
        '<i class="fas fa-network-wired"></i>' +
        '<span>Subdomains of <strong>.' + esc(tldName) + '</strong></span>' +
      '</div>' +
      '<button class="ar-sub-close-btn" onclick="closeSubdomains()" aria-label="Close"><i class="fas fa-times"></i></button>' +
    '</div>' +
    '<div class="ar-sub-create">' +
      '<div class="ar-sub-input-row">' +
        '<input id="ar-sub-input-' + sid + '" class="ar-sub-input" type="text" placeholder="mysubdomain" autocomplete="off" spellcheck="false" />' +
        '<span class="ar-sub-suffix">.' + esc(tldName) + '</span>' +
        '<button id="ar-sub-btn-' + sid + '" class="ar-sub-create-btn" type="button"><i class="fas fa-plus"></i><span>Create</span></button>' +
      '</div>' +
      '<div class="ar-sub-preview" id="ar-sub-preview-' + sid + '"></div>' +
    '</div>' +
    '<div class="ar-sub-list" id="ar-sub-list-' + sid + '">' +
      '<div class="ar-sub-list-loading"><span class="spin-icon"></span><span>Loading subdomains...</span></div>' +
    '</div>';

  card.insertAdjacentElement('afterend', panel);

  var input = document.getElementById('ar-sub-input-' + sid);
  var btn   = document.getElementById('ar-sub-btn-' + sid);

  if (input) {
    input.addEventListener('input', function() { window.arSubPreview(tldName); });
    input.addEventListener('keydown', function(e) { if (e.key === 'Enter') window.createSubdomain(tldName); });
    input.focus();
  }
  if (btn) btn.addEventListener('click', function() { window.createSubdomain(tldName); });

  window.loadSubdomainsList(tldName);
};

window.closeSubdomains = function() {
  document.querySelectorAll('.ar-subdomain-panel').forEach(function(el) { el.remove(); });
};

window.arSubPreview = function(tldName) {
  var sid     = arSubId(tldName);
  var input   = document.getElementById('ar-sub-input-' + sid);
  var preview = document.getElementById('ar-sub-preview-' + sid);
  if (!input || !preview) return;
  var val = input.value.trim().toLowerCase();
  if (!val) { preview.textContent = ''; preview.className = 'ar-sub-preview'; return; }
  var valid = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(val);
  preview.textContent = valid ? val + '.' + tldName : 'Invalid - lowercase letters, numbers, hyphens only; no leading or trailing hyphen';
  preview.className = 'ar-sub-preview ' + (valid ? 'is-valid' : 'is-error');
};

window.loadSubdomainsList = function(tldName) {
  var sid    = arSubId(tldName);
  var listEl = document.getElementById('ar-sub-list-' + sid);
  if (!listEl) return;
  var suffix = '.' + tldName;
  queryContract(CFG.REGISTRY, {names_by_owner:{owner:userAddress,start_after:null,limit:200}})
    .then(function(resp) {
      var subs = ((resp && resp.names) || []).filter(function(n) { return n.slice(-suffix.length) === suffix; });
      if (!subs.length) {
        listEl.innerHTML = '<div class="ar-sub-empty">No subdomains yet. Create the first one above.</div>';
        return;
      }
      listEl.innerHTML = '<div class="ar-sub-list-grid">' + subs.map(function(sub) {
        var subLabel = sub.slice(0, sub.length - suffix.length);
        return '<div class="ar-sub-item">' +
          '<span class="ar-sub-item-name"><strong>' + esc(subLabel) + '</strong><em>' + esc(suffix) + '</em></span>' +
          '<div class="ar-sub-item-actions">' +
            '<button class="ar-sub-action ar-sub-action-manage" onclick="openManage(\'' + esc(sub) + '\',false)"><i class="fas fa-sliders-h"></i><span>Manage</span></button>' +
            '<button class="ar-sub-action ar-sub-action-delete" onclick="deleteSubdomain(\'' + esc(sub) + '\',\'' + esc(tldName) + '\')"><i class="fas fa-trash"></i><span>Delete</span></button>' +
          '</div>' +
        '</div>';
      }).join('') + '</div>';
    })
    .catch(function() {
      listEl.innerHTML = '<div class="ar-sub-empty is-error">Failed to load subdomains.</div>';
    });
};

window.createSubdomain = async function(tldName) {
  var sid   = arSubId(tldName);
  var input = document.getElementById('ar-sub-input-' + sid);
  var btn   = document.getElementById('ar-sub-btn-' + sid);
  if (!input) return;

  var val = input.value.trim().toLowerCase();
  if (!val) { toast('Enter a subdomain name', 'warn'); input.focus(); return; }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(val)) {
    toast('Lowercase letters, numbers, and hyphens only; no leading or trailing hyphen', 'warn');
    input.focus(); return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon"></span>'; }
  try {
    var price = 0;
    try {
      var policy = await queryContract(CFG.REGISTRY, {subdomain_policy:{name:tldName}});
      if (policy && policy.price) price = parseInt(policy.price) || 0;
    } catch(e) {}
    await signAndBroadcastRegistry(
      CFG.REGISTRY,
      {register_subdomain:{name:tldName, subdomain:val, owner:userAddress}},
      price, null, null, TX_STEPS
    );
    toast(val + '.' + tldName + ' created!', 'ok');
    input.value = '';
    window.arSubPreview(tldName);
    window.loadSubdomainsList(tldName);
    loadPortfolio();
  } catch(e) {
    toast('Failed: ' + (e.message || String(e)).slice(0, 80), 'error');
  }
  if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-plus"></i><span>Create</span>'; }
};

window.deleteSubdomain = async function(fullName, tldName) {
  if (!confirm('Delete ' + fullName + '?\nThis cannot be undone.')) return;
  try {
    await signAndBroadcastRegistry(CFG.REGISTRY, {burn:{name:fullName}}, 0, null, null, TX_STEPS);
    toast(fullName + ' deleted.', 'ok');
    window.loadSubdomainsList(tldName);
    loadPortfolio();
  } catch(e) {
    toast('Failed to delete: ' + (e.message || String(e)).slice(0, 80), 'error');
  }
};

function didForDomain(domain) {
  return 'did:cosmos:1:cosmoshub:atomregistry:' + encodeURIComponent(domain).replace(/%2E/gi, '.').replace(/%2D/gi, '-');
}

function didAliasForDomain(domain) {
  return 'did:cosmos:cosmoshub:atomregistry:' + encodeURIComponent(domain).replace(/%2E/gi, '.').replace(/%2D/gi, '-');
}

function initDidPanel() {
  var domain = currentManagedDomain;
  if (!domain) return;

  var canonical = didForDomain(domain);
  var alias     = didAliasForDomain(domain);
  var encoded   = encodeURIComponent(canonical);
  var resolverUrl = 'https://did.atomregistry.com/1.0/identifiers/' + encoded;

  var elCanonical = $('didCanonical');
  var elAlias     = $('didAlias');
  var elDoc       = $('didDocPreview');
  var elBadge     = $('didDocBadge');
  var elLink      = $('didResolverLink');

  if (elCanonical) elCanonical.textContent = canonical;
  if (elAlias)     elAlias.textContent     = alias;
  if (elLink)      elLink.href             = resolverUrl;

  var copyBtn = $('copyCanonicalDid');
  if (copyBtn) copyBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(canonical).then(function() { toast('DID copied!', 'ok'); });
  });

  var copyAliasBtn = $('copyAliasDid');
  if (copyAliasBtn) copyAliasBtn.addEventListener('click', function() {
    navigator.clipboard.writeText(alias).then(function() { toast('Alias copied!', 'ok'); });
  });

  if (elDoc) {
    elDoc.textContent = 'Fetching...';
    fetch(resolverUrl)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data && data.didDocument) {
          elDoc.textContent = JSON.stringify(data.didDocument, null, 2);
          if (elBadge) elBadge.textContent = data.didDocumentMetadata && data.didDocumentMetadata.deactivated ? 'deactivated' : 'live';
        } else if (data && data.didResolutionMetadata && data.didResolutionMetadata.error) {
          elDoc.textContent = 'Not resolved: ' + data.didResolutionMetadata.error;
          if (elBadge) elBadge.textContent = data.didResolutionMetadata.error;
        } else {
          elDoc.textContent = JSON.stringify(data, null, 2);
        }
      })
      .catch(function() {
        elDoc.textContent = 'Could not reach resolver.';
      });
  }
}

window.initManagePage = initManagePage;
window.loadPortfolio  = loadPortfolio;
