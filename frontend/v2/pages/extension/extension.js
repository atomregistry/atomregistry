'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['extension'] = (function () {
  var _bound = false;

  function init() {
    if (_bound) return;
    _bound = true;

    var toast = document.querySelector('#extToast');

    function showToast(message) {
      if (!toast) return;

      toast.textContent = message;
      toast.classList.add('show');

      clearTimeout(showToast.timer);
      showToast.timer = setTimeout(function () {
        toast.classList.remove('show');
      }, 2200);
    }

    var revealItems = document.querySelectorAll('.reveal, .reveal-2, .reveal-3');

    if (typeof IntersectionObserver !== 'undefined' && revealItems.length) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('on');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12 });

      revealItems.forEach(function (item) {
        observer.observe(item);
      });
    } else {
      revealItems.forEach(function (item) {
        item.classList.add('on');
      });
    }

    document.addEventListener('click', async function (event) {
      var copyButton = event.target && event.target.closest('[data-copy]');
      if (!copyButton) return;

      var value = copyButton.getAttribute('data-copy') || '';

      try {
        await navigator.clipboard.writeText(value);
        showToast('Copied to clipboard.');
      } catch (err) {
        showToast('Copy failed. Try manually.');
      }
    });
  }

  return init;
})();
