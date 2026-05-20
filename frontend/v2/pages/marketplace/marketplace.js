'use strict';

(function(){
  var CFG = {
    CHAIN_ID: 'cosmoshub-4',
    DENOM: 'uatom',
    GAS_PRICE: 0.025,
    GAS_ADJ: 1.8,
    GAS_FALLBACK: 450000,
    REGISTRY: 'cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe',
    MARKETPLACE: 'cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc',
    TYPE_EXECUTE: '/cosmwasm.wasm.v1.MsgExecuteContract',
    TYPE_PUBKEY: '/cosmos.crypto.secp256k1.PubKey',
    REST: [
      'https://cosmos-rest.publicnode.com',
      'https://rest.cosmos.directory/cosmoshub',
      'https://cosmoshub-api.lavenderfive.com',
      'https://cosmos-api.polkachu.com'
    ]
  };

  var FEATURED_NAMES = [
  ];

  var state = {
    userAddress: null,
    pubKey: null,
    accountName: '',
    connected: false,
    marketplaceConfig: null,
    ownedDomains: [],
    myListings: []
  };

  function $(id){ return document.getElementById(id); }
  function qsa(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  function shortAddress(address, head, tail){ if(!address) return '-'; return address.slice(0, head || 10) + '...' + address.slice(-(tail || 6)); }
  function toB64(u8){ var s=''; for(var i=0;i<u8.length;i++) s += String.fromCharCode(u8[i]); return btoa(s); }
  function fromB64(b64){ var s = atob(b64); var out = new Uint8Array(s.length); for(var i=0;i<s.length;i++) out[i] = s.charCodeAt(i); return out; }
  function normalizeName(value){ return String(value || '').trim().toLowerCase(); }
  function isLikelyDomain(name){ return /^[a-z0-9-]+\.[a-z0-9-]+(?:\.[a-z0-9-]+)*$/.test(String(name || '').trim().toLowerCase()); }
  function uatomToAtom(amount){ var n = Number(amount || 0) / 1000000; return Number.isFinite(n) ? trimZeros(n.toFixed(6)) : '0'; }
  function trimZeros(v){ return String(v).replace(/\.0+$/,'').replace(/(\.\d*?)0+$/,'$1'); }
  function atomToUatom(value){ var n = Number(value); if(!Number.isFinite(n) || n <= 0) throw new Error('Invalid ATOM price'); return String(Math.floor(n * 1000000)); }
  function formatCoin(amount, denom){ return denom === 'uatom' ? (uatomToAtom(amount) + ' ATOM') : (String(amount || '0') + ' ' + String(denom || '')); }
  function mintscanAddress(address){ return 'https://www.mintscan.io/cosmos/address/' + encodeURIComponent(address); }
  function mintscanTx(txhash){ return 'https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(txhash); }

  function toast(message, type){
    var el = $('toast');
    if(!el) return;
    el.textContent = message;
    el.style.borderColor = type === 'error' ? 'rgba(239,68,68,0.5)' : type === 'warn' ? 'rgba(245,158,11,0.5)' : 'rgba(34,211,238,0.4)';
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function(){ el.classList.remove('show'); }, 4500);
  }

  async function restFetch(path){
    var lastError;
    for(var i=0;i<CFG.REST.length;i++){
      try {
        var res = await fetch(CFG.REST[i] + path);
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch(e) { lastError = e; }
    }
    throw lastError || new Error('All REST endpoints failed');
  }

  async function restPost(path, body){
    var lastError;
    for(var i=0;i<CFG.REST.length;i++){
      try {
        var res = await fetch(CFG.REST[i] + path, {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify(body)
        });
        if(!res.ok) throw new Error('HTTP ' + res.status);
        return await res.json();
      } catch(e) { lastError = e; }
    }
    throw lastError || new Error('All REST endpoints failed');
  }

  async function queryContract(contract, query){
    var enc = btoa(JSON.stringify(query));
    var data = await restFetch('/cosmwasm/wasm/v1/contract/' + contract + '/smart/' + enc);
    return data.data;
  }

  async function getAccount(address){
    var d = await restFetch('/cosmos/auth/v1beta1/accounts/' + address);
    var acc = d && d.account ? d.account : d;
    for(var i=0;i<6 && acc;i++){
      if(acc.base_vesting_account) acc = acc.base_vesting_account.base_account || acc.base_vesting_account;
      else if(acc.base_account) acc = acc.base_account;
      else break;
    }
    return { accountNumber: BigInt(acc.account_number || 0), sequence: BigInt(acc.sequence || 0) };
  }

  async function loadBalance(){
    if(!state.userAddress) return '-';
    var d = await restFetch('/cosmos/bank/v1beta1/balances/' + state.userAddress);
    var coin = (d.balances || []).find(function(b){ return b.denom === CFG.DENOM; });
    return coin ? (uatomToAtom(coin.amount) + ' ATOM') : '0 ATOM';
  }

  async function loadOwnedNames(){
    if(!state.userAddress) return [];
    var r = await queryContract(CFG.REGISTRY, { names_by_owner: { owner: state.userAddress, start_after: null, limit: 100 } });
    return Array.isArray(r) ? r : (r && Array.isArray(r.names) ? r.names : []);
  }

  function PW(){ this.c = []; }
  PW.prototype.v = function(n){
    var b = [];
    if(typeof n === 'bigint'){
      while(n > 127n){ b.push(Number(n & 0x7Fn) | 0x80); n >>= 7n; }
      b.push(Number(n));
    } else {
      n = Math.floor(Number(n));
      while(n > 127){ b.push((n & 0x7F) | 0x80); n = Math.floor(n / 128); }
      b.push(n & 0x7F);
    }
    this.c.push(new Uint8Array(b)); return this;
  };
  PW.prototype.t = function(f,w){ return this.v((f << 3) | w); };
  PW.prototype.s = function(f,str){ if(str === undefined || str === null) return this; var e = new TextEncoder().encode(String(str)); this.t(f,2).v(e.length).c.push(e); return this; };
  PW.prototype.b = function(f,arr){ if(!arr || !arr.length) return this; var u = arr instanceof Uint8Array ? arr : new Uint8Array(arr); this.t(f,2).v(u.length).c.push(u); return this; };
  PW.prototype.u64 = function(f,n){ var bn = typeof n === 'bigint' ? n : BigInt(Math.floor(Number(n))); if(bn === 0n) return this; return this.t(f,0).v(bn); };
  PW.prototype.fin = function(){ var total=0, i; for(i=0;i<this.c.length;i++) total += this.c[i].length; var out = new Uint8Array(total); var p=0; for(i=0;i<this.c.length;i++){ out.set(this.c[i], p); p += this.c[i].length; } return out; };

  function encodeCoin(c){ return new PW().s(1,c.denom).s(2,String(c.amount)).fin(); }
  function encodeMsgExecute(sender, contract, msgObj, funds){
    var pw = new PW().s(1, sender).s(2, contract).b(3, new TextEncoder().encode(JSON.stringify(msgObj)));
    (funds || []).forEach(function(c){ if(c && c.amount && Number(c.amount) > 0) pw.b(5, encodeCoin(c)); });
    return pw.fin();
  }
  function anyMsg(typeUrl, value){ return new PW().s(1,typeUrl).b(2,value).fin(); }
  function txBody(msgBytes){ return new PW().b(1, anyMsg(CFG.TYPE_EXECUTE, msgBytes)).fin(); }
  function modeInfoDirect(){ return new PW().b(1, new PW().u64(1,1n).fin()).fin(); }
  function signerInfo(pubKey, seq){ return new PW().b(1, anyMsg(CFG.TYPE_PUBKEY, new PW().b(1,pubKey).fin())).b(2, modeInfoDirect()).u64(3, seq).fin(); }
  function feeMsg(amount, gas){ return new PW().b(1, encodeCoin({denom: CFG.DENOM, amount: amount})).u64(2, BigInt(gas)).fin(); }
  function authInfo(pubKey, seq, fee, gas){ return new PW().b(1, signerInfo(pubKey, seq)).b(2, feeMsg(fee, gas)).fin(); }
  function txRaw(body, auth, sig){ return new PW().b(1, body).b(2, auth).b(3, sig).fin(); }

  async function simulateGas(bodyBytes, authBytes){
    var sim = new PW().b(1, bodyBytes).b(2, authBytes).b(3, new Uint8Array(64)).fin();
    try {
      var j = await restPost('/cosmos/tx/v1beta1/simulate', { tx_bytes: toB64(sim) });
      var gas = parseInt((j.gas_info || {}).gas_used || 0, 10);
      if(gas > 50000) return Math.ceil(gas * CFG.GAS_ADJ);
    } catch(e) {}
    return CFG.GAS_FALLBACK;
  }

  async function broadcast(rawBytes){
    var j = await restPost('/cosmos/tx/v1beta1/txs', { tx_bytes: toB64(rawBytes), mode: 'BROADCAST_MODE_SYNC' });
    var r = j.tx_response || j;
    return { code: parseInt(r.code || 0, 10), txhash: r.txhash || '', rawLog: r.raw_log || '' };
  }

  function paintTxSteps(labels){
    var stepsEl = $('txSteps');
    var barEl = $('txBar');
    var panel = $('marketTxPanel');
    if(panel) panel.classList.remove('hidden');
    if(barEl) barEl.style.width = '0%';
    if(!stepsEl) return function(){};
    stepsEl.innerHTML = '';
    labels.forEach(function(label, idx){
      var div = document.createElement('div');
      div.className = 'market-tx-step';
      div.id = 'tx_step_' + (idx + 1);
      div.innerHTML = '<span>' + (idx + 1) + '</span><span>' + esc(label) + '</span>';
      stepsEl.appendChild(div);
    });
    return function(index, status){
      var el = $('tx_step_' + index);
      if(!el) return;
      el.classList.remove('active','done','error');
      el.classList.add(status);
      var dot = el.querySelector('span:first-child');
      if(dot) dot.textContent = status === 'done' ? '✓' : status === 'error' ? '✗' : String(index);
      if(barEl) {
        var pct = status === 'done' ? (index / labels.length * 100) : ((index - .5) / labels.length * 100);
        barEl.style.width = pct + '%';
      }
    };
  }

  async function signAndBroadcastContract(contract, msg, funds, labels){
    await ensureConnected();
    labels = labels || ['Build transaction','Simulate gas','Approve in wallet','Broadcast'];
    var setStep = paintTxSteps(labels);
    try {
      setStep(1, 'active');
      var fundsUatom = (funds && funds.length) ? Number(funds[0].amount || 0) : 0;
      setStep(1, 'done');
      setStep(2, 'active');
      setStep(2, 'done');
      setStep(3, 'active');
      toast('Review and approve in your wallet...', 'ok');
      var result = await window.executeContract(contract, msg, fundsUatom);
      setStep(3, 'done');
      setStep(4, 'active');
      setStep(4, 'done');
      var txBar = $('txBar');
      if(txBar) txBar.style.width = '100%';
      toast('Transaction broadcast: ' + result.txhash, 'ok');
      return result;
    } catch(e) {
      qsa('.market-tx-step.active').forEach(function(el){ el.classList.remove('active'); el.classList.add('error'); var dot = el.querySelector('span:first-child'); if(dot) dot.textContent = '✗'; });
      toast((e && e.message ? e.message : String(e)).slice(0, 260), 'error');
      throw e;
    }
  }

  function openWalletModal(){
    if(typeof window.openWalletModal === 'function') window.openWalletModal();
  }

  function syncGlobalWallet(){
    if(window.userAddress){
      state.userAddress = window.userAddress;
      state.pubKey      = window.pubKey || null;
      state.connected   = true;
      renderWallet();
    }
  }

  function renderWallet(){
    var stat = $('marketWalletStatus');
    if(!stat) return;
    if(!state.connected){ stat.textContent = 'Not connected'; return; }
    stat.textContent = shortAddress(state.userAddress, 10, 6);
    if(window.NameResolver){
      window.NameResolver.resolveAddress(state.userAddress).then(function(name){
        if(name && stat) stat.textContent = name;
      });
    }
  }

  async function ensureConnected(){
    syncGlobalWallet();
    if(state.connected && state.userAddress) return;
    openWalletModal();
    throw new Error('Wallet not connected. Please connect your wallet from the top menu first.');
  }

  function cardLoading(text){ return '<div class="market-loading-card"><div><span class="market-spinner"></span><strong>' + esc(text || 'Loading...') + '</strong><span>Querying Cosmos Hub...</span></div></div>'; }
  function cardEmpty(title, text, icon){ return '<div class="market-empty-card"><div><i class="fas ' + esc(icon || 'fa-box-open') + '"></i><strong>' + esc(title) + '</strong><span>' + esc(text) + '</span></div></div>'; }
  function cardError(error){ return '<div class="market-error-card"><div><i class="fas fa-triangle-exclamation"></i><strong>Something failed</strong><span>' + esc(error && error.message ? error.message : error) + '</span></div></div>'; }

  function listingCard(listing, opts){
    opts = opts || {};
    var denom = state.marketplaceConfig && state.marketplaceConfig.denom ? state.marketplaceConfig.denom : CFG.DENOM;
    var isMine = state.connected && listing.seller === state.userAddress;
    var actions = opts.compact ? 'single' : '';
    var actionBtn = isMine
      ? '<button class="market-danger-button" type="button" data-cancel-listing="' + esc(listing.name) + '"><i class="fas fa-ban"></i> Cancel listing</button>'
      : '<button class="market-card-button" type="button" data-buy-listing="' + esc(listing.name) + '" data-price="' + esc(listing.price) + '"><i class="fas fa-bag-shopping"></i>Buy</button>';
    return '' +
      '<article class="market-listing-card" data-name="' + esc(listing.name) + '">' +
        '<div class="market-card-top">' +
          '<div><div class="market-name">' + esc(listing.name) + '</div><div class="market-seller mono">Seller <span data-resolve-address="' + esc(listing.seller) + '">' + esc(shortAddress(listing.seller, 10, 6)) + '</span></div></div>' +
          '<div class="market-price">' + esc(formatCoin(listing.price, denom)) + '</div>' +
        '</div>' +
        '<div class="market-badges"><span class="market-badge"><i class="fas fa-tag"></i>Fixed price</span><span class="market-badge"><i class="fas fa-link"></i>On-chain</span>' + (isMine ? '<span class="market-badge"><i class="fas fa-user"></i>Your listing</span>' : '') + '</div>' +
        '<div class="market-card-actions ' + actions + '">' +
          actionBtn +
          (!opts.compact ? '<a class="market-ghost-button" data-route="search" href="/search?q=' + encodeURIComponent(listing.name) + '"><i class="fas fa-eye"></i>View</a>' : '') +
        '</div>' +
      '</article>';
  }

  function ownedDomainCard(name, listing){
    var listed = !!listing;
    var priceAtom = listing && listing.price ? uatomToAtom(listing.price) : '';
    return '' +
      '<article class="market-domain-card" data-name="' + esc(name) + '">' +
        '<div class="market-card-top">' +
          '<div><div class="market-name">' + esc(name) + '</div><div class="market-meta">' + (listed ? 'Already listed on marketplace' : 'Owned by your wallet') + '</div></div>' +
          '<div class="market-price">' + (listed ? esc(formatCoin(listing.price, (state.marketplaceConfig && state.marketplaceConfig.denom) || CFG.DENOM)) : '-') + '</div>' +
        '</div>' +
        '<div class="market-badges"><span class="market-badge"><i class="fas fa-folder-open"></i>Owned</span>' + (listed ? '<span class="market-badge"><i class="fas fa-tag"></i>Listed</span>' : '<span class="market-badge"><i class="fas fa-circle-plus"></i>Ready to list</span>') + '</div>' +
        '<div class="market-form-grid">' +
          '<input class="market-form-input" type="number" min="0" step="0.000001" placeholder="Price in ATOM" value="' + esc(priceAtom) + '" data-price-input="' + esc(name) + '" />' +
          '<button class="market-card-button" type="button" data-create-listing="' + esc(name) + '"><i class="fas fa-tag"></i>' + (listed ? 'Update' : 'List') + '</button>' +
          '<div class="market-form-help">Use ATOM here. The script converts to uatom before signing.</div>' +
        '</div>' +
        (listed ? '<div class="market-card-actions single"><button class="market-danger-button" type="button" data-cancel-listing="' + esc(name) + '"><i class="fas fa-ban"></i>Cancel listing</button></div>' : '') +
      '</article>';
  }

  async function loadConfig(){
    state.marketplaceConfig = await queryContract(CFG.MARKETPLACE, { config: {} });
    var addrShort = $('marketplaceAddrShort');
    if(addrShort) addrShort.textContent = shortAddress(CFG.MARKETPLACE, 10, 6);
    var denom = $('marketplaceDenom');
    if(denom) denom.textContent = (state.marketplaceConfig && state.marketplaceConfig.denom === 'uatom') ? 'ATOM' : ((state.marketplaceConfig && state.marketplaceConfig.denom) || CFG.DENOM);
    var out = $('marketConfigOut');
    if(out) out.textContent = JSON.stringify(state.marketplaceConfig, null, 2);
    return state.marketplaceConfig;
  }

  async function safeListing(name){
    try {
      var listing = await queryContract(CFG.MARKETPLACE, { listing: { name: name } });
      if(!listing || !listing.name) return null;
      return listing;
    } catch(e) { return null; }
  }

  // The marketplace contract exposes only `config` and `listing { name }`.
  // Bulk discovery is done by checking each name from the curated FEATURED_NAMES
  // list above (or from the user's own owned-names set in My domains/My listings).

  async function searchListing(){
    var input = $('marketSearchInput');
    var result = $('marketSearchResult');
    var name = normalizeName(input && input.value);
    if(!name) return toast('Enter a domain name', 'warn');
    if(!isLikelyDomain(name)) return toast('Use full domain format, e.g. church.atom', 'warn');
    if(result) result.innerHTML = cardLoading('Searching listing...');
    try {
      if(!state.marketplaceConfig) await loadConfig();
      var listing = await queryContract(CFG.MARKETPLACE, { listing: { name: name } });
      if(result) result.innerHTML = listing && listing.name ? listingCard(listing, { compact: true }) : cardEmpty('No active listing', name + ' is not listed on the marketplace right now.', 'fa-magnifying-glass');
    } catch(e) {
      if(result) result.innerHTML = cardEmpty('No active listing', name + ' is not listed or the query returned no listing.', 'fa-magnifying-glass');
    }
  }

  async function loadFeaturedListings(){
    var grid = $('featuredListingsGrid');
    if(!grid) return;

    if(!FEATURED_NAMES.length){
      grid.innerHTML = cardEmpty(
        'Search a domain to view listings',
        'The marketplace contract resolves listings by name. Use the search box above to look up any domain, or open My domains to list one of your own.',
        'fa-magnifying-glass'
      );
      return;
    }

    grid.innerHTML = cardLoading('Loading featured listings...');

    var checks = FEATURED_NAMES.map(safeListing);
    var resolved = await Promise.all(checks);
    var listings = resolved.filter(function(l){ return l && l.name; });

    grid.innerHTML = listings.length
      ? listings.map(function(l){ return listingCard(l); }).join('')
      : cardEmpty(
          'Featured domains not listed right now',
          'The curated featured names are not currently on the marketplace. Search any domain above or list one of your own from My domains.',
          'fa-store'
        );

    if(window.NameResolver) window.NameResolver.refreshAddressDisplays();
  }

  async function loadOwnedDomains(){
    await ensureConnected();
    var grid = $('ownedDomainsGrid');
    if(grid) grid.innerHTML = cardLoading('Loading your domains...');
    state.ownedDomains = (await loadOwnedNames()).sort();
    var checks = [];
    for(var i=0;i<state.ownedDomains.length;i++) checks.push(safeListing(state.ownedDomains[i]));
    var listings = await Promise.all(checks);
    state.myListings = listings.filter(function(l){ return l && l.seller === state.userAddress; });
    renderOwnedDomains(listings);
    renderMyListings();
  }

  function renderOwnedDomains(listings){
    var grid = $('ownedDomainsGrid');
    if(!grid) return;
    if(!state.connected) { grid.innerHTML = cardEmpty('Connect wallet', 'Connect your wallet to see domains available for listing.', 'fa-wallet'); return; }
    if(!state.ownedDomains.length && listings !== undefined) { grid.innerHTML = cardEmpty('No names found', 'This wallet has no registered names on Cosmos Hub.', 'fa-folder-open'); return; }
    if(!state.ownedDomains.length) { grid.innerHTML = cardLoading('Loading your domains...'); return; }
    var byName = {};
    (listings || state.myListings || []).forEach(function(l){ if(l && l.name) byName[l.name] = l; });
    grid.innerHTML = state.ownedDomains.map(function(name){ return ownedDomainCard(name, byName[name]); }).join('');
  }

  function renderMyListings(){
    var grid = $('myListingsGrid');
    if(!grid) return;
    if(!state.connected) { grid.innerHTML = cardEmpty('Connect wallet', 'Connect your wallet to load your marketplace listings.', 'fa-wallet'); return; }
    if(!state.myListings.length) { grid.innerHTML = cardEmpty('No active listings', 'No active marketplace listings were found for your owned domains.', 'fa-tags'); return; }
    grid.innerHTML = state.myListings.map(function(l){ return listingCard(l); }).join('');
  }

  async function createOrUpdateListing(name){
    await ensureConnected();
    if(!state.marketplaceConfig) await loadConfig();
    var input = document.querySelector('[data-price-input="' + CSS.escape(name) + '"]');
    var atomPrice = input ? input.value : '';
    var price = atomToUatom(atomPrice);
    await signAndBroadcastContract(CFG.MARKETPLACE, { list: { name: name, price: price } }, []);
    await loadOwnedDomains();
    var searchInput = $('marketSearchInput');
    if(searchInput) searchInput.value = name;
    await searchListing();
  }

  async function cancelListing(name){
    await ensureConnected();
    await signAndBroadcastContract(CFG.MARKETPLACE, { cancel: { name: name } }, []);
    await loadOwnedDomains();
  }

  async function buyListing(name, price){
    await ensureConnected();
    if(!state.marketplaceConfig) await loadConfig();
    var denom = state.marketplaceConfig && state.marketplaceConfig.denom ? state.marketplaceConfig.denom : CFG.DENOM;
    await signAndBroadcastContract(CFG.MARKETPLACE, { buy: { name: name } }, [{ denom: denom, amount: String(price) }]);
    var input = $('marketSearchInput');
    if(input) input.value = name;
    await searchListing();
    await loadFeaturedListings();
  }

  async function runRawQuery(){
    var out = $('rawQueryOut');
    try {
      var q = JSON.parse($('rawQuery').value);
      out.textContent = JSON.stringify(await queryContract(CFG.MARKETPLACE, q), null, 2);
    } catch(e) { out.textContent = e && e.message ? e.message : String(e); }
  }

  async function runRawExecute(){
    await ensureConnected();
    var msg = JSON.parse($('rawExecute').value);
    var funds = $('rawFunds').value.trim() ? JSON.parse($('rawFunds').value) : [];
    await signAndBroadcastContract(CFG.MARKETPLACE, msg, funds);
  }

  function switchTab(tab){
    qsa('[data-market-tab]').forEach(function(btn){ btn.classList.toggle('active', btn.getAttribute('data-market-tab') === tab); });
    qsa('[data-market-panel]').forEach(function(panel){ panel.classList.toggle('active', panel.getAttribute('data-market-panel') === tab); });
    if(tab === 'my-domains' || tab === 'my-listings') {
      if(!state.connected) {
        renderOwnedDomains();
        renderMyListings();
      } else if(!state.ownedDomains.length) {
        loadOwnedDomains().catch(function(e){ toast(e.message || String(e), 'error'); });
      }
    }
  }

  var _delegationBound = false;

  function bindEvents(){
    var el;

    el = $('marketSearchBtn');    if(el) el.addEventListener('click', searchListing);
    el = $('marketSearchInput');  if(el) el.addEventListener('keydown', function(e){ if(e.key === 'Enter') searchListing(); });
    el = $('marketRefreshBtn');   if(el) el.addEventListener('click', function(){ loadConfig().then(loadFeaturedListings).catch(function(e){ toast(e.message || String(e), 'error'); }); });
    el = $('loadOwnedDomainsBtn');if(el) el.addEventListener('click', function(){ loadOwnedDomains().catch(function(e){ toast(e.message || String(e), 'error'); }); });
    el = $('loadMyListingsBtn');  if(el) el.addEventListener('click', function(){ loadOwnedDomains().then(function(){ switchTab('my-listings'); }).catch(function(e){ toast(e.message || String(e), 'error'); }); });
    el = $('runRawQuery');        if(el) el.addEventListener('click', runRawQuery);
    el = $('runRawExecute');      if(el) el.addEventListener('click', function(){ runRawExecute().catch(function(e){ toast(e.message || String(e), 'error'); }); });

    qsa('[data-market-tab]').forEach(function(btn){
      btn.addEventListener('click', function(){ switchTab(btn.getAttribute('data-market-tab')); });
    });

    document.addEventListener('wallet:connected', function(){
      syncGlobalWallet();
      if(state.connected && !state.ownedDomains.length){
        renderOwnedDomains();
        renderMyListings();
      }
    });

    if(!_delegationBound){
      _delegationBound = true;
      document.addEventListener('click', function(e){
        var buy = e.target.closest('[data-buy-listing]');
        if(buy){ buyListing(buy.getAttribute('data-buy-listing'), buy.getAttribute('data-price')).catch(function(err){ toast(err.message || String(err), 'error'); }); return; }
        var create = e.target.closest('[data-create-listing]');
        if(create){ createOrUpdateListing(create.getAttribute('data-create-listing')).catch(function(err){ toast(err.message || String(err), 'error'); }); return; }
        var cancel = e.target.closest('[data-cancel-listing]');
        if(cancel){ cancelListing(cancel.getAttribute('data-cancel-listing')).catch(function(err){ toast(err.message || String(err), 'error'); }); }
      });
    }
  }

  async function init(){
    bindEvents();
    renderWallet();
    if(new URLSearchParams(location.search).has('dev')) {
      var dev = $('marketDevPanel');
      if(dev) dev.classList.remove('hidden');
    }
    try { await loadConfig(); }
    catch(e) {
      var out = $('marketConfigOut');
      if(out) out.textContent = e.message || String(e);
      toast('Marketplace config failed: ' + (e.message || String(e)).slice(0, 180), 'warn');
    }
    if(state.connected) {
      loadOwnedDomains().catch(function(e){ toast(e.message || String(e), 'error'); });
    } else {
      renderOwnedDomains();
      renderMyListings();
    }
    await loadFeaturedListings();
  }

  window.AtomMarketplace = {
    CFG: CFG,
    state: state,
    init: init,
    searchListing: searchListing,
    loadOwnedDomains: loadOwnedDomains,
    buyListing: buyListing,
    createOrUpdateListing: createOrUpdateListing,
    cancelListing: cancelListing,
    loadFeaturedListings: loadFeaturedListings
  };

  window.ArViewInit = window.ArViewInit || {};
  window.ArViewInit['marketplace'] = function () {
    var pendingName = window._marketplacePendingSell || null;
    if (pendingName) window._marketplacePendingSell = null;

    syncGlobalWallet();
    var syncPromise = Promise.resolve();

    syncPromise.then(function () {
      return window.AtomMarketplace.init();
    }).then(function () {
      if (!pendingName) return;
      switchTab('my-domains');
      if (state.ownedDomains.length) {
        var el = document.querySelector('[data-price-input="' + CSS.escape(pendingName) + '"]');
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      } else {
        loadOwnedDomains().then(function () {
          var el = document.querySelector('[data-price-input="' + CSS.escape(pendingName) + '"]');
          if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
        }).catch(function () {});
      }
    });
  };
})();
