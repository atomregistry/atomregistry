'use strict';

(function () {
  function fmt(atom) {
    return atom % 1 === 0 ? atom.toFixed(0) + ' ATOM' : atom.toFixed(2) + ' ATOM';
  }

  function updateBadge(badgeId, value, suffix) {
    var el = $(badgeId);
    if (!el) return;
    el.textContent = value + (suffix || '');
  }

  function calculate() {
    var tldSlider  = $('calcTldPrice');
    var subSlider  = $('calcSubPrice');
    var subsSlider = $('calcSubs');
    var moSlider   = $('calcMonths');
    if (!tldSlider) return;

    var tldPrice = parseFloat(tldSlider.value)  || 0;
    var subPrice = parseFloat(subSlider.value)  || 0;
    var subs     = parseFloat(subsSlider.value) || 0;
    var months   = parseFloat(moSlider.value)   || 0;

    updateBadge('calcTldPriceBadge', tldPrice % 1 === 0 ? tldPrice.toFixed(0) : tldPrice.toFixed(1), ' ATOM');
    updateBadge('calcSubPriceBadge', subPrice % 1 === 0 ? subPrice.toFixed(0) : subPrice.toFixed(1), ' ATOM');
    updateBadge('calcSubsBadge', Math.round(subs), '');
    updateBadge('calcMonthsBadge', Math.round(months), months === 1 ? ' month' : ' months');

    [tldSlider, subSlider, subsSlider, moSlider].forEach(function(sl) {
      var pct = ((sl.value - sl.min) / (sl.max - sl.min)) * 100;
      sl.style.background = 'linear-gradient(to right, rgba(167,139,250,0.6) 0%, rgba(34,211,238,0.5) ' + pct + '%, rgba(255,255,255,0.1) ' + pct + '%)';
    });

    var revenue   = subPrice * subs * months;
    var profit    = revenue - tldPrice;
    var breakeven = subPrice > 0 && subs > 0 ? Math.ceil(tldPrice / subPrice) : null;
    var beMonths  = subPrice > 0 && subs > 0 ? (tldPrice / (subPrice * subs)).toFixed(1) : null;

    var setEl = function(id, val) { var el = $(id); if (el) el.textContent = val; };
    setEl('calcRevenue',   fmt(revenue));
    setEl('calcCost',      fmt(tldPrice));
    setEl('calcProfit',    (profit >= 0 ? '+' : '') + fmt(profit));
    setEl('calcBreakeven', breakeven !== null ? breakeven + ' sales (~' + beMonths + ' mo)' : '-');

    var profitEl = $('calcProfit');
    if (profitEl) profitEl.style.color = profit >= 0 ? '#34d399' : '#f87171';
  }

  function init() {
    ['calcTldPrice', 'calcSubPrice', 'calcSubs', 'calcMonths'].forEach(function(id) {
      var el = $(id);
      if (el) el.addEventListener('input', calculate);
    });
    calculate();
  }

  window.initTldCalculator = init;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
