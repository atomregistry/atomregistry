Atom Registry v2

Vanilla-JS SPA for a Cosmos name/domain registry, backed by CosmWasm smart
contracts (Rust) and a DID - compliant component.

Directory tree

```
atomregistry/
├── index.html                  # SPA entry point
├── server.py                   # Local development server
├── sw.js                       # Service Worker (PWA / cache)
├── sitemap.xml                 # Site map (SEO)
├── robots.txt                  # Crawler rules
├── .htaccess                   # Apache server configuration
│
├── assets/                     # Static assets (graphics, icons)
│   ├── favicon.png
│   ├── cosmos-hero.svg / cosmos-hero1.svg
│   └── atom-registry-globe.png
│
├── app/                        # Frontend application logic
│   ├── layout/                 # UI skeleton (layout HTML/CSS/JS)
│   │   ├── layout.html
│   │   ├── layout.css
│   │   ├── layout.js
│   │   └── tw-compat.css
│   ├── core/                   # Application core
│   │   ├── router.js           # SPA routing
│   │   ├── view-loader.js      # View loading
│   │   ├── state.js            # Application state
│   │   ├── config.js           # Configuration
│   │   ├── utils.js            # Helper functions
│   │   ├── registry.js         # Name registry logic
│   │   ├── names.js            # Name handling
│   │   ├── pricing-tiers.js    # Pricing tiers
│   │   ├── tld-mint.js / tld-settings.js
│   │   ├── dssl-function.js    # DSSL function
│   │   ├── metadata-function.js
│   │   ├── function-pages.js
│   │   ├── contracts-page.js
│   │   ├── marketplace-preview.js
│   │   ├── network-status.js
│   │   ├── portfolio.js
│   │   ├── pay.js
│   │   ├── success.js
│   │   ├── seo.js
│   │   ├── languages.js
│   │   ├── qr-lib.js
│   │   └── docs-search-index.js
│   └── wallet/                 # Wallet integration
│       ├── wallet-core.js
│       ├── wallet-ui.js
│       ├── wallet-menu.js
│       ├── wallet-adapters.js
│       ├── name-resolver.js
│       ├── tx.js               # Transaction handling
│       └── adapters/           # Adapters for specific wallets
│           ├── keplr-wallet.js
│           ├── cosmostation-wallet.js
│           ├── ledger-wallet.js
│           └── keystone-wallet.js
│
├── pages/                      # Views/subpages (HTML + CSS + JS)
│   ├── index/                  # Home page
│   ├── search/                 # Name search
│   ├── marketplace/            # Marketplace
│   ├── tlds/                   # TLD domains (+ tld-calculator.js, tld-settings.js)
│   ├── contracts/              # Contracts
│   ├── docs/                   # Documentation
│   ├── docmaker/               # Document generator
│   ├── pay/                    # Payments
│   ├── qr/                     # QR codes
│   ├── extension/              # Browser extension
│   ├── roadmap/                # Roadmap
│   ├── not-found/              # 404 page
│   └── legal/                  # Legal pages
│       ├── terms/              # Terms of service
│       ├── privacy/            # Privacy policy
│       └── disclaimer/         # Legal disclaimer
│
├── wallet/                     # Wallet feature modules
│   └── modules/
│       ├── my-names/           # My names
│       ├── portfolio/          # Portfolio
│       ├── profiles/           # Profiles (+ profile-page.js)
│       ├── metadata/           # Metadata
│       ├── mint-tld/           # TLD minting
│       └── dssl/               # DSSL
│
├── seo/                        # Static SEO pages (each: index.html)
│   ├── search/   marketplace/  tlds/      contracts/
│   ├── docs/     extension/    roadmap/
│   └── terms/    privacy/
│
├── contracts/                  # CosmWasm smart contracts (Rust)
│   ├── Cargo.toml              # Rust workspace
│   ├── README.md
│   ├── index.html / rust-audit.html
│   ├── contracts/              # Individual contracts
│   │   ├── registry/           # Registry (lib, state, contract, error)
│   │   ├── registrar/          # Registrar
│   │   ├── resolver/           # Resolver
│   │   ├── metadata/           # Metadata
│   │   ├── marketplace/        # Marketplace
│   │   ├── tld-manager/        # TLD management
│   │   └── dssl-manager/       # DSSL management
│   └── packages/               # Shared Rust packages
│       ├── atom-names-types/   # Types
│       ├── atom-names-utils/   # Utilities
│       └── atom-names-testkit/ # Test kit
│
└── did-compliant/              # DID-standard-compliant component
    ├── README.md
    ├── index.html
    ├── contract/               # DID CosmWasm contract (Rust)
    │   ├── Cargo.toml
    │   └── src/                # lib, contract, msg, state, error, helpers
    ├── resolver-driver/        # DID resolver driver (Node.js)
    │   ├── package.json
    │   ├── ecosystem.config.cjs
    │   ├── did.atomregistry.com.nginx.conf
    │   ├── src/                # server, document, did-cosmos, lcd, config, base58
    │   └── test/               # parse.test.mjs
    ├── universal-resolver/     # Universal Resolver configuration
    └── examples/               # Sample JSON documents
```

Main project parts

| Part         | Technology         | Description                                  |
| ------------ | ------------------ | -------------------------------------------- |
| **Frontend** | Vanilla JS (SPA)   | `index.html`, `app/`, `pages/`, `wallet/`    |
| **SEO**      | Static HTML        | `seo/` - search - engine - indexable pages   |
| **Contracts**| Rust / CosmWasm    | `contracts/` - 7 contracts + 3 packages      |
| **DID**      | Rust + Node.js     | `did-compliant/` - DID standard compliance   |
| **PWA**      | Service Worker     | `sw.js` - caching and offline mode           |
