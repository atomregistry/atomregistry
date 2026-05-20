'use strict';

var LENGTH_PRICING_TIERS = [
  { key: '1', label: '1 char', exampleBase: 'x', tag: 'ultra', baseAtom: 2500 },
  { key: '2', label: '2 chars', exampleBase: 'ab', tag: 'rare', baseAtom: 500 },
  { key: '3', label: '3 chars', exampleBase: 'abc', tag: 'hot', baseAtom: 100 },
  { key: '4', label: '4 chars', exampleBase: 'atom', tag: 'strong', baseAtom: 25 },
  { key: '5', label: '5 chars', exampleBase: 'super', tag: 'standard', baseAtom: 5 },
  { key: '6plus', label: '6+ chars', exampleBase: 'cosmos', tag: 'default', fallback: true, baseAtom: 1 }
];

var TIER_PRICE_CHANGE_STOPS = [-50, 0, 50, 100, 250, 500, 1000, 2500, 5000];
var TIER_SLIDER_MIN = 0;
var TIER_SLIDER_MAX = TIER_PRICE_CHANGE_STOPS.length - 1;
var TIER_DEFAULT_PERCENT = 0;
var TIER_MIN_ATOM = 0.01;
var TIER_MAX_ATOM = 500000;

function clampTierPercent(percent) {
  var n = parseFloat(percent || '0');
  if (!isFinite(n)) n = TIER_DEFAULT_PERCENT;
  if (n < TIER_PRICE_CHANGE_STOPS[0]) n = TIER_PRICE_CHANGE_STOPS[0];
  if (n > TIER_PRICE_CHANGE_STOPS[TIER_PRICE_CHANGE_STOPS.length - 1]) n = TIER_PRICE_CHANGE_STOPS[TIER_PRICE_CHANGE_STOPS.length - 1];
  return Math.round(n * 100) / 100;
}

function sliderValueToPercent(sliderValue) {
  var raw = parseFloat(sliderValue || '1');
  if (!isFinite(raw)) raw = 1;
  if (raw < TIER_SLIDER_MIN) raw = TIER_SLIDER_MIN;
  if (raw > TIER_SLIDER_MAX) raw = TIER_SLIDER_MAX;

  var left = Math.floor(raw);
  var right = Math.ceil(raw);
  if (left === right) return TIER_PRICE_CHANGE_STOPS[left];

  var ratio = raw - left;
  var a = TIER_PRICE_CHANGE_STOPS[left];
  var b = TIER_PRICE_CHANGE_STOPS[right];
  return Math.round((a + (b - a) * ratio) * 100) / 100;
}

function percentToSliderValue(percent) {
  var p = clampTierPercent(percent);
  for (var i = 0; i < TIER_PRICE_CHANGE_STOPS.length - 1; i++) {
    var a = TIER_PRICE_CHANGE_STOPS[i];
    var b = TIER_PRICE_CHANGE_STOPS[i + 1];
    if (p >= a && p <= b) {
      var ratio = (p - a) / (b - a || 1);
      return Math.round((i + ratio) * 100) / 100;
    }
  }
  return 1;
}

function tierByKey(key) {
  for (var i = 0; i < LENGTH_PRICING_TIERS.length; i++) {
    if (LENGTH_PRICING_TIERS[i].key === key) return LENGTH_PRICING_TIERS[i];
  }
  return LENGTH_PRICING_TIERS[LENGTH_PRICING_TIERS.length - 1];
}

function tierBaseAtom(key) {
  var tier = tierByKey(key);
  return clampTierAtom(tier.baseAtom || 1);
}

function atomForTierPercent(key, percent) {
  var base = tierBaseAtom(key);
  var price = base * (1 + clampTierPercent(percent) / 100);
  return clampTierAtom(price);
}

function percentForTierAtom(key, atom) {
  var base = tierBaseAtom(key);
  var safe = clampTierAtom(atom);
  return clampTierPercent(((safe - base) / base) * 100);
}

function formatTierAtomInput(atom) {
  var safe = clampTierAtom(atom);
  if (safe >= 1000) return String(Math.round(safe));
  if (safe >= 100) return safe.toFixed(1).replace(/\.0$/, '');
  if (safe >= 10) return safe.toFixed(2).replace(/\.00$/, '').replace(/0$/, '');
  return safe.toFixed(2);
}

function formatTierAtomDisplay(atom) {
  return formatTierAtomInput(atom) + ' ATOM';
}

function clampTierAtom(value) {
  var n = parseFloat(String(value || '1').replace(',', '.'));
  if (!isFinite(n) || n <= 0) n = 1;
  if (n < TIER_MIN_ATOM) n = TIER_MIN_ATOM;
  if (n > TIER_MAX_ATOM) n = TIER_MAX_ATOM;
  return Math.round(n * 1000000) / 1000000;
}

function tierStorageKey(name) {
  return 'ar_length_pricing:' + String(name || '');
}

function defaultTierValues(baseUatom) {
  var out = {};
  LENGTH_PRICING_TIERS.forEach(function(t){
    out[t.key] = Math.round(atomForTierPercent(t.key, TIER_DEFAULT_PERCENT) * 1000000);
  });

  var fallback = parseInt(baseUatom || 0, 10);
  if (isFinite(fallback) && fallback > 0) out['6plus'] = fallback;
  return out;
}

function normalizeTierValues(values, baseUatom) {
  var out = defaultTierValues(baseUatom);
  if (!values || typeof values !== 'object') return out;
  LENGTH_PRICING_TIERS.forEach(function(t){
    var amount = parseInt(values[t.key], 10);
    if (isFinite(amount) && amount > 0) out[t.key] = amount;
  });
  return out;
}

function loadLengthTierPreset(name, baseUatom) {
  try {
    var raw = localStorage.getItem(tierStorageKey(name));
    if (!raw) return defaultTierValues(baseUatom);
    return normalizeTierValues(JSON.parse(raw), baseUatom);
  } catch (e) {
    return defaultTierValues(baseUatom);
  }
}

function saveLengthTierPreset(name, values) {
  try {
    localStorage.setItem(tierStorageKey(name), JSON.stringify(normalizeTierValues(values, 1000000)));
    return true;
  } catch (e) {
    return false;
  }
}

function tierLabel(prefix, key, suffix) {
  return prefix + 'Tier_' + key + '_' + suffix;
}

function exampleForTier(tier, domainName) {
  var base = tier.exampleBase || 'name';
  var suffix = domainName ? '.' + String(domainName).replace(/^\./, '') : '.tld';
  return base + suffix;
}

function tierStopSliderPosition(value) {
  var sliderValue = percentToSliderValue(value);
  return ((sliderValue - TIER_SLIDER_MIN) / (TIER_SLIDER_MAX - TIER_SLIDER_MIN)) * 100;
}

function percentScaleHtml() {
  return '<div class="ar-tier-percent-scale">' + TIER_PRICE_CHANGE_STOPS.map(function(value){
    var label = (value > 0 ? '+' : '') + value + '%';
    var left = tierStopSliderPosition(value);
    return '<span style="left:' + left + '%"><i></i>' + label + '</span>';
  }).join('') + '</div>';
}

function ensureTierScaleStyles() {
  if (document.getElementById('ar-tier-scale-align-fix')) return;
  var style = document.createElement('style');
  style.id = 'ar-tier-scale-align-fix';
  style.textContent = [
    '.ar-tier-slider-wrap{position:relative;}',
    '.ar-tier-slider-wrap{--ar-tier-thumb-size:18px;--ar-tier-thumb-half:9px;}',
    '.ar-tier-percent-scale{position:relative;display:block;width:auto;height:24px;margin:6px var(--ar-tier-thumb-half) 0 var(--ar-tier-thumb-half);box-sizing:border-box;}',
    '.ar-tier-percent-scale span{position:absolute;top:0;transform:translateX(-50%);white-space:nowrap;text-align:center;}',
    '.ar-tier-percent-scale span:first-child{transform:translateX(-50%);}',
    '.ar-tier-percent-scale span:last-child{transform:translateX(-50%);}',
    '.ar-tier-percent-scale span i{display:block;margin:0 auto 2px;}'
  ].join('');
  document.head.appendChild(style);
}

function buildTierRows(containerId, prefix) {
  var host = $(containerId);
  if (!host) return;
  host.innerHTML = LENGTH_PRICING_TIERS.map(function(t){
    var defaultAtom = atomForTierPercent(t.key, TIER_DEFAULT_PERCENT);
    return '' +
      '<div class="ar-tier-row' + (t.fallback ? ' is-fallback' : '') + '">' +
        '<div class="ar-tier-name">' +
          '<strong>' + t.label + '</strong>' +
          '<span id="' + tierLabel(prefix, t.key, 'example') + '">Example: ' + exampleForTier(t, '') + '</span>' +
        '</div>' +
        '<div class="ar-tier-base">' +
          '<span>Base Price</span>' +
          '<strong>' + formatTierAtomDisplay(t.baseAtom) + '</strong>' +
        '</div>' +
        '<div class="ar-tier-price-now">' +
          '<span>Your Price</span>' +
          '<strong id="' + tierLabel(prefix, t.key, 'display') + '">' + formatTierAtomDisplay(defaultAtom) + '</strong>' +
        '</div>' +
        '<div class="ar-tier-change">' +
          '<span>Price Change</span>' +
          '<strong id="' + tierLabel(prefix, t.key, 'percent') + '" class="ar-tier-percent-value">+0%</strong>' +
        '</div>' +
        '<div class="ar-tier-slider-wrap">' +
          '<input type="range" min="' + TIER_SLIDER_MIN + '" max="' + TIER_SLIDER_MAX + '" step="0.01" value="' + percentToSliderValue(TIER_DEFAULT_PERCENT) + '" class="ar-tier-slider" id="' + tierLabel(prefix, t.key, 'slider') + '" />' +
          percentScaleHtml() +
        '</div>' +
        '<div class="ar-tier-value">' +
          '<input type="number" min="' + TIER_MIN_ATOM + '" max="' + TIER_MAX_ATOM + '" step="0.01" value="' + formatTierAtomInput(defaultAtom) + '" class="ar-tier-input" id="' + tierLabel(prefix, t.key, 'atom') + '" aria-label="Price in ATOM" />' +
          '<small>ATOM</small>' +
        '</div>' +
      '</div>';
  }).join('') + '<div class="ar-tier-note">The <strong>6+ chars</strong> row is the default price for regular names. Shorter lengths let you price rare names separately while keeping everything easy to read in <strong>ATOM</strong>.</div>';
}

function setTierRowValue(prefix, key, uatom) {
  var amount = parseInt(uatom || 1000000, 10);
  if (!isFinite(amount) || amount <= 0) amount = 1000000;
  var atom = clampTierAtom(amount / 1000000);
  var normalized = Math.round(atom * 1000000);
  var percent = percentForTierAtom(key, atom);
  var slider = $(tierLabel(prefix, key, 'slider'));
  var atomInput = $(tierLabel(prefix, key, 'atom'));
  var display = $(tierLabel(prefix, key, 'display'));
  var percentEl = $(tierLabel(prefix, key, 'percent'));
  if (slider) slider.value = String(percentToSliderValue(percent));
  if (atomInput) atomInput.value = formatTierAtomInput(atom);
  if (display) display.textContent = formatTierAtomDisplay(atom);
  if (percentEl) {
    percentEl.textContent = (percent >= 0 ? '+' : '') + Math.round(percent) + '%';
    percentEl.className = 'ar-tier-percent-value ' + (percent >= 0 ? 'is-up' : 'is-down');
  }
}

function collectTierValues(prefix) {
  var out = {};
  LENGTH_PRICING_TIERS.forEach(function(t){
    var atomInput = $(tierLabel(prefix, t.key, 'atom'));
    var atom = clampTierAtom(atomInput ? atomInput.value : t.baseAtom);
    out[t.key] = Math.round(atom * 1000000);
  });
  return out;
}

function syncTierFallback(prefix) {
  var values = collectTierValues(prefix);
  var amount = values['6plus'] || 1000000;
  var hiddenPrice = $(prefix + 'Price');
  if (hiddenPrice) hiddenPrice.value = String(amount);
  var fallbackDisplay = $(prefix + 'TierFallbackDisplay');
  var fallbackUatomDisplay = $(prefix + 'TierFallbackUatomDisplay');
  if (fallbackDisplay) fallbackDisplay.textContent = formatTierAtomDisplay(amount / 1000000);
  if (fallbackUatomDisplay) fallbackUatomDisplay.textContent = formatTierAtomDisplay(amount / 1000000);
}

function applyTierValues(prefix, values) {
  var normalized = normalizeTierValues(values, 1000000);
  LENGTH_PRICING_TIERS.forEach(function(t){ setTierRowValue(prefix, t.key, normalized[t.key]); });
  syncTierFallback(prefix);
}

function applyLengthTierPreset(prefix, name, baseUatom) {
  applyTierValues(prefix, loadLengthTierPreset(name, baseUatom));
}

function updateTierExamples(prefix, domainName) {
  LENGTH_PRICING_TIERS.forEach(function(t){
    var el = $(tierLabel(prefix, t.key, 'example'));
    if (el) el.textContent = 'Example: ' + exampleForTier(t, domainName);
  });
}

function bindTierEvents(prefix) {
  LENGTH_PRICING_TIERS.forEach(function(t){
    var slider = $(tierLabel(prefix, t.key, 'slider'));
    var atomInput = $(tierLabel(prefix, t.key, 'atom'));
    if (slider) slider.addEventListener('input', function(){
      var percent = sliderValueToPercent(slider.value);
      setTierRowValue(prefix, t.key, Math.round(atomForTierPercent(t.key, percent) * 1000000));
      syncTierFallback(prefix);
    });
    if (atomInput) atomInput.addEventListener('input', function(){
      setTierRowValue(prefix, t.key, Math.round(clampTierAtom(atomInput.value) * 1000000));
      syncTierFallback(prefix);
    });
  });
}

function initLengthTierPricingUi() {
  ensureTierScaleStyles();
  buildTierRows('policyTierRows', 'policy');
  buildTierRows('settingTierRows', 'setting');
  bindTierEvents('policy');
  bindTierEvents('setting');
  applyTierValues('policy', defaultTierValues(1000000));
  applyTierValues('setting', defaultTierValues(1000000));
}

window.LENGTH_PRICING_TIERS = LENGTH_PRICING_TIERS;
window.loadLengthTierPreset = loadLengthTierPreset;
window.saveLengthTierPreset = saveLengthTierPreset;
window.collectTierValues = collectTierValues;
window.applyTierValues = applyTierValues;
window.applyLengthTierPreset = applyLengthTierPreset;
window.syncTierFallback = syncTierFallback;
window.initLengthTierPricingUi = initLengthTierPricingUi;
window.updateTierExamples = updateTierExamples;

document.addEventListener('DOMContentLoaded', initLengthTierPricingUi);
