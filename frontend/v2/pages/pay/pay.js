'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['pay'] = (function () {
  function $(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }
  function toast(message, tone) {
    if (typeof window.toast === 'function') window.toast(message, tone || 'info');
  }
  function mintscanTx(hash) { return 'https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(hash); }

  var MIN_ATOM = 0.01;
  var AMOUNT_PRESETS = ['1', '10', '100'];

  function fmtAmountForPresetMatch(value) {
    if (!value) return '';
    var n = Number(value);
    if (!isFinite(n)) return '';
    return String(n);
  }

  function renderAmountPresets(currentValue) {
    var cur = fmtAmountForPresetMatch(currentValue);
    return '<div class="pay-amount-presets" role="group" aria-label="Quick amount">' +
      AMOUNT_PRESETS.map(function (p) {
        var active = (cur === fmtAmountForPresetMatch(p)) ? ' is-active' : '';
        return '<button class="pay-preset-btn' + active + '" type="button" data-amount-preset="' + p + '">' + p + ' ATOM</button>';
      }).join('') +
    '</div>';
  }
  function isAmountValid(amt) {
    if (amt == null || amt === '') return false;
    var n = Number(amt);
    return isFinite(n) && n >= MIN_ATOM;
  }
  function amountErrorFor(amt) {
    if (amt == null || amt === '') return '';
    var n = Number(amt);
    if (!isFinite(n)) return 'Amount is not a valid number.';
    if (n < MIN_ATOM) return 'Minimum amount is 0.01 ATOM.';
    return '';
  }
  function syncUrlWithIntent(intent) {
    try { history.replaceState(null, '', window.ArPay.buildLink(intent.to, intent)); } catch (e) {}
  }

  function hideQrSide() {
    var side = $('payQrSide');
    var shell = $('payShell');
    if (side) side.hidden = true;
    if (shell) shell.classList.remove('has-qr');
  }

  function renderEmpty() {
    return '' +
      '<div class="pay-empty-block">' +
        '<i class="fas fa-paper-plane"></i>' +
        '<strong>Send crypto to names, not wallet addresses.</strong>' +
        '<span>Every recipient is resolved on-chain through Atom Registry before your wallet signs anything - no addresses to memorize, no copy-paste mistakes.</span>' +
      '</div>';
  }

  function renderNoPayment(intent) {
    return '' +
      '<div class="pay-recipient">' +
        '<div class="pay-recipient-avatar"><i class="fas fa-circle-question"></i></div>' +
        '<div><div class="pay-recipient-name">' + esc(intent.to) + '</div><div class="pay-recipient-sub">No recipient could be resolved</div></div>' +
      '</div>' +
      '<div class="pay-warnings"><div class="pay-warning is-error"><i class="fas fa-triangle-exclamation"></i> No payment address or owner address could be resolved for this name. The name may not be registered on Atom Registry yet.</div></div>' +
      '<div class="pay-actions">' +
        '<a class="pay-btn-ghost" data-route="search" href="/search?q=' + encodeURIComponent(intent.to) + '"><i class="fas fa-magnifying-glass"></i> Look up this name</a>' +
        '<button class="pay-btn-ghost" type="button" data-action="back"><i class="fas fa-arrow-left"></i> Back</button>' +
      '</div>';
  }

  function renderError(err) {
    var attempts = err && err.attempts ? err.attempts : (err && err.cause && err.cause.attempts) || null;
    var attemptsHtml = '';
    if (attempts && attempts.length) {
      attemptsHtml = '<details style="margin-top:.6rem;text-align:left;color:rgba(255,255,255,.55);font-size:.78rem"><summary>Per-endpoint detail</summary><pre style="white-space:pre-wrap;word-break:break-all;margin:.4rem 0 0;font-family:Roboto Mono,monospace;font-size:.72rem">' +
        attempts.map(function (a) {
          return esc(a.url) + ' → ' + esc(a.status ? ('HTTP ' + a.status) : a.error);
        }).join('\n') +
        '</pre></details>';
    }
    return '' +
      '<div class="pay-empty-block">' +
        '<i class="fas fa-triangle-exclamation" style="color:#fca5a5"></i>' +
        '<strong>Could not resolve this payment intent</strong>' +
        '<span>' + esc((err && err.message) || String(err)) + '</span>' +
        '<span style="font-size:.75rem;opacity:.6">Full details printed to browser console.</span>' +
        attemptsHtml +
      '</div>';
  }

  function relativeTimeAgo(timestamp) {
    if (!timestamp) return '';
    var diff = Date.now() - timestamp;
    if (diff < 0) return 'just now';
    var seconds = Math.floor(diff / 1000);
    var minutes = Math.floor(seconds / 60);
    var hours = Math.floor(minutes / 60);
    var days = Math.floor(hours / 24);
    var months = Math.floor(days / 30);
    var years = Math.floor(days / 365);
    if (years > 0) return years + (years === 1 ? ' year ago' : ' years ago');
    if (months > 0) return months + (months === 1 ? ' month ago' : ' months ago');
    if (days > 0) return days + (days === 1 ? ' day ago' : ' days ago');
    if (hours > 0) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    if (minutes > 0) return minutes + (minutes === 1 ? ' minute ago' : ' minutes ago');
    return 'just now';
  }

  function renderTrustState(addrCheck) {
    if (!addrCheck || addrCheck.changed) return '';
    if (addrCheck.firstSeen) {
      return '<div class="pay-trust-state pay-trust-state-new">' +
        '<i class="fas fa-circle-info"></i>' +
        '<span>New recipient - verify the address with the recipient before sending.</span>' +
      '</div>';
    }
    var ago = relativeTimeAgo(addrCheck.previousTimestamp);
    return '<div class="pay-trust-state pay-trust-state-verified">' +
      '<i class="fas fa-shield-halved"></i>' +
      '<span>Address verified' + (ago ? ' &middot; last paid ' + esc(ago) : '') + '</span>' +
    '</div>';
  }

  function renderAddressChangeBanner(addrCheck) {
    if (!addrCheck || !addrCheck.changed) return '';
    var prev = window.ArPay.shortAddress(addrCheck.previousAddress || '', 10, 8);
    var ago = addrCheck.previousTimestamp ? relativeTimeAgo(addrCheck.previousTimestamp) : '';
    return '<div class="pay-warnings"><div class="pay-warning is-error pay-address-changed">' +
        '<i class="fas fa-triangle-exclamation"></i>' +
        '<div>' +
          '<strong>This name resolved to a different address than last time.</strong>' +
          '<p>' + (ago ? 'Last verified ' + esc(ago) + '. ' : '') + 'Verify with the recipient before sending.</p>' +
          '<div class="pay-address-diff">' +
            '<div><span>Previous:</span><code>' + esc(prev) + '</code></div>' +
            '<div><span>Current:</span><code data-current-addr="1">…</code></div>' +
          '</div>' +
          '<label class="pay-ack">' +
            '<input type="checkbox" id="payAddressAck" data-role="address-ack"/>' +
            '<span>I understand the address has changed and want to continue.</span>' +
          '</label>' +
          '<button class="pay-link-btn" type="button" data-action="reset-trust">Reset trust (advanced)</button>' +
        '</div>' +
      '</div></div>';
  }

  function renderConfirm(intent, payment, validation, resolution, addrCheck) {
    var warnings = (validation.warnings || []).map(function (w) {
      var copy = {
        'address-format': 'Resolved address does not look like a standard cosmos1 bech32 string. Double-check before sending.',
        'denom-mismatch': 'The link asked for ' + esc(intent.denom) + ' but the recipient is configured for ' + esc(payment.denom) + '. Sending will use the recipient\'s denom.',
        'chain-mismatch': 'The link requested chain ' + esc(intent.chain) + ' but the recipient has metadata for ' + esc(payment.chain) + '.'
      };
      return '<div class="pay-warning"><i class="fas fa-triangle-exclamation"></i> ' + (copy[w] || w) + '</div>';
    }).join('');

    var amountFixed = isAmountValid(intent.amount) && intent._editAmount !== true;
    var amountRow, amountPresets;
    if (amountFixed) {
      amountRow = '' +
        '<div class="pay-row pay-row-amount">' +
          '<dt>Amount</dt>' +
          '<dd>' + esc(intent.amount) + ' ATOM</dd>' +
          '<button class="pay-row-edit" type="button" data-action="change-amount" title="Change amount"><i class="fas fa-pen"></i> Change amount</button>' +
        '</div>';
      amountPresets = renderAmountPresets(intent.amount);
    } else {
      var prefill = intent.amount || '';
      var initErr = amountErrorFor(intent.amount);
      amountRow = '' +
        '<div class="pay-amount-input">' +
          '<label for="payAmountField">Amount to send (ATOM)</label>' +
          renderAmountPresets(prefill) +
          '<input id="payAmountField" type="number" min="0.01" step="0.000001" placeholder="min. 0.01 ATOM" autocomplete="off" inputmode="decimal"' +
          (prefill ? ' value="' + esc(prefill) + '"' : '') + ' />' +
          '<div class="pay-amount-error" id="payAmountError"' + (initErr ? '' : ' hidden') + '>' +
            '<i class="fas fa-circle-info"></i> <span>' + esc(initErr || 'Enter an amount of at least 0.01 ATOM to continue.') + '</span>' +
          '</div>' +
        '</div>';
      amountPresets = '';
    }

    var memoBlock = '' +
      '<div class="pay-row pay-row-memo">' +
        '<dt>Memo</dt>' +
        '<dd><input id="payMemoField" type="text" class="pay-row-input" maxlength="180" placeholder="Memo (optional)" autocomplete="off" value="' + esc(intent.memo || '') + '" /></dd>' +
        '<span></span>' +
      '</div>';

    var sourceLabel = payment.source === 'owner' ? 'Domain owner' : 'Payment metadata';
    var sourceRow = '<div class="pay-row"><dt>Source</dt><dd class="pay-source-badge is-' + esc(payment.source || 'metadata') + '">' + esc(sourceLabel) + '</dd><span></span></div>';

    var labelLine = payment.label
      ? '<div class="pay-recipient-sub">' + esc(payment.label) + '</div>'
      : '<div class="pay-recipient-sub">' + esc(payment.chain) + ' · ' + esc(payment.denom) + '</div>';

    var addressRow = payment.privacyHidden
      ? '<div class="pay-row pay-row-private">' +
          '<dt>Resolved address</dt>' +
          '<dd class="pay-private-mask"><i class="fas fa-eye-slash"></i> Hidden by recipient - your wallet shows it before signing</dd>' +
          '<span></span>' +
        '</div>'
      : '<div class="pay-row"><dt>Resolved address</dt><dd>' + esc(window.ArPay.shortAddress(payment.address, 12, 10)) + '</dd>' +
        '<button class="pay-row-copy" type="button" data-copy="' + esc(payment.address) + '"><i class="fas fa-copy"></i></button></div>';

    return '' +
      '<div class="pay-recipient">' +
        '<div class="pay-recipient-avatar"><i class="fas fa-atom"></i></div>' +
        '<div><div class="pay-recipient-name">' + esc(intent.to) + '</div>' + labelLine + '</div>' +
      '</div>' +
      '<dl class="pay-rows">' +
        '<div class="pay-row"><dt>Recipient name</dt><dd class="is-name">' + esc(intent.to) + '</dd>' +
          '<button class="pay-row-copy" type="button" data-copy="' + esc(intent.to) + '"><i class="fas fa-copy"></i></button></div>' +
        addressRow +
        '<div class="pay-row"><dt>Chain</dt><dd>' + esc(window.ArPay.chainDisplayName(payment.chain)) + ' <span class="pay-row-meta">· ' + esc(payment.chain) + '</span></dd><span></span></div>' +
        '<div class="pay-row"><dt>Denom</dt><dd>' + esc(payment.denom) + '</dd><span></span></div>' +
        sourceRow +
        amountRow +
        memoBlock +
      '</dl>' +
      amountPresets +
      renderAddressChangeBanner(addrCheck) +
      (warnings ? '<div class="pay-warnings">' + warnings + '</div>' : '') +
      renderTrustState(addrCheck) +
      '<p class="pay-trust-copy"><i class="fas fa-shield-halved"></i> Recipient confirmed by Atom Registry - verified on-chain before signing.</p>' +
      '<div class="pay-actions">' +
        '<button class="pay-btn-primary" type="button" data-action="confirm"' + ((window.userAddress && isAmountValid(intent.amount) && !(addrCheck && addrCheck.changed && !intent._addressAck)) ? '' : ' disabled aria-disabled="true"') + '>' +
          '<i class="fas fa-shield-halved"></i> Confirm and sign with wallet</button>' +
        '<button class="pay-btn-ghost" type="button" data-action="toggle-qr"><i class="fas fa-qrcode"></i> Show QR</button>' +
        '<button class="pay-btn-ghost" type="button" data-action="copy-link"><i class="fas fa-link"></i> Copy pay link</button>' +
        '<button class="pay-btn-ghost" type="button" data-action="back-to-create"><i class="fas fa-arrow-left"></i> Change recipient</button>' +
      '</div>' +
      (window.userAddress ? '' : '<p class="pay-create-hint" style="margin-top:.7rem"><i class="fas fa-wallet"></i> Connect a wallet from the top menu to sign this payment.</p>') +
      '<div class="pay-steps" id="payTxSteps" hidden>' +
        '<div class="pay-step" data-pay-step="1"><span class="pay-step-dot">1</span><span>Build MsgSend transaction</span></div>' +
        '<div class="pay-step" data-pay-step="2"><span class="pay-step-dot">2</span><span>Fetch account &amp; simulate gas</span></div>' +
        '<div class="pay-step" data-pay-step="3"><span class="pay-step-dot">3</span><span>Awaiting wallet signature</span></div>' +
        '<div class="pay-step" data-pay-step="4"><span class="pay-step-dot">4</span><span>Broadcast to Cosmos Hub</span></div>' +
      '</div>' +
      '<div class="pay-progress" id="payTxProgress" hidden><div class="pay-progress-bar" id="payTxBar"></div></div>' +
      '<div id="payTxResult"></div>';
  }

  async function showQR(intent) {
    var side = $('payQrSide');
    var shell = $('payShell');
    var canvas = $('payQrCanvas');
    var frame = side ? side.querySelector('.pay-qr-frame') : null;
    if (!side || !shell || !canvas || !frame) return;
    side.hidden = false;
    shell.classList.add('has-qr');
    var errBox = side.querySelector('[data-qr-error]');
    if (errBox) errBox.remove();
    canvas.hidden = false;
    var url = window.ArPay.absoluteLink(intent.to, intent);
    var urlText = $('payQrUrlText');
    if (urlText) urlText.textContent = url;
    try {
      await window.ArPay.renderQR(url, canvas, { size: 280 });
    } catch (e) {
      console.error('[ArPay] QR render failed', e);
      canvas.hidden = true;
      var div = document.createElement('div');
      div.setAttribute('data-qr-error', '');
      div.style.cssText = 'padding:1.2rem 1rem;text-align:center;color:#06020d;background:#fff;border-radius:.6rem;font-size:.82rem;max-width:14rem';
      div.innerHTML = '<i class="fas fa-triangle-exclamation" style="font-size:1.4rem;color:#dc2626;display:block;margin-bottom:.4rem"></i><strong style="display:block;margin-bottom:.25rem">QR rendering failed</strong><span style="opacity:.7">' + esc((e && e.message) || String(e)) + '</span>';
      frame.appendChild(div);
    }
  }

  function downloadQR(intent) {
    var canvas = $('payQrCanvas');
    if (!canvas) return;
    var link = document.createElement('a');
    link.download = 'atomregistry-pay-' + intent.to + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function copyToClipboard(text, label) {
    try {
      await navigator.clipboard.writeText(text);
      toast((label || 'Copied') + ' to clipboard', 'good');
    } catch (e) {
      toast('Could not copy to clipboard', 'warn');
    }
  }

  function bindActions(intent, payment) {
    var card = $('payCard');
    if (!card) return;

    function validateAmountInline() {
      var input = $('payAmountField');
      if (!input) return;
      var raw = (input.value || '').trim();
      intent.amount = raw;
      var valid = isAmountValid(raw);
      var msg = amountErrorFor(raw);
      var errEl = $('payAmountError');
      if (errEl) {
        if (!msg) { errEl.hidden = true; }
        else {
          errEl.hidden = false;
          var span = errEl.querySelector('span');
          if (span) span.textContent = msg;
        }
      }
      var confirmBtn = card.querySelector('[data-action="confirm"]');
      if (confirmBtn) {
        if (window.userAddress && valid) confirmBtn.removeAttribute('disabled');
        else confirmBtn.setAttribute('disabled', 'disabled');
      }
      if (valid) {
        syncUrlWithIntent(intent);
        showQR(intent).catch(function () {});
      }
    }

    function updateMemoInline() {
      var input = $('payMemoField');
      if (!input) return;
      intent.memo = (input.value || '').trim();
      syncUrlWithIntent(intent);
      var side = $('payQrSide');
      if (side && !side.hidden && isAmountValid(intent.amount)) {
        showQR(intent).catch(function () {});
      }
    }

    function refreshConfirmEnabled() {
      var confirmBtn = card.querySelector('[data-action="confirm"]');
      if (!confirmBtn) return;
      var amountOk = isAmountValid(intent.amount);
      var addressOk = !(intent._addrCheck && intent._addrCheck.changed && !intent._addressAck);
      if (window.userAddress && amountOk && addressOk) confirmBtn.removeAttribute('disabled');
      else confirmBtn.setAttribute('disabled', 'disabled');
    }

    card.addEventListener('input', function (e) {
      if (e.target && e.target.id === 'payAmountField') validateAmountInline();
      if (e.target && e.target.id === 'payMemoField') updateMemoInline();
    });

    card.addEventListener('change', function (e) {
      if (e.target && e.target.id === 'payAddressAck') {
        intent._addressAck = !!e.target.checked;
        refreshConfirmEnabled();
      }
    });

    function syncPresetButtons(value) {
      var cur = fmtAmountForPresetMatch(value);
      card.querySelectorAll('[data-amount-preset]').forEach(function (btn) {
        btn.classList.toggle('is-active', fmtAmountForPresetMatch(btn.getAttribute('data-amount-preset')) === cur);
      });
    }

    card.addEventListener('click', async function (e) {
      var copyBtn = e.target.closest('[data-copy]');
      if (copyBtn) { copyToClipboard(copyBtn.getAttribute('data-copy'), 'Address'); return; }
      var presetBtn = e.target.closest('[data-amount-preset]');
      if (presetBtn) {
        var preset = presetBtn.getAttribute('data-amount-preset');
        intent.amount = preset;
        syncUrlWithIntent(intent);
        var fld = $('payAmountField');
        if (fld) { fld.value = preset; validateAmountInline(); }
        else {

          card.innerHTML = renderConfirm(intent, payment, window.ArPay.validate(intent, payment));
          if (isAmountValid(intent.amount)) showQR(intent).catch(function () {});
        }
        syncPresetButtons(intent.amount);
        return;
      }
      var action = e.target.closest('[data-action]');
      if (!action) return;
      var name = action.getAttribute('data-action');
      if (name === 'back') { history.back(); return; }
      if (name === 'back-to-create') {
        if (window.ArRouter && typeof window.ArRouter.navigate === 'function') window.ArRouter.navigate('pay');
        else location.href = '/pay';
        return;
      }
      if (name === 'toggle-qr') { showQR(intent); return; }
      if (name === 'copy-link') {
        copyToClipboard(window.ArPay.absoluteLink(intent.to, intent), 'Pay link');
        return;
      }
      if (name === 'change-amount') {

        intent._editAmount = true;
        card.innerHTML = renderConfirm(intent, payment, window.ArPay.validate(intent, payment), null, intent._addrCheck);
        var fld = $('payAmountField');
        if (fld) { fld.focus(); fld.select(); }
        return;
      }
      if (name === 'reset-trust') {
        if (!confirm('Reset address history for ' + intent.to + '? The next visit will treat this address as a fresh, first-time recipient.')) return;
        try {
          window.ArPay.clearAddressHistory(intent.to);
          intent._addressAck = false;

          intent._addrCheck = window.ArPay.checkAddressChange(intent.to, payment);
          card.innerHTML = renderConfirm(intent, payment, window.ArPay.validate(intent, payment), null, intent._addrCheck);
          var curEl = card.querySelector('[data-current-addr="1"]');
          if (curEl) curEl.textContent = window.ArPay.shortAddress(payment.address, 10, 8);
          toast('Address history reset', 'good');
        } catch (err) {
          toast('Failed to reset: ' + (err.message || err), 'error');
        }
        return;
      }
      if (name === 'confirm') {
        if (!window.userAddress) { toast('Connect a wallet first', 'warn'); return; }
        if (!isAmountValid(intent.amount)) { toast(amountErrorFor(intent.amount), 'warn'); return; }
        var uatom = window.ArPay.atomToUatom(parseFloat(intent.amount));
        $('payTxSteps').hidden = false;
        $('payTxProgress').hidden = false;
        action.setAttribute('disabled', 'disabled');
        try {
          var result = await window.ArPay.signAndBroadcastSend(payment.address, uatom, intent.memo || '', $('payTxSteps'), $('payTxBar'));
          window.ArPay.recordAddress(intent.to, payment);
          $('payTxResult').innerHTML = '<div class="pay-tx-success"><strong>Payment broadcast.</strong> Tx hash: <code>' + esc(result.txhash) + '</code> · <a href="' + mintscanTx(result.txhash) + '" target="_blank" rel="noopener">View on Mintscan</a></div>';
          toast('Payment broadcast: ' + result.txhash.slice(0, 12) + '…', 'good');
        } catch (err) {
          $('payTxResult').innerHTML = '<div class="pay-warning is-error"><i class="fas fa-triangle-exclamation"></i> ' + esc((err && err.message) || String(err)) + '</div>';
          action.removeAttribute('disabled');
        }
      }
    });
  }

  async function renderIntent(intent) {
    var card = $('payCard');
    if (!card) return;
    card.classList.remove('pay-card--receive');
    var page = $('payPage');
    if (page) {
      page.classList.remove('is-receive-mode');
      page.classList.add('is-intent-mode');
    }
    try {
      var recipient;
      try {
        recipient = await window.ArPay.findAddress(intent.to, { chain: intent.chain });
      } catch (err) {
        if (err && err.code === 'no-recipient') {
          hideQrSide();
          card.classList.remove('pay-card-loading');
          card.innerHTML = renderNoPayment(intent);
          bindActions(intent, null);
          return;
        }
        throw err;
      }
      var validation = window.ArPay.validate(intent, recipient);
      var addrCheck = window.ArPay.checkAddressChange(intent.to, recipient);
      intent._addrCheck = addrCheck;
      intent._addressAck = false;
      card.classList.remove('pay-card-loading');
      card.innerHTML = renderConfirm(intent, recipient, validation, null, addrCheck);

      var curEl = card.querySelector('[data-current-addr="1"]');
      if (curEl) curEl.textContent = window.ArPay.shortAddress(recipient.address, 10, 8);
      bindActions(intent, recipient);
      bindSidePanel(intent);
      if (isAmountValid(intent.amount)) showQR(intent).catch(function () {});
    } catch (e) {
      console.error('[ArPay view] renderIntent error', e);
      hideQrSide();
      card.classList.remove('pay-card-loading');
      card.innerHTML = renderError(e);
    }
  }

  function bindCreate() {
    var createCard = $('payCreateCard');
    if (!createCard) return;
    createCard.hidden = false;
    var btn = $('payCreateBtn');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var name = ($('payCreateName').value || '').trim().toLowerCase().replace(/^\.+/, '');
      if (!name) { toast('Enter a name like user.atom', 'warn'); return; }
      var amount = ($('payCreateAmount').value || '').trim();
      if (amount && !isAmountValid(amount)) { toast(amountErrorFor(amount), 'warn'); return; }
      var url = window.ArPay.buildLink(name, { amount: amount || undefined });
      location.href = url;
    });
  }

  function bindSidePanel(intent) {
    var copy = $('payCopyLink');
    if (copy) copy.addEventListener('click', function () {
      copyToClipboard(window.ArPay.absoluteLink(intent.to, intent), 'Pay link');
    });
    var dl = $('payDownloadQr');
    if (dl) dl.addEventListener('click', function () { downloadQR(intent); });
  }

  async function renderReceive(intent) {
    var card = $('payCard');
    if (!card) return;
    try {
      var recipient = await window.ArPay.findAddress(intent.to, { chain: intent.chain });
      var sourceBadge = recipient.source === 'metadata'
        ? '<span class="pay-source-badge is-metadata">Payment metadata</span>'
        : '<span class="pay-source-badge is-owner">Domain owner</span>';
      var fallbackNote = recipient.source === 'owner'
        ? '<div class="pay-warning"><i class="fas fa-info-circle"></i> Using domain owner address. Add payment metadata to route payments to a custom wallet.</div>'
        : '';
      var link = window.ArPay.absoluteLink(intent.to, intent);
      card.classList.remove('pay-card-loading');
      card.classList.add('pay-card--receive');
      var page = $('payPage');
      if (page) {
        page.classList.add('is-receive-mode');
        page.classList.add('is-intent-mode');
      }
      card.innerHTML =
        '<div class="pay-recipient">' +
          '<div class="pay-recipient-avatar"><i class="fas fa-atom"></i></div>' +
          '<div><div class="pay-recipient-name">' + esc(intent.to) + '</div>' +
            '<div class="pay-recipient-sub">Receive payments as ' + esc(intent.to) + '</div></div>' +
        '</div>' +
        '<div class="pay-receive-qr">' +
          '<canvas id="payQrCanvas" aria-label="Payment QR"></canvas>' +
        '</div>' +
        '<div class="pay-receive-badge-row"><span class="pay-qr-intent-badge"><i class="fas fa-shield-halved"></i> Payment intent, not wallet address</span></div>' +
        '<div class="pay-qr-url-preview">' +
          '<span class="pay-qr-url-label">This QR opens:</span>' +
          '<code class="pay-qr-url-text">' + esc(link) + '</code>' +
        '</div>' +
        '<dl class="pay-rows">' +
          '<div class="pay-row"><dt>Recipient name</dt><dd class="is-name">' + esc(intent.to) + '</dd>' +
            '<button class="pay-row-copy" type="button" data-copy="' + esc(intent.to) + '"><i class="fas fa-copy"></i></button></div>' +
          (recipient.privacyHidden
            ? '<div class="pay-row pay-row-private"><dt>Resolved address</dt><dd class="pay-private-mask"><i class="fas fa-eye-slash"></i> Hidden by recipient - revealed in sender wallet at sign time</dd><span></span></div>'
            : '<div class="pay-row"><dt>Resolved address</dt><dd>' + esc(window.ArPay.shortAddress(recipient.address, 12, 10)) + '</dd>' +
              '<button class="pay-row-copy" type="button" data-copy="' + esc(recipient.address) + '"><i class="fas fa-copy"></i></button></div>') +
          '<div class="pay-row"><dt>Chain</dt><dd>' + esc(window.ArPay.chainDisplayName(recipient.chain)) + ' <span class="pay-row-meta">· ' + esc(recipient.chain) + '</span></dd><span></span></div>' +
          '<div class="pay-row"><dt>Source</dt><dd class="pay-source-badge is-' + esc(recipient.source) + '">' + (recipient.source === 'metadata' ? 'Payment metadata' : 'Domain owner') + '</dd><span></span></div>' +
        '</dl>' +
        fallbackNote +
        '<p class="pay-trust-copy"><i class="fas fa-shield-halved"></i> Share this QR to receive ATOM by name. Payments sent to this name will resolve through Atom Registry.</p>' +
        '<div class="pay-actions">' +
          '<button class="pay-btn-ghost" type="button" data-action="copy-link"><i class="fas fa-link"></i> Copy payment link</button>' +
          (recipient.privacyHidden ? '' : '<button class="pay-btn-ghost" type="button" data-action="copy-address"><i class="fas fa-wallet"></i> Copy resolved address</button>') +
          '<button class="pay-btn-ghost" type="button" data-action="download-qr"><i class="fas fa-download"></i> Download QR</button>' +
          '<a class="pay-btn-ghost" data-route="pay" href="' + esc(window.ArPay.buildLink(intent.to)) + '"><i class="fas fa-paper-plane"></i> Switch to Send mode</a>' +
        '</div>';

      window.ArPay.renderQR(link, $('payQrCanvas'), { size: 260 }).catch(function (err) {
        toast('QR render failed: ' + (err.message || err), 'error');
      });

      card.addEventListener('click', function (e) {
        var copyBtn = e.target.closest('[data-copy]');
        if (copyBtn) { copyToClipboard(copyBtn.getAttribute('data-copy'), 'Copied'); return; }
        var act = e.target.closest('[data-action]');
        if (!act) return;
        var a = act.getAttribute('data-action');
        if (a === 'copy-link') copyToClipboard(link, 'Pay link');
        else if (a === 'copy-address') copyToClipboard(recipient.address, 'Address');
        else if (a === 'download-qr') {
          var canvas = $('payQrCanvas');
          if (!canvas) return;
          var lnk = document.createElement('a');
          lnk.download = 'atomregistry-pay-' + intent.to + '.png';
          lnk.href = canvas.toDataURL('image/png');
          lnk.click();
        }
      });
    } catch (err) {
      card.classList.remove('pay-card-loading');
      card.innerHTML = renderError(err);
    }
  }

  return function init() {
    hideQrSide();
    var intent = window.ArPay.parseLink(location.href);
    if (!intent.to) {
      var card = $('payCard');
      if (card) {
        card.classList.remove('pay-card-loading');
        card.classList.remove('pay-card--receive');
        card.innerHTML = renderEmpty();
      }
      var page = $('payPage');
      if (page) {
        page.classList.remove('is-receive-mode');
        page.classList.remove('is-intent-mode');
      }
      bindCreate();
      return;
    }
    if (intent.mode === 'receive') {
      renderReceive(intent);
      return;
    }
    renderIntent(intent);
  };
})();
