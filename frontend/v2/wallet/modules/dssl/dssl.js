'use strict';

window.ArViewInit = window.ArViewInit || {};

function bindDsslHeroScrollActions() {
  var buttons = document.querySelectorAll('[data-dssl-scroll]');
  buttons.forEach(function (button) {
    if (button.dataset.dsslScrollBound === '1') return;
    button.dataset.dsslScrollBound = '1';

    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();

      var sectionId = button.getAttribute('data-dssl-scroll');
      var focusId = button.getAttribute('data-dssl-focus');
      var section = sectionId ? document.getElementById(sectionId) : null;

      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      if (focusId) {
        window.setTimeout(function () {
          var focusTarget = document.getElementById(focusId);
          if (focusTarget && typeof focusTarget.focus === 'function') {
            focusTarget.focus({ preventScroll: true });
          }
        }, 320);
      }
    });
  });
}

window.ArViewInit['dssl'] = function () {
  bindDsslHeroScrollActions();
  if (typeof window.initDsslFunctionPage === 'function') window.initDsslFunctionPage();
};

(function(){
  function startDssl(){
    if (window.__dsslGlobalInitDone) return;
    window.__dsslGlobalInitDone = true;
    bindDsslHeroScrollActions();
    if (typeof window.initDsslFunctionPage === 'function') window.initDsslFunctionPage();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startDssl, { once: true });
  else startDssl();
})();
