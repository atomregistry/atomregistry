'use strict';

window.ArSEO = (function () {
  var BASE = 'https://atomregistry.com';
  var IMG  = BASE + '/assets/atom-registry-globe.png';

  var META = {
    '': {
      title: 'Atom Registry | Web3 Domains on Cosmos Hub',
      description: 'Register Web3 domains and TLD namespaces on Cosmos Hub with wallet-native ownership. Pay once, own permanently - no renewals.',
      ogTitle: 'Atom Registry | Web3 Domains on Cosmos Hub',
      ogDescription: 'Register Web3 domains and TLD namespaces on Cosmos Hub. Permanent ownership, no renewal fees, fully on-chain.',
      canonical: BASE + '/'
    },
    'search': {
      title: 'Search Web3 Domains | Atom Registry',
      description: 'Resolve Web3 domains, TLD namespaces, DNS records and on-chain websites on Cosmos Hub. Universal resolver for .atom, .cosmos and more.',
      ogTitle: 'Search & Resolve Web3 Domains - Atom Registry',
      ogDescription: 'Universal resolver for Web3 domains, DNS records and on-chain sites. Search .atom, .cosmos and all custom TLDs on Cosmos Hub.',
      canonical: BASE + '/search'
    },
    'marketplace': {
      title: 'Marketplace | Buy & Sell Web3 Domains | Atom Registry',
      description: 'Browse fixed-price Web3 domain listings on Cosmos Hub. Buy domains directly on-chain or list your own names - no middlemen, instant settlement.',
      ogTitle: 'Web3 Domain Marketplace on Cosmos Hub | Atom Registry',
      ogDescription: 'Buy and sell Web3 domains on Cosmos Hub. Fixed-price listings, direct on-chain settlement, wallet-controlled.',
      canonical: BASE + '/marketplace'
    },
    'extension': {
      title: 'Browser Extension | Resolve Web3 Domains | Atom Registry',
      description: 'Browse Web3 domains natively in Chrome, Edge, Brave and Opera. Free Atom Registry extension - no tracking, Manifest V3, no private keys.',
      ogTitle: 'Atom Registry Browser Extension - Web3 DNS for Chrome & Edge',
      ogDescription: 'Resolve Web3 domains directly from your address bar. Free, no tracking, Manifest V3. Install for Chrome, Edge, Brave and Opera.',
      canonical: BASE + '/extension'
    },
    'tlds': {
      title: 'TLD Namespaces | Own Your Root Domain | Atom Registry',
      description: 'Register your own TLD namespace like .dao, .brand or .community on Cosmos Hub. Pay once, control registration rules, own it forever.',
      ogTitle: 'Own a Top-Level Domain on Cosmos Hub | Atom Registry',
      ogDescription: 'Create a TLD namespace like .dao, .brand or .community on Cosmos Hub. Pay once, set your own registration rules, earn from sub-names.',
      canonical: BASE + '/tlds'
    },
    'docs': {
      title: 'Documentation | Atom Registry',
      description: 'Complete guide to Atom Registry - register Web3 domains, manage TLD namespaces, deploy on-chain websites, and integrate with the registry API.',
      ogTitle: 'Atom Registry Docs - Complete Developer & User Guide',
      ogDescription: 'Register domains, manage TLDs, deploy on-chain sites, install the browser extension and build integrations - all in one guide.',
      canonical: BASE + '/docs'
    },
    'roadmap': {
      title: 'Roadmap | Atom Registry',
      description: 'From mainnet foundation to IBC expansion and Cosmos Hub governance handover. Five release phases, 30+ tracked features - see what shipped, what is being built now, and what comes next.',
      ogTitle: 'Atom Registry Roadmap - From Foundation to Interchain',
      ogDescription: 'Five-phase release plan for Atom Registry: v1 Foundation (shipped), v2 Pay & Identity (active), v3 IBC Expansion with handover to Cosmos Hub governance, v4 Privacy research and v5 Ecosystem expansion.',
      canonical: BASE + '/roadmap'
    },
    'pay': {
      title: 'Atom Registry Pay | Scan. Resolve. Pay.',
      description: 'Send crypto to Web3 names, not wallet addresses. Pay alice.atom directly - every payment is resolved on-chain before your wallet signs anything.',
      ogTitle: 'Atom Registry Pay - Send Crypto to Names on Cosmos Hub',
      ogDescription: 'Send ATOM to alice.atom instead of cosmos1... strings. Recipient is resolved on-chain through Atom Registry; your wallet always shows the final address before signing.',
      canonical: BASE + '/pay'
    },
    'contracts': {
      title: 'Smart Contracts | Atom Registry',
      description: 'Atom Registry smart contracts deployed on Cosmos Hub - registry, marketplace, and resolver addresses with live on-chain state.',
      ogTitle: 'Atom Registry Smart Contracts on Cosmos Hub',
      ogDescription: 'View and interact with registry, marketplace and resolver smart contracts deployed on Cosmos Hub.',
      canonical: BASE + '/contracts'
    },
    'terms': {
      title: 'Terms of Service | Atom Registry',
      description: 'Terms of Service for Atom Registry - the Web3 domain registry on Cosmos Hub.',
      ogTitle: 'Terms of Service | Atom Registry',
      ogDescription: 'Read the Terms of Service for Atom Registry.',
      canonical: BASE + '/terms'
    },
    'privacy': {
      title: 'Privacy Policy | Atom Registry',
      description: 'Privacy Policy for Atom Registry - how we collect, use and protect your data on this Web3 domain platform.',
      ogTitle: 'Privacy Policy | Atom Registry',
      ogDescription: 'Privacy Policy for Atom Registry.',
      canonical: BASE + '/privacy'
    },
    'disclaimer': {
      title: 'Disclaimer | Atom Registry',
      description: 'Legal disclaimer for Atom Registry services on Cosmos Hub.',
      ogTitle: 'Disclaimer | Atom Registry',
      ogDescription: 'Legal disclaimer for Atom Registry.',
      canonical: BASE + '/disclaimer'
    }
  };

  function _setMeta(name, content) {
    var el = document.querySelector('meta[name="' + name + '"]');
    if (el) el.setAttribute('content', content);
  }

  function _setProp(prop, content) {
    var el = document.querySelector('meta[property="' + prop + '"]');
    if (el) el.setAttribute('content', content);
  }

  function _setCanonical(url) {
    var el = document.querySelector('link[rel="canonical"]');
    if (el) el.setAttribute('href', url);
  }

  function update(routeKey) {
    var m = META[routeKey] || META[''];
    document.title = m.title;
    _setMeta('description', m.description);
    _setProp('og:title', m.ogTitle);
    _setProp('og:description', m.ogDescription);
    _setProp('og:url', m.canonical);
    _setProp('og:image', IMG);
    _setMeta('twitter:title', m.ogTitle);
    _setMeta('twitter:description', m.ogDescription);
    _setMeta('twitter:image', IMG);
    _setCanonical(m.canonical);
  }

  return { update: update };
})();
