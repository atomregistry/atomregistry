# Atom Registry — Frontend

Plain HTML platform. No build step. No npm. No dependencies.

## Pages

| File | Description |
|---|---|
| `index.html` | Main interface — register names and TLDs |
| `onchain.html` | On-chain site builder and deployer |
| `profiles.html` | On-chain profile builder |
| `contracts.html` | Smart contract launcher (compile via GitHub Actions + deploy) |
| `dssl.html` | dSSL trust record manager |
| `metadata.html` | Domain metadata manager |
| `marketplace.html` | Name marketplace |
| `proposal.html` | Governance proposal (deploys to proposal.atom on-chain) |
| `docs.html` | Full platform documentation |

## Wallet Support

All pages support Keplr, Leap, Cosmostation, and Ledger hardware wallet.
Session persists across page navigations via `sessionStorage`.

## Running Locally

```bash
python3 -m http.server 8080
```

## Architecture

No CosmJS. No CosmosKit. No external JS dependencies. Transactions are built
using a hand-rolled protobuf encoder and signed via `signDirect` through
the connected wallet extension.
