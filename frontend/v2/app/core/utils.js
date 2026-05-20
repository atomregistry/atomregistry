'use strict';

function $(id) { return document.getElementById(id); }

var toastTimer;
function toast(msg, type) {
  var el = $('toast');
  if (!el) return;
  el.textContent = msg;
  el.style.borderColor = type==='error'?'rgba(239,68,68,0.5)':type==='warn'?'rgba(245,158,11,0.5)':'rgba(34,211,238,0.4)';
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ el.classList.remove('show'); }, 4500);
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function uatomToAtom(u) { return (parseInt(u||0)/1000000).toFixed(2) + ' ATOM'; }
function atomToUatom(a) { return Math.floor(parseFloat(a||0)*1000000); }
function formatAtomPriceFromUatom(uatom) {
  var amount = parseInt(uatom || 0, 10);
  if (!isFinite(amount) || amount < 0) amount = 0;
  return (amount / 1000000).toFixed(2) + ' ATOM';
}

function setPriceSliderValue(prefix, uatom) {
  var amount = parseInt(uatom || 1000000, 10);
  if (!isFinite(amount) || amount <= 0) amount = 1000000;
  var atom = amount / 1000000;
  var slider = $(prefix + 'PriceSlider');
  var atomInput = $(prefix + 'PriceAtom');
  var uatomInput = $(prefix + 'Price');
  var atomDisplay = $(prefix + 'PriceAtomDisplay');
  var uatomDisplay = $(prefix + 'PriceUatomDisplay');
  if (slider) slider.value = Math.min(Math.max(atom, parseFloat(slider.min || '0.1')), parseFloat(slider.max || '100'));
  if (atomInput) atomInput.value = Number(atom.toFixed(6));
  if (uatomInput) uatomInput.value = String(amount);
  if (atomDisplay) atomDisplay.textContent = formatAtomPriceFromUatom(amount);
  if (uatomDisplay) uatomDisplay.textContent = String(amount) + ' uatom';
}

function debounce(fn, ms) {
  var timer;
  return function() {
    var args = arguments, ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, ms || 300);
  };
}
window.debounce = debounce;

function toastTx(txhash, label) {
  var el = document.getElementById('txToast');
  if (!el) return;
  var nameEl = el.querySelector('#txToastName');
  var linkEl = el.querySelector('#txToastLink');
  if (nameEl) nameEl.textContent = label || 'Transaction confirmed';
  if (linkEl) {
    linkEl.href = 'https://www.mintscan.io/cosmos/tx/' + encodeURIComponent(txhash);
    linkEl.textContent = txhash.slice(0, 10) + '...' + txhash.slice(-6);
  }
  el.classList.add('show');
  clearTimeout(window.txToastTimer);
  window.txToastTimer = setTimeout(function() { el.classList.remove('show'); }, 9000);
}
window.toastTx = toastTx;

function bindPriceSlider(prefix) {
  var slider = $(prefix + 'PriceSlider');
  var atomInput = $(prefix + 'PriceAtom');
  var uatomInput = $(prefix + 'Price');
  if (!slider || !atomInput || !uatomInput) return;

  slider.addEventListener('input', function(){
    var atom = parseFloat(slider.value || '1');
    setPriceSliderValue(prefix, Math.round(atom * 1000000));
  });

  atomInput.addEventListener('input', function(){
    var atom = parseFloat(atomInput.value || '0');
    if (!isFinite(atom) || atom <= 0) return;
    setPriceSliderValue(prefix, Math.round(atom * 1000000));
  });

  uatomInput.addEventListener('input', function(){
    var amount = parseInt(uatomInput.value || '0', 10);
    if (!isFinite(amount) || amount <= 0) return;
    setPriceSliderValue(prefix, amount);
  });

  setPriceSliderValue(prefix, uatomInput.value || 1000000);
}
