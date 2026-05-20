'use strict';

(function () {
  function call(fnName) {
    var fn = window[fnName];
    if (typeof fn === 'function') {
      return fn.apply(window, Array.prototype.slice.call(arguments, 1));
    }
  }

  function toastSafe(message, type) {
    if (typeof window.toast === 'function') window.toast(message, type);
    else console[type === 'error' ? 'error' : 'log'](message);
  }

  function getEditingTld() {
    return window.editingTld || '';
  }

  function setEditingTld(label) {
    window.editingTld = label;
  }

  function loadMyTlds() {
    if (!window.userAddress) return;
    call('renderMyTldList');
  }

  function openTldEditor(label) {
    setEditingTld(label);

    var editor = $('tldSettingsEditor');
    var labelEl = $('editingTldLabel');
    if (labelEl) labelEl.textContent = '.' + label;
    if (editor) editor.classList.remove('hidden');

    var allTlds = Array.isArray(window.allTlds) ? window.allTlds : [];
    var tld = allTlds.find(function (item) { return item && item.label === label; });
    var policy = tld && tld.policy;

    if (policy) {
      call('setPriceSliderValue', 'setting', policy.price || 1000000);
      call('applyLengthTierPreset', 'setting', label, policy.price || 1000000);
      call('updateTierExamples', 'setting', label);

      var recipient = $('settingRecipient');
      var maxPerAddr = $('settingMaxPerAddr');
      var open = $('settingOpen');
      var badge = $('currentPolicyBadge');
      var status = $('cpStatus');
      var price = $('cpPrice');
      var cpRecipient = $('cpRecipient');
      var cpMax = $('cpMax');
      var info = $('currentPolicyInfo');
      var isOpen = !!(policy.enabled && policy.registration_open);

      if (recipient) recipient.value = policy.recipient || window.userAddress || '';
      if (maxPerAddr) maxPerAddr.value = policy.max_per_address || '100';
      if (open) open.value = isOpen ? 'open' : 'closed';
      if (badge) {
        badge.textContent = isOpen ? 'Public' : 'Private';
        badge.className = 'text-xs px-3 py-1 rounded-full ' + (isOpen
          ? 'bg-green-500/15 text-green-400 border border-green-500/20'
          : 'bg-red-500/15 text-red-400 border border-red-500/20');
      }
      if (status) status.textContent = isOpen ? 'Public' : 'Private';
      if (price) price.textContent = typeof window.uatomToAtom === 'function' ? window.uatomToAtom(policy.price) : String(policy.price || '-');
      if (cpRecipient) cpRecipient.textContent = policy.recipient || '-';
      if (cpMax) cpMax.textContent = policy.max_per_address || '-';
      if (info) info.classList.remove('hidden');
      return;
    }

    call('setPriceSliderValue', 'setting', 1000000);
    call('applyLengthTierPreset', 'setting', label, 1000000);
    call('updateTierExamples', 'setting', label);

    var fallbackRecipient = $('settingRecipient');
    var fallbackInfo = $('currentPolicyInfo');
    var fallbackBadge = $('currentPolicyBadge');

    if (fallbackRecipient) fallbackRecipient.value = window.userAddress || '';
    if (fallbackInfo) fallbackInfo.classList.add('hidden');
    if (fallbackBadge) {
      fallbackBadge.textContent = 'No Policy';
      fallbackBadge.className = 'text-xs px-3 py-1 rounded-full bg-gray-500/15 text-gray-400 border border-gray-500/20';
    }
  }

  async function saveTldSettings() {
    var editingTld = getEditingTld();
    if (!editingTld || !window.userAddress) {
      toastSafe('Select a TLD first', 'warn');
      return;
    }

    var priceEl = $('settingPrice');
    var recipientEl = $('settingRecipient');
    var maxEl = $('settingMaxPerAddr');
    var openEl = $('settingOpen');
    var btn = $('saveTldSettingsBtn');
    var progress = $('settingsTxProgress');

    var price = parseInt(priceEl && priceEl.value, 10) || 0;
    var recipient = (recipientEl && recipientEl.value.trim()) || window.userAddress;
    var max = parseInt(maxEl && maxEl.value, 10) || 100;
    var isOpen = !openEl || openEl.value === 'open';

    if (!price) {
      toastSafe('Enter a price in uatom', 'warn');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spin-icon mr-2"></span> Saving...';
    }
    if (progress) progress.classList.remove('hidden');

    try {
      if (typeof window.signAndBroadcastRegistry !== 'function') {
        throw new Error('Registry transaction helper is not loaded');
      }

      await window.signAndBroadcastRegistry(window.CFG.REGISTRY, {
        set_subdomain_policy: {
          name: editingTld,
          policy: {
            enabled: true,
            registration_open: isOpen,
            denom: window.CFG.DENOM,
            price: String(price),
            recipient: recipient,
            max_per_address: max
          }
        }
      }, 0, $('settingsTxSteps'), $('settingsTxBar'), window.TX_STEPS);

      if (typeof window.saveLengthTierPreset === 'function' && typeof window.collectTierValues === 'function') {
        window.saveLengthTierPreset(editingTld, window.collectTierValues('setting'));
      }

      toastSafe('Settings saved! On-chain fallback + local tier preset updated.', 'ok');
      if (progress) progress.classList.add('hidden');
      call('loadTlds');
      openTldEditor(editingTld);
    } catch (error) {
      if (progress) progress.classList.add('hidden');
      var message = error && error.message ? error.message : String(error);
      if (/rejected|denied|cancel/i.test(message)) toastSafe('Cancelled', 'warn');
      else toastSafe('Failed: ' + message.slice(0, 120), 'error');
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save"></i> Save Settings On-Chain';
    }
  }

  async function disablePolicy() {
    var editingTld = getEditingTld();
    if (!editingTld || !window.userAddress) {
      toastSafe('Select a TLD first', 'warn');
      return;
    }

    if (!window.confirm('Disable subdomain registration for .' + editingTld + '?')) return;

    var btn = $('disablePolicyBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="spin-icon"></span>';
    }

    try {
      if (typeof window.signAndBroadcastRegistry !== 'function') {
        throw new Error('Registry transaction helper is not loaded');
      }

      await window.signAndBroadcastRegistry(window.CFG.REGISTRY, {
        set_subdomain_policy: { name: editingTld, policy: null }
      }, 0, null, null, window.TX_STEPS);

      toastSafe('Registration disabled for .' + editingTld, 'ok');
      call('loadTlds');
      openTldEditor(editingTld);
    } catch (error) {
      toastSafe('Failed: ' + ((error && error.message) || '').slice(0, 80), 'error');
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = 'Make Private';
    }
  }

  function bindOnce(id, eventName, handler) {
    var el = $(id);
    if (!el || el.dataset.tldSettingsBound === '1') return;
    el.dataset.tldSettingsBound = '1';
    el.addEventListener(eventName, handler);
  }

  function initTldSettings() {
    if (typeof window.initLengthTierPricingUi === 'function') window.initLengthTierPricingUi();
    bindOnce('saveTldSettingsBtn', 'click', saveTldSettings);
    bindOnce('disablePolicyBtn', 'click', disablePolicy);
  }

  window.loadMyTlds = loadMyTlds;
  window.openTldEditor = openTldEditor;
  window.initTldSettings = initTldSettings;

  window.initManageTldsPage = window.initManageTldsPage || initTldSettings;
})();
