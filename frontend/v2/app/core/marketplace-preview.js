'use strict';

(function () {
  var MAX_PREVIEW_LISTINGS = 4;

  // Curated list of names to probe for the homepage preview board. The
  // marketplace contract only supports per-name `listing { name }` lookup,
  // so a "live featured listings" board has to query a known set of names.
  // Populate as the marketplace gets seeded with notable listings.
  var FEATURED_PREVIEW_NAMES = [];

  function $(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[m];
    });
  }

  function shortAddress(address, head, tail) {
    if (!address) return '-';
    address = String(address);
    return address.slice(0, head || 10) + '...' + address.slice(-(tail || 6));
  }

  function trimZeros(v) {
    return String(v).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  }

  function uatomToAtom(amount) {
    var n = Number(amount || 0) / 1000000;
    return Number.isFinite(n) ? trimZeros(n.toFixed(6)) : '0';
  }

  function formatCoin(amount, denom) {
    denom = denom || 'uatom';

    if (denom === 'uatom') {
      return uatomToAtom(amount) + ' ATOM';
    }

    return String(amount || '0') + ' ' + denom;
  }

  function getConfig() {
    var cfg = window.CFG || window.AR_CONFIG || window.APP_CONFIG || {};

    return {
      marketplace:
        cfg.MARKETPLACE ||
        cfg.MARKETPLACE_CONTRACT ||
        '',

      registry:
        cfg.REGISTRY ||
        cfg.REGISTRY_CONTRACT ||
        '',

      denom:
        cfg.DENOM ||
        'uatom',

      rest:
        cfg.REST || [
          'https://cosmos-rest.publicnode.com',
          'https://rest.cosmos.directory/cosmoshub',
          'https://cosmoshub-api.lavenderfive.com',
          'https://cosmos-api.polkachu.com'
        ]
    };
  }

  var _nameCache = {};

  async function resolvePrimaryName(address) {
    if (!address) return null;
    if (_nameCache[address] !== undefined) return _nameCache[address];

    var cfg = getConfig();
    if (!cfg.registry) { _nameCache[address] = null; return null; }

    try {
      var result = await queryContract(cfg.registry, { primary_of: { owner: address } });
      _nameCache[address] = (result && result.name) || null;
    } catch (e) {
      _nameCache[address] = null;
    }

    return _nameCache[address];
  }

  async function enrichWithNames(listings) {
    var unique = listings
      .map(function (l) { return l.seller; })
      .filter(function (a, i, arr) { return a && arr.indexOf(a) === i; });

    await Promise.all(unique.map(resolvePrimaryName));

    return listings.map(function (item) {
      return Object.assign({}, item, { sellerName: _nameCache[item.seller] || null });
    });
  }

  async function restFetch(path) {
    var cfg = getConfig();
    var lastError;

    for (var i = 0; i < cfg.rest.length; i++) {
      try {
        var res = await fetch(cfg.rest[i] + path);

        if (!res.ok) {
          lastError = new Error('HTTP ' + res.status);

          if (res.status === 500) break;
          continue;
        }

        return await res.json();
      } catch (e) {
        lastError = e;
      }
    }

    throw lastError || new Error('All REST endpoints failed');
  }

  async function queryContract(contract, query) {
    var enc = btoa(JSON.stringify(query));
    var data = await restFetch('/cosmwasm/wasm/v1/contract/' + contract + '/smart/' + enc);
    return data && data.data ? data.data : data;
  }

  function normalizeName(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeListing(raw) {
    raw = raw || {};

    var name =
      raw.name ||
      raw.domain ||
      raw.asset_name ||
      raw.token_id ||
      raw.id ||
      '';

    name = normalizeName(name);

    var seller =
      raw.seller ||
      raw.owner ||
      raw.address ||
      raw.creator ||
      '';

    var price =
      raw.price ||
      raw.ask_price ||
      raw.amount ||
      raw.list_price ||
      raw.fixed_price ||
      '0';

    var type =
      raw.asset_type ||
      raw.kind ||
      raw.type ||
      '';

    var isTld =
      type === 'tld' ||
      type === 'TLD' ||
      name.charAt(0) === '.' ||
      name.indexOf('.') === -1;

    if (isTld && name && name.charAt(0) !== '.') {
      name = '.' + name;
    }

    return {
      name: name,
      seller: seller,
      price: price,
      type: isTld ? 'TLD' : 'Domain',
      subtitle: isTld ? 'Top-level namespace' : 'Wallet identity name'
    };
  }

  async function queryMarketplaceListings() {
    var cfg = getConfig();

    if (!cfg.marketplace) {
      throw new Error('Missing marketplace contract address');
    }

    if (!FEATURED_PREVIEW_NAMES.length) return [];

    var probes = FEATURED_PREVIEW_NAMES.map(function (name) {
      return queryContract(cfg.marketplace, { listing: { name: name } })
        .then(function (raw) { return raw && raw.name ? normalizeListing(raw) : null; })
        .catch(function () { return null; });
    });

    var resolved = await Promise.all(probes);

    return resolved
      .filter(function (item) { return item && item.name; })
      .slice(0, MAX_PREVIEW_LISTINGS);
  }

  function renderLoading() {
    var el = $('marketPreviewList');
    if (!el) return;

    el.innerHTML = [
      '<div class="market-preview-empty">',
        '<i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>',
        '<div>',
          '<strong>Loading listings...</strong>',
          '<span>Reading active marketplace listings from Cosmos Hub.</span>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderEmpty() {
    var el = $('marketPreviewList');
    if (!el) return;

    el.innerHTML = [
      '<div class="market-preview-empty">',
        '<i class="fas fa-magnifying-glass" aria-hidden="true"></i>',
        '<div>',
          '<strong>Look up a listing by name</strong>',
          '<span>Search any domain on the marketplace to view its price, or list one of your own from My domains.</span>',
        '</div>',
      '</div>'
    ].join('');
  }

  function renderError(message) {
    var el = $('marketPreviewList');
    if (!el) return;

    el.innerHTML = [
      '<div class="market-preview-empty market-preview-empty-error">',
        '<i class="fas fa-triangle-exclamation" aria-hidden="true"></i>',
        '<div>',
          '<strong>Marketplace unavailable</strong>',
          '<span>' + esc(message || 'Could not load marketplace listings right now.') + '</span>',
        '</div>',
      '</div>'
    ].join('');
  }

  function listingIcon(type) {
    return type === 'TLD' ? 'fa-layer-group' : 'fa-globe';
  }

  function renderListings(listings) {
    var el = $('marketPreviewList');
    if (!el) return;

    if (!listings || !listings.length) {
      renderEmpty();
      return;
    }

    var cfg = getConfig();

    el.innerHTML = listings.map(function (item, index) {
      var badgeClass =
        item.type === 'Domain'
          ? 'market-preview-badge market-preview-badge-domain'
          : 'market-preview-badge';

      return [
        '<article class="market-preview-row ' + (index === 0 ? 'is-featured' : '') + '">',
          '<div class="market-preview-name">',
            '<span class="market-preview-icon">',
              '<i class="fas ' + listingIcon(item.type) + '" aria-hidden="true"></i>',
            '</span>',
            '<div>',
              '<strong>' + esc(item.name) + '</strong>',
              '<small>' + esc(item.sellerName ? item.sellerName : item.seller ? 'Seller ' + shortAddress(item.seller, 10, 6) : item.subtitle) + '</small>',
            '</div>',
          '</div>',
          '<span class="' + badgeClass + '">' + esc(item.type) + '</span>',
          '<strong class="market-preview-price">' + esc(formatCoin(item.price, cfg.denom)) + '</strong>',
        '</article>'
      ].join('');
    }).join('');
  }

  async function loadMarketplacePreview() {
    var el = $('marketPreviewList');
    if (!el) return;

    renderLoading();

    try {
      var listings = await enrichWithNames(await queryMarketplaceListings());
      renderListings(listings);
    } catch (e) {
      console.warn('[marketplace-preview] failed:', e);
      renderError(e && e.message ? e.message : String(e));
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    loadMarketplacePreview();

    var refreshBtn = $('refreshMarketPreviewBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function (e) {
        e.preventDefault();
        loadMarketplacePreview();
      });
    }
  });

  window.loadMarketplacePreview = loadMarketplacePreview;
})();
