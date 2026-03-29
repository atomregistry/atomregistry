# Atom Registry — CosmWasm Contracts

Seven CosmWasm smart contracts implementing the Atom Registry namespace system on Cosmos Hub.

## Contracts

| Contract | Description |
|---|---|
| `registry` | Source of truth for all domain and TLD ownership |
| `registrar` | Commit-reveal name registration with anti-frontrunning |
| `tld-manager` | TLD registration and management |
| `resolver` | DNS records, cross-chain addresses, IPFS hashes, federation handles |
| `marketplace` | Fixed-price listings, offers, and auctions with royalty support |
| `metadata` | On-chain key/value metadata fields keyed by domain |
| `dssl-manager` | Decentralized trust, attestations, and site reputation |

## Build

```bash
cargo fmt --all
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
cargo build --release --target wasm32-unknown-unknown
```

## Optimize (Docker required)

```bash
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/optimizer:0.15.0
```

## Deployment Order

1. `registry` — deploy first, all others reference it
2. `resolver`, `metadata`, `dssl-manager` — independent, reference registry
3. `marketplace` — references registry and resolver
4. `registrar` — references registry and tld-manager
5. `tld-manager` — references registry
6. Configure operator addresses on registry
