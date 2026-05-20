'use strict';

(function () {
  var CHECK_INTERVAL = 30000;
  var CHECK_ENDPOINT = 'https://cosmos-rest.publicnode.com/cosmos/base/tendermint/v1beta1/node_info';
  var checkTimer = null;
  var lastStatus = null;

  window.AR_NETWORK = { online: null };

  function updateDot(online) {
    if (online === lastStatus) return;
    lastStatus = online;
    window.AR_NETWORK.online = online;

    var dot = document.getElementById('netStatusDot');
    var label = document.getElementById('netStatusLabel');
    var wrap = document.getElementById('netStatus');
    if (!dot) return;

    dot.className = 'ar-net-dot ' + (online === true ? 'ar-net-online' : online === false ? 'ar-net-offline' : 'ar-net-checking');
    if (label) label.textContent = online === true ? 'Online' : online === false ? 'Offline' : '';
    if (wrap) wrap.title = online === true ? 'Cosmos Hub REST: online' : online === false ? 'Cosmos Hub REST: unreachable' : 'Checking Cosmos Hub…';
  }

  async function checkNetwork() {
    try {
      var ctrl = new AbortController();
      var timeout = setTimeout(function () { ctrl.abort(); }, 5000);
      var r = await fetch(CHECK_ENDPOINT, { signal: ctrl.signal });
      clearTimeout(timeout);
      updateDot(r.ok);
    } catch (e) {
      updateDot(false);
    }
  }

  function startPolling() {
    checkNetwork();
    clearInterval(checkTimer);
    checkTimer = setInterval(checkNetwork, CHECK_INTERVAL);
  }

  document.addEventListener('ar:network', function (e) {
    if (e.detail && typeof e.detail.online === 'boolean') updateDot(e.detail.online);
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startPolling);
  } else {
    startPolling();
  }
})();
