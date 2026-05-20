'use strict';

var AtomFunctionPages = (function(){
  var loaded = {};

  function clearSibling(pageId) {
    ['metadata', 'dssl'].forEach(function(id){
      if (id === pageId) return;
      var node = document.getElementById(id + 'Page');
      if (node) node.innerHTML = '';
      loaded[id] = false;
    });
  }

  async function loadPartial(pageId, viewPath, initName) {
    clearSibling(pageId);
    var target = document.getElementById(pageId + 'Page');
    if (!target) return;

    if (!loaded[pageId]) {
      target.innerHTML = '<div class="glass-panel rounded-2xl p-6 text-gray-400 text-sm">Loading ' + pageId + '...</div>';
      var response = await fetch(viewPath, { cache: 'no-store' });
      if (!response.ok) throw new Error('Cannot load ' + viewPath + ' (' + response.status + ')');
      target.innerHTML = await response.text();
      loaded[pageId] = true;
    }

    if (typeof window[initName] === 'function') {
      await window[initName]();
    }
  }

  return {
    loadMetadata: function(){ return loadPartial('metadata', './views/metadata.html', 'initMetadataFunctionPage'); },
    loadDssl: function(){ return loadPartial('dssl', './views/dssl.html', 'initDsslFunctionPage'); }
  };
})();
