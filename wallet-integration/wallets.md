# Wallet integration

Atom Registry uses the wallet the user already trusts. No custody, no proxied signing, no custom chain to add.

## Supported wallets (today)

|      Wallet      |       Detection       |              Signer               |                                    Notes                                   |
|------------------|-----------------------|-----------------------------------|----------------------------------------------------------------------------|
| **Keplr**        | `window.keplr`        | `getOfflineSigner("cosmoshub-4")` | Default for most Cosmos users. Direct + Amino. Ledger via Keplr supported. |
| **Cosmostation** | `window.cosmostation` | Same OfflineSigner shape          | Mobile (WalletConnect) and desktop extension.                              |

The user chooses a wallet on Connect; the rest of the app is wallet-agnostic.

## Signing flow

1. **Connect** - `provider.enable("cosmoshub-4")`, then `getOfflineSigner` + `getAccounts`. Keys never leave the wallet.
2. **Compose** - Atom Registry builds a `MsgExecuteContract` targeting a public registry / marketplace / resolver contract. Fee and gas are estimated client-side.
3. **Sign** - Wallet shows the full call (contract address, method, JSON, funds). User can compare it against the Mintscan link we ship next to the prompt.
4. **Broadcast** - Signed tx goes to a public LCD endpoint. We do not proxy through our own backend.

## What an action looks like end-to-end

```js
// 1. detect
const provider = window.keplr || window.cosmostation;

// 2. permission + signer
await provider.enable("cosmoshub-4");
const signer  = provider.getOfflineSigner("cosmoshub-4");
const [acct]  = await signer.getAccounts();

// 3. build a Register tx
const msg = {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
  value: {
    sender:   acct.address,
    contract: REGISTRY,
    msg:      new TextEncoder().encode(JSON.stringify({ register: { name: "alice.atom" } })),
    funds:    [{ denom: "uatom", amount: "15000000" }]
  }
};

// 4. sign + broadcast (SigningStargateClient or wallet-native helper)
const client = await SigningCosmWasmClient.connectWithSigner(RPC, signer);
const tx     = await client.signAndBroadcast(acct.address, [msg], "auto");
```

The same envelope is used for: mint, transfer, set-resolver, list-on-marketplace, buy, mint-TLD, set-metadata, set-dSSL endpoint.

## Read-only - no wallet required

Anyone can resolve a name in one GET. Wallets can use this directly in the send screen:

```bash
curl -s "https://rest.cosmos.directory/cosmoshub/cosmwasm/wasm/v1/contract/${RESOLVER}/smart/$(echo -n '{"resolve":{"name":"alice.atom"}}' | base64)" \
  | jq '.data'
# {
#   "address": "cosmos1...",
#   "owner":   "cosmos1...",
#   "tld":     "atom",
#   ...
# }
```

Reverse:

```bash
curl -s "https://rest.cosmos.directory/cosmoshub/cosmwasm/wasm/v1/contract/${RESOLVER}/smart/$(echo -n '{"primary_name":{"address":"cosmos1..."}}' | base64)" \
  | jq '.data'
```

## What we'd love to ship with wallet teams

|                                              Feature                                                                                 |                   Effort on wallet side             | Value to user |
|--------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------|----------|
| **Send-to-name** in the wallet's send screen (type `alice.atom`, wallet shows the resolved `cosmos1...` and lets the user confirm).  | One LCD call per keystroke (debounced).             | Removes the #1 source of lost funds: copy-pasting wrong addresses. |
| **Reverse-resolved tx history** - tag historical txs with `<- alice.atom` instead of `<- cosmos1...`.                                | One batch LCD call per tx page.                     | Tx history becomes readable.                                       |
| **Connected-as display name** for dApps.                                                                                             | One LCD call on connect.                            | Nicer UX for users with a primary name.                            |
| **Name expiry / offer notifications** - subscribe to events from the registry + marketplace contracts.                               | New listener in the existing notification pipeline. | First non-financial notifications wallets can offer Cosmos users.  |
| **Address book auto-fill** - import the user's owned names as suggestions.                                                           | One LCD call on wallet open.                        | Zero-friction.                                                     |

We're happy to build any of these together - PRs in the wallet repo, or a hosted helper service that the wallet calls. Whatever fits your stack.

## Provider API surface we depend on

Minimum we need from a wallet provider to support it as a signer:

- `enable(chainId: string): Promise<void>`
- `getOfflineSigner(chainId: string): OfflineSigner | OfflineDirectSigner`
- `getKey(chainId: string): Promise<{ name, address, pubKey, ... }>` (used for nicer connect labels - optional)

All three are present in Keplr, Cosmostation and Ledger today.

## Failure modes we handle

- User rejects in wallet -> graceful "Cancelled" UI, no retry loop.
- Gas estimation fails -> fall back to `GAS_FALLBACK` (~400k) with a clear note in the UI.
- LCD endpoint times out -> rotate through `REST[]` list (3 public endpoints, see [`contracts.md`](./contracts.md)).
- Wallet not installed -> link to the wallet's official download page, not a custom landing.

## What we never do

- Touch private keys / seeds.
- Proxy signing through a server.
- Suggest a non-canonical chain.
- Bypass the wallet's signing UI.
- Run a "permit"-style infinite approval.
