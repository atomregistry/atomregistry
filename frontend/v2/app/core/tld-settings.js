'use strict';

function loadMyTlds(){
  if(!userAddress) return;
  renderMyTldList();
}

function openTldEditor(label){
  editingTld=label;
  $('editingTldLabel').textContent='.'+label;
  $('tldSettingsEditor').classList.remove('hidden');
  var tld=allTlds.find(function(t){return t.label===label;});
  if(tld&&tld.policy){
    setPriceSliderValue('setting', tld.policy.price||1000000);
    if (window.applyLengthTierPreset) applyLengthTierPreset('setting', label, tld.policy.price||1000000);
    if (window.updateTierExamples) updateTierExamples('setting', label);
    $('settingRecipient').value=tld.policy.recipient||userAddress||'';
    $('settingMaxPerAddr').value=tld.policy.max_per_address||'100';
    $('settingOpen').value=(tld.policy.enabled&&tld.policy.registration_open)?'open':'closed';
    var isOpen=tld.policy.enabled&&tld.policy.registration_open;
    $('currentPolicyBadge').textContent=isOpen?'Public':'Private';
    $('currentPolicyBadge').className='text-xs px-3 py-1 rounded-full '+(isOpen?'bg-green-500/15 text-green-400 border border-green-500/20':'bg-red-500/15 text-red-400 border border-red-500/20');
    $('cpStatus').textContent=isOpen?'Public':'Private';
    $('cpPrice').textContent=uatomToAtom(tld.policy.price);
    $('cpRecipient').textContent=tld.policy.recipient||'-';
    $('cpMax').textContent=tld.policy.max_per_address;
    $('currentPolicyInfo').classList.remove('hidden');
  } else {
    setPriceSliderValue('setting', 1000000);
    if (window.applyLengthTierPreset) applyLengthTierPreset('setting', label, 1000000);
    if (window.updateTierExamples) updateTierExamples('setting', label);
    $('settingRecipient').value=userAddress||'';
    $('currentPolicyInfo').classList.add('hidden');
    $('currentPolicyBadge').textContent='No Policy';
    $('currentPolicyBadge').className='text-xs px-3 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20';
  }
}

window.initManageTldsPage = function() {
  if (typeof window.initLengthTierPricingUi === 'function') window.initLengthTierPricingUi();
  renderMyTldList();

  var b = $('saveTldSettingsBtn');
  if (b) b.addEventListener('click', async function(){
    if(!editingTld||!userAddress){ toast('Select a TLD first','warn'); return; }
    var price=parseInt($('settingPrice').value)||0;
    var recipient=$('settingRecipient').value.trim()||userAddress;
    var max=parseInt($('settingMaxPerAddr').value)||100;
    var isOpen=$('settingOpen').value==='open';
    if(!price){ toast('Enter a price in uatom','warn'); return; }
    var btn=$('saveTldSettingsBtn'); btn.disabled=true; btn.innerHTML='<span class="spin-icon mr-2"></span> Saving...';
    $('settingsTxProgress').classList.remove('hidden');
    try {
      await signAndBroadcastRegistry(CFG.REGISTRY,{
        set_subdomain_policy:{name:editingTld,policy:{enabled:true,registration_open:isOpen,denom:CFG.DENOM,price:String(price),recipient:recipient,max_per_address:max}}
      },0,$('settingsTxSteps'),$('settingsTxBar'),TX_STEPS);
      if (window.saveLengthTierPreset && window.collectTierValues) saveLengthTierPreset(editingTld, collectTierValues('setting'));
      toast('Settings saved! On-chain fallback + local tier preset updated.','ok');
      $('settingsTxProgress').classList.add('hidden');
      loadTlds();
      openTldEditor(editingTld);
    } catch(e){
      $('settingsTxProgress').classList.add('hidden');
      var m=e.message||String(e);
      if(/rejected|denied|cancel/i.test(m)) toast('Cancelled','warn');
      else toast('Failed: '+m.slice(0,120),'error');
    }
    btn.disabled=false; btn.innerHTML='<i class="fas fa-save"></i> Save Settings On-Chain';
  });

  var d = $('disablePolicyBtn');
  if (d) d.addEventListener('click', async function(){
    if(!editingTld||!userAddress){ toast('Select a TLD first','warn'); return; }
    if(!confirm('Disable subdomain registration for .'+editingTld+'?')) return;
    var btn=$('disablePolicyBtn'); btn.disabled=true; btn.innerHTML='<span class="spin-icon"></span>';
    try {
      await signAndBroadcastRegistry(CFG.REGISTRY,{set_subdomain_policy:{name:editingTld,policy:null}},0,null,null,TX_STEPS);
      toast('Registration disabled for .'+editingTld,'ok');
      loadTlds();
      openTldEditor(editingTld);
    } catch(e){ toast('Failed: '+(e.message||'').slice(0,80),'error'); }
    btn.disabled=false; btn.innerHTML='Make Private';
  });
};

