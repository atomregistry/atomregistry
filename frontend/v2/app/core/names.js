'use strict';

function selectTld(tld) {
  selectedTld = tld;
  selectedTldPolicy = tld.policy;
  $('selectedTldDisplay').textContent = '.'+tld.label;
  $('nameSearchSuffix').textContent = '.'+tld.label;
  var ownerAddr = tld.owner || (tld.policy && tld.policy.recipient) || null;
  $('selectedTldOwner').textContent = ownerAddr ? ownerAddr.slice(0,10)+'...'+ownerAddr.slice(-6) : '-';
  if(tld.policy) {
    $('selectedTldPrice').textContent = uatomToAtom(tld.policy.price);
  } else {
    $('selectedTldPrice').textContent = 'No policy set';
  }
  $('nameSearchPanel').classList.remove('hidden');
  $('nameSearchResult').innerHTML='';
  $('nameSearchInput').value='';
  $('nameSearchInput').focus();
}

var nameSearchBtn = $('nameSearchBtn'); if (nameSearchBtn) nameSearchBtn.addEventListener('click', searchName);
var nameSearchInput = $('nameSearchInput'); if (nameSearchInput) nameSearchInput.addEventListener('keydown', function(e){ if(e.key==='Enter') searchName(); });
var refreshTldsNameBtn = $('refreshTldsNameBtn'); if (refreshTldsNameBtn) refreshTldsNameBtn.addEventListener('click', loadTlds);
var refreshTldsPageBtn = $('refreshTldsPageBtn'); if (refreshTldsPageBtn) refreshTldsPageBtn.addEventListener('click', loadTlds);

async function searchName() {
  if(!selectedTld){ toast('Select a TLD first','warn'); return; }
  var raw = $('nameSearchInput').value.trim().toLowerCase().replace(/\..*$/,'');
  if(!raw){ toast('Enter a name','warn'); return; }

  var btn = $('nameSearchBtn');
  btn.disabled=true; btn.innerHTML='<span class="spin-icon"></span>';
  var result = $('nameSearchResult');
  result.innerHTML='<div class="text-center py-4 text-gray-500 text-sm"><span class="spin-icon mr-2"></span> Checking...</div>';

  try {
    var fullName = raw+'.'+selectedTld.label;
    var exists = false;
    try {
      var resp = await queryContract(CFG.REGISTRY, {exists:{name:fullName}});
      exists = resp&&resp.exists;
    } catch(e){}

    if(!selectedTldPolicy||!selectedTldPolicy.enabled||!selectedTldPolicy.registration_open) {
      result.innerHTML='<div class="glass-card rounded-xl p-5 border border-yellow-500/20">'+
        '<div class="flex items-center gap-3 mb-2"><span class="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded text-xs font-bold">CLOSED</span>'+
        '<span class="font-display font-bold text-lg text-white">'+esc(fullName)+'</span></div>'+
        '<p class="text-yellow-400 text-sm">Registration for this TLD is currently closed by the owner.</p>'+
        '</div>';
    } else if(exists) {
      result.innerHTML='<div class="glass-card rounded-xl p-5 border border-red-500/20">'+
        '<div class="flex items-center gap-3"><span class="bg-red-500/20 text-red-400 px-3 py-1 rounded text-xs font-bold">TAKEN</span>'+
        '<span class="font-display font-bold text-lg text-white">'+esc(fullName)+'</span></div>'+
        '</div>';
    } else {
      var price = uatomToAtom(selectedTldPolicy.price);
      result.innerHTML='<div class="glass-card rounded-xl p-5 border border-green-500/20">'+
        '<div class="flex items-center justify-between mb-4">'+
          '<div><div class="flex items-center gap-3 mb-1"><span class="bg-green-500/20 text-green-400 px-3 py-1 rounded text-xs font-bold">AVAILABLE</span></div>'+
          '<div class="font-display font-bold text-xl text-cyan-400">'+esc(fullName)+'</div></div>'+
          '<div class="text-xs text-gray-400 leading-relaxed mt-2"><span class="text-green-400">✓</span> Permanent ownership &nbsp; <span class="text-green-400">✓</span> Transfer anytime &nbsp; <span class="text-green-400">✓</span> On-chain proof</div>'+
          '<div class="text-right"><div class="text-white font-bold text-lg">'+esc(price)+'</div><div class="text-gray-500 text-xs">one-time • forever</div></div>'+
        '</div>'+
        '<button id="registerNameBtn" class="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-3 rounded-xl font-bold text-sm transition-all">'+
          'Register '+esc(fullName)+' - '+esc(price)+
        '</button>'+
        '<div id="nameRegTxWrap" class="hidden mt-4 glass-card p-4 rounded-xl">'+
          '<p class="font-display text-xs text-purple-400 mb-2" style="letter-spacing:0.08em">⚡ REGISTERING</p>'+
          '<div id="nameRegTxSteps" class="space-y-1.5"></div>'+
          '<div class="mt-2 h-1 rounded-full bg-white/5 overflow-hidden"><div id="nameRegTxBar" class="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full transition-all duration-500" style="width:0%"></div></div>'+
        '</div>'+
        '</div>';

      $('registerNameBtn').addEventListener('click', function(){
        registerName(raw, selectedTld.label, parseInt(selectedTldPolicy.price));
      });
    }
  } catch(e) {
    result.innerHTML='<div class="glass-card rounded-xl p-4 border border-red-500/20"><p class="text-red-400 text-sm">Error: '+esc(e.message||String(e))+'</p></div>';
  } finally {
    btn.disabled=false; btn.innerHTML='Check';
  }
}

async function registerName(label, tldLabel, priceUatom) {
  if(!userAddress){ toast('Connect wallet first','warn'); return; }
  var btn = $('registerNameBtn');
  btn.disabled=true; btn.innerHTML='<span class="spin-icon mr-2"></span> Registering...';
  $('nameRegTxWrap').classList.remove('hidden');

  try {
    var result = await signAndBroadcastRegistry(
      CFG.REGISTRY,
      { register_subdomain: { parent: tldLabel, label: label } },
      priceUatom,
      $('nameRegTxSteps'),
      $('nameRegTxBar'),
      TX_STEPS
    );
    var registeredName = label+'.'+tldLabel;
    toast('🎉 '+registeredName+' registered!','ok');
    setLastPurchaseTx(registeredName, result.txhash);
    launchConfetti();
    showSuccessModal(registeredName, result.txhash);
    $('nameSearchResult').innerHTML='';
    $('nameSearchInput').value='';
  } catch(e) {
    var m=e.message||String(e);
    if(/rejected|denied|cancel/i.test(m)) toast('Cancelled','warn');
    else if(/insufficient/i.test(m)) toast('Insufficient ATOM','error');
    else if(/limit/i.test(m)) toast('Max names per address reached for this TLD','error');
    else toast('Failed: '+m.slice(0,120),'error');
    btn.disabled=false; btn.innerHTML='Register '+label+'.'+tldLabel;
  }
}

