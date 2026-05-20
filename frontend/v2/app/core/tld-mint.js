'use strict';

function genSecret(){var a=new Uint8Array(16);crypto.getRandomValues(a);return Array.from(a).map(function(b){return b.toString(16).padStart(2,'0');}).join('');}

function setTldStudioStatus(label, state) {
  var el = $('tldStudioPreviewStatus');
  if (!el) return;
  el.className = '';
  if (state === 'available') { el.textContent = 'Available'; el.classList.add('is-available'); }
  else if (state === 'taken') { el.textContent = 'Taken'; el.classList.add('is-taken'); }
  else if (state === 'reserved') { el.textContent = 'Reserved'; el.classList.add('is-reserved'); }
  else { el.textContent = 'Not checked'; }
}

function updateTldStudioPreview(value) {
  var label = String(value || '').trim().toLowerCase().replace(/^\./,'').replace(/[^a-z0-9]/g,'') || 'yourbrand';
  var root = $('tldStudioPreviewRoot');
  var examples = $('tldStudioPreviewExamples');
  if (root) root.textContent = '.' + label;
  if (examples) {
    examples.innerHTML = ['app','shop','id','docs'].map(function(prefix){
      return '<div><i></i><span>' + esc(prefix + '.' + label) + '</span></div>';
    }).join('');
  }
  setTldStudioStatus(label, null);
}

function setTldStudioFlowStep(step) {
  var nodes = document.querySelectorAll('#tldMintFlow .tld-studio-flow-track span');
  Array.prototype.forEach.call(nodes, function(node, idx){
    var n = idx + 1;
    node.classList.toggle('is-active', n === step);
    node.classList.toggle('is-done', n < step);
  });
}

function tldStudioResultCard(state, raw, message, price) {
  var label = state === 'available' ? 'AVAILABLE' : state === 'reserved' ? 'RESERVED' : 'TAKEN';
  return '<div class="tld-studio-result-card is-' + state + '">' +
    '<div class="tld-studio-result-main">' +
      '<span>' + label + '</span>' +
      '<strong>.' + esc(raw) + '</strong>' +
      '<p>' + esc(message) + '</p>' +
    '</div>' +
    (price ? '<div class="tld-studio-result-price">' + price + '</div>' : '') +
  '</div>';
}

async function checkTldAvailability() {
  var raw = $('tldCheckInput').value.trim().toLowerCase().replace(/^\./,'');
  if(!raw){ toast('Enter a TLD name','warn'); return; }
  if(raw.length < 2){ toast('Domain must be at least 2 characters long','warn'); return; }
  if(!/^[a-z0-9]{2,20}$/.test(raw)){ toast('Lowercase letters and numbers only, 2-20 chars','warn'); return; }

  var btn=$('tldCheckBtn');
  btn.disabled=true; btn.innerHTML='<span class="spin-icon"></span>';
  $('tldCheckResult').classList.add('hidden');
  $('tldMintFlow').classList.add('hidden');

  try {
    var exists=false;
    try { var r=await queryContract(CFG.REGISTRY,{exists:{name:raw}}); exists=r&&r.exists; } catch(e){}
    var reserved=false;
    try { var rv=await queryContract(CFG.TLD_MANAGER,{reserved:{label:raw}}); reserved=!!(rv&&rv.reserved); } catch(e){}

    $('tldCheckResult').classList.remove('hidden');
    if(reserved){
      $('tldCheckResult').innerHTML=tldStudioResultCard('reserved', raw, 'This namespace is reserved and cannot be registered.', '');
      setTldStudioStatus(raw, 'reserved');
    } else if(exists){
      $('tldCheckResult').innerHTML=tldStudioResultCard('taken', raw, 'This namespace already exists on-chain.', '');
      setTldStudioStatus(raw, 'taken');
    } else {
      $('tldCheckResult').innerHTML=tldStudioResultCard('available', raw, 'Ready to claim. Start the secure commit-reveal registration flow.', calculateDomainPrice(raw)+' ATOM');
      setTldStudioStatus(raw, 'available');
      tldPendingLabel=raw;
      $('tldMintLabel').textContent='.'+raw;
      $('tldRegisterLabel').textContent='.'+raw;
      $('tldMintFlow').classList.remove('hidden');
      $('tldCommitPanel').classList.remove('hidden');
      $('tldWaitPanel').classList.add('hidden');
      $('tldRegisterPanel').classList.add('hidden');
      setTldStudioFlowStep(1);

      var saved=loadSavedTldCommit();
      if(saved&&saved.address===userAddress&&saved.label===raw){
        tldPendingSecret=saved.secret;
        tldCommitTimestamp=saved.timestamp;
        restoreTldCommit();
      }
    }
  } catch(e){
    $('tldCheckResult').innerHTML='<div class="tld-studio-result-card is-taken"><div class="tld-studio-result-main"><span>ERROR</span><strong>Check failed</strong><p>'+esc(e.message)+'</p></div></div>';
    setTldStudioStatus(raw, null);
    $('tldCheckResult').classList.remove('hidden');
  } finally {
    btn.disabled=false; btn.innerHTML='<i class="fas fa-magnifying-glass"></i><span>Check namespace</span>';
  }
}

async function doTldCommit() {
  if(!userAddress){ toast('Connect wallet first','warn'); return; }
  tldPendingSecret=genSecret();
  var commitment=userAddress+':'+tldPendingLabel+':'+tldPendingSecret;
  var btn=$('tldCommitBtn');
  btn.disabled=true; btn.innerHTML='<span class="spin-icon mr-2"></span> Submitting...';
  $('tldTxProgress').classList.remove('hidden');
  try {
    var result=await signAndBroadcast(
      {commit:{commitment:commitment}}, 0,
      $('tldTxSteps'), $('tldTxBar'), TX_STEPS
    );
    tldCommitTimestamp=Date.now();
    saveTldCommit();
    toast('Commit broadcast!','ok');
    $('tldTxProgress').classList.add('hidden');
    $('tldCommitPanel').classList.add('hidden');
    startTldTimer();
  } catch(e){
    $('tldTxProgress').classList.add('hidden');
    var m=e.message||String(e);
    if(/rejected|denied|cancel/i.test(m)) toast('Cancelled','warn');
    else toast('Commit failed: '+m.slice(0,120),'error');
    btn.disabled=false; btn.innerHTML='<i class="fas fa-lock"></i><span>Start secure registration</span>';
  }
}

function startTldTimer() {
  setTldStudioFlowStep(2);
  $('tldWaitPanel').classList.remove('hidden');
  $('tldRegisterPanel').classList.add('hidden');
  clearInterval(tldTimerInterval);
  tldTimerInterval=setInterval(function(){
    var elapsed=(Date.now()-tldCommitTimestamp)/1000;
    var remaining=Math.max(0,CFG.MIN_COMMIT-elapsed);
    $('tldTimerText').textContent=Math.ceil(remaining);
    $('tldTimerLabel').textContent=Math.ceil(remaining)+' second'+(Math.ceil(remaining)!==1?'s':'');
    if(remaining<=0){
      clearInterval(tldTimerInterval);
      $('tldWaitPanel').classList.add('hidden');
      setTldStudioFlowStep(3);
      $('tldRegisterPanel').classList.remove('hidden');
      var _rBtn=$('tldRegisterBtn');
      if(_rBtn&&tldPendingLabel) _rBtn.innerHTML='<i class="fas fa-circle-check"></i><span>Register - '+calculateDomainPrice(tldPendingLabel)+' ATOM</span>';
      toast('Ready to register!','ok');
    }
  },1000);
}

function restoreTldCommit(){
  var elapsed=(Date.now()-tldCommitTimestamp)/1000;
  if(elapsed<CFG.MIN_COMMIT){ $('tldCommitPanel').classList.add('hidden'); startTldTimer(); }
  else if(elapsed<CFG.MAX_COMMIT){ setTldStudioFlowStep(3); $('tldCommitPanel').classList.add('hidden'); $('tldRegisterPanel').classList.remove('hidden'); var _rBtn2=$('tldRegisterBtn'); if(_rBtn2&&tldPendingLabel) _rBtn2.innerHTML='<i class="fas fa-circle-check"></i><span>Register - '+calculateDomainPrice(tldPendingLabel)+' ATOM</span>'; }
  else { toast('Previous commit expired. Please recommit.','warn'); clearTldCommit(); tldPendingLabel=null; tldPendingSecret=null; }
}

async function doTldRegister() {
  if(!userAddress){ toast('Connect wallet first','warn'); return; }
  var elapsed=(Date.now()-tldCommitTimestamp)/1000;
  if(elapsed<CFG.MIN_COMMIT){ toast('Commit too young - wait a moment','warn'); return; }
  if(elapsed>CFG.MAX_COMMIT){ toast('Commit expired - please recommit','error'); clearTldCommit(); return; }
  var btn=$('tldRegisterBtn');
  btn.disabled=true; btn.innerHTML='<span class="spin-icon mr-2"></span> Registering...';
  $('tldTxProgress').classList.remove('hidden');
  try {
    var result=await signAndBroadcast(
      {register_tld:{label:tldPendingLabel,owner:userAddress,secret:tldPendingSecret}},
      calculateDomainPriceUatom(tldPendingLabel),
      $('tldTxSteps'), $('tldTxBar'), TX_STEPS
    );
    clearTldCommit();
    var label=tldPendingLabel;
    tldPendingLabel=null; tldPendingSecret=null; tldCommitTimestamp=null;
    $('tldTxProgress').classList.add('hidden');
    $('tldMintFlow').classList.add('hidden');
    loadTlds();
    var registeredTld = '.'+label+' TLD';
    toast('🎉 '+registeredTld+' registered!','ok');
    setLastPurchaseTx(registeredTld, result.txhash);
    launchConfetti();
    showSuccessModal(registeredTld, result.txhash);
  } catch(e){
    $('tldTxProgress').classList.add('hidden');
    var m=e.message||String(e);
    if(/rejected|denied|cancel/i.test(m)) toast('Cancelled','warn');
    else if(/insufficient/i.test(m)) toast('Insufficient ATOM','error');
    else if(/exists/i.test(m)) toast('TLD already taken','error');
    else if(/expired/i.test(m)){ toast('Commit expired - please recommit','error'); clearTldCommit(); }
    else toast('Failed: '+m.slice(0,120),'error');
    btn.disabled=false; btn.innerHTML='<i class="fas fa-circle-check"></i><span>Register - '+calculateDomainPrice(tldPendingLabel)+' ATOM</span>';
  }
}

function saveTldCommit(){try{localStorage.setItem('ar_tld_commit',JSON.stringify({address:userAddress,label:tldPendingLabel,secret:tldPendingSecret,timestamp:tldCommitTimestamp}));}catch(e){}}
function loadSavedTldCommit(){try{return JSON.parse(localStorage.getItem('ar_tld_commit'));}catch(e){return null;}}
function clearTldCommit(){try{localStorage.removeItem('ar_tld_commit');}catch(e){}}

window.initMintTldPage = function() {
  var checkBtn = $('tldCheckBtn');
  if (checkBtn) checkBtn.addEventListener('click', checkTldAvailability);

  var checkInput = $('tldCheckInput');
  if (checkInput) {
    updateTldStudioPreview(checkInput.value);
    checkInput.addEventListener('keydown', function(e){ if(e.key==='Enter') checkTldAvailability(); });
    checkInput.addEventListener('input', function(){ updateTldStudioPreview(checkInput.value); });
  }

  Array.prototype.forEach.call(document.querySelectorAll('[data-tld-studio-example]'), function(btn){
    btn.addEventListener('click', function(){
      var value = btn.getAttribute('data-tld-studio-example') || '';
      if (checkInput) {
        checkInput.value = value;
        updateTldStudioPreview(value);
        checkInput.focus();
      }
    });
  });

  var commitBtn = $('tldCommitBtn');
  if (commitBtn) commitBtn.addEventListener('click', doTldCommit);

  var registerBtn = $('tldRegisterBtn');
  if (registerBtn) registerBtn.addEventListener('click', doTldRegister);
};

