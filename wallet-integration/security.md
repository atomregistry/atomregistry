# Security model

Atom Registry is a **client-side dApp** that talks to public CosmWasm contracts on Cosmos Hub. The user's wallet holds all key material. There is no Atom Registry backend that can sign on the user's behalf.

## Trust boundary (what an attacker needs)

|            To do this          |                                       The attacker needs                                       |
|--------------------------------|------------------------------------------------------------------------------------------------|
| Transfer a name they don't own | The owner's wallet private key.                                                                |
| Re-route resolution for a name | The owner's wallet private key.                                                                |
| Drain marketplace listings     | The lister's wallet private key.                                                               |
| Mint a name they don't own     | A live exploit in the public registry / registrar CosmWasm contract.                           |
| Phish a user mid-flow          | A way to trick the user into approving a `MsgExecuteContract` they wouldn't otherwise approve. |

Compromising the Atom Registry web frontend does **not** give the attacker the ability to move user funds. It gives them the ability to **show** misleading content - the wallet still asks for an explicit signature on the real message before anything moves on-chain.

## What the user sees before signing

Every transaction the wallet asks the user to sign shows:

- The destination **contract address** (which the user can compare against the [contracts page](https://atomregistry.com/contracts)).
- The full **message JSON** (e.g. `{ "register": { "name": "alice.atom" } }`).
- The **funds attached** (denom + amount).
- The **fee** and **gas limit**.

We ship a Mintscan deep-link to the contract next to each signing prompt so users can verify the address in a second tab without leaving the wallet popup.

## What the app commits to

- **No server-side key storage.** There is no Atom Registry backend with custodial signing.
- **No analytics / no tracking.** The frontend ships zero third-party tracking pixels.
- **No "approve-once" permits.** Every action is a one-shot signed tx. There is no `setApprovalForAll`-style indefinite delegation.
- **Public LCD only.** Reads go to community endpoints (`rest.cosmos.directory`, `publicnode`, `polkachu`). No private proxy.
- **Open routes.** The site is a static SPA - all logic, including which contract is called for which action, is in the browser.

## Hardening on the deployment side

- HTTPS forced + HSTS-ready.
- Sensitive paths (`.env`, dotfiles, lockfiles, source maps, common dev folders) blocked at the webserver level - see [`.htaccess`](../.htaccess).
- No source maps or `.env` files ship to production.
- `index.html` is the only fallback - SPA routes resolve through the explicit rewrite rule, unknown extensions return 404 instead of leaking content.

## Contract change posture

- Contract addresses are pinned in [`app/core/config.js`](../app/core/config.js) and rendered on the public `/contracts` page.
- Upgrades happen via deploying a new contract (or migrating via the contract's admin, where applicable) and shipping a config change. The old contracts remain queryable; users can verify the swap by diffing the address history.
- We will not silently rotate a contract address that holds user state.

## Known risks we cannot eliminate

- **Wallet-level phishing.** If a user installs a malicious wallet or grants permission to a malicious extension, no dApp can protect them. We mitigate by linking only to official wallet download pages.
- **Public LCD failure.** All three public endpoints can be down simultaneously. We surface the failure state instead of silently retrying forever. The chain itself is unaffected.
- **Smart-contract bugs.** Audited code can still have bugs. We treat the on-chain contracts as the source of truth - if a bug exists, every dApp interacting with the same contract is affected equally. Disclosures: `hello@atomregistry.com`.

## Responsible disclosure

If you find a security issue, email `hello@atomregistry.com` with:

- A clear description and reproduction steps.
- Any PoC code (gist or attachment).
- Your preferred credit handle.

We aim to acknowledge within 48 hours. Please don't publish details before we've had a chance to respond.
