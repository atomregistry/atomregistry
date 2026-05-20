'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['roadmap'] = (function () {

  function bindAnchorScroll() {
    var page = document.querySelector('.roadmap-page');
    if (!page) return;
    page.addEventListener('click', function (e) {
      var link = e.target.closest('a[href]');
      if (!link) return;
      var href = link.getAttribute('href') || '';

      if (href.charAt(0) !== '#' || href.length < 2) return;
      var id = href.slice(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      if (history.replaceState) {
        history.replaceState(null, '', '#' + id);
      } else {
        location.hash = id;
      }
    });
  }

  return function init() {
    bindAnchorScroll();

    if (location.hash && location.hash.length > 1) {
      var id = location.hash.slice(1);
      var target = document.getElementById(id);
      if (target) {
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 60);
      }
    }
  };
})();
