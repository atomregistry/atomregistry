'use strict';

window.ArRouter = (function () {
  var ROUTES = {
    '':                     { view: 'pages/index',               title: 'Atom Registry | Web3 Domains on Cosmos Hub' },
    'search':               { view: 'pages/search',              title: 'Search | Atom Registry' },
    'marketplace':          { view: 'pages/marketplace',         title: 'Marketplace | Atom Registry' },
    'pay':                  { view: 'pages/pay',                 title: 'Atom Registry Pay | Scan. Resolve. Pay.' },
    'qr':                   { view: 'pages/qr',                  title: 'Smart QR resolver | Atom Registry' },
    'profiles':             { view: 'wallet/modules/profiles',   title: 'Profiles | Atom Registry' },
    'contracts':            { view: 'pages/contracts',           title: 'Contracts | Atom Registry' },
    'docs':                 { view: 'pages/docs',                title: 'Docs | Atom Registry' },
    'roadmap':              { view: 'pages/roadmap',             title: 'Roadmap | Atom Registry' },
    'docmaker':             { view: 'pages/docmaker',            title: 'DocMaker | Atom Registry' },
    'extension':            { view: 'pages/extension',           title: 'Extension | Atom Registry' },
    'tlds':                 { view: 'pages/tlds',                title: 'TLDs | Atom Registry' },
    'terms':                { view: 'pages/legal/terms',         title: 'Terms | Atom Registry' },
    'privacy':              { view: 'pages/legal/privacy',       title: 'Privacy | Atom Registry' },
    'disclaimer':           { view: 'pages/legal/disclaimer',    title: 'Disclaimer | Atom Registry' },
    'wallet/my-domains':    { view: 'wallet/modules/portfolio',  title: 'My Domains | Atom Registry',   wallet: true },
    'wallet/manage-tlds':   { view: 'wallet/modules/my-names',   title: 'Manage | Atom Registry',       wallet: true },
    'wallet/mint-tld':      { view: 'wallet/modules/mint-tld',   title: 'Mint TLD | Atom Registry',     wallet: true },
    'wallet/metadata':      { view: 'wallet/modules/metadata',   title: 'Metadata | Atom Registry',     wallet: true },
    'wallet/dssl':          { view: 'wallet/modules/dssl',       title: 'dSSL | Atom Registry',         wallet: true },
    'wallet/profiles':      { view: 'wallet/modules/profiles',   title: 'Profiles | Atom Registry',     wallet: true }
  };

  function _base() {
    var el = document.querySelector('base');
    if (!el) return '/';
    var href = el.getAttribute('href') || '/';
    return href.replace(/\/$/, '') || '/';
  }

  function _routeKey() {
    var base = _base();
    var path = location.pathname;
    if (base !== '/' && path.indexOf(base) === 0) {
      path = path.slice(base.length);
    }
    return path.replace(/^\/+|\/+$/g, '');
  }

  function _updateNavState(key) {
    var links = document.querySelectorAll('[data-route]');
    for (var i = 0; i < links.length; i++) {
      if (links[i].classList.contains('ar-topnav-logo')) continue;
      var r = links[i].getAttribute('data-route');
      links[i].classList.toggle('ar-nav-active', r === key);
      if (r === key) links[i].setAttribute('aria-current', 'page');
      else links[i].removeAttribute('aria-current');
    }
  }

  function _load(key) {
    var route = ROUTES[key] || null;
    if (!route) {
      route = { view: 'pages/not-found', title: 'Not Found - Atom Registry' };
    }

    if (route.wallet && !userAddress) {

      var base = _base();
      history.replaceState(null, '', base === '/' ? '/' : base + '/');
      if (typeof openWalletModal === 'function') openWalletModal();
      _load('');
      return;
    }

    if (typeof ArSEO !== 'undefined') ArSEO.update(key);
    else if (route.title) document.title = route.title;
    if (typeof ArViewLoader !== 'undefined') ArViewLoader.load(route.view);
    _updateNavState(key);
  }

  function navigate(path) {
    var base = _base();
    var clean = path.replace(/^\/+/, '');
    var full = (base === '/' ? '' : base) + '/' + clean;
    history.pushState(null, '', full || '/');
    _load(clean);
  }

  function start() {
    _load(_routeKey());
    window.addEventListener('popstate', function () { _load(_routeKey()); });
  }

  window.showPage = function (pageId, opts) {
    var map = {
      'names':     '',
      'portfolio': 'wallet/my-domains',
      'manage':    'wallet/manage-tlds',
      'wallet':    'wallet/my-domains'
    };
    navigate(map.hasOwnProperty(pageId) ? map[pageId] : pageId);
  };

  return { navigate: navigate, start: start, updateNavState: _updateNavState };
})();
