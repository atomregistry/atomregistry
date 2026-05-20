'use strict';

(function () {
  var REST = [
    'https://cosmos-rest.publicnode.com',
    'https://rest.cosmos.directory/cosmoshub',
    'https://cosmoshub.rest.interchain.ivansmirnov.me',
    'https://cosmos-api.polkachu.com'
  ];
  var REGISTRY = typeof CFG !== 'undefined' ? CFG.REGISTRY : 'cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe';

  function $(id) { return document.getElementById(id); }

  function show(id) { var el = $(id); if (el) el.classList.remove('hidden'); }
  function hide(id) { var el = $(id); if (el) el.classList.add('hidden'); }

  async function queryRest(path) {
    for (var i = 0; i < REST.length; i++) {
      try {
        var r = await fetch(REST[i] + path);
        if (!r.ok) continue;
        return await r.json();
      } catch (e) {}
    }
    throw new Error('All endpoints failed');
  }

  async function queryContract(contract, msg) {
    var enc = btoa(JSON.stringify(msg));
    var d = await queryRest('/cosmwasm/wasm/v1/contract/' + contract + '/smart/' + enc);
    return d.data;
  }

  function isValidCosmosAddress(addr) {
    return /^cosmos1[a-z0-9]{38,}$/.test(String(addr || '').trim());
  }

  async function loadProfile(address) {
    address = String(address || '').trim();
    if (!isValidCosmosAddress(address)) {
      show('profileSearch');
      hide('profileContent');
      hide('profileLoading');
      var input = $('profileAddressInput');
      if (input) { input.value = address; input.focus(); }
      return;
    }

    hide('profileSearch');
    hide('profileContent');
    hide('profileError');
    show('profileLoading');

    try {
      var addrEl = $('profileAddress');
      if (addrEl) addrEl.textContent = address;

      var mscan = $('profileMintscan');
      if (mscan) mscan.href = 'https://www.mintscan.io/cosmos/address/' + address;

      var copyBtn = $('profileCopyBtn');
      if (copyBtn) {
        copyBtn.onclick = function () {
          if (navigator.clipboard) navigator.clipboard.writeText(address);
        };
      }
      var shareBtn = $('profileShareBtn');
      if (shareBtn) {
        shareBtn.onclick = function () {
          var url = location.origin + location.pathname + '?address=' + encodeURIComponent(address);
          if (navigator.clipboard) navigator.clipboard.writeText(url);
        };
      }

      document.title = address.slice(0, 14) + '… | Atom Registry Profile';

      hide('profileLoading');
      show('profileContent');
      show('profileDomainLoading');

      var data = await queryContract(REGISTRY, { names_by_owner: { owner: address, limit: 50 } });
      hide('profileDomainLoading');

      var list = $('profileDomainList');
      if (!list) return;

      var names = (data && (data.names || data.list || data.items || data)) || [];
      if (!Array.isArray(names)) names = [];

      if (!names.length) {
        list.innerHTML = '<p class="text-gray-500 text-sm">No domains registered by this address.</p>';
        return;
      }

      var payBase = (window.ArPay && typeof window.ArPay.buildLink === 'function')
        ? function(n){ return window.ArPay.buildLink(n); }
        : function(n){ return '/pay?to=' + encodeURIComponent(n); };

      list.innerHTML = names.map(function (n) {
        var name = typeof n === 'string' ? n : (n.name || n.full_name || JSON.stringify(n));
        var searchUrl = '/search?q=' + encodeURIComponent(name);
        var payHref = payBase(name);
        return '<div class="profile-name-row" data-name="' + name + '">' +
            '<span class="profile-name-label mono">' + name + '</span>' +
            '<div class="profile-name-actions">' +
              '<a class="profile-name-btn" href="' + searchUrl + '"><i class="fas fa-magnifying-glass"></i> Lookup</a>' +
              '<a class="profile-name-btn is-pay" href="' + payHref + '"><i class="fas fa-paper-plane"></i> Send ATOM</a>' +
              '<button class="profile-name-btn" type="button" data-pay-qr="' + name + '"><i class="fas fa-qrcode"></i> Show QR</button>' +
            '</div>' +
            '<div class="profile-name-qr" hidden><canvas aria-label="Pay QR for ' + name + '"></canvas></div>' +
          '</div>';
      }).join('');

      list.querySelectorAll('[data-pay-qr]').forEach(function(btn){
        btn.addEventListener('click', function(){
          var row = btn.closest('.profile-name-row');
          var name = btn.getAttribute('data-pay-qr');
          var frame = row && row.querySelector('.profile-name-qr');
          var canvas = frame && frame.querySelector('canvas');
          if (!frame || !canvas || !window.ArPay) return;
          if (!frame.hidden) { frame.hidden = true; btn.innerHTML = '<i class="fas fa-qrcode"></i> Show QR'; return; }
          frame.hidden = false;
          btn.innerHTML = '<i class="fas fa-eye-slash"></i> Hide QR';
          window.ArPay.renderQR(window.ArPay.absoluteLink(name), canvas, { size: 200 })
            .catch(function(err){ frame.hidden = true; btn.innerHTML = '<i class="fas fa-qrcode"></i> Show QR'; console.error('[Profile] QR render failed', err); });
        });
      });

    } catch (e) {
      hide('profileLoading');
      hide('profileDomainLoading');
      var errMsg = $('profileErrorMsg');
      if (errMsg) errMsg.textContent = 'Failed to load profile: ' + (e.message || 'network error');
      show('profileError');
      show('profileSearch');
      hide('profileContent');
    }
  }

  function init() {
    var params = new URLSearchParams(location.search);
    var address = params.get('address') || params.get('addr') || '';

    if (address) {
      loadProfile(address);
    } else {
      show('profileSearch');
    }

    var btn = $('profileSearchBtn');
    var input = $('profileAddressInput');
    if (btn) btn.addEventListener('click', function () {
      loadProfile(input ? input.value : '');
    });
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') loadProfile(input.value);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
