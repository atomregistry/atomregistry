# AtomRegistry did:cosmos compatibility pack

This package contains a production-oriented implementation plan for making AtomRegistry domains resolvable as `did:cosmos` identifiers.

It contains two integration paths:

1. `resolver-driver/` - a Universal Resolver-compatible HTTP driver that resolves existing AtomRegistry domains into DID Resolution results without requiring a chain migration.
2. `contract/` - a CosmWasm adapter contract that can be deployed next to the existing AtomRegistry contracts or merged into a future Resolver migration.

The canonical DID shape for AtomRegistry is:

```text
did:cosmos:1:cosmoshub:atomregistry:<atomregistry-domain>
```

Example:

```text
did:cosmos:1:cosmoshub:atomregistry:alice.atom
```

The versionless DID form is accepted for compatibility and returns metadata that points to the canonical versioned DID:

```text
did:cosmos:cosmoshub:atomregistry:alice.atom
```

## Why this shape

`did:cosmos` uses:

```text
did:cosmos:<version>:<chainspace>:<namespace>:<unique-id>
```

For AtomRegistry on Cosmos Hub:

- `version`: `1`
- `chainspace`: `cosmoshub`, matching the Cosmos Chain Registry `chain_name`
- `namespace`: `atomregistry`
- `unique-id`: the fully-qualified AtomRegistry name, for example `alice.atom`

## Contents

```text
atomregistry-did-cosmos/
  README.md
  PATCH_NOTES.md
  contract/
    Cargo.toml
    src/
      contract.rs
      error.rs
      helpers.rs
      lib.rs
      msg.rs
      state.rs
  resolver-driver/
    package.json
    src/
      base58.mjs
      config.mjs
      did-cosmos.mjs
      document.mjs
      lcd.mjs
      server.mjs
    test/
      parse.test.mjs
  universal-resolver/
    driver-did-cosmos-atomregistry.json
  examples/
    instantiate-adapter.json
    query-identifier-document.json
    set-did-document.json
```

## Immediate soft compatibility: resolver driver

The driver reads the existing AtomRegistry contracts through standard Cosmos LCD smart queries and emits DID Resolution JSON.

```bash
cd resolver-driver
npm install
npm test
npm start
```

Resolve a domain DID:

```bash
curl 'http://localhost:8080/1.0/identifiers/did%3Acosmos%3A1%3Acosmoshub%3Aatomregistry%3Aalice.atom'
```

Dereference a DID URL fragment:

```bash
curl 'http://localhost:8080/1.0/dereference/did%3Acosmos%3A1%3Acosmoshub%3Aatomregistry%3Aalice.atom%23atomregistry'
```

Environment variables:

```text
PORT=8080
ATOMREGISTRY_CHAIN_ID=cosmoshub-4
ATOMREGISTRY_CHAINSPACE=cosmoshub
ATOMREGISTRY_NAMESPACE=atomregistry
ATOMREGISTRY_REGISTRY_CONTRACT=cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe
ATOMREGISTRY_RESOLVER_CONTRACT=cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv
ATOMREGISTRY_SITE_REGISTRY_CONTRACT=cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt
ATOMREGISTRY_DID_RESOLVER_CONTRACT=<optional adapter contract address>
ATOMREGISTRY_LCD_ENDPOINTS=https://rest.cosmos.directory/cosmoshub,https://cosmos-rest.publicnode.com
ATOMREGISTRY_REQUEST_TIMEOUT_MS=8000
```

The driver resolution order is:

1. Check that the AtomRegistry domain exists via the Registry `owner_of` query.
2. If `ATOMREGISTRY_DID_RESOLVER_CONTRACT` is configured, query `query_identifier_document` on that contract.
3. If no adapter document exists, look for a resolver record such as `DID_DOCUMENT` or `DID_DOCUMENT_JSON`.
4. If no custom DID document exists, build a deterministic DID document from AtomRegistry owner, resolver records, IPFS, site registry and account public key if available.

## Native compatibility: CosmWasm adapter or resolver migration

The adapter contract implements did:cosmos-style operations while preserving AtomRegistry's existing ownership model.

Instantiate:

```json
{
  "admin": "cosmos1...",
  "registry_contract": "cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe",
  "resolver_contract": "cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv",
  "site_registry_contract": "cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt",
  "chainspace": "cosmoshub",
  "namespace": "atomregistry"
}
```

Query:

```json
{
  "query_identifier_document": {
    "id": "did:cosmos:1:cosmoshub:atomregistry:alice.atom"
  }
}
```

Set a custom DID document, signed by the current AtomRegistry domain owner:

```json
{
  "set_did_document": {
    "id": "did:cosmos:1:cosmoshub:atomregistry:alice.atom",
    "document": {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/earth/NS/iid/v1"
      ],
      "id": "did:cosmos:1:cosmoshub:atomregistry:alice.atom",
      "alsoKnownAs": ["https://atomregistry.com/search.html?name=alice.atom"],
      "service": [
        {
          "id": "did:cosmos:1:cosmoshub:atomregistry:alice.atom#atomregistry",
          "type": "AtomRegistryResolver",
          "serviceEndpoint": {
            "chainId": "cosmoshub-4",
            "domain": "alice.atom"
          }
        }
      ]
    }
  }
}
```

## Contract messages

Execute messages:

```rust
CreateIdentifier { unique_id, namespace, chainspace, document }
SetDidDocument { id, document }
UpdateIidDocument { id, document }
DeactivateIdentifier { id }
UpdateConfig { admin, registry_contract, resolver_contract, site_registry_contract }
```

Query messages:

```rust
QueryIdentifierDocument { id }
ResolveDid { did }
GetConfig {}
```

Authorization:

- Domain writes are allowed only to the current owner returned by the AtomRegistry Registry contract `owner_of` query.
- The configured admin can write operational config and bootstrap data.
- Deactivation is recorded in metadata and does not burn or transfer the AtomRegistry domain.

## Compatibility notes

- DID documents always include `https://www.w3.org/ns/did/v1` and `https://w3id.org/earth/NS/iid/v1`.
- The `id` property exactly matches the resolved DID.
- Service entries are checked for duplicate IDs and must include `id`, `type` and `serviceEndpoint`.
- DID URL query parameters are rejected because the did:cosmos method does not support query parts.
- Path and fragment dereferencing is implemented in the HTTP driver.

## Build notes

The resolver driver is zero-dependency Node.js ESM code and was tested with Node's built-in test runner.

The CosmWasm code is written against CosmWasm `1.5`. Compile it in a Rust/CosmWasm toolchain, for example:

```bash
cd contract
cargo wasm
```

Then optimize the wasm using the standard CosmWasm optimizer used by the AtomRegistry deployment pipeline.
