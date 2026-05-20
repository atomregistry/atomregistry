'use strict';

(function () {
  document.addEventListener('click', function (e) {
    var switcher = document.getElementById('languageSwitcher');
    if (!switcher) return;
    var toggle = document.getElementById('languageToggle');
    if (toggle && toggle.contains(e.target)) {
      switcher.classList.toggle('open');
      toggle.setAttribute('aria-expanded', switcher.classList.contains('open') ? 'true' : 'false');
      return;
    }
    if (!switcher.contains(e.target)) {
      switcher.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      var switcher = document.getElementById('languageSwitcher');
      if (switcher) switcher.classList.remove('open');
    }
  });
})();
