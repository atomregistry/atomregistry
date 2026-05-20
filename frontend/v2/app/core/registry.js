'use strict';

var TLD_SEED = [
'btc','chain','any','atom','bitcoin','custody','blockchain','dev','btc','do','eureka','chain','global','grok','custody','hemp','dev','do','index','eureka','lab','global','link','grok','lunc','hemp','mori','move','name','index','onchain','oracle','lab','org','osmosis','link','price','lunc','reserve','route','mori','move','name','skip','onchain','oracle','treasury','org','osmosis','ultra','val','price','reserve','route','web','skip','xyz','zk','treasury','ultra','val','web','xyz','zk'
];

var loadTldsInProgress = false;
var tldsLoaded = false;
async function loadTlds() {
  if (loadTldsInProgress) return;
  loadTldsInProgress = true;
  tldsLoaded = false;
  try {
    var nameOwners = new Map();

    TLD_SEED.forEach(function(label){ nameOwners.set(label, null); });

    if (userAddress) {
      try {
        var resp = await queryContract(CFG.REGISTRY,{names_by_owner:{owner:userAddress,start_after:null,limit:100}});
        var names = resp.names||[];
        names.filter(function(n){ return n.indexOf('.')===-1; }).forEach(function(n){
          nameOwners.set(n, userAddress);
        });
      } catch(e) {}
    }

    allTlds = [];
    var roots = Array.from(nameOwners.entries()).sort(function(a,b){ return a[0].localeCompare(b[0]); });
    for (var k = 0; k < roots.length; k++) {
      var label = roots[k][0];
      var owner = roots[k][1];
      var policy = null;
      try {
        policy = await queryContract(CFG.REGISTRY, { subdomain_policy:{ name:label } });
      } catch (e) {}

      if(!owner && userAddress && policy && policy.recipient &&
         policy.recipient.toLowerCase() === userAddress.toLowerCase()) {
        owner = userAddress;
      }
      allTlds.push({ label:label, owner:owner, policy:policy });
      if (policy && policy.enabled && policy.registration_open) renderQuickTldOptions();
    }

    tldsLoaded = true;
    renderTldBrowser();
    renderQuickTldOptions();
    renderTldPageList();
    renderMyTldList();

  } catch(e) {
    console.error('[TLD] loadTlds error:', e);
  } finally {
    loadTldsInProgress = false;
  }
}

function bindOpenTabButtons(root) {
  Array.prototype.forEach.call((root || document).querySelectorAll('[data-open-tab]'), function(btn){
    if(btn.dataset.boundOpenTab === '1') return;
    btn.dataset.boundOpenTab = '1';
    btn.addEventListener('click', function(e){
      e.preventDefault();
      showPage(btn.getAttribute('data-open-tab'), { scrollToApp: true });
    });
  });
}

var quickSearchMode = 'domain';
var quickDomainOfferData = null;
var quickTldOfferData = null;
var quickDomainChecking = false;
var quickDomainAfterRegister = false;
var quickLastCheckedLabel = null;
var quickLastCheckedTld = null;

function setQuickButton(label, iconClass) {
  var btn = $('quickSearchBtn');
  if (!btn) return;
  btn.innerHTML = '<i class="fas '+(iconClass || 'fa-search')+' mr-2"></i><span id="quickSearchButtonText">'+esc(label)+'</span>';
}

function resetQuickDomainOffer() {
  quickDomainOfferData = null;
  quickTldOfferData = null;
  quickDomainChecking = false;
  quickDomainAfterRegister = false;
  quickLastCheckedLabel = null;
  quickLastCheckedTld = null;
  var panel = $('quickDomainOffer');
  if (panel) { panel.classList.add('hidden'); panel.innerHTML = ''; }
  var btn = $('quickSearchBtn');
  if (btn) btn.disabled = false;
  setQuickButton(quickSearchMode === 'tld' ? 'Check TLD availability' : 'Check availability', 'fa-search');
}

function renderQuickDomainOffer(kind, data) {
  var panel = $('quickDomainOffer');
  if (!panel) return;
  panel.classList.remove('hidden');

  if (kind === 'taken') {
    quickDomainOfferData = null;
    panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-red-500/20">'+
      '<div class="flex items-center gap-3"><span class="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold">TAKEN</span>'+
      '<span class="font-display font-bold text-lg text-white">'+esc(data.fullName)+'</span></div>'+
      '<p class="text-gray-500 text-xs mt-2">Try another name or switch TLD.</p></div>';
    setQuickButton('Check another name', 'fa-search');
    return;
  }

  if (kind === 'closed') {
    quickDomainOfferData = null;
    panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-yellow-500/20">'+
      '<div class="flex items-center gap-3"><span class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-bold">CLOSED</span>'+
      '<span class="font-display font-bold text-lg text-white">'+esc(data.fullName)+'</span></div>'+
      '<p class="text-yellow-400 text-xs mt-2">Registration for this TLD is currently closed.</p></div>';
    setQuickButton('Check another name', 'fa-search');
    return;
  }

  quickDomainOfferData = data;
  var price = uatomToAtom(data.priceUatom);
  panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-green-500/20">'+
    '<div class="flex items-center justify-between gap-4 flex-wrap mb-3">'+
      '<div><div class="flex items-center gap-2 mb-1"><span class="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold">AVAILABLE</span><span class="text-gray-500 text-xs">ready to register</span></div>'+
      '<div class="font-display font-bold text-xl text-cyan-400">'+esc(data.fullName)+'</div></div>'+
      '<div class="text-right"><div class="text-white font-bold text-lg">'+esc(price)+'</div><div class="text-gray-500 text-xs">one-time • forever</div></div>'+
    '</div>'+
    '<div class="grid grid-cols-3 gap-2 text-xs mb-3">'+
      '<div class="rounded-lg bg-white/5 border border-white/10 p-2"><span class="text-green-400">✓</span> Forever</div>'+
      '<div class="rounded-lg bg-white/5 border border-white/10 p-2"><span class="text-green-400">✓</span> On-chain</div>'+
      '<div class="rounded-lg bg-white/5 border border-white/10 p-2"><span class="text-green-400">✓</span> Transferable</div>'+
    '</div>'+
    '<div id="quickNameTxWrap" class="hidden mt-3 glass-card p-3 rounded-xl">'+
      '<p class="font-display text-xs text-purple-400 mb-2" style="letter-spacing:0.08em">⚡ REGISTERING</p>'+
      '<div id="quickNameTxSteps" class="space-y-1.5"></div>'+
      '<div class="mt-2 h-1 rounded-full bg-white/5 overflow-hidden"><div id="quickNameTxBar" class="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full transition-all duration-500" style="width:0%"></div></div>'+
    '</div>'+
  '</div>';
  setQuickButton('Register '+data.fullName+' - '+price, 'fa-cart-shopping');
}

function renderQuickTldOffer(kind, data) {
  var panel = $('quickDomainOffer');
  if (!panel) return;
  panel.classList.remove('hidden');
  quickDomainOfferData = null;

  if (kind === 'reserved') {
    quickTldOfferData = null;
    panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-yellow-500/20">'+
      '<div class="flex items-center gap-3 mb-1"><span class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-bold">RESERVED</span>'+
      '<span class="font-display font-bold text-lg text-white">.'+esc(data.label)+'</span></div>'+
      '<p class="text-yellow-400 text-xs mt-2">This TLD is reserved and cannot be registered.</p></div>';
    setQuickButton('Check another TLD', 'fa-search');
    return;
  }

  if (kind === 'taken') {
    quickTldOfferData = null;
    panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-red-500/20">'+
      '<div class="flex items-center gap-3"><span class="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold">TAKEN</span>'+
      '<span class="font-display font-bold text-lg text-white">.'+esc(data.label)+'</span></div>'+
      '<p class="text-gray-500 text-xs mt-2">Try another TLD.</p></div>';
    setQuickButton('Check another TLD', 'fa-search');
    return;
  }

  quickTldOfferData = data;
  panel.innerHTML = '<div class="glass-card rounded-xl p-4 border border-green-500/20">'+
    '<div class="flex items-center justify-between gap-4 flex-wrap mb-3">'+
      '<div><div class="flex items-center gap-2 mb-1"><span class="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold">AVAILABLE</span><span class="text-gray-500 text-xs">buy here, no scrolling circus</span></div>'+
      '<div class="font-display font-bold text-xl text-cyan-400">.'+esc(data.label)+'</div></div>'+
      '<div class="text-right"><div class="text-white font-bold text-lg">'+calculateDomainPrice(data.label)+' ATOM</div><div class="text-gray-500 text-xs">one-time • forever</div></div>'+
    '</div>'+
    '<div id="quickTldWaitWrap" class="hidden rounded-xl bg-cyan-500/5 border border-cyan-500/15 p-3 mb-3 text-center">'+
      '<div class="font-display text-cyan-400 text-2xl font-bold" id="quickTldTimerText">10</div>'+
      '<div class="text-gray-500 text-xs">seconds left before registration</div>'+
    '</div>'+
    '<div id="quickTldTxWrap" class="hidden mt-3 glass-card p-3 rounded-xl">'+
      '<p class="font-display text-xs text-purple-400 mb-2" style="letter-spacing:0.08em">⚡ ON-CHAIN TRANSACTION</p>'+
      '<div id="quickTldTxSteps" class="space-y-1.5"></div>'+
      '<div class="mt-2 h-1 rounded-full bg-white/5 overflow-hidden"><div id="quickTldTxBar" class="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full transition-all duration-500" style="width:0%"></div></div>'+
    '</div>'+
  '</div>';
  setQuickButton('Commit .'+data.label+' - step 1/2', 'fa-lock');
  restoreQuickTldCommitIfPossible(data.label);
}

function restoreQuickTldCommitIfPossible(label) {
  var saved = loadSavedTldCommit();
  if (!saved || saved.label !== label || saved.address !== userAddress) return;
  quickTldOfferData = { label: label, stage: 'waiting', secret: saved.secret, timestamp: saved.timestamp };
  tldPendingLabel = label;
  tldPendingSecret = saved.secret;
  tldCommitTimestamp = saved.timestamp;
  var elapsed = (Date.now() - tldCommitTimestamp) / 1000;
  if (elapsed >= CFG.MIN_COMMIT && elapsed < CFG.MAX_COMMIT) {
    quickTldOfferData.stage = 'ready';
    setQuickButton('Register .'+label+' - '+calculateDomainPrice(label)+' ATOM', 'fa-check-circle');
    toast('Commit found. Ready to register.', 'ok');
  } else if (elapsed < CFG.MIN_COMMIT) {
    startQuickTldTimer();
  } else {
    clearTldCommit();
    quickTldOfferData.stage = 'commit';
  }
}

function startQuickTldTimer() {
  var waitWrap = $('quickTldWaitWrap');
  if (waitWrap) waitWrap.classList.remove('hidden');
  clearInterval(tldTimerInterval);
  tldTimerInterval = setInterval(function(){
    if (!quickTldOfferData || !quickTldOfferData.timestamp) { clearInterval(tldTimerInterval); return; }
    var elapsed = (Date.now() - quickTldOfferData.timestamp) / 1000;
    var remaining = Math.max(0, CFG.MIN_COMMIT - elapsed);
    var timer = $('quickTldTimerText');
    if (timer) timer.textContent = Math.ceil(remaining);
    if (remaining <= 0) {
      clearInterval(tldTimerInterval);
      if (waitWrap) waitWrap.classList.add('hidden');
      quickTldOfferData.stage = 'ready';
      setQuickButton('Register .'+quickTldOfferData.label+' - '+calculateDomainPrice(quickTldOfferData.label)+' ATOM', 'fa-check-circle');
      toast('Ready to register .'+quickTldOfferData.label, 'ok');
    }
  }, 500);
}

async function quickCommitTld() {
  if (!quickTldOfferData || !quickTldOfferData.label) return runQuickTldSearch();
  if (!userAddress) { toast('Connect wallet first', 'warn'); openWalletModal(); return; }
  var label = quickTldOfferData.label;
  tldPendingLabel = label;
  tldPendingSecret = genSecret();
  tldCommitTimestamp = null;
  var commitment = userAddress + ':' + label + ':' + tldPendingSecret;
  var btn = $('quickSearchBtn');
  var txWrap = $('quickTldTxWrap');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon mr-2"></span><span>Committing...</span>'; }
  if (txWrap) txWrap.classList.remove('hidden');
  try {
    await signAndBroadcast({ commit: { commitment: commitment } }, 0, $('quickTldTxSteps'), $('quickTldTxBar'), TX_STEPS);
    tldCommitTimestamp = Date.now();
    quickTldOfferData = { label: label, stage: 'waiting', secret: tldPendingSecret, timestamp: tldCommitTimestamp };
    saveTldCommit();
    if (txWrap) txWrap.classList.add('hidden');
    if (btn) btn.disabled = false;
    setQuickButton('Waiting for commit...', 'fa-hourglass-half');
    toast('Commit sent. Wait 10 seconds, because blockchains enjoy tiny rituals.', 'ok');
    startQuickTldTimer();
  } catch(e) {
    var m = e.message || String(e);
    if (/rejected|denied|cancel/i.test(m)) toast('Cancelled', 'warn');
    else toast('Commit failed: ' + m.slice(0,120), 'error');
    if (txWrap) txWrap.classList.add('hidden');
    if (btn) { btn.disabled = false; setQuickButton('Commit .'+label+' - step 1/2', 'fa-lock'); }
  }
}

async function quickRegisterTld() {
  if (!quickTldOfferData || !quickTldOfferData.label) return runQuickTldSearch();
  if (!userAddress) { toast('Connect wallet first', 'warn'); openWalletModal(); return; }
  var label = quickTldOfferData.label;
  tldPendingLabel = label;
  tldPendingSecret = quickTldOfferData.secret || tldPendingSecret;
  tldCommitTimestamp = quickTldOfferData.timestamp || tldCommitTimestamp;
  var elapsed = (Date.now() - tldCommitTimestamp) / 1000;
  if (elapsed < CFG.MIN_COMMIT) { toast('Commit too young - wait a moment', 'warn'); return; }
  if (elapsed > CFG.MAX_COMMIT) { toast('Commit expired - commit again', 'error'); clearTldCommit(); quickTldOfferData.stage = 'commit'; setQuickButton('Commit .'+label+' - step 1/2', 'fa-lock'); return; }
  var btn = $('quickSearchBtn');
  var txWrap = $('quickTldTxWrap');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon mr-2"></span><span>Registering...</span>'; }
  if (txWrap) txWrap.classList.remove('hidden');
  try {
    var result = await signAndBroadcast({ register_tld: { label: label, owner: userAddress, secret: tldPendingSecret } }, calculateDomainPriceUatom(label), $('quickTldTxSteps'), $('quickTldTxBar'), TX_STEPS);
    clearTldCommit();
    quickTldOfferData = null;
    tldPendingLabel = null; tldPendingSecret = null; tldCommitTimestamp = null;
    loadTlds();
    var registeredTld = '.' + label + ' TLD';
    toast('🎉 ' + registeredTld + ' registered!', 'ok');
    setLastPurchaseTx(registeredTld, result.txhash);
    launchConfetti();
    showSuccessModal(registeredTld, result.txhash);
    setQuickButton('Registered - view my domains', 'fa-check');
    quickDomainAfterRegister = true;
    if (btn) btn.disabled = false;
  } catch(e) {
    var m = e.message || String(e);
    if (/rejected|denied|cancel/i.test(m)) toast('Cancelled', 'warn');
    else if (/insufficient/i.test(m)) toast('Insufficient ATOM', 'error');
    else if (/exists/i.test(m)) toast('TLD already taken', 'error');
    else toast('Failed: ' + m.slice(0,120), 'error');
    if (btn) { btn.disabled = false; setQuickButton('Register .'+label+' - '+calculateDomainPrice(label)+' ATOM', 'fa-check-circle'); }
  }
}

function continueQuickTldRegistration() {
  if (!quickTldOfferData || !quickTldOfferData.label) return runQuickTldSearch();
  if (quickTldOfferData.stage === 'ready') return quickRegisterTld();
  if (quickTldOfferData.stage === 'waiting') { toast('Wait for the commit timer to finish', 'warn'); return; }
  return quickCommitTld();
}

function setQuickSearchMode(mode, silent) {
  quickSearchMode = mode === 'tld' ? 'tld' : 'domain';
  var isTld = quickSearchMode === 'tld';
  var domainBtn = $('quickDomainModeBtn');
  var tldBtn = $('quickTldModeBtn');
  var row = $('quickSearchRow');
  var input = $('quickDomainInput');
  var select = $('quickTldSelect');
  var picker = $('quickTldPicker');
  var suffix = $('quickTldSuffix');
  var title = $('quickSearchTitle');
  var copy = $('quickSearchCopy');
  var buttonText = $('quickSearchButtonText');
  var note = $('quickSearchNote');
  var domainSummary = $('quickDomainSummary');
  var tldSummary = $('quickTldSummary');
  if (domainBtn) { domainBtn.classList.toggle('active', !isTld); domainBtn.setAttribute('aria-selected', isTld ? 'false' : 'true'); }
  if (tldBtn) { tldBtn.classList.toggle('active', isTld); tldBtn.setAttribute('aria-selected', isTld ? 'true' : 'false'); }
  if (row) row.classList.toggle('tld-mode', isTld);
  if (select) select.classList.toggle('hidden', isTld);
  if (picker) picker.classList.toggle('hidden', isTld);
  if (suffix) suffix.classList.toggle('hidden', !isTld);
  if (input) { input.placeholder = isTld ? '.yourbrand' : 'yourname'; input.maxLength = isTld ? 20 : 40; if (!silent) input.focus(); }
  if (title) title.textContent = isTld ? 'Own a whole .TLD' : 'Find your domain';
  if (copy) copy.innerHTML = isTld ? 'Register the namespace itself, like <strong>.yourname</strong>. Set registration rules and earn from names under it.' : 'Buy a name under an existing TLD, like <strong>yourname.atom</strong>. Switch to TLD if you want to own the whole namespace.';
  if (buttonText) buttonText.textContent = isTld ? 'Check TLD availability' : 'Check availability';
  if (note) note.innerHTML = isTld ? '<i class="fas fa-crown"></i><span>From 15 ATOM. Price varies by TLD length. Own the namespace forever.</span>' : '<i class="fas fa-shield-halved"></i><span>No hidden renewals. Your wallet stays in control.</span>';
  if (domainSummary) domainSummary.classList.toggle('hidden', isTld);
  if (tldSummary) tldSummary.classList.toggle('hidden', !isTld);
  resetQuickDomainOffer();
}
function runQuickSearch() {
  if (quickDomainAfterRegister) { quickDomainAfterRegister = false; return showPage('portfolio', { instant: true }); }
  if (quickSearchMode === 'tld') {
    if (quickTldOfferData) {
      var _inp2 = $('quickDomainInput');
      var _cur2 = _inp2 ? _inp2.value.trim().toLowerCase().replace(/^\./, '').replace(/\..*$/, '') : '';
      if (_cur2 !== quickLastCheckedLabel) { resetQuickDomainOffer(); return; }
      return continueQuickTldRegistration();
    }
    return runQuickTldSearch();
  }
  if (quickDomainOfferData) {
    var _inp = $('quickDomainInput'), _sel = $('quickTldSelect');
    var _curLabel = _inp ? _inp.value.trim().toLowerCase().replace(/^\./, '').replace(/\..*$/, '') : '';
    var _curTld   = _sel ? normalizeTldLabel(_sel.value) : '';
    if (_curLabel !== quickLastCheckedLabel || _curTld !== quickLastCheckedTld) { resetQuickDomainOffer(); return; }
    return quickRegisterDomain();
  }
  return runQuickDomainSearch();
}
async function runQuickTldSearch() {
  var input = $('quickDomainInput');
  if (!input || quickDomainChecking) return;
  var label = input.value.trim().toLowerCase().replace(/^\./, '').replace(/\..*$/, '');
  if (!label) { toast('Enter a TLD first', 'warn'); input.focus(); return; }
  if (!/^[a-z0-9]{2,20}$/.test(label)) { toast('Use lowercase letters and numbers, 2-20 chars', 'warn'); return; }

  resetQuickDomainOffer();
  quickDomainChecking = true;
  var btn = $('quickSearchBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon mr-2"></span><span>Checking...</span>'; }

  try {
    var exists = false;
    try {
      var r = await queryContract(CFG.REGISTRY, { exists: { name: label } });
      exists = !!(r && r.exists);
    } catch(e) {}

    var reserved = false;
    try {
      var rv = await queryContract(CFG.TLD_MANAGER, { reserved: { label: label } });
      reserved = !!(rv && rv.reserved);
    } catch(e) {}

    if (reserved) renderQuickTldOffer('reserved', { label: label });
    else if (exists) renderQuickTldOffer('taken', { label: label });
    else { renderQuickTldOffer('available', { label: label }); quickLastCheckedLabel = label; }
  } catch(e) {
    toast('Check failed: ' + (e.message || String(e)).slice(0,120), 'error');
  } finally {
    quickDomainChecking = false;
    if (btn) btn.disabled = false;
    if (!quickTldOfferData && btn) setQuickButton('Check TLD availability', 'fa-search');
  }
}

function normalizeTldLabel(label) {
  return String(label || '').trim().toLowerCase().replace(/^\./, '');
}

function uniqueTlds(list) {
  var seen = new Map();
  (list || []).forEach(function(t){
    if (!t || !t.label) return;
    var label = normalizeTldLabel(t.label);
    if (!label) return;
    if (!seen.has(label)) seen.set(label, Object.assign({}, t, { label: label }));
    else {
      var existing = seen.get(label);

      if ((!existing.policy && t.policy) || (!existing.owner && t.owner)) {
        seen.set(label, Object.assign({}, existing, t, { label: label }));
      }
    }
  });
  return Array.from(seen.values());
}

function closeQuickTldPicker() {
  var picker = $('quickTldPicker');
  var trigger = $('quickTldTrigger');
  if (picker) picker.classList.remove('open');
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleQuickTldPicker() {
  var picker = $('quickTldPicker');
  var trigger = $('quickTldTrigger');
  if (!picker || picker.classList.contains('hidden')) return;
  var open = !picker.classList.contains('open');
  picker.classList.toggle('open', open);
  if (trigger) trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function syncQuickTldPickerFromSelect() {
  var select = $('quickTldSelect');
  var current = $('quickTldCurrent');
  if (select && current) current.textContent = '.' + normalizeTldLabel(select.value || 'atom');
}

function selectQuickTld(label) {
  var select = $('quickTldSelect');
  label = normalizeTldLabel(label);
  if (!select || !label) return;
  select.value = label;
  syncQuickTldPickerFromSelect();
  Array.prototype.forEach.call(document.querySelectorAll('#quickTldMenu .quick-tld-option'), function(btn){
    var active = normalizeTldLabel(btn.dataset.label) === label;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-selected', active ? 'true' : 'false');
  });
  closeQuickTldPicker();
  resetQuickDomainOffer();
}

function renderQuickTldDropdown(tlds, current) {
  var menu = $('quickTldMenu');
  var currentEl = $('quickTldCurrent');
  if (!menu) return;
  tlds = uniqueTlds(tlds);
  current = normalizeTldLabel(current || 'atom');
  if (currentEl) currentEl.textContent = '.' + current;
  if (!tlds.length) {
    menu.innerHTML = '<div class="quick-tld-empty">No public TLDs loaded yet.</div>';
    return;
  }
  menu.innerHTML = tlds.map(function(t){
    var label = normalizeTldLabel(t.label);
    var active = label === current;
    var status = (t.policy && t.policy.registration_open) ? 'open' : 'listed';
    return '<button class="quick-tld-option '+(active ? 'active' : '')+'" type="button" data-label="'+esc(label)+'" role="option" aria-selected="'+(active ? 'true' : 'false')+'">'+
      '<span class="quick-tld-option-name">.'+esc(label)+'</span>'+
      '<span class="quick-tld-option-status">'+status+'</span>'+
    '</button>';
  }).join('');
  Array.prototype.forEach.call(menu.querySelectorAll('.quick-tld-option'), function(btn){
    btn.addEventListener('click', function(){ selectQuickTld(btn.dataset.label); });
  });
}

function renderQuickTldOptions() {
  var select = $('quickTldSelect');
  if (!select || !allTlds || !allTlds.length) return;
  var dedupedAll = uniqueTlds(allTlds);
  allTlds = dedupedAll;
  var openTlds = dedupedAll.filter(function(t){ return t.policy && t.policy.enabled && t.policy.registration_open; });
  if (!openTlds.length) return;
  var preferred = ['atom','web3','dao','app','wallet','ai','crypto','defi'];
  openTlds.sort(function(a, b){
    var ai = preferred.indexOf(a.label), bi = preferred.indexOf(b.label);
    if (ai === -1) ai = 999;
    if (bi === -1) bi = 999;
    return ai === bi ? a.label.localeCompare(b.label) : ai - bi;
  });
  var current = normalizeTldLabel(select.value);
  openTlds = uniqueTlds(openTlds).slice(0, 80);
  select.innerHTML = openTlds.map(function(t){ return '<option value="'+esc(t.label)+'">.'+esc(t.label)+'</option>'; }).join('');
  if (!openTlds.some(function(t){ return t.label === current; })) {
    if (openTlds.some(function(t){ return t.label === 'atom'; })) select.value = 'atom';
    else if (openTlds[0]) select.value = openTlds[0].label;
  }
  syncQuickTldPickerFromSelect();
  renderQuickTldDropdown(openTlds, select.value);
}

async function runQuickDomainSearch() {
  var input = $('quickDomainInput');
  var select = $('quickTldSelect');
  if (!input || !select || quickDomainChecking) return;
  var label = input.value.trim().toLowerCase().replace(/^\./, '').replace(/\..*$/, '');
  if (!label) { toast('Enter a name first', 'warn'); input.focus(); return; }
  if (!/^[a-z0-9-]{1,40}$/.test(label)) { toast('Use lowercase letters, numbers or hyphens', 'warn'); return; }

  resetQuickDomainOffer();
  quickDomainChecking = true;
  var btn = $('quickSearchBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon mr-2"></span><span>Checking...</span>'; }

  try {
    if (!allTlds || !allTlds.length) await loadTlds();
    var tld = allTlds.find(function(t){ return t.label === select.value; }) || allTlds.find(function(t){ return t.label === 'atom'; });
    if (!tld) { toast('No TLDs loaded yet. Try refresh.', 'warn'); return; }

    var fullName = label + '.' + tld.label;
    var exists = false;
    try {
      var resp = await queryContract(CFG.REGISTRY, { exists: { name: fullName } });
      exists = !!(resp && resp.exists);
    } catch(e) {}

    if (!tld.policy || !tld.policy.enabled || !tld.policy.registration_open) {
      renderQuickDomainOffer('closed', { fullName: fullName });
    } else if (exists) {
      renderQuickDomainOffer('taken', { fullName: fullName });
    } else {
      renderQuickDomainOffer('available', {
        label: label,
        tldLabel: tld.label,
        fullName: fullName,
        priceUatom: parseInt(tld.policy.price || 0, 10)
      });
      quickLastCheckedLabel = label;
      quickLastCheckedTld = tld.label;
    }
  } catch(e) {
    toast('Check failed: ' + (e.message || String(e)).slice(0,120), 'error');
  } finally {
    quickDomainChecking = false;
    if (btn) btn.disabled = false;
    if (!quickDomainOfferData && btn) setQuickButton('Check availability', 'fa-search');
  }
}

async function quickRegisterDomain() {
  if (!quickDomainOfferData) return runQuickDomainSearch();
  if (!userAddress) {
    toast('Connect wallet first', 'warn');
    openWalletModal();
    return;
  }

  var offer = quickDomainOfferData;
  var btn = $('quickSearchBtn');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin-icon mr-2"></span><span>Awaiting wallet...</span>'; }
  var txWrap = $('quickNameTxWrap');
  if (txWrap) txWrap.classList.remove('hidden');

  try {
    var result = await signAndBroadcastRegistry(
      CFG.REGISTRY,
      { register_subdomain: { parent: offer.tldLabel, label: offer.label } },
      offer.priceUatom,
      $('quickNameTxSteps'),
      $('quickNameTxBar'),
      TX_STEPS
    );
    toast('🎉 ' + offer.fullName + ' registered!', 'ok');
    setLastPurchaseTx(offer.fullName, result.txhash);
    launchConfetti();
    showSuccessModal(offer.fullName, result.txhash);
    quickDomainOfferData = null;
    quickDomainAfterRegister = true;
    setQuickButton('Registered - view my domains', 'fa-check');
    var btn2 = $('quickSearchBtn');
    if (btn2) btn2.disabled = false;
  } catch(e) {
    var m = e.message || String(e);
    if (/rejected|denied|cancel/i.test(m)) toast('Cancelled', 'warn');
    else if (/insufficient/i.test(m)) toast('Insufficient ATOM', 'error');
    else if (/limit/i.test(m)) toast('Max names per address reached for this TLD', 'error');
    else toast('Failed: ' + m.slice(0,120), 'error');
    if (btn) { btn.disabled = false; setQuickButton('Register '+offer.fullName+' - '+uatomToAtom(offer.priceUatom), 'fa-cart-shopping'); }
  }
}

function renderTldBrowser() {
  var el = $('tldBrowser');
  if(!el) return;
  if(!allTlds.length){
    if(!tldsLoaded){
      el.innerHTML='<div class="tld-empty-state"><div><span class="spin-icon mr-2"></span><strong>Loading public namespaces...</strong></div></div>';
    } else {
      el.innerHTML='<div class="tld-empty-state"><div><strong>No public registration policies found.</strong></div><button type="button" data-open-tab="tlds">Own a TLD</button></div>';
      bindOpenTabButtons(el);
    }
    return;
  }

  var openTlds = allTlds.filter(function(t){return t.policy && t.policy.enabled && t.policy.registration_open;});
  var enabledTlds = allTlds.filter(function(t){return t.policy && t.policy.enabled;});
  var visibleTlds = openTlds.length ? openTlds : enabledTlds;

  if(!visibleTlds.length){
    el.innerHTML='<div class="tld-empty-state"><div><strong>No public registration policies found.</strong></div><button type="button" data-open-tab="tlds">Own a TLD</button></div>';
    bindOpenTabButtons(el);
    return;
  }

  var preferred = ['atom','web3','dao','app','wallet','ai','crypto','defi','nft','id'];
  visibleTlds.sort(function(a,b){
    var ai=preferred.indexOf(a.label), bi=preferred.indexOf(b.label);
    if(ai===-1) ai=999; if(bi===-1) bi=999;
    return ai===bi ? a.label.localeCompare(b.label) : ai-bi;
  });

  var html = visibleTlds.map(function(t){
    var price = t.policy ? uatomToAtom(t.policy.price) : 'Policy loading';
    var isOpen = t.policy && t.policy.registration_open;
    return '<button class="tld-pill" data-label="'+esc(t.label)+'">'+
      '<span class="'+(isOpen?'text-cyan-400':'text-gray-500')+'">.</span>'+esc(t.label)+
      '<span class="ml-1.5 '+(isOpen?'text-gray-400':'text-gray-600')+' text-xs"> | '+price+'</span>'+
      (isOpen?'':'<span class="ml-1 text-gray-600 text-xs">closed</span>')+
      '</button>';
  }).join('');

  el.innerHTML = html;
  el.querySelectorAll('.tld-pill').forEach(function(btn){
    btn.addEventListener('click', function(){
      el.querySelectorAll('.tld-pill').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      var tld = allTlds.find(function(t){return t.label===btn.dataset.label;});
      selectTld(tld);
    });
  });
}

function renderTldPageList() {
  var el = $('tldPageList');
  if (!el) return;
  if(!allTlds.length){ el.innerHTML='<span class="text-gray-600 text-xs">Loading...</span>'; return; }
  el.innerHTML = allTlds.map(function(t){
    var isOpen = t.policy&&t.policy.enabled&&t.policy.registration_open;
    return '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border '+(isOpen?'border-green-500/30 bg-green-500/10 text-green-400':'border-white/10 bg-white/3 text-gray-500')+'">'+
      '<span class="w-1.5 h-1.5 rounded-full '+(isOpen?'bg-green-400':'bg-gray-600')+' inline-block"></span>'+
      '.'+esc(t.label)+
    '</span>';
  }).join('');
}

function renderMyTldList() {
  var el = $('myTldList');
  if (!el) return;
  if(!userAddress){ el.innerHTML='<span class="text-gray-600 text-xs">Connect wallet to see your TLDs</span>'; return; }
  var mine = allTlds.filter(function(t){return t.owner===userAddress;});
  if(!mine.length){ el.innerHTML='<span class="text-gray-600 text-xs">You don\'t own any TLDs yet. <button class="text-purple-400 hover:text-purple-300" onclick="showPage(\'tlds\')">Get one →</button></span>'; return; }
  el.innerHTML = mine.map(function(t){
    var isOpen = t.policy&&t.policy.enabled&&t.policy.registration_open;
    return '<button class="tld-pill '+(editingTld===t.label?'active':'')+'" data-label="'+esc(t.label)+'">'+
      '.'+esc(t.label)+
      '<span class="ml-1.5 text-xs '+(isOpen?'text-green-400':'text-gray-600')+'">'+(isOpen?'public':'private')+'</span>'+
    '</button>';
  }).join('');
  el.querySelectorAll('.tld-pill').forEach(function(btn){
    btn.addEventListener('click', function(){
      el.querySelectorAll('.tld-pill').forEach(function(b){b.classList.remove('active');});
      btn.classList.add('active');
      openTldEditor(btn.dataset.label);
    });
  });
}

function updateTldCounts() {
  if(!userAddress) return;
  var mine = allTlds.filter(function(t){return t.owner===userAddress;});
  $('tldCount').textContent = mine.length;
}
