'use strict';

function openWalletModal()  { var m = $('walletModal'); if (m) m.classList.remove('hidden'); }
function closeWalletModal() { var m = $('walletModal'); if (m) m.classList.add('hidden'); }

function setWalletMenuOpen(open) {
  var menu   = $('topWalletMenu');
  var button = $('topConnectWalletBtn');
  if (!menu || !button) return;
  menu.classList.toggle('hidden', !open);
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
}

function updateTopWalletBalance(value) {
  var el = $('topWalletBalance');
  if (el) el.textContent = value || '-';
}

function setLastPurchaseTx(name, txhash) {
  if (!txhash) return;
  var purchase = { name: name || 'Domain purchase', txhash: txhash, time: Date.now() };
  try { sessionStorage.setItem('ar_last_purchase_tx', JSON.stringify(purchase)); } catch (e) {}
  renderLastPurchaseTx(purchase);
  if (typeof toastTx === 'function') toastTx(txhash, name || 'Domain purchase');
  if (typeof addTxToHistory === 'function') addTxToHistory(name || 'Domain purchase', txhash);
}

function getLastPurchaseTx() {
  try { return JSON.parse(sessionStorage.getItem('ar_last_purchase_tx') || 'null'); } catch (e) { return null; }
}

function renderLastPurchaseTx(purchase) {
  var wrap   = $('topLastPurchase');
  var nameEl = $('topLastPurchaseName');
  var linkEl = $('topLastPurchaseTx');
  if (!wrap || !nameEl || !linkEl) return;
  if (!purchase || !purchase.txhash) {
    wrap.classList.add('hidden');
    nameEl.textContent = '-';
    linkEl.textContent = '-';
    linkEl.href = '#';
    return;
  }
  wrap.classList.remove('hidden');
  nameEl.textContent = purchase.name || 'Domain purchase';
  linkEl.textContent = shortAddress(purchase.txhash, 10, 8);
  linkEl.href = 'https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(purchase.txhash);
}

function closeTopWalletMenu()   { setWalletMenuOpen(false); }
function toggleTopWalletMenu()  {
  var menu = $('topWalletMenu');
  if (!menu) return;
  setWalletMenuOpen(menu.classList.contains('hidden'));
}

function bindWalletUi() {
  bindPriceSlider('policy');
  bindPriceSlider('setting');
  var el;

  el = $('openWalletModalBtn');
  if (el) el.addEventListener('click', openWalletModal);

  el = $('topConnectWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    userAddress ? toggleTopWalletMenu() : openWalletModal();
  });

  el = $('topCopyWalletBtn');
  if (el) el.addEventListener('click', async function (e) {
    e.preventDefault(); e.stopPropagation();
    if (!userAddress) return;
    try { await navigator.clipboard.writeText(userAddress); toast('Address copied', 'ok'); }
    catch (err) { toast('Copy failed', 'error'); }
  });

  el = $('topPortfolioWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    ArRouter.navigate('wallet/my-domains');
  });

  el = $('topProfilesWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    ArRouter.navigate('wallet/profiles');
  });

  el = $('topMetadataWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    ArRouter.navigate('wallet/metadata');
  });

  el = $('topDsslWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    ArRouter.navigate('wallet/dssl');
  });

  el = $('topViewWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    if (userAddress) window.open('https://www.mintscan.io/cosmos/address/' + userAddress, '_blank', 'noopener');
    closeTopWalletMenu();
  });

  el = $('topSwitchWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    openWalletModal();
  });

  el = $('topDisconnectWalletBtn');
  if (el) el.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    closeTopWalletMenu();
    disconnect();
  });

  document.addEventListener('click', function (e) {
    var walletControl = $('topWalletControl');
    if (walletControl && !walletControl.contains(e.target)) closeTopWalletMenu();
  });

  el = $('wmKeplr');        if (el) el.addEventListener('click', function () { connectWallet('keplr'); });
  el = $('wmCosmostation'); if (el) el.addEventListener('click', function () { connectWallet('cosmostation'); });
  el = $('wmLedger');       if (el) el.addEventListener('click', function () { connectWallet('ledger'); });
  el = $('wmKeystone');     if (el) el.addEventListener('click', function () { connectWallet('keystone'); });
  el = $('wmCancel');       if (el) el.addEventListener('click', closeWalletModal);

  el = $('walletModal');
  if (el) el.addEventListener('click', function (e) { if (e.target === $('walletModal')) closeWalletModal(); });

  el = $('disconnectBtn');  if (el) el.addEventListener('click', disconnect);
  el = $('disconnectBtn2'); if (el) el.addEventListener('click', disconnect);

  if (CFG.LEDGER_MOCK) {
    var d = $('ledgerBtnDesc');
    if (d) d.innerHTML = '<span style="color:#fbbf24;font-weight:700">⚠ MOCK MODE ON</span> · No hardware needed · Test key only';
    var wmb = $('wmLedger');
    if (wmb) wmb.style.borderColor = 'rgba(251,191,36,0.5)';
  }
}

window.openWalletModal        = openWalletModal;
window.closeWalletModal       = closeWalletModal;
window.updateTopWalletBalance = updateTopWalletBalance;
window.setLastPurchaseTx      = setLastPurchaseTx;
window.getLastPurchaseTx      = getLastPurchaseTx;
window.renderLastPurchaseTx   = renderLastPurchaseTx;
window.closeTopWalletMenu     = closeTopWalletMenu;
window.toggleTopWalletMenu    = toggleTopWalletMenu;
window.bindWalletUi           = bindWalletUi;
