# Atom Registry

**Proposal to be the official Web3 multi-TLD domain naming layer for Cosmos Hub.**

Eight CosmWasm smart contracts deployed and operational on `cosmoshub-4` mainnet. A complete browser-based platform. No external JavaScript dependencies. No build step. No npm.

> This repository is published as part of the [Cosmos Hub governance proposal](https://forum.cosmos.network/t/draft-atom-registry-official-web3-universal-namespace-platform-for-cosmos-hub/16807) to recognize Atom Registry as the official namespace platform for Cosmos Hub.

---

## Live Platform

**[atomregistry.com](https://atomregistry.com)**

---

## What This Is

Atom Registry is a fully on-chain Web3 domain naming system. Anyone can register a top-level domain (`.atom`, `.cosmos`, `.anything`) on Cosmos Hub permanently. TLD owners earn 100% of registration fees under their namespace. Domains resolve to wallet addresses, DNS records, on-chain websites, cross-chain addresses, and social handles.

---

## Contract Addresses (cosmoshub-4 mainnet)

| Contract | Address | Status |
|---|---|---|
| Registry | `cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe` | Production |
| Registrar | `cosmos1w4rknyllzt7mu6tsl6m7qm0sss66stwemvc4p4utdsyrjdf9q44ss0697x` | Production |
| TLD Manager | `cosmos12sseygvx4ykhp0df70ndg82l7p9a7ld7l0n0pptwj7c2h726cc9sahh4hz` | Production |
| Resolver | `cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv` | Production |
| Marketplace | `cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc` | Beta |
| Metadata | `cosmos1cu35kuzrvlprssa3j5p0ypwy9v6j4s6ugc5sm7gz6klj4pxmjeksvxcea0` | Beta |
| dSSL Manager | `cosmos1pmuxqc3ehdjkm8wzpqz5saxztwn97a84ga27uktt6huckxw3j8lszgjnpp` | Beta |
| Site Registry | `cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt` | Beta |

---

## Repository Structure

```
atom-registry/
├── contracts/          # CosmWasm smart contracts (Rust)
│   ├── contracts/
│   │   ├── registry/       # Source of truth for all domain ownership
│   │   ├── registrar/      # Commit-reveal name registration
│   │   ├── tld-manager/    # TLD registration and management
│   │   ├── resolver/       # DNS records, cross-chain addresses, IPFS
│   │   ├── marketplace/    # Fixed-price listings and auctions
│   │   ├── metadata/       # On-chain profiles and key/value fields
│   │   └── dssl-manager/   # Decentralized trust and attestation layer
│   └── packages/
│       ├── atom-names-types/    # Shared message types
│       ├── atom-names-utils/    # Shared utilities
│       └── atom-names-testkit/  # Test helpers
├── frontend/           # Browser platform (plain HTML, no build step)
│   ├── index.html          # Main registration interface
│   ├── onchain.html        # On-chain site builder and deployer
│   ├── profiles.html       # Profile builder
│   ├── contracts.html      # Contract launcher (compile + deploy)
│   ├── dssl.html           # dSSL manager
│   ├── metadata.html       # Metadata manager
│   ├── marketplace.html    # Marketplace interface
│   ├── proposal.html       # Governance proposal (deploys to proposal.atom)
│   └── docs.html           # Documentation
├── sales/              # ATOM Sales Widget (self-hostable payment system)
│   ├── index.html          # Visual widget builder
│   ├── widget.js           # Embeddable widget
│   ├── widget.html         # Iframe-ready widget
│   └── api/
│       ├── verify-sale.php      # On-chain TX verification
│       ├── helpers.php
│       └── config.example.php   # Copy to config.php, add your settings
└── docs/               # Additional documentation
```

---

## Contracts

### Prerequisites

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add wasm target
rustup target add wasm32-unknown-unknown

# Install cargo-generate (optional)
cargo install cargo-generate
```

### Build

```bash
cd contracts

# Check and test
cargo fmt --all
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace

# Build optimized WASM (requires Docker)
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.15.0
```

### Deployment Order

1. Deploy `registry`
2. Deploy `resolver`, `metadata`, `dssl-manager`
3. Deploy `marketplace`
4. Deploy `registrar`
5. Deploy `tld-manager`
6. Configure registry operator addresses
7. Run end-to-end smoke tests on testnet

---

## Frontend

No build step. No npm. No dependencies.

The frontend is plain HTML files with inline JavaScript. Copy to any web server and they work. Each page connects to Cosmos Hub LCD endpoints directly via standard REST queries.

### Wallet Support

All pages support: **Keplr · Leap · Cosmostation · Ledger**

Session persistence is handled via `sessionStorage` — connect once and stay connected across page navigations. Disconnect explicitly via the Disconnect button.

### Running Locally

```bash
# Any static file server works
cd frontend
python3 -m http.server 8080
# Open http://localhost:8080
```

---

## Sales Widget

The ATOM Sales Widget is a free, self-hostable payment system for accepting ATOM on any website.

**Live demo:** [atomregistry.com/sales/](https://atomregistry.com/sales/)

### Setup

```bash
# Copy to your web server's /sales/ directory
# Then configure the backend:
cp sales/api/config.example.php sales/api/config.php
# Edit config.php with your webhook URL and secret
# Ensure sales/storage/ is writable by PHP
```

See `sales/README.md` for full documentation.

---

## Architecture

All signing is done natively without CosmJS or CosmosKit. The frontend uses a hand-rolled protobuf encoder (`ProtoWriter`) that builds `MsgExecuteContract`, `MsgStoreCode`, and `MsgInstantiateContract` messages directly. Transactions are signed via `signDirect` through the connected wallet extension and broadcast to public LCD endpoints with automatic failover.

This means:
- **No external JavaScript dependencies**
- **No build process**
- **No npm or node_modules**
- **Fully auditable** — the complete signing logic is readable inline

---

## Governance

This codebase is published as part of the Cosmos Hub governance process. If the signaling proposal passes, the contracts will be migrated to a 2-of-3 multisig governance structure with community-elected keyholders.

**Proposal:** [forum.cosmos.network](https://forum.cosmos.network/t/draft-atom-registry-official-web3-universal-namespace-platform-for-cosmos-hub/16807)

---

## Security

Contracts were developed using rigorous internal methodology — invariant-driven design, authorization validation on every entrypoint, overflow-checked arithmetic, reentrancy-safe state management, and adversarial path simulation throughout.

No formal third-party audit has been performed. If the community requires a formal audit as a condition of governance acceptance, it will be conducted at the community's expense.

**Found a vulnerability?** Please report responsibly via X DM to [@atomregistry](https://x.com/atomregistry).

---

## Contributing

This repository is open for community review, issues, and pull requests. All contributions welcome.

1. Fork the repo
2. Create a feature branch
3. Submit a PR with a clear description of changes

---

## License

MIT — see [LICENSE](LICENSE)

---

*Built on Cosmos Hub. Forever ownership. No renewals.*
