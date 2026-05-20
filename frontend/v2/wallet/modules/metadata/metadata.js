'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['metadata'] = function () {
  if (typeof window.initMetadataFunctionPage === 'function') {
    window.initMetadataFunctionPage();
  }
};
