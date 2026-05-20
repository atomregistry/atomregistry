'use strict';

window.NameResolver = (function () {
  var _cache = {};
  var _subscribers = [];

  function _registryAddr() {
    var cfg = window.CFG || window.AR_CONFIG || window.APP_CONFIG || {};
    return cfg.REGISTRY || cfg.REGISTRY_CONTRACT || '';
  }

  function _restEndpoints() {
    var cfg = window.CFG || window.AR_CONFIG || window.APP_CONFIG || {};
    return cfg.REST || [
      'https://cosmos-rest.publicnode.com',
      'https://rest.cosmos.directory/cosmoshub',
      'https://cosmoshub-api.lavenderfive.com',
      'https://cosmos-api.polkachu.com'
    ];
  }

  async function _fetchPrimary(address) {
    var registry = _registryAddr();
    if (!registry) return null;

    var query = btoa(JSON.stringify({ primary_of: { owner: address } }));
    var endpoints = _restEndpoints();

    for (var i = 0; i < endpoints.length; i++) {
      try {
        var res = await fetch(
          endpoints[i] + '/cosmwasm/wasm/v1/contract/' + registry + '/smart/' + query
        );
        if (!res.ok) continue;
        var json = await res.json();
        var data = json && json.data ? json.data : json;
        return (data && data.name) || null;
      } catch (_) {}
    }

    return null;
  }

  async function resolveAddress(address) {
    if (!address) return null;

    if (_cache[address] !== undefined) {
      return _cache[address] instanceof Promise ? _cache[address] : _cache[address];
    }

    var promise = _fetchPrimary(address).then(function (name) {
      _cache[address] = name;
      return name;
    }).catch(function () {
      _cache[address] = null;
      return null;
    });

    _cache[address] = promise;
    return promise;
  }

  async function formatAddress(address, head, tail) {
    if (!address) return '-';
    var name = await resolveAddress(address);
    if (name) return name;
    head = head || 10; tail = tail || 6;
    if (address.length <= head + tail + 3) return address;
    return address.slice(0, head) + '...' + address.slice(-tail);
  }

  async function refreshAddressDisplays() {
    var els = document.querySelectorAll('[data-resolve-address]');
    var work = [];

    for (var i = 0; i < els.length; i++) {
      (function (el) {
        var addr = el.getAttribute('data-resolve-address');
        if (!addr) return;
        work.push(
          formatAddress(addr).then(function (label) {
            el.textContent = label;
          })
        );
      })(els[i]);
    }

    await Promise.all(work);
  }

  async function _onWalletConnected(address) {
    if (!address) return;

    var name = await resolveAddress(address);
    if (!name) return;

    var barAddr = document.getElementById('walletAddrShort');
    if (barAddr && barAddr.textContent && barAddr.textContent.includes('...')) {
      barAddr.textContent = name;
    }

    var topLabel = document.getElementById('topConnectWalletLabel');
    if (topLabel) {
      var current = topLabel.textContent || '';
      if (current.includes('...') || current.toLowerCase().startsWith('cosmos')) {
        topLabel.textContent = name;
      }
    }

    for (var i = 0; i < _subscribers.length; i++) {
      try { _subscribers[i](address, name); } catch (_) {}
    }

    refreshAddressDisplays();
  }

  function onNameResolved(fn) {
    _subscribers.push(fn);
  }

  function clearCache() {
    _cache = {};
  }

  document.addEventListener('wallet:connected', function (e) {
    var address = e && e.detail && e.detail.address;
    if (address) _onWalletConnected(address);
  });

  document.addEventListener('DOMContentLoaded', function () {
    refreshAddressDisplays();
  });

  return {
    resolveAddress:         resolveAddress,
    formatAddress:          formatAddress,
    refreshAddressDisplays: refreshAddressDisplays,
    onNameResolved:         onNameResolved,
    clearCache:             clearCache
  };
})();

window.resolveAddress = window.NameResolver.resolveAddress;
window.formatAddress  = window.NameResolver.formatAddress;
