# Atom Registry

> A short, copy-pasteable bundle for wallet teams, infrastructure partners, and Cosmos Hub contributors. Everything here is also live at <https://atomregistry.com/>.

**TL;DR** - Atom Registry is the Web3 domain registry on **Cosmos Hub**. Names like `alice.atom` are CosmWasm-native NFTs, signed by the user's own wallet (Keplr / Cosmostation), with no server-side custody at any layer.

---

## What's in this pack

| File | What it is |
|------|------------|
| [`README.md`]                 (./README.md)                    | This file - one-page overview. |
| [`wallets.md`]                (./wallets.md)                   | Wallet integration model (Keplr / Cosmostation), provider interfaces we use, what we'd love to ship together. |
| [`security.md`]               (./security.md)                  | Security model - what we control, what users control, what an attacker could and couldn't do. |
| [`contracts.md`]              (./contracts.md)                 | Canonical contract addresses on `cosmoshub-4` with Mintscan links. |
| [`outreach/keplr.md`]         (./outreach/keplr.md)            | Keplr-specific pitch DM / email. |
| [`outreach/cosmostation.md`]  (./outreach/cosmostation.md)     | Cosmostation-specific pitch DM / email. |
| [`outreach/public-update.md`] (./outreach/public-update.md)    | Public X / Telegram post that tags both. |

---

## What Atom Registry is

- **A name layer for Cosmos Hub.** `name.atom`, `name.cosmos`, plus user-owned TLDs (`.dao`, `.brand`, `.community` ...).
- **Pay once, own permanently.** No annual renewal fees, no escrow, no "release" gotcha.
- **CosmWasm-native.** Names are state in audited CosmWasm contracts deployed on `cosmoshub-4`. No new chain, no bridge.
- **Wallet-native.** Every transaction is a standard `MsgExecuteContract` signed by the user's wallet. We never see private keys.
- **DID-compliant.** Every name is also resolvable as `did:cosmos:1:cosmoshub:atomregistry:<name>` via a Universal Resolver driver (see [`/did-compliant/`](https://atomregistry.com/did-compliant/)).

## What lives where

- **App**                                            - <https://atomregistry.com/>
- **Browser extension**                              - <https://atomregistry.com/extension>
- **Marketplace**                                    - <https://atomregistry.com/marketplace>
- **Contracts (live state + Mintscan links)**        - <https://atomregistry.com/contracts>
- **Docs**                                           - <https://atomregistry.com/docs>
- **Wallet integration page**                        - <https://atomregistry.com/wallet-integration>
- **did:cosmos resolver pack**                       - <https://atomregistry.com/did-compliant/>

## How wallets see us

```js
await window.keplr.enable("cosmoshub-4");
const signer  = window.keplr.getOfflineSigner("cosmoshub-4");
const [acct]  = await signer.getAccounts();

// Register a name - same envelope every other Cosmos dApp uses.
const msg = {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
  value: {
    sender:   acct.address,
    contract: "cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe", // REGISTRY
    msg:      new TextEncoder().encode(JSON.stringify({ register: { name: "alice.atom" } })),
    funds:    [{ denom: "uatom", amount: "15000000" }]
  }
};
```

No `suggestChain`, no custom RPC, no private bridge - just `cosmoshub-4` and a public CosmWasm contract.

## Why wallets should care

1. **Resolve names to addresses** - users want to send to `alice.atom`, not `cosmos1...`. We expose a single read-only LCD call that returns the resolved address. Drop-in for the wallet's send screen.
2. **Reverse resolution** - turn an address back into its primary name for nicer address-book entries and tx history.
3. **Display name for connected dApps** - show "Connected as **alice.atom**" instead of `cosmos1abc...xyz`.
4. **Notifications hook** - on-chain events (name expiring, offer received) that wallets can push to their notification stack.

See [`wallets.md`](./wallets.md) for the full integration menu.

## Contact

- Email: `hello@atomregistry.com`
- X: `@atomregistry`
- Site: <https://atomregistry.com/>
