'use strict';

window.ArViewInit = window.ArViewInit || {};

window.ArViewInit['contracts'] = function () {
  const grid = document.getElementById('contractsGrid');
  const endpointList = document.getElementById('endpointList');

  if (!grid || !endpointList) return;

  const copyText = async function (value, button, successLabel) {
    if (!value || !button) return;

    const original = button.innerHTML;

    try {
      await navigator.clipboard.writeText(value);
      button.innerHTML = '<i class="fas fa-check"></i> ' + (successLabel || 'Copied');
      setTimeout(function () {
        button.innerHTML = original;
      }, 1400);
    } catch (err) {
      console.error('[Contracts] Copy failed:', err);
      button.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Failed';
      setTimeout(function () {
        button.innerHTML = original;
      }, 1400);
    }
  };

  const esc = function (value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const normalizeKey = function (key) {
    return String(key || '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, function (m) {
        return m.toUpperCase();
      });
  };

  const contractInfo = {
    registry: {
      title: 'Registry',
      kicker: 'Registry',
      description: 'Core name ownership and registry state.'
    },
    registrar: {
      title: 'Registrar',
      kicker: 'Registrar',
      description: 'Domain registration execution contract.'
    },
    tld_manager: {
      title: 'TLD Manager',
      kicker: 'TLD Manager',
      description: 'Top-level namespace minting and policy management.'
    },
    tldManager: {
      title: 'TLD Manager',
      kicker: 'TLD Manager',
      description: 'Top-level namespace minting and policy management.'
    },
    resolver: {
      title: 'Resolver',
      kicker: 'Resolver',
      description: 'Records, wallet resolution, and web content pointers.'
    },
    marketplace: {
      title: 'Marketplace',
      kicker: 'Marketplace',
      description: 'Fixed-price domain listing, purchase, and cancellation.'
    },
    metadata: {
      title: 'Metadata',
      kicker: 'Metadata',
      description: 'Profile and metadata records for domains.'
    },
    dssl: {
      title: 'dSSL',
      kicker: 'dSSL',
      description: 'dSSL certificate style records and validation state.'
    }
  };

  const getGlobalConfig = function () {
    return (
      window.ArConfig ||
      window.AR_CONFIG ||
      window.ATOM_CONFIG ||
      window.ATOM_REGISTRY_CONFIG ||
      window.AppConfig ||
      window.CONFIG ||
      {}
    );
  };

  const getByPath = function (obj, paths) {
    for (const path of paths) {
      const parts = path.split('.');
      let current = obj;

      for (const part of parts) {
        if (!current || typeof current !== 'object' || !(part in current)) {
          current = null;
          break;
        }

        current = current[part];
      }

      if (current != null) return current;
    }

    return null;
  };

  const normalizeContracts = function (raw) {
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw
        .map(function (item, index) {
          if (typeof item === 'string') {
            return {
              key: 'contract_' + (index + 1),
              title: 'Contract ' + (index + 1),
              kicker: 'Contract',
              description: 'Configured smart contract address.',
              address: item
            };
          }

          if (!item || typeof item !== 'object') return null;

          const key = item.key || item.id || item.name || item.title || 'contract_' + (index + 1);
          const info = contractInfo[key] || {};

          return {
            key: key,
            title: item.title || item.label || item.name || info.title || normalizeKey(key),
            kicker: item.kicker || item.type || info.kicker || normalizeKey(key),
            description: item.description || item.desc || info.description || 'Configured smart contract address.',
            address: item.address || item.contract || item.value || item.addr || '',
            explorer: item.explorer || item.mintscan || item.url || '',
            status: item.status || 'Active'
          };
        })
        .filter(Boolean);
    }

    if (typeof raw === 'object') {
      return Object.keys(raw)
        .map(function (key) {
          const value = raw[key];
          const info = contractInfo[key] || {};
          let address = '';
          let explorer = '';
          let title = info.title || normalizeKey(key);
          let kicker = info.kicker || normalizeKey(key);
          let description = info.description || 'Configured smart contract address.';
          let status = 'Active';

          if (typeof value === 'string') {
            address = value;
          } else if (value && typeof value === 'object') {
            address = value.address || value.contract || value.value || value.addr || '';
            explorer = value.explorer || value.mintscan || value.url || '';
            title = value.title || value.label || value.name || title;
            kicker = value.kicker || value.type || kicker;
            description = value.description || value.desc || description;
            status = value.status || status;
          }

          return {
            key: key,
            title: title,
            kicker: kicker,
            description: description,
            address: address,
            explorer: explorer,
            status: status
          };
        })
        .filter(function (item) {
          return item.address;
        });
    }

    return [];
  };

  const normalizeEndpoints = function (raw) {
    if (!raw) return [];

    if (Array.isArray(raw)) {
      return raw
        .map(function (item) {
          if (typeof item === 'string') return item;
          if (item && typeof item === 'object') {
            return item.url || item.endpoint || item.value || item.rest || item.rpc || '';
          }
          return '';
        })
        .filter(Boolean);
    }

    if (typeof raw === 'object') {
      return Object.keys(raw)
        .map(function (key) {
          const value = raw[key];
          if (typeof value === 'string') return value;
          if (value && typeof value === 'object') {
            return value.url || value.endpoint || value.value || value.rest || value.rpc || '';
          }
          return '';
        })
        .filter(Boolean);
    }

    return [];
  };

  const mintscanUrl = function (address) {
    if (!address || !/^cosmos1/i.test(address)) return '';
    return 'https://www.mintscan.io/cosmos/wasm/contract/' + encodeURIComponent(address);
  };

  const renderContracts = function (contracts) {
    if (!contracts.length) {
      grid.innerHTML = '<div class="contracts-empty">No contract addresses were found in the frontend configuration. Check <code>app/core/config.js</code> or define <code>window.ArContractsPage.init()</code>.</div>';
      return;
    }

    grid.innerHTML = contracts.map(function (contract) {
      const address = contract.address || '';
      const explorer = mintscanUrl(address);
      const status = contract.status || 'Active';

      return [
        '<article class="contract-card" data-contract="' + esc(contract.key || '') + '">',
          '<div class="contract-card-top">',
            '<div>',
              '<span class="contract-kicker">' + esc(contract.kicker || 'Contract') + '</span>',
              '<h2>' + esc(contract.title || 'Contract') + '</h2>',
            '</div>',
            '<div class="contract-meta">',
              '<span class="contract-status">' + esc(status) + '</span>',
              explorer
                ? '<a class="contract-explorer" href="' + esc(explorer) + '" target="_blank" rel="noopener noreferrer">Mintscan <i class="fas fa-arrow-up-right-from-square"></i></a>'
                : '',
            '</div>',
          '</div>',
          '<p>' + esc(contract.description || 'Configured smart contract address.') + '</p>',
          '<div class="contract-address">',
            '<span>Contract address</span>',
            '<code title="' + esc(address) + '">' + esc(address) + '</code>',
          '</div>',
          '<div class="contract-actions">',
           '<button class="contract-copy" type="button" data-copy="' + esc(address) + '"><i class="far fa-copy"></i> Copy contract</button>',
          '</div>',
        '</article>'
      ].join('');
    }).join('');
  };

  const renderEndpoints = function (endpoints) {
    if (!endpoints.length) {
      endpointList.innerHTML = '<div class="endpoint-row"><code>No REST endpoints found in config.</code></div>';
      return;
    }

    endpointList.innerHTML = endpoints.map(function (endpoint) {
      return [
        '<div class="endpoint-row">',
          '<code title="' + esc(endpoint) + '">' + esc(endpoint) + '</code>',
          '<button class="endpoint-copy" type="button" data-copy="' + esc(endpoint) + '"><i class="far fa-copy"></i> Copy</button>',
        '</div>'
      ].join('');
    }).join('');
  };

  const bindCopyButtons = function () {
    document.querySelectorAll('.contract-copy[data-copy], .endpoint-copy[data-copy]').forEach(function (button) {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';

      button.addEventListener('click', function () {
        copyText(button.getAttribute('data-copy'), button, 'Copied');
      });
    });
  };

  const enhanceExistingMarkup = function () {
    grid.querySelectorAll('article, .glass-card, .contract').forEach(function (card) {
      card.classList.add('contract-card');
    });

    grid.querySelectorAll('a').forEach(function (link) {
      if (/mintscan/i.test(link.textContent || link.href || '')) {
        link.classList.add('contract-explorer');
        if (!link.querySelector('i')) {
          link.insertAdjacentHTML('beforeend', ' <i class="fas fa-arrow-up-right-from-square"></i>');
        }
      }
    });

    grid.querySelectorAll('button').forEach(function (button) {
      button.classList.add('contract-copy');
      if (!button.querySelector('i')) {
        button.insertAdjacentHTML('afterbegin', '<i class="far fa-copy"></i> ');
      }
    });

    endpointList.querySelectorAll('button').forEach(function (button) {
      button.classList.add('endpoint-copy');
      if (!button.querySelector('i')) {
        button.insertAdjacentHTML('afterbegin', '<i class="far fa-copy"></i> ');
      }
    });
  };

  const config = getGlobalConfig();

  const rawContracts = getByPath(config, [
    'contracts',
    'CONTRACTS',
    'addresses.contracts',
    'deployments.contracts',
    'cosmos.contracts',
    'atomRegistry.contracts'
  ]);

  const rawEndpoints = getByPath(config, [
    'restEndpoints',
    'REST_ENDPOINTS',
    'endpoints',
    'ENDPOINTS',
    'rest',
    'api.rest',
    'cosmos.restEndpoints',
    'cosmos.endpoints'
  ]);

  const contracts = normalizeContracts(rawContracts);
  const endpoints = normalizeEndpoints(rawEndpoints);

  if (contracts.length || endpoints.length) {
    renderContracts(contracts);
    renderEndpoints(endpoints);
    bindCopyButtons();
    return;
  }

  if (window.ArContractsPage && typeof window.ArContractsPage.init === 'function') {
    window.ArContractsPage.init();
    enhanceExistingMarkup();
    bindCopyButtons();
    return;
  }

  renderContracts([]);
  renderEndpoints([]);
  bindCopyButtons();
};
