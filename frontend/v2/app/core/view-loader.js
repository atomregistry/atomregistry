'use strict';

window.ArViewLoader = (function () {
  var _loadedCss  = {};
  var _loadedJs   = {};
  var _cachedHtml = {};

  function _base() {
    var el = document.querySelector('base');
    return (el && el.getAttribute('href')) || './';
  }

  function _viewName(dir) {
    return dir.split('/').pop();
  }

  function _loadCss(href) {
    if (_loadedCss[href]) return Promise.resolve();
    return new Promise(function (res) {
      var link = document.createElement('link');
      link.rel  = 'stylesheet';
      link.href = href;
      link.onload  = function () { _loadedCss[href] = true; res(); };
      link.onerror = function () { _loadedCss[href] = true; res(); };
      document.head.appendChild(link);
    });
  }

  function _loadJs(src) {
    if (_loadedJs[src]) {
      return Promise.resolve();
    }
    return new Promise(function (res) {
      var s = document.createElement('script');
      s.src = src;
      s.onload  = function () { _loadedJs[src] = true; res(); };
      s.onerror = function () { _loadedJs[src] = true; res(); };
      document.body.appendChild(s);
    });
  }

  function _callInit(name) {
    var key = name.replace(/-/g, '_');
    var fn  = window.ArViewInit && window.ArViewInit[key];
    if (typeof fn === 'function') {
      try { fn(); } catch (e) { console.error('[ArViewLoader] init failed for ' + name, e); }
    }
  }

  async function load(dir) {
    var base = _base();
    var name = _viewName(dir);
    var root = base.replace(/\/$/, '') + '/' + dir;

    await _loadCss(root + '/' + name + '.css');

    var html = '';
    var htmlUrl = root + '/' + name + '.html';
    if (_cachedHtml[htmlUrl]) {
      html = _cachedHtml[htmlUrl];
    } else {
      try {
        var res = await fetch(htmlUrl, { cache: 'no-cache' });
        if (!res.ok) throw new Error(res.status);
        html = await res.text();
        _cachedHtml[htmlUrl] = html;
      } catch (e) {
        if (dir !== 'pages/not-found') {
          load('pages/not-found');
          return;
        }
        html = '<div style="padding:4rem;text-align:center"><h1 style="color:#fff;font-family:Orbitron,sans-serif">404</h1><p style="color:rgba(255,255,255,.5)">Page not found.</p></div>';
      }
    }

    var view = document.getElementById('app-view');
    if (!view) return;
    view.innerHTML = html;

    _bindFragmentLinks(view);

    window.scrollTo({ top: 0, behavior: 'instant' });

    if (_loadedJs[root + '/' + name + '.js']) {
      _callInit(name);
    } else {
      await _loadJs(root + '/' + name + '.js');
      _callInit(name);
    }
  }

  function _bindFragmentLinks(root) {
    var links = root.querySelectorAll('a[data-route], button[data-route]');
    for (var i = 0; i < links.length; i++) {
      (function (el) {
        el.addEventListener('click', function (e) {
          e.preventDefault();
          ArRouter.navigate(el.getAttribute('data-route'));
        });
      })(links[i]);
    }
  }

  return { load: load };
})();
