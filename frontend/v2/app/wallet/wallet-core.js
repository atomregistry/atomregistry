'use strict';

var walletAdapterLoaded = {};
var walletAdapterPaths = {
  keplr:        'app/wallet/adapters/keplr-wallet.js',
  cosmostation: 'app/wallet/adapters/cosmostation-wallet.js',
  ledger:       'app/wallet/adapters/ledger-wallet.js',
  keystone:     'app/wallet/adapters/keystone-wallet.js'
};

function _resolveAdapterPath(type) {
  var rel = walletAdapterPaths[type];
  if (!rel) return null;
  var el  = document.querySelector('base');
  var base = (el && el.getAttribute('href')) || './';
  return base.replace(/\/$/, '') + '/' + rel;
}

function loadWalletAdapter(type) {
  return new Promise(function (resolve, reject) {
    if (!type || walletAdapterLoaded[type]) { resolve(); return; }
    var src = _resolveAdapterPath(type);
    if (!src) { resolve(); return; }
    var s = document.createElement('script');
    s.src = src;
    s.onload  = function () { walletAdapterLoaded[type] = true; resolve(); };
    s.onerror = function () { reject(new Error('Failed to load wallet adapter: ' + type)); };
    document.head.appendChild(s);
  });
}

var walletSessionRestoreInProgress = false;
var walletSessionRestoreAttempted  = false;

function inferWalletTypeFromIdentity(identity) {
  if (!identity) return '';
  var raw = String(identity.type || identity.walletType || identity.providerName || identity.provider || '').toLowerCase();
  if (raw.indexOf('cosmostation') !== -1) return 'cosmostation';
  if (raw.indexOf('keystone')     !== -1) return 'keystone';
  if (raw.indexOf('ledger')       !== -1) return 'ledger';
  if (raw.indexOf('keplr')        !== -1) return 'keplr';
  return '';
}

function readStoredWalletIdentity(address) {
  try {
    var raw = null;
    if (address) {
      raw = localStorage.getItem('ar_wallet_identity_' + address) ||
            localStorage.getItem('ar_search_wallet_identity_' + address);
    }
    raw = raw || localStorage.getItem('ar_wallet_identity_latest');
    if (!raw) return null;
    var identity = JSON.parse(raw);
    if (address && identity && identity.address && identity.address !== address) return null;
    return identity || null;
  } catch (e) {
    return null;
  }
}

function getSavedWalletSession() {
  var saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('ar_wallet') || 'null'); } catch (e) { saved = null; }
  if (saved && saved.address) {
    saved.type = saved.type || saved.walletType || inferWalletTypeFromIdentity(saved.meta || saved);
    return saved;
  }

  var localAddress = '';
  try { localAddress = localStorage.getItem('ar_search_wallet') || ''; } catch (e) {}
  if (!localAddress) return null;
  var identity = readStoredWalletIdentity(localAddress);
  if (!identity || !identity.address) return null;

  var type = inferWalletTypeFromIdentity(identity);
  if (!type) {
    try {
      var provider = localStorage.getItem('ar_search_wallet_provider') || '';
      type = inferWalletTypeFromIdentity({ providerName: provider });
    } catch (e) {}
  }
  if (!type) type = 'keplr';

  return {
    type:    type,
    address: identity.address,
    meta: {
      accountName:  identity.accountName  || '',
      providerName: identity.providerName || '',
      walletType:   identity.walletType   || type
    },
    fromLocalStorage: true
  };
}

async function restoreWalletSession(opts) {
  opts = opts || {};
  if (userAddress) return true;
  if (walletSessionRestoreInProgress) return false;
  if (walletSessionRestoreAttempted && !opts.force) return false;
  walletSessionRestoreAttempted = true;

  var saved = opts.saved || getSavedWalletSession();
  if (!saved || !saved.address || !saved.type) return false;

  if (saved.type === 'ledger' || saved.type === 'keystone') return false;

  try { await loadWalletAdapter(saved.type); } catch (e) {
    console.warn('[wallet] adapter load failed', e);
    return false;
  }

  var adapter = window.WalletAdapters && window.WalletAdapters.get ? window.WalletAdapters.get(saved.type) : null;
  if (!adapter) return false;

  try {
    if (typeof adapter.isAvailable === 'function' && !(await adapter.isAvailable())) return false;
    walletSessionRestoreInProgress = true;
    var result = await adapter.connect();
    if (!result || !result.address || result.address !== saved.address) return false;

    userAddress = result.address;
    pubKey      = result.pubKey || null;
    walletType  = saved.type;
    walletPrefersAmino = !!result.prefersAmino;
    walletMeta  = result.meta || saved.meta || {};

    onConnected({ restored: true, silent: opts.silent !== false });
    return true;
  } catch (e) {
    console.warn('[wallet] auto-restore failed', e);
    try { sessionStorage.removeItem('ar_wallet'); } catch (_) {}
    return false;
  } finally {
    walletSessionRestoreInProgress = false;
  }
}
window.restoreWalletSession = restoreWalletSession;

async function resetWalletForSwitch(nextType) {
  var currentAdapter = window.WalletAdapters && window.WalletAdapters.get ? window.WalletAdapters.get(walletType) : null;
  if (currentAdapter && typeof currentAdapter.disconnect === 'function') {
    try { await currentAdapter.disconnect(); } catch (e) { console.warn('[wallet] adapter disconnect failed', e); }
  } else if (ledgerTransport && nextType !== 'ledger') {
    try { await ledgerTransport.close(); } catch (e) {}
    ledgerTransport = null;
    ledgerApp = null;
  }
  userAddress = null;
  pubKey      = null;
  walletType  = null;
  walletPrefersAmino = false;
  keystoneAccount    = null;
  walletMeta = {};
  if (typeof cosmostationProviderMode !== 'undefined') cosmostationProviderMode = null;
  if (typeof cosmostationChainName    !== 'undefined') cosmostationChainName    = null;
}

async function connectWallet(type) {
  try { await loadWalletAdapter(type); } catch (e) {
    toast('Failed to load wallet adapter: ' + type, 'error');
    return;
  }
  var adapter = window.WalletAdapters && window.WalletAdapters.get ? window.WalletAdapters.get(type) : null;
  var label   = adapter && adapter.label ? adapter.label : type;

  try {
    if (!adapter) throw new Error('Unsupported wallet type: ' + type);
    toast('Connecting ' + label + '...', 'ok');
    await resetWalletForSwitch(type);

    if (typeof adapter.isAvailable === 'function' && !(await adapter.isAvailable())) {
      if (type === 'keplr')        window.open('https://www.keplr.app/', '_blank');
      if (type === 'cosmostation') window.open('https://www.cosmostation.io/', '_blank');
      throw new Error(label + ' extension not found');
    }

    var result = await adapter.connect();
    if (!result || !result.address) throw new Error(label + ' did not provide a wallet address');

    userAddress = result.address;
    pubKey      = result.pubKey || null;
    walletType  = type;
    walletPrefersAmino = !!result.prefersAmino;
    walletMeta  = result.meta || {};

    if (type === 'ledger' && CFG.LEDGER_MOCK) toast('⚠ LEDGER MOCK MODE - test key only, not real funds', 'warn');

    closeWalletModal();
    onConnected();
  } catch (e) {
    if (type === 'ledger' && ledgerTransport) {
      try { await ledgerTransport.close(); } catch (_) {}
      ledgerTransport = null; ledgerApp = null;
    }
    var m = e && e.message ? e.message : String(e);
    if (type === 'ledger' && /hid/i.test(m))     toast('WebHID unavailable - use Chrome or Edge with USB Ledger.', 'error');
    else if (type === 'ledger' && /timeout/i.test(m)) toast('Ledger timed out - unlock device and open Cosmos app.', 'error');
    else toast('Connect failed: ' + m.slice(0, 220), 'error');
    console.error('[connectWallet] failed', e);
  }
}

function onConnected(opts) {
  opts = opts || {};
  var label       = getWalletLabel();
  var providerLabel = getWalletProviderLabel();
  var accountName = getWalletAccountName();
  var buttonText  = getWalletButtonText(userAddress);
  var longShortAddr = shortAddress(userAddress, 12, 6);

  var login       = $('loginSection');    if (login)    login.classList.add('hidden');
  var connected   = $('connectedState'); if (connected) connected.classList.remove('hidden');
  var bar         = $('walletBar');      if (bar)       bar.classList.remove('hidden');
  var barAddr     = $('walletAddrShort'); if (barAddr)  barAddr.textContent = longShortAddr;
  var connAddr    = $('connectedAddress'); if (connAddr) connAddr.textContent = userAddress;

  var topButton   = $('topConnectWalletBtn');
  var topLabel    = $('topConnectWalletLabel');
  var topChevron  = $('topWalletChevron');
  var topTitle    = $('topWalletTitle');
  var topSubtitle = $('topWalletSubtitle');
  var topAddress  = $('topWalletAddress');

  if (topButton) {
    topButton.classList.add('ar-wallet-connected');
    topButton.setAttribute('aria-label', 'Open connected wallet menu');
    topButton.setAttribute('title', (accountName ? accountName + ' via ' + providerLabel : providerLabel) + ' connected: ' + userAddress);
  }
  if (topLabel)    topLabel.textContent    = buttonText;
  if (topChevron)  topChevron.classList.remove('hidden');
  if (topTitle)    topTitle.textContent    = getWalletConnectedTitle();
  if (topSubtitle) {
    topSubtitle.textContent = getWalletConnectedSubtitle();
    topSubtitle.classList.toggle('hidden', !topSubtitle.textContent);
  }
  if (topAddress)  topAddress.textContent = userAddress || '-';

  storeWalletIdentitySnapshot();
  if (typeof renderLastPurchaseTx === 'function') renderLastPurchaseTx(getLastPurchaseTx());

  var badgeClass = walletType === 'keystone' ? 'wb-s' : walletType === 'ledger' ? 'wb-d' : walletType === 'cosmostation' ? 'wb-c' : 'wb-k';
  var badge = $('walletBadge');
  if (badge) { badge.className = 'wb ' + badgeClass; badge.textContent = label; }

  try {
    if (walletType === 'ledger') sessionStorage.removeItem('ar_wallet');
    else sessionStorage.setItem('ar_wallet', JSON.stringify({ type: walletType, address: userAddress, meta: walletMeta || {} }));
  } catch (e) {}

  if (typeof loadAccountData === 'function') loadAccountData();
  if (typeof loadTlds === 'function') {
    loadTlds().then(function () { if (typeof renderMyTldList === 'function') renderMyTldList(); });
  }
  try { document.dispatchEvent(new CustomEvent('wallet:connected', { detail: getWalletIdentitySnapshot() })); } catch (e) {}
  if (!opts.silent) toast(accountName ? ('Connected as ' + accountName + ' via ' + providerLabel + '!') : ('Connected via ' + label + '!'), 'ok');
}

function resetConnectedUi() {
  try {
    sessionStorage.removeItem('ar_wallet');
    sessionStorage.removeItem('ar_keystone_account');
    localStorage.removeItem('ar_search_wallet');
    localStorage.removeItem('ar_search_wallet_provider');
  } catch (e) {}
  userAddress = null;
  pubKey      = null;
  walletType  = null;
  walletPrefersAmino = false;
  walletMeta  = {};
  ledgerApp   = null;
  if (typeof updateTopWalletBalance === 'function') updateTopWalletBalance('-');
  if (typeof closeTopWalletMenu     === 'function') closeTopWalletMenu();

  if ($('loginSection'))   $('loginSection').classList.remove('hidden');
  if ($('connectedState')) $('connectedState').classList.add('hidden');
  if ($('walletBar'))      $('walletBar').classList.add('hidden');

  var topButton   = $('topConnectWalletBtn');
  var topLabel    = $('topConnectWalletLabel');
  var topChevron  = $('topWalletChevron');
  var topAddress  = $('topWalletAddress');
  var topTitle    = $('topWalletTitle');
  var topSubtitle = $('topWalletSubtitle');

  if (topButton) {
    topButton.classList.remove('ar-wallet-connected');
    topButton.setAttribute('aria-label', 'Connect wallet');
    topButton.removeAttribute('title');
  }
  if (topLabel)    topLabel.textContent    = 'Connect Wallet';
  if (topChevron)  topChevron.classList.add('hidden');
  if (topAddress)  topAddress.textContent  = '-';
  if (topTitle)    topTitle.textContent    = 'Connected wallet';
  if (topSubtitle) { topSubtitle.textContent = ''; topSubtitle.classList.add('hidden'); }
  if (typeof renderLastPurchaseTx === 'function') renderLastPurchaseTx(null);

  try { document.dispatchEvent(new CustomEvent('wallet:disconnected')); } catch (e) {}
  if (typeof ArRouter !== 'undefined') ArRouter.navigate('');
}

async function disconnect() {
  var adapter = window.WalletAdapters && window.WalletAdapters.get ? window.WalletAdapters.get(walletType) : null;
  if (adapter && typeof adapter.disconnect === 'function') {
    try { await adapter.disconnect(); } catch (e) { console.warn('[wallet] adapter disconnect failed', e); }
  } else if (ledgerTransport) {
    try { await ledgerTransport.close(); } catch (e) {}
    ledgerTransport = null;
  }
  resetConnectedUi();
}

async function loadAccountData() {
  if (!userAddress) return;
  if (typeof restFetch !== 'function') return;
  if (typeof updateTopWalletBalance === 'function') updateTopWalletBalance('Loading...');
  try {
    var d    = await restFetch('/cosmos/bank/v1beta1/balances/' + userAddress);
    var coin = (d.balances || []).find(function (b) { return b.denom === CFG.DENOM; });
    var amount = coin ? parseInt(coin.amount || '0', 10) : 0;
    if (!isFinite(amount)) amount = 0;
    var atomAmount = (amount / 1000000).toFixed(2);
    var balanceText = atomAmount + ' ATOM';

    var atomBalance = $('atomBalance');
    var walletBalance = $('walletBal');
    if (atomBalance)   atomBalance.textContent = balanceText;
    if (walletBalance) { walletBalance.textContent = balanceText; walletBalance.style.color = parseFloat(atomAmount) < 3 ? '#f87171' : '#fff'; }

    if (typeof updateTopWalletBalance === 'function') updateTopWalletBalance(balanceText);
  } catch (e) {
    console.error('[wallet] balance load failed', e);
    if (typeof updateTopWalletBalance === 'function') updateTopWalletBalance('Unable to load');
    var ab = $('atomBalance'); var wb = $('walletBal');
    if (ab) ab.textContent = '-';
    if (wb) wb.textContent = '-';
  }
}

window.addEventListener('keplr_keystorechange', function () {
  if (walletType === 'keplr') restoreWalletSession({ silent: true, force: true });
});

document.addEventListener('visibilitychange', function () {
  if (document.visibilityState === 'visible' && !userAddress) {
    restoreWalletSession({ silent: true, force: true });
  }
});
