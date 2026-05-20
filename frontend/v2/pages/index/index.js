'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['index'] = function () {
  var quickSearchBtn = $('quickSearchBtn');
  if (quickSearchBtn) quickSearchBtn.addEventListener('click', runQuickSearch);

  var quickDomainInput = $('quickDomainInput');
  var quickSearchDebounceTimer = null;
  if (quickDomainInput) {
    quickDomainInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { clearTimeout(quickSearchDebounceTimer); runQuickSearch(); }
    });
    quickDomainInput.addEventListener('input', function () {
      if (quickLastCheckedLabel) {
        var cur = quickDomainInput.value.trim().toLowerCase().replace(/^\./, '').replace(/\..*$/, '');
        if (cur !== quickLastCheckedLabel && typeof resetQuickDomainOffer === 'function') resetQuickDomainOffer();
      }
      clearTimeout(quickSearchDebounceTimer);
      var val = quickDomainInput.value.trim().replace(/^\./, '').replace(/\..*$/, '');
      if (val.length >= 2) {
        quickSearchDebounceTimer = setTimeout(function () {
          if (typeof runQuickSearch === 'function') runQuickSearch();
        }, 700);
      }
    });
  }

  var quickDomainModeBtn = $('quickDomainModeBtn');
  if (quickDomainModeBtn) quickDomainModeBtn.addEventListener('click', function () { setQuickSearchMode('domain'); });

  var quickTldModeBtn = $('quickTldModeBtn');
  if (quickTldModeBtn) quickTldModeBtn.addEventListener('click', function () { setQuickSearchMode('tld'); });

  var quickTldTrigger = $('quickTldTrigger');
  if (quickTldTrigger) quickTldTrigger.addEventListener('click', toggleQuickTldPicker);

  var quickTldSelectEl = $('quickTldSelect');
  if (quickTldSelectEl) quickTldSelectEl.addEventListener('change', function () {
    if (typeof syncQuickTldPickerFromSelect === 'function') syncQuickTldPickerFromSelect();
    if (typeof resetQuickDomainOffer === 'function') resetQuickDomainOffer();
  });

  document.addEventListener('click', function (e) {
    var picker = $('quickTldPicker');
    if (picker && !picker.contains(e.target) && e.target !== quickTldTrigger) {
      closeQuickTldPicker();
    }
  });

  var refreshTldsNameBtn = $('refreshTldsNameBtn');
  if (refreshTldsNameBtn) refreshTldsNameBtn.addEventListener('click', loadTlds);

  var refreshTldsPageBtn = $('refreshTldsPageBtn');
  if (refreshTldsPageBtn) refreshTldsPageBtn.addEventListener('click', loadTlds);

  var connectLandscapeBtn = $('connectWalletLandscapeBtn');
  if (connectLandscapeBtn) connectLandscapeBtn.addEventListener('click', openWalletModal);

  if (typeof bindOpenTabButtons === 'function') bindOpenTabButtons(document.getElementById('app-view'));

  if (typeof loadMarketplacePreview === 'function') loadMarketplacePreview();
  var refreshMarketBtn = $('refreshMarketPreviewBtn');
  if (refreshMarketBtn) refreshMarketBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof loadMarketplacePreview === 'function') loadMarketplacePreview();
  });

  if (typeof renderTldBrowser === 'function') renderTldBrowser();
  if (typeof renderQuickTldOptions === 'function') renderQuickTldOptions();

  if (typeof setQuickSearchMode === 'function') setQuickSearchMode('domain', true);
};
