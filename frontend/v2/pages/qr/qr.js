'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['qr'] = (function () {
  function basePath() {
    var el = document.querySelector('base');
    var h = (el && el.getAttribute('href')) || '/';
    return h.replace(/\/+$/, '');
  }

  function renderEmpty() {
    var card = $('qrCard');
    if (card) {
      card.innerHTML =
        '<div class="qr-empty-block">' +
          '<i class="fas fa-compass"></i>' +
          '<strong>Paste a name below to start.</strong>' +
          '<span>Share links like <code>/qr?name=user.atom&amp;mode=smart</code> to open this resolver pre-loaded.</span>' +
        '</div>';
    }
    var empty = $('qrEmptyCard');
    if (empty) {
      empty.hidden = false;
      var btn = $('qrLookupBtn');
      if (btn) btn.addEventListener('click', function () {
        var name = ($('qrLookupName').value || '').trim().toLowerCase();
        if (!name) { toast('Enter a name like user.atom', 'warn'); return; }
        location.href = basePath() + '/qr?name=' + encodeURIComponent(name) + '&mode=smart';
      });
      var input = $('qrLookupName');
      if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') btn.click(); });
    }
  }

  function renderError(err) {
    var card = $('qrCard');
    if (!card) return;
    card.innerHTML =
      '<div class="qr-empty-block">' +
        '<i class="fas fa-triangle-exclamation" style="color:#fca5a5"></i>' +
        '<strong>Could not resolve this name</strong>' +
        '<span>' + esc((err && err.message) || String(err)) + '</span>' +
      '</div>';
  }

  function buildActions(name, resolution, recipient) {
    var website = resolution && resolution.raw && resolution.raw.website;
    var avatar = resolution && resolution.raw && resolution.raw.avatar;
    var displayName = (resolution && resolution.raw && (resolution.raw.displayName || resolution.raw.projectName)) || name;
    var bio = resolution && resolution.raw && resolution.raw.bio;

    var actions = [];

    if (recipient) {
      var sourceTag = recipient.source === 'metadata' ? '' : ' · owner fallback';
      actions.push({
        kind: 'pay',
        icon: 'fa-paper-plane',
        title: 'Send payment',
        sub: recipient.chain + ' · ' + window.ArPay.shortAddress(recipient.address, 12, 8) + sourceTag,
        primary: true,
        href: window.ArPay.buildLink(name),
        route: 'pay'
      });
    }

    actions.push({
      kind: 'profile',
      icon: 'fa-id-card',
      title: 'Open profile',
      sub: 'View the public metadata identity for ' + name,
      href: basePath() + '/wallet/metadata?domain=' + encodeURIComponent(name),
      route: 'wallet/metadata'
    });

    actions.push({
      kind: 'registry',
      icon: 'fa-shield-halved',
      title: 'View registry record',
      sub: 'Resolver lookup, on-chain WHOIS, ownership',
      href: basePath() + '/search?q=' + encodeURIComponent(name) + '&mode=registry',
      route: 'search'
    });

    if (website && /^https?:\/\//i.test(website)) {
      actions.push({
        kind: 'website',
        icon: 'fa-globe',
        title: 'Open website',
        sub: website.length > 56 ? website.slice(0, 53) + '…' : website,
        external: true,
        href: website
      });
    }

    if (recipient) {
      actions.push({
        kind: 'copy-address',
        icon: 'fa-wallet',
        title: 'Copy resolved wallet address',
        sub: window.ArPay.shortAddress(recipient.address, 14, 10) + ' (' + recipient.source + ')',
        copy: recipient.address
      });
    }

    return { actions: actions, recipient: recipient, displayName: displayName, bio: bio, avatar: avatar };
  }

  function renderResolved(name, resolution, recipient) {
    var card = $('qrCard');
    if (!card) return;
    var built = buildActions(name, resolution, recipient);
    var avatar = built.avatar && /^https:\/\//i.test(built.avatar)
      ? '<img src="' + esc(built.avatar) + '" alt="" loading="lazy" />'
      : '<i class="fas fa-atom"></i>';

    card.innerHTML =
      '<header class="qr-resolved-head">' +
        '<div class="qr-resolved-avatar">' + avatar + '</div>' +
        '<div>' +
          '<div class="qr-resolved-name">' + esc(built.displayName) + '</div>' +
          '<div class="qr-resolved-sub">' + esc(name) + (built.bio ? ' · ' + esc(built.bio.slice(0, 80)) : '') + '</div>' +
        '</div>' +
      '</header>' +
      '<ul class="qr-actions">' +
        built.actions.map(function (a) {
          var tag = a.external ? 'a' : (a.copy ? 'button' : 'a');
          var attrs = '';
          if (tag === 'a') {
            attrs = 'href="' + esc(a.href) + '"';
            if (a.external) attrs += ' target="_blank" rel="noopener"';
            if (a.route) attrs += ' data-route="' + esc(a.route) + '"';
          } else {
            attrs = 'type="button" data-copy="' + esc(a.copy) + '"';
          }
          return '<li class="qr-action' + (a.primary ? ' is-primary' : '') + '">' +
            '<' + tag + ' ' + attrs + ' class="qr-action-inner">' +
              '<span class="qr-action-icon"><i class="fas ' + a.icon + '"></i></span>' +
              '<span class="qr-action-text"><strong>' + esc(a.title) + '</strong><span>' + esc(a.sub) + '</span></span>' +
              '<i class="fas fa-chevron-right qr-action-chev"></i>' +
            '</' + tag + '>' +
          '</li>';
        }).join('') +
      '</ul>' +
      (built.recipient
        ? '<div class="qr-payment-note"><i class="fas fa-info-circle"></i> ' +
            (built.recipient.source === 'owner'
              ? 'Payment uses domain owner address. The owner can add payment metadata to route to a different wallet.'
              : 'Payment uses configured payment metadata.') +
          '</div>'
        : '');

    card.querySelectorAll('[data-copy]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(btn.getAttribute('data-copy')).then(
          function () { toast('Copied to clipboard', 'good'); },
          function () { toast('Could not copy', 'warn'); }
        );
      });
    });
    card.querySelectorAll('[data-route]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        var route = el.getAttribute('data-route');
        var path = el.getAttribute('href');
        var query = '';
        var q = path.indexOf('?');
        if (q !== -1) query = path.slice(q);
        if (query) {
          history.pushState(null, '', path);
          window.dispatchEvent(new Event('popstate'));
        } else {
          ArRouter.navigate(route);
        }
      });
    });
  }

  async function resolveAndRender(name) {
    var card = $('qrCard');
    if (!card) return;
    try {
      var resolution = await window.ArPay.resolve(name).catch(function (err) {
        console.warn('[Smart QR] metadata resolve failed (continuing without resolution)', err);
        return null;
      });
      var recipient = null;
      try {
        recipient = await window.ArPay.findAddress(name);
      } catch (err) {
        console.warn('[Smart QR] findAddress failed (no Send payment action)', err);
      }
      if (!resolution && !recipient) {
        renderError(new Error('Could not resolve any data for this name. It may not be registered.'));
        return;
      }
      renderResolved(name, resolution, recipient);
    } catch (e) {
      console.error('[Smart QR] resolveAndRender error', e);
      renderError(e);
    }
  }

  return function init() {
    var params = new URLSearchParams(location.search);
    var name = (params.get('name') || '').trim().toLowerCase();
    if (!name) { renderEmpty(); return; }
    resolveAndRender(name);
  };
})();
