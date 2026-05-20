'use strict';

window.WalletAdapters = (function () {
  var _registry = {};
  return {
    register: function (id, adapter) { _registry[id] = adapter; },
    get:      function (id)          { return _registry[id] || null; },
    list:     function ()            { return Object.keys(_registry); }
  };
})();

var walletMeta = {};

function getWalletIdentitySnapshot() {
  return {
    address:      userAddress || '',
    walletType:   walletType  || '',
    providerName: (walletMeta && walletMeta.providerName) || walletType || '',
    accountName:  (walletMeta && walletMeta.accountName)  || '',
    pubKeyHex:    pubKey ? bytesToHex(pubKey) : ''
  };
}

function storeWalletIdentitySnapshot() {
  if (!userAddress) return;
  var snap = getWalletIdentitySnapshot();
  try {
    localStorage.setItem('ar_wallet_identity_' + userAddress, JSON.stringify(snap));
    localStorage.setItem('ar_wallet_identity_latest', JSON.stringify(snap));
    localStorage.setItem('ar_search_wallet', userAddress);
    localStorage.setItem('ar_search_wallet_provider', snap.providerName || snap.walletType);
    localStorage.setItem('ar_search_wallet_identity_' + userAddress, JSON.stringify(snap));
  } catch (e) {}
}
window.storeWalletIdentitySnapshot = storeWalletIdentitySnapshot;
window.getWalletIdentitySnapshot    = getWalletIdentitySnapshot;

function getWalletLabel() {
  if (!walletType) return 'Wallet';
  if (walletType === 'keplr')        return 'Keplr';
  if (walletType === 'cosmostation') return 'Cosmostation';
  if (walletType === 'ledger')       return 'Ledger';
  if (walletType === 'keystone')     return 'Keystone';
  return walletType.charAt(0).toUpperCase() + walletType.slice(1);
}

function getWalletProviderLabel() {
  return (walletMeta && walletMeta.providerName) || getWalletLabel();
}

function getWalletAccountName() {
  return (walletMeta && walletMeta.accountName) || '';
}

function getWalletButtonText(address) {
  if (!address) return 'Connect Wallet';
  var name = getWalletAccountName();
  if (name) return name;
  return shortAddress(address, 6, 4);
}

function getWalletConnectedTitle() {
  var name = getWalletAccountName();
  var provider = getWalletProviderLabel();
  if (name) return name + ' · ' + provider;
  return provider + ' connected';
}

function getWalletConnectedSubtitle() {
  var name = getWalletAccountName();
  if (name) return 'via ' + getWalletProviderLabel();
  return '';
}

function shortAddress(address, head, tail) {
  if (!address) return '';
  head = head || 8; tail = tail || 4;
  if (address.length <= head + tail + 3) return address;
  return address.slice(0, head) + '...' + address.slice(-tail);
}

function bytesToHex(bytes) {
  if (!bytes) return '';
  return Array.from(bytes).map(function (b) { return ('00' + b.toString(16)).slice(-2); }).join('');
}

function hexToBytes(hex) {
  if (!hex) return new Uint8Array(0);
  var result = [];
  for (var i = 0; i < hex.length; i += 2) {
    result.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return new Uint8Array(result);
}

function stringToHex(str) {
  var encoder = new TextEncoder();
  return bytesToHex(encoder.encode(str));
}

window.getWalletLabel            = getWalletLabel;
window.getWalletProviderLabel    = getWalletProviderLabel;
window.getWalletAccountName      = getWalletAccountName;
window.getWalletButtonText       = getWalletButtonText;
window.getWalletConnectedTitle   = getWalletConnectedTitle;
window.getWalletConnectedSubtitle = getWalletConnectedSubtitle;
window.shortAddress = shortAddress;
window.bytesToHex   = bytesToHex;
window.hexToBytes   = hexToBytes;
window.stringToHex  = stringToHex;
