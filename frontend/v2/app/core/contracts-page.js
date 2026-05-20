'use strict';
(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function copy(text){navigator.clipboard&&navigator.clipboard.writeText(text).then(function(){ if(window.toast) toast('Copied'); }).catch(function(){ if(window.toast) toast('Copy failed','error'); });}
  function card(label,key,description){
    var value=CFG[key]||'';
    var url='https://www.mintscan.io/cosmos/wasm/contract/'+encodeURIComponent(value);
    return '<article class="glass-card rounded-2xl p-5 contract-card"><div class="flex items-center justify-between gap-3 mb-3"><div><div class="text-xs text-cyan-400 uppercase tracking-widest">'+esc(key)+'</div><h2 class="font-display text-xl font-bold">'+esc(label)+'</h2></div><a class="market-primary-button" href="'+url+'" target="_blank" rel="noopener">Mintscan</a></div><p class="text-gray-400 text-sm mb-3">'+esc(description)+'</p><div class="addr-block mono text-xs break-all">'+esc(value)+'</div><button class="flow-action mt-3" data-copy="'+esc(value)+'" type="button"><i class="fas fa-copy"></i> Copy address</button></article>';
  }
  function init(){
    var grid=document.getElementById('contractsGrid');
    if(grid){grid.innerHTML=[
      card('Registry','REGISTRY','Core name ownership and registry state.'),
      card('Registrar','REGISTRAR','Domain registration execution contract.'),
      card('TLD Manager','TLD_MANAGER','Top-level namespace minting and policy management.'),
      card('Resolver','RESOLVER','Records, wallet resolution and web content pointers.'),
      card('Metadata','METADATA','Profile and metadata records for domains.'),
      card('Marketplace','MARKETPLACE','Fixed-price domain listing, purchase and cancellation.'),
      card('Site Registry','SITE_REGISTRY','On-chain HTML site storage with version history. Powers Web3 search and the Page Builder.'),
      card('dSSL Manager','DSSL','dSSL certificate style records and validation state.'),
      card('DID','DID_ADAPTER','did:cosmos adapter — every registered domain is a W3C-resolvable Decentralized Identifier.')
    ].join('');}
    var endpoints=document.getElementById('endpointList');
    if(endpoints){endpoints.innerHTML=(CFG.REST||[]).map(function(x){return '<div class="glass-card rounded-xl p-4 flex items-center justify-between gap-3"><code class="mono text-xs break-all">'+esc(x)+'</code><button class="flow-action" data-copy="'+esc(x)+'" type="button">Copy</button></div>';}).join('');}
    document.addEventListener('click',function(e){var b=e.target.closest('[data-copy]');if(b) copy(b.getAttribute('data-copy'));});
  }
  window.ArContractsPage = { init: init };
})();
