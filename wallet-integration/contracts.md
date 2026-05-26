# Contracts

All Atom Registry contracts are deployed on **Cosmos Hub** (`cosmoshub-4`) and are public CosmWasm contracts.

> **Verify before signing.** Compare these addresses with the prompt your wallet shows you, and with the live state on Mintscan. The same list is rendered (with live on-chain queries) at <https://atomregistry.com/contracts>.

## Chain

|            Key             |                 Value                  |
|----------------------------|----------------------------------------|
| Chain ID                   | `cosmoshub-4`                          |
| Native denom               | `uatom`                                |
| Gas price                  | `0.025 uatom`                          |
| Default gas adj.           | `1.8` (fallback gas: `400000`)         |
| MsgExecuteContract typeUrl | `/cosmwasm.wasm.v1.MsgExecuteContract` |

## Contracts (mainnet, `cosmoshub-4`)

| Role | Address | Mintscan |
|------|---------|----------|
| Registry | `cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe`         | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe) |
| Registrar | `cosmos1w4rknyllzt7mu6tsl6m7qm0sss66stwemvc4p4utdsyrjdf9q44ss0697x`        | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1w4rknyllzt7mu6tsl6m7qm0sss66stwemvc4p4utdsyrjdf9q44ss0697x) |
| TLD manager | `cosmos12sseygvx4ykhp0df70ndg82l7p9a7ld7l0n0pptwj7c2h726cc9sahh4hz`      | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos12sseygvx4ykhp0df70ndg82l7p9a7ld7l0n0pptwj7c2h726cc9sahh4hz) |
| Resolver | `cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv`         | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv) |
| Marketplace | `cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc`      | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc) |
| Metadata | `cosmos1cu35kuzrvlprssa3j5p0ypwy9v6j4s6ugc5sm7gz6klj4pxmjeksvxcea0`         | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1cu35kuzrvlprssa3j5p0ypwy9v6j4s6ugc5sm7gz6klj4pxmjeksvxcea0) |
| dSSL | `cosmos1pmuxqc3ehdjkm8wzpqz5saxztwn97a84ga27uktt6huckxw3j8lszgjnpp`             | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1pmuxqc3ehdjkm8wzpqz5saxztwn97a84ga27uktt6huckxw3j8lszgjnpp) |
| Site registry | `cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt`    | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt) |
| DID adapter | `cosmos146n3zuu32nlqqa3rln2l70a6wez2wrzvwy0k5h30phl4d900h6gspyl95l`      | [open](https://www.mintscan.io/cosmos/wasm/contract/cosmos146n3zuu32nlqqa3rln2l70a6wez2wrzvwy0k5h30phl4d900h6gspyl95l) |

## Public REST endpoints used by the frontend

The frontend rotates through this list and falls back on the next one on timeout. None of these are operated by Atom Registry - they are community / public infrastructure.

- `https://rest.cosmos.directory/cosmoshub`
- `https://cosmos-rest.publicnode.com`
- `https://cosmos-api.polkachu.com`

Wallet teams should feel free to use their own LCD instead - the query format is just standard CosmWasm smart queries.

## Quick query examples

Resolve a name (read-only, no wallet):

```bash
RESOLVER="cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv"
LCD="https://rest.cosmos.directory/cosmoshub"

curl -s "${LCD}/cosmwasm/wasm/v1/contract/${RESOLVER}/smart/$(echo -n '{"resolve":{"name":"alice.atom"}}' | base64)" | jq '.data'
```

Reverse-resolve an address to its primary name:

```bash
curl -s "${LCD}/cosmwasm/wasm/v1/contract/${RESOLVER}/smart/$(echo -n '{"primary_name":{"address":"cosmos1..."}}' | base64)" | jq '.data'
```

Register a name (write, wallet required - see [`wallets.md`](./wallets.md) for the full client-side example):

```json
{
  "typeUrl": "/cosmwasm.wasm.v1.MsgExecuteContract",
  "value": {
    "sender": "cosmos1...",
    "contract": "cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe",
    "msg": "<base64 of {\"register\":{\"name\":\"alice.atom\"}}>",
    "funds": [{ "denom": "uatom", "amount": "15000000" }]
  }
}
```

## Pricing (uatom)

Length-based base price (paid once, no renewal):

| Length | Base (ATOM) |
|----------|-----------|
| 2 chars  | 100       |
| 3 chars  | 50        |
| 4 chars  | 25        |
| 5+ chars | 15        |

Premium keywords (`ai`, `btc`, `crypto`, `defi`, `nft`, `shop`, `pay`, `dex`, `dao`) add **+25 ATOM**. Pure-numeric names add **+10 ATOM**.

Authoritative pricing logic: [`app/core/config.js`](../app/core/config.js) - functions `calculateDomainPrice` and `calculateDomainPriceUatom`.

## Source-of-truth note

If anything in this file disagrees with [`app/core/config.js`](../app/core/config.js) or the live `/contracts` page, the live values win. This file is regenerated from those when contracts change.
