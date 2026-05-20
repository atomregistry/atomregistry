'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['portfolio'] = function () {
  var btn = document.getElementById('syncPortfolioBtn');
  if (btn) btn.addEventListener('click', loadPortfolio);
  if (typeof loadPortfolio === 'function') loadPortfolio();
};
