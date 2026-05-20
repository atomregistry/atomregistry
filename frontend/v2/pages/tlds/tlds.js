'use strict';

(function () {
  window.ArViewInit = window.ArViewInit || {};

  var currentScript = document.currentScript;
  var PAGE_DIR = currentScript && currentScript.src
    ? currentScript.src.replace(/\/[^\/]*$/, '/')
    : './pages/tlds/';

  var loadedScripts = window.__tldPageLoadedScripts || (window.__tldPageLoadedScripts = {});

  function $(id) {
    return document.getElementById(id);
  }

  function loadScriptOnce(fileName) {
    var src = PAGE_DIR + fileName;

    if (loadedScripts[src]) return loadedScripts[src];

    loadedScripts[src] = new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[data-tld-page-script="' + fileName + '"]');
      if (existing) {
        resolve();
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.dataset.tldPageScript = fileName;
      script.onload = function () { resolve(); };
      script.onerror = function () {
        delete loadedScripts[src];
        reject(new Error('Could not load ' + fileName));
      };
      document.body.appendChild(script);
    });

    return loadedScripts[src];
  }

  async function ensureTldPageScripts() {

    await Promise.all([
      loadScriptOnce('tld-calculator.js'),
      loadScriptOnce('tld-settings.js')
    ]);
  }

  function cleanLabel(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/^\.+/, '')
      .replace(/\..*$/, '')
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 20);
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[ch];
    });
  }

  function setSearchButtonLoading(button, loading) {
    if (!button) return;
    button.disabled = !!loading;
    button.innerHTML = loading ? '<span class="spin-icon"></span> Checking...' : 'Check';
  }

  var inlineTldRegistration = {
    label: '',
    secret: '',
    commitTimestamp: 0,
    timer: null
  };

  function tldPriceText(label) {
    var price = window.calculateDomainPrice ? window.calculateDomainPrice(label) : 15;
    return price + ' ATOM';
  }

  function getCommitStorageKey(label) {
    var address = window.userAddress || 'anonymous';
    return 'ar_tld_inline_commit_' + address + '_' + label;
  }

  function saveInlineTldCommit(label, secret, timestamp) {
    try {
      localStorage.setItem(getCommitStorageKey(label), JSON.stringify({
        address: window.userAddress || '',
        label: label,
        secret: secret,
        timestamp: timestamp
      }));
    } catch (error) {}
  }

  function loadInlineTldCommit(label) {
    try {
      var saved = JSON.parse(localStorage.getItem(getCommitStorageKey(label)) || 'null');
      if (!saved || saved.label !== label) return null;
      if (saved.address && window.userAddress && saved.address !== window.userAddress) return null;
      return saved;
    } catch (error) {
      return null;
    }
  }

  function clearInlineTldCommit(label) {
    try { localStorage.removeItem(getCommitStorageKey(label)); } catch (error) {}
  }

  function makeSecret() {
    var bytes = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) window.crypto.getRandomValues(bytes);
    else for (var i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return Array.prototype.map.call(bytes, function (b) {
      return b.toString(16).padStart(2, '0');
    }).join('');
  }

  function requireRegistrationRuntime(result, label) {
    if (!window.CFG || !window.CFG.TLD_MANAGER || typeof window.signAndBroadcast !== 'function') {
      renderTldAvailability(result, 'warning', label, 'Registration scripts are not loaded yet. Refresh the app and try again.');
      return false;
    }
    return true;
  }

  async function ensureWalletConnectedForTld(result, label) {
    if (window.userAddress) return true;

    if (typeof window.restoreWalletSession === 'function') {
      try { await window.restoreWalletSession({ silent: true, force: true }); } catch (error) {}
      if (window.userAddress) return true;
    }

    renderTldAvailability(result, 'available', label, 'Connect your wallet to register this namespace directly from this page.', {
      mode: 'connect'
    });

    if (typeof window.openWalletModal === 'function') window.openWalletModal();
    else if (typeof window.toast === 'function') window.toast('Connect wallet first', 'warn');
    return false;
  }

  function setInlineRegistrationStatus(result, label, title, message, mode, txhash) {
    if (!result) return;
    var txLink = txhash ? '<a class="tld-inline-tx" target="_blank" rel="noopener" href="https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(txhash) + '">View transaction</a>' : '';
    var action = '';
    if (mode === 'ready') {
      action = '<button type="button" class="tld-register-action" data-register-reveal-tld="' + escapeHtml(label) + '">Finish registration - ' + escapeHtml(tldPriceText(label)) + '</button>';
    } else if (mode === 'retry') {
      action = '<button type="button" class="tld-register-secondary" data-register-tld="' + escapeHtml(label) + '">Try again</button>';
    }

    result.innerHTML =
      '<div class="tld-result-card is-available is-registering">' +
        '<div class="tld-result-icon" aria-hidden="true">✓</div>' +
        '<div class="tld-result-content">' +
          '<div class="tld-result-domain">.' + escapeHtml(label) + '</div>' +
          '<div class="tld-result-badge">Registration</div>' +
          '<div class="tld-result-subtitle">' + escapeHtml(title) + '</div>' +
          '<p>' + escapeHtml(message) + '</p>' +
          '<div class="tld-inline-progress" aria-hidden="true">' +
            '<span class="is-done">1</span>' +
            '<i></i>' +
            '<span class="' + (mode === 'waiting' || mode === 'ready' || mode === 'registering' || mode === 'done' ? 'is-done' : '') + '">2</span>' +
            '<i></i>' +
            '<span class="' + (mode === 'ready' || mode === 'registering' || mode === 'done' ? 'is-done' : '') + '">3</span>' +
          '</div>' +
          action + txLink +
        '</div>' +
      '</div>';

    var revealButton = result.querySelector('[data-register-reveal-tld]');
    if (revealButton) {
      revealButton.addEventListener('click', function () {
        finishInlineTldRegistration(label, result, revealButton);
      });
    }

    var retryButton = result.querySelector('[data-register-tld]');
    if (retryButton) {
      retryButton.addEventListener('click', function () {
        beginInlineTldRegistration(label, result, retryButton);
      });
    }
  }

  function startInlineCommitTimer(label, result) {
    clearInterval(inlineTldRegistration.timer);
    var minCommit = window.CFG && window.CFG.MIN_COMMIT ? window.CFG.MIN_COMMIT : 10;

    inlineTldRegistration.timer = setInterval(function () {
      var elapsed = (Date.now() - inlineTldRegistration.commitTimestamp) / 1000;
      var remaining = Math.max(0, Math.ceil(minCommit - elapsed));

      if (remaining > 0) {
        setInlineRegistrationStatus(result, label, 'Commit confirmed - wait ' + remaining + 's', 'The registry uses a secure commit-reveal flow. Keep this page open, then finish the registration.', 'waiting');
        return;
      }

      clearInterval(inlineTldRegistration.timer);
      setInlineRegistrationStatus(result, label, 'Ready to finish', 'Your commit is mature. Sign the final transaction to register .' + label + '.', 'ready');
    }, 1000);
  }

  function restoreInlineRegistrationIfPossible(label, result) {
    if (!window.userAddress) return false;
    var saved = loadInlineTldCommit(label);
    if (!saved || !saved.secret || !saved.timestamp) return false;

    var elapsed = (Date.now() - saved.timestamp) / 1000;
    var maxCommit = window.CFG && window.CFG.MAX_COMMIT ? window.CFG.MAX_COMMIT : 1800;
    var minCommit = window.CFG && window.CFG.MIN_COMMIT ? window.CFG.MIN_COMMIT : 10;

    if (elapsed > maxCommit) {
      clearInlineTldCommit(label);
      return false;
    }

    inlineTldRegistration.label = label;
    inlineTldRegistration.secret = saved.secret;
    inlineTldRegistration.commitTimestamp = saved.timestamp;

    if (elapsed < minCommit) {
      startInlineCommitTimer(label, result);
    } else {
      setInlineRegistrationStatus(result, label, 'Ready to finish', 'Your previous commit is still valid. Finish registration from this page.', 'ready');
    }
    return true;
  }

  async function beginInlineTldRegistration(label, result, button) {
    if (!requireRegistrationRuntime(result, label)) return;
    if (!(await ensureWalletConnectedForTld(result, label))) return;

    if (restoreInlineRegistrationIfPossible(label, result)) return;

    inlineTldRegistration.label = label;
    inlineTldRegistration.secret = makeSecret();
    inlineTldRegistration.commitTimestamp = 0;

    var commitment = window.userAddress + ':' + label + ':' + inlineTldRegistration.secret;
    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spin-icon"></span> Signing commit...';
    }

    setInlineRegistrationStatus(result, label, 'Signing commit', 'Approve the first wallet transaction. This reserves your hidden intent to register .' + label + '.', 'committing');

    try {
      var txProgress = document.createElement('div');
      txProgress.className = 'tld-inline-tx-progress';
      txProgress.innerHTML = '<div class="tld-inline-steps" id="inlineTldTxSteps"></div><div class="tld-inline-bar"><span id="inlineTldTxBar"></span></div>';
      var cardContent = result.querySelector('.tld-result-content');
      if (cardContent) cardContent.appendChild(txProgress);

      var commitResult = await window.signAndBroadcast(
        { commit: { commitment: commitment } },
        0,
        document.getElementById('inlineTldTxSteps'),
        document.getElementById('inlineTldTxBar'),
        window.TX_STEPS || ['Building transaction', 'Fetching account & simulating gas', 'Awaiting wallet signature', 'Broadcasting to Cosmos Hub']
      );

      inlineTldRegistration.commitTimestamp = Date.now();
      saveInlineTldCommit(label, inlineTldRegistration.secret, inlineTldRegistration.commitTimestamp);
      if (typeof window.toast === 'function') window.toast('Commit submitted for .' + label, 'ok');
      if (typeof window.setLastPurchaseTx === 'function' && commitResult && commitResult.txhash) window.setLastPurchaseTx('Commit .' + label + ' TLD', commitResult.txhash);
      startInlineCommitTimer(label, result);
    } catch (error) {
      var msg = error && error.message ? error.message : String(error);
      if (/rejected|denied|cancel/i.test(msg) && typeof window.toast === 'function') window.toast('Cancelled', 'warn');
      setInlineRegistrationStatus(result, label, 'Commit failed', msg.slice(0, 180), 'retry');
    }
  }

  async function finishInlineTldRegistration(label, result, button) {
    if (!requireRegistrationRuntime(result, label)) return;
    if (!(await ensureWalletConnectedForTld(result, label))) return;

    var saved = loadInlineTldCommit(label);
    if (saved && saved.secret && saved.timestamp) {
      inlineTldRegistration.secret = saved.secret;
      inlineTldRegistration.commitTimestamp = saved.timestamp;
    }

    var minCommit = window.CFG && window.CFG.MIN_COMMIT ? window.CFG.MIN_COMMIT : 10;
    var maxCommit = window.CFG && window.CFG.MAX_COMMIT ? window.CFG.MAX_COMMIT : 1800;
    var elapsed = (Date.now() - inlineTldRegistration.commitTimestamp) / 1000;

    if (!inlineTldRegistration.secret || !inlineTldRegistration.commitTimestamp) {
      setInlineRegistrationStatus(result, label, 'Commit required', 'Start registration again to create the secure commit before the final transaction.', 'retry');
      return;
    }
    if (elapsed < minCommit) {
      startInlineCommitTimer(label, result);
      return;
    }
    if (elapsed > maxCommit) {
      clearInlineTldCommit(label);
      setInlineRegistrationStatus(result, label, 'Commit expired', 'The commit window expired. Start registration again.', 'retry');
      return;
    }

    if (button) {
      button.disabled = true;
      button.innerHTML = '<span class="spin-icon"></span> Registering...';
    }

    setInlineRegistrationStatus(result, label, 'Final signature', 'Approve the final wallet transaction to register .' + label + '.', 'registering');

    try {
      var txProgress = document.createElement('div');
      txProgress.className = 'tld-inline-tx-progress';
      txProgress.innerHTML = '<div class="tld-inline-steps" id="inlineTldTxSteps"></div><div class="tld-inline-bar"><span id="inlineTldTxBar"></span></div>';
      var cardContent = result.querySelector('.tld-result-content');
      if (cardContent) cardContent.appendChild(txProgress);

      var registerResult = await window.signAndBroadcast(
        { register_tld: { label: label, owner: window.userAddress, secret: inlineTldRegistration.secret } },
        window.calculateDomainPriceUatom ? window.calculateDomainPriceUatom(label) : 15000000,
        document.getElementById('inlineTldTxSteps'),
        document.getElementById('inlineTldTxBar'),
        window.TX_STEPS || ['Building transaction', 'Fetching account & simulating gas', 'Awaiting wallet signature', 'Broadcasting to Cosmos Hub']
      );

      clearInlineTldCommit(label);
      clearInterval(inlineTldRegistration.timer);
      inlineTldRegistration.label = '';
      inlineTldRegistration.secret = '';
      inlineTldRegistration.commitTimestamp = 0;

      if (typeof window.loadTlds === 'function') window.loadTlds();
      if (typeof window.toast === 'function') window.toast('🎉 .' + label + ' registered!', 'ok');
      if (typeof window.setLastPurchaseTx === 'function' && registerResult && registerResult.txhash) window.setLastPurchaseTx('.' + label + ' TLD', registerResult.txhash);
      if (typeof window.launchConfetti === 'function') window.launchConfetti();
      if (typeof window.showSuccessModal === 'function') window.showSuccessModal('.' + label + ' TLD', registerResult && registerResult.txhash);

      setInlineRegistrationStatus(result, label, 'Registered successfully', 'This namespace is now live on-chain and belongs to your wallet.', 'done', registerResult && registerResult.txhash);
    } catch (error) {
      var msg = error && error.message ? error.message : String(error);
      if (/rejected|denied|cancel/i.test(msg) && typeof window.toast === 'function') window.toast('Cancelled', 'warn');
      else if (/insufficient/i.test(msg) && typeof window.toast === 'function') window.toast('Insufficient ATOM', 'error');
      setInlineRegistrationStatus(result, label, 'Registration failed', msg.slice(0, 180), 'ready');
    }
  }

  function renderTldAvailability(result, state, label, message, options) {
    if (!result) return;
    options = options || {};

    var stateText = state === 'available' ? 'Available' : state === 'reserved' ? 'Reserved' : state === 'taken' ? 'Taken' : state === 'checking' ? 'Checking' : 'Unavailable';
    var icon = state === 'available' ? '✓' : state === 'reserved' ? '!' : state === 'taken' ? '×' : state === 'checking' ? '•' : '!';
    var subtitle = state === 'available' ? 'Namespace is ready to claim' : state === 'reserved' ? 'Protected namespace' : state === 'taken' ? 'Already registered' : state === 'checking' ? 'Live registry lookup' : 'Action needed';
    var action = '';

    if (state === 'available') {
      if (options.mode === 'connect') {
        action = '<button type="button" class="tld-register-action" data-connect-wallet-for-tld="' + escapeHtml(label) + '">Connect wallet</button>';
      } else {
        action = '<button type="button" class="tld-register-action" data-register-tld="' + escapeHtml(label) + '">Register .' + escapeHtml(label) + ' - ' + escapeHtml(tldPriceText(label)) + '</button>';
      }
    }

    result.innerHTML =
      '<div class="tld-result-card is-' + escapeHtml(state) + '">' +
        '<div class="tld-result-icon" aria-hidden="true">' + escapeHtml(icon) + '</div>' +
        '<div class="tld-result-content">' +
          '<div class="tld-result-domain">.' + escapeHtml(label) + '</div>' +
          '<div class="tld-result-badge">' + escapeHtml(stateText) + '</div>' +
          '<div class="tld-result-subtitle">' + escapeHtml(subtitle) + '</div>' +
          '<p>' + escapeHtml(message) + '</p>' +
          action +
        '</div>' +
      '</div>';

    var registerButton = result.querySelector('[data-register-tld]');
    if (registerButton) {
      registerButton.addEventListener('click', function () {
        var selectedLabel = registerButton.getAttribute('data-register-tld');
        beginInlineTldRegistration(selectedLabel, result, registerButton);
      });
    }

    var connectButton = result.querySelector('[data-connect-wallet-for-tld]');
    if (connectButton) {
      connectButton.addEventListener('click', function () {
        if (typeof window.openWalletModal === 'function') window.openWalletModal();
        else if (typeof window.toast === 'function') window.toast('Connect wallet first', 'warn');
      });
    }
  }

  async function checkTldAvailability(label, result, button) {
    if (!/^[a-z0-9]{2,20}$/.test(label)) {
      renderTldAvailability(result, 'warning', 'Invalid TLD', 'Use lowercase letters and numbers only. TLD labels must be 2-20 characters and cannot contain dots, spaces or hyphens.');
      return;
    }

    if (typeof window.queryContract !== 'function' || !window.CFG || !window.CFG.REGISTRY) {
      renderTldAvailability(result, 'warning', label, 'Registry connection is not loaded yet. Refresh the app or make sure app/core/registry.js and wallet/core scripts are loaded before this page.');
      return;
    }

    setSearchButtonLoading(button, true);
    if (result) {
      renderTldAvailability(result, 'checking', label, 'Querying the registry contract for current availability.');
    }

    try {
      var exists = false;
      try {
        var existing = await window.queryContract(window.CFG.REGISTRY, { exists: { name: label } });
        exists = !!(existing && existing.exists);
      } catch (error) {
        console.warn('[tlds] Registry exists query failed', error);
      }

      var reserved = false;
      if (window.CFG.TLD_MANAGER) {
        try {
          var reservedResponse = await window.queryContract(window.CFG.TLD_MANAGER, { reserved: { label: label } });
          reserved = !!(reservedResponse && reservedResponse.reserved);
        } catch (error) {
          console.warn('[tlds] TLD manager reserved query failed', error);
        }
      }

      if (reserved) {
        renderTldAvailability(result, 'reserved', label, 'This namespace is reserved and cannot be registered.');
      } else if (exists) {
        renderTldAvailability(result, 'taken', label, 'This namespace already exists on-chain. Try another TLD.');
      } else {
        renderTldAvailability(result, 'available', label, 'This namespace looks available in the live registry. Register it directly from this page.');
        restoreInlineRegistrationIfPossible(label, result);
      }
    } catch (error) {
      renderTldAvailability(result, 'warning', label, 'Check failed: ' + (error && error.message ? error.message : String(error)).slice(0, 160));
    } finally {
      setSearchButtonLoading(button, false);
    }
  }

  function bindTldPageUi() {
    var input = $('nameInput');
    var select = $('tldSelect');
    var form = $('tldSearchForm');
    var result = $('tldSearchResult');

    document.querySelectorAll('[data-tld]').forEach(function (button) {
      if (button.dataset.tldBound === '1') return;
      button.dataset.tldBound = '1';

      button.addEventListener('click', function () {
        var label = cleanLabel(button.dataset.tld);
        if (input) input.value = label;
        if (select) select.value = 'tld';
        if (input) input.focus();
      });
    });

    if (input && input.dataset.tldBound !== '1') {
      input.dataset.tldBound = '1';
      input.addEventListener('input', function () {
        var cleaned = cleanLabel(input.value);
        if (input.value !== cleaned) input.value = cleaned;
      });
    }

    if (form && form.dataset.tldBound !== '1') {
      form.dataset.tldBound = '1';
      form.addEventListener('submit', function (event) {
        event.preventDefault();

        var label = cleanLabel(input && input.value);
        var button = $('tldSearchBtn');

        if (!label) {
          renderTldAvailability(result, 'warning', 'Missing TLD', 'Enter a TLD name first. Example: dao, club or mybrand.');
          return;
        }

        checkTldAvailability(label, result, button);
      });
    }
  }

  async function initTldsPage() {
    bindTldPageUi();

    try {
      await ensureTldPageScripts();
    } catch (error) {
      console.error('[tlds] Failed to load page scripts', error);
    }

    if (typeof window.renderTldPageList === 'function') window.renderTldPageList();
    if (typeof window.loadTlds === 'function') window.loadTlds();

    if (typeof window.initTldCalculator === 'function') window.initTldCalculator();
    if (typeof window.initTldSettings === 'function') window.initTldSettings();
    if (typeof window.initManageTldsPage === 'function') window.initManageTldsPage();
  }

  window.initTldsPage = initTldsPage;
  window.ArViewInit.tlds = initTldsPage;
})();
