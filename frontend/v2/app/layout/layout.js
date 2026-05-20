'use strict';

(function () {
  var BASE = (function () {
    var el = document.querySelector('base');
    return (el && el.getAttribute('href')) || './';
  })();

  function joinBase(rel) {
    return BASE.replace(/\/$/, '') + '/' + rel.replace(/^\.?\//, '');
  }

  function getTxHistory() {
    try { return JSON.parse(localStorage.getItem('ar_tx_history') || '[]'); } catch (e) { return []; }
  }

  window.addTxToHistory = function (name, txhash) {
    if (!txhash) return;
    var history = getTxHistory().filter(function (t) { return t.txhash !== txhash; });
    history.unshift({ name: name || 'Transaction', txhash: txhash, time: Date.now() });
    if (history.length > 20) history = history.slice(0, 20);
    try { localStorage.setItem('ar_tx_history', JSON.stringify(history)); } catch (e) {}
    renderTxHistoryList();
  };

  window.renderTxHistoryList = function () {
    var wrap = document.getElementById('topTxHistory');
    var list = document.getElementById('topTxHistoryList');
    if (!wrap || !list) return;
    var history = getTxHistory();
    if (!history.length) { wrap.classList.add('hidden'); return; }
    wrap.classList.remove('hidden');
    list.innerHTML = history.slice(0, 5).map(function (t) {
      var date  = new Date(t.time).toLocaleDateString();
      var short = t.txhash.slice(0, 8) + '...' + t.txhash.slice(-6);
      return '<a class="ar-tx-history-item" href="https://www.mintscan.io/cosmos/tx/' +
        encodeURIComponent(t.txhash) + '" rel="noopener" target="_blank">' +
        '<span class="ar-tx-history-name">' + (t.name || 'TX') + '</span>' +
        '<span class="ar-tx-history-meta"><span class="mono">' + short + '</span> · ' + date + '</span>' +
        '</a>';
    }).join('');
  };

  function ensureToast() {
    if (document.getElementById('toast')) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.id = 'toast';
    document.body.appendChild(el);
  }

  function renderWalletModal() {
    if (document.getElementById('walletModal')) return;
    var html = '' +
      '<div class="wm-ov hidden" id="walletModal">' +
        '<div class="wm-box">' +
          '<div class="wm-h">Connect Wallet</div>' +
          '<div class="wm-s">Select your wallet to continue</div>' +
          '<button class="wm-b" id="wmKeplr"><span aria-hidden="true" class="wallet-logo wallet-logo-keplr"><svg role="img" viewBox="0 0 32 32"><circle cx="16" cy="16" fill="none" opacity="0.9" r="13" stroke="white" stroke-width="3"></circle><path d="M10 9v14M22 9l-9 8 9 6" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.2"></path></svg></span><div><div class="wm-n">Keplr</div><div class="wm-d">Browser wallet for Cosmos and multichain Web3 apps</div></div></button>' +
          '<button class="wm-b" id="wmCosmostation"><span aria-hidden="true" class="wallet-logo wallet-logo-cosmostation"><svg role="img" viewBox="0 0 32 32"><circle cx="16" cy="16" fill="none" opacity="0.9" r="12" stroke="white" stroke-width="3"></circle><path d="M22 11.5a8 8 0 1 0 0 9" fill="none" stroke="white" stroke-linecap="round" stroke-width="3.2"></path><circle cx="22.5" cy="16" fill="white" r="2.1"></circle></svg></span><div><div class="wm-n">Cosmostation</div><div class="wm-d">Cosmos ecosystem wallet with staking and Web3 support</div></div></button>' +
          '<button class="wm-b" id="wmLedger"><span aria-hidden="true" class="wallet-logo wallet-logo-ledger"><svg role="img" viewBox="0 0 32 32"><path d="M6 13V7h6M20 7h6v6M26 20v6h-6M12 26H6v-6" fill="none" stroke="white" stroke-linecap="round" stroke-linejoin="round" stroke-width="3"></path><rect fill="white" height="6" opacity="0.95" rx="1.2" width="6" x="13" y="13"></rect></svg></span><div><div class="wm-n">Ledger</div><div class="wm-d">Hardware wallet · USB · Cosmos app required · Chrome/Edge only</div></div></button>' +
          '<button class="wm-b" id="wmKeystone"><span aria-hidden="true" class="wallet-logo wallet-logo-keystone"><svg role="img" viewBox="0 0 32 32"><path d="M16 4l11 7v10l-11 7-11-7V11L16 4z" fill="none" stroke="white" stroke-linejoin="round" stroke-width="2.5"></path><path d="M11 16h10M16 11v10" stroke="white" stroke-linecap="round" stroke-width="2.8"></path><circle cx="16" cy="16" fill="white" r="3"></circle></svg></span><div><div class="wm-n">Keystone</div><div class="wm-d">Native QR signing · no Keplr dependency · Keystone Pro</div></div></button>' +
          '<span class="wm-cancel" id="wmCancel">Cancel</span>' +
        '</div>' +
      '</div>';
    document.body.insertAdjacentHTML('beforeend', html);
  }

  function renderTxToast() {
    if (document.getElementById('txToast')) return;
    var el = document.createElement('div');
    el.id = 'txToast';
    el.className = 'tx-toast';
    el.innerHTML =
      '<i class="fas fa-check-circle tx-toast-icon"></i>' +
      '<div class="tx-toast-body">' +
        '<span id="txToastName">Transaction confirmed</span>' +
        '<a href="#" id="txToastLink" rel="noopener" target="_blank">View on Mintscan</a>' +
      '</div>' +
      '<button aria-label="Close" class="tx-toast-close" id="txToastClose" type="button"><i class="fas fa-times"></i></button>';
    document.body.appendChild(el);
    el.addEventListener('click', function (e) {
      if (e.target.closest('#txToastClose')) {
        el.classList.remove('show');
        clearTimeout(window.txToastTimer);
      }
    });
  }

  function renderOnboardingModal() {
    if (document.getElementById('onboardingModal')) return;
    var shown = false;
    try { shown = !!localStorage.getItem('ar_onboarded'); } catch (e) {}
    var hasWallet = false;
    try { hasWallet = !!(sessionStorage.getItem('ar_wallet') || localStorage.getItem('ar_search_wallet')); } catch (e) {}
    if (shown || hasWallet) return;

    var el = document.createElement('div');
    el.id = 'onboardingModal';
    el.className = 'onboarding-ov';
    el.innerHTML =
      '<div class="onboarding-box">' +
        '<div class="onboarding-kicker"><i class="fas fa-rocket"></i> First time here?</div>' +
        '<h2 class="onboarding-title">Welcome to Atom Registry</h2>' +
        '<p class="onboarding-copy">Atom Registry lets you register Web3 domain names and TLDs on <strong>Cosmos Hub</strong> - permanently, with no renewals. You own it on-chain forever.</p>' +
        '<div class="onboarding-steps">' +
          '<div class="onboarding-step"><span class="onboarding-num">1</span><div><strong>Install Keplr</strong><p>The Cosmos browser wallet. Free, open-source, takes 2 minutes.</p><a class="onboarding-link" href="https://www.keplr.app/" rel="noopener" target="_blank"><i class="fas fa-arrow-up-right-from-square"></i> Get Keplr</a></div></div>' +
          '<div class="onboarding-step"><span class="onboarding-num">2</span><div><strong>Connect your wallet</strong><p>Click "Connect Wallet" in the top-right corner and select Keplr.</p></div></div>' +
          '<div class="onboarding-step"><span class="onboarding-num">3</span><div><strong>Register a domain</strong><p>Search for a name like <code>yourname.atom</code> and register it with ATOM.</p></div></div>' +
        '</div>' +
        '<div class="onboarding-actions">' +
          '<button class="onboarding-btn-primary" id="onboardingConnectBtn" type="button"><i class="fas fa-wallet"></i> Connect Wallet</button>' +
          '<button class="onboarding-btn-ghost" id="onboardingSkipBtn" type="button">Maybe later</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);

    function closeOnboarding() {
      el.classList.remove('show');
      setTimeout(function () { el.remove(); }, 300);
      try { localStorage.setItem('ar_onboarded', '1'); } catch (e) {}
    }

    document.getElementById('onboardingSkipBtn').addEventListener('click', closeOnboarding);
    document.getElementById('onboardingConnectBtn').addEventListener('click', function () {
      closeOnboarding();
      var btn = document.getElementById('topConnectWalletBtn');
      if (btn) btn.click();
    });
    el.addEventListener('click', function (e) { if (e.target === el) closeOnboarding(); });

    setTimeout(function () { el.classList.add('show'); }, 1200);
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(joinBase('sw.js')).catch(function (e) {
      console.warn('[SW] Registration failed:', e);
    });
  }

  function bindNavLinks(root) {
    var links = root.querySelectorAll('a[data-route], button[data-route]');
    for (var i = 0; i < links.length; i++) {
      (function (el) {
        el.addEventListener('click', function (e) {
          if (el.tagName === 'A') e.preventDefault();
          closeNav();
          ArRouter.navigate(el.getAttribute('data-route'));
        });
      })(links[i]);
    }
  }

  function closeNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', 'false');
    nav.classList.remove('ar-nav-open');
  }

  function bindMobileNav() {
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('primary-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
      nav.classList.toggle('ar-nav-open', !open);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    document.addEventListener('click', function (e) {
      var header = document.getElementById('site-header');
      if (header && !header.contains(e.target)) closeNav();
    });
  }

  fetch(joinBase('app/layout/layout.html'))
    .then(function (r) { return r.text(); })
    .then(function (html) {
      var shell = document.getElementById('app-shell');
      if (shell) shell.innerHTML = html;

      ensureToast();
      renderWalletModal();
      renderTxToast();
      renderTxHistoryList();

      bindNavLinks(document);
      bindMobileNav();

      if (typeof bindWalletUi === 'function') bindWalletUi();

      if (typeof startNetworkStatusPolling === 'function') startNetworkStatusPolling();

      setTimeout(renderOnboardingModal, 400);

      registerServiceWorker();

      if (typeof loadTlds === 'function') loadTlds();

      if (typeof restoreWalletSession === 'function') {
        var _routerStarted = false;
        var _startRouter = function () {
          if (_routerStarted) return;
          _routerStarted = true;
          ArRouter.start();
        };
        window.walletRestorePromise = restoreWalletSession({ silent: true });
        window.walletRestorePromise.then(_startRouter).catch(_startRouter);

        setTimeout(_startRouter, 2000);
      } else {
        ArRouter.start();
      }

      if (window.AtomRegistryLanguages && typeof window.AtomRegistryLanguages.init === 'function') {
        window.AtomRegistryLanguages.init();
      }
    })
    .catch(function (e) {
      console.error('[layout] Failed to load layout.html', e);
    });
})();
