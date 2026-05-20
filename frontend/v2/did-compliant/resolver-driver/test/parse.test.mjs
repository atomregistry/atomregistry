import assert from "node:assert/strict";
import { base58btcEncode, secp256k1PublicKeyToMultibase } from "../src/base58.mjs";
import { didForDomain, parseAtomRegistryDid } from "../src/did-cosmos.mjs";

const config = { chainspace: "cosmoshub", namespace: "atomregistry" };

assert.equal(didForDomain("Cosmos.Atom"), "did:cosmos:1:cosmoshub:atomregistry:cosmos.atom");

const parsed = parseAtomRegistryDid("did:cosmos:cosmoshub:atomregistry:cosmos.atom", config);
assert.equal(parsed.version, "1");
assert.equal(parsed.versionWasExplicit, false);
assert.equal(parsed.domain, "cosmos.atom");
assert.equal(parsed.canonicalDid, "did:cosmos:1:cosmoshub:atomregistry:cosmos.atom");

const parsed2 = parseAtomRegistryDid("did:cosmos:1:cosmoshub:atomregistry:sub.cosmos.atom#linked-domain", config);
assert.equal(parsed2.fragment, "linked-domain");
assert.equal(parsed2.domain, "sub.cosmos.atom");

assert.equal(base58btcEncode(new Uint8Array([0])), "1");
assert.equal(base58btcEncode(new Uint8Array([0, 0, 1])), "112");

const compressed = new Uint8Array(33);
compressed[0] = 2;
compressed[32] = 1;
const mb = secp256k1PublicKeyToMultibase(compressed);
assert.match(mb, /^z/);
assert.ok(mb.length > 20);

for (const bad of [
  "did:cosmos:1:cosmoshub:atomregistry:not a domain",
  "did:cosmos:2:cosmoshub:atomregistry:cosmos.atom",
  "did:cosmos:1:osmosis:atomregistry:cosmos.atom",
  "did:cosmos:1:cosmoshub:other:cosmos.atom",
  "DID:cosmos:1:cosmoshub:atomregistry:cosmos.atom",
]) {
  assert.throws(() => parseAtomRegistryDid(bad, config));
}

console.log("parse.test.mjs ok");
