# Atom Registry: A Universal Web3 Namespace Protocol for Cosmos Hub

**Author:** Atom Registry  
**Date:** March 2026  
**Status:** Governance Draft

---

## Abstract

Atom Registry is a production-deployed, multi-TLD Web3 domain naming protocol operating on Cosmos Hub mainnet. Eight CosmWasm smart contracts provide a complete namespace infrastructure: domain registration, subdomain management, name resolution, on-chain site storage, marketplace trading, metadata, decentralized trust attestation, and TLD governance.

Any participant can register a top-level domain permanently. TLD owners set registration policy, earn 100% of fees generated under their namespace, and govern subdomain issuance without platform intermediaries. Names resolve to wallet addresses, DNS records, IPFS content hashes, cross-chain addresses, and social identities via a single REST query to Cosmos Hub.

This document presents the protocol architecture, security model, economic design, governance structure, and ecosystem integration strategy for consideration by the Cosmos Hub community.

---

## 1. Problem Statement

Every major public blockchain has resolved the naming problem. Ethereum has ENS. Solana has SNS. Polygon hosts Unstoppable Domains. Each provides human-readable identity, on-chain address resolution, and a namespace economy. Cosmos Hub — the sovereign coordination layer for an ecosystem of over 100 interconnected chains — does not.

The consequences are practical and compounding. Users transact using 45-character bech32 addresses. Projects compete on unverifiable marketing claims rather than provable on-chain identity. Validators have no canonical identity anchor across chains. DAOs cannot express membership, governance, or social presence through a stable namespace. IBC routing has no human-readable layer. Cross-chain address books do not exist.

This is not a design constraint. It is an unbuilt component.

The Cosmos ecosystem has the technical foundation — CosmWasm, IBC, a shared validator set, a functional community pool, and a governance process capable of ratifying protocol additions. What it lacks is a naming protocol that treats namespaces as first-class economic assets, that works without external dependency, and that is already running on mainnet.

Atom Registry is that protocol.

---

## 2. Protocol Architecture

### 2.1 Design Principles

Atom Registry is designed around four principles:

**Permanent ownership.** Names do not expire. There are no renewal fees. The economic model is front-loaded at registration. Once a name or TLD is registered, it belongs to its owner until explicitly transferred.

**TLD sovereignty.** Top-level domain owners are independent operators. They set pricing, access policy, maximum allocations per address, and receive 100% of registration revenue. The protocol does not extract rent from successful namespaces.

**Composability.** Every contract exposes a stable query interface. Any IBC-connected chain can resolve a name with a single REST call to Cosmos Hub. No bridge, no wrapper, no secondary deployment required.

**No external dependency.** The protocol has no runtime dependency on external price feeds, oracles, or off-chain infrastructure. All state is on-chain. All resolution is deterministic.

### 2.2 Contract Architecture

The protocol is implemented as seven CosmWasm smart contracts organized into two tiers.

**Core Registry Layer**

The Registry contract is the authoritative source of truth for all ownership state. It stores the mapping from name to owner address, handles transfers, and enforces that names within a TLD namespace can only be issued by the TLD owner or an authorized registrar. No other contract can modify ownership state without passing through the Registry.

The Registrar contract implements commit-reveal registration for subdomain names within open TLDs. Commit-reveal prevents front-running: a registrant commits a hash of their desired name and a secret, waits for the commit to be confirmed, then reveals. The protocol enforces a minimum commit phase of 10 seconds and a maximum of 1800 seconds. This eliminates the class of attacks where a validator or mempool observer reads a pending registration transaction and races to register the same name first.

The TLD Manager contract handles top-level domain registration using the same commit-reveal mechanism. TLD registration costs 2.5 ATOM at launch pricing. TLD owners configure subdomain policy through the Registry's subdomain_policy interface.

The Resolver contract maps names to records. Supported record types include: Cosmos wallet address, DNS A/AAAA records, CNAME, TXT, MX, content hash (IPFS/Arweave), cross-chain addresses with chain ID, federation handles (ActivityPub/AT Protocol), and arbitrary key-value extensions. Records are owner-controlled and updateable at any time.

**Extended Service Layer**

The Site Registry contract stores full HTML pages on-chain, keyed by domain name. A one-time storage fee of 5 ATOM covers permanent storage. Updates after initial deployment are gas-only. The maximum page size at launch is 100KB. This enables truly censorship-resistant web presence with no hosting dependency.

The Marketplace contract enables secondary trading of names and TLDs at fixed prices. Sellers list at a chosen price in uatom. The contract verifies ownership at settlement time. Royalty distribution to TLD owners on secondary sales of names within their namespace is implemented but not enforced in the current beta — this will be activated post-audit.

The Metadata contract provides a general-purpose key-value store keyed by domain name. Fields have public/private visibility controls. Use cases include profile data, verification badges, social links, and application-specific extensions.

The dSSL Manager implements a decentralized trust layer. Domain owners can publish signed attestations — verifiable claims about identity, organization membership, code authorship, or domain control. Third parties can attest to other domains. The aggregate attestation record for a domain forms a trust signal that applications can query and weight according to their own policies.

### 2.3 Data Model

The Registry maintains three primary state structures:

**Name record:** owner address, parent TLD, registration timestamp, transfer history hash.

**TLD record:** owner address, subdomain policy (enabled, open/closed, price in uatom, recipient address, max per address), registration timestamp.

**Subdomain policy:** Controls whether a TLD accepts public registration, the price per name, the address that receives registration fees, and the maximum number of names any single address may register under the TLD.

All state is stored using cw-storage-plus Maps and Items with deterministic storage keys. The storage layout is versioned via cw2 contract metadata to support safe migrations.

### 2.4 Resolution Protocol

Name resolution follows a two-step pattern:

1. Query the Registry for the owner of a name: `owner_of { name: "alice.atom" }`
2. Query the Resolver for the desired record type: `resolve { name: "alice.atom", record_type: "cosmos_address" }`

Both queries are standard CosmWasm smart queries accessible via the Cosmos Hub LCD REST endpoint. Any application, wallet, or IBC-connected chain that can reach a Cosmos Hub node can resolve any name.

Cross-chain address resolution uses the chain ID as a discriminator: `resolve { name: "alice.atom", record_type: "address", chain_id: "osmosis-1" }`. This enables a single name to serve as the canonical address book across the entire IBC network.

---

## 3. Security Model

### 3.1 Authorization Design

Authorization correctness is the primary security invariant. Every state-modifying entrypoint validates `info.sender` before executing. The authorization hierarchy is:

- **Registry owner operations** (transfer, set_record): sender must be the current owner of the name.
- **TLD policy operations** (set_subdomain_policy): sender must be the owner of the TLD.
- **Registrar operations** (commit, reveal): sender is the registrant; the Registrar validates against Registry state.
- **Admin operations** (migration, operator configuration): restricted to the contract admin address.

No entrypoint assumes trust based on `env.contract.address` or caller position in the call stack.

### 3.2 Commit-Reveal Security

The commit-reveal scheme for registration provides the following guarantees:

**Front-running resistance.** A committed hash reveals nothing about the intended name. An observer who sees a commit transaction cannot determine what name is being reserved.

**Timeout enforcement.** Commits expire after 1800 seconds. A registrant who commits but never reveals cannot permanently block a name — another participant can commit after the window closes.

**Secret binding.** The commit hash is `keccak256(name || secret || sender)`. Binding the sender address prevents an attacker from replaying a valid reveal with a different sender.

### 3.3 Reentrancy

All state mutations complete before any SubMsg or cross-contract call is dispatched. The contracts do not use reply handlers that re-enter their own state. IBC packet handlers (if enabled in future versions) will follow the same state-before-call discipline.

### 3.4 Arithmetic Safety

All arithmetic uses Rust's checked operations (`checked_add`, `checked_sub`, `checked_mul`). Overflow conditions return explicit `ContractError::Overflow` rather than panicking or wrapping. `Uint128` is used throughout for token amounts, providing 128-bit precision with no floating point.

### 3.5 Known Limitations

No formal third-party audit has been performed on the current deployed contracts. The internal development methodology applied invariant-driven design and adversarial path simulation, but this does not substitute for independent review. The codebase is published to GitHub concurrent with this proposal to enable community and third-party review. If the community conditions acceptance on a formal audit, that audit will be conducted at the community's expense prior to multisig migration.

---

## 4. Economic Model

### 4.1 TLD Registration

Top-level domain registration is priced at 2.5 ATOM at launch. This price is set by protocol configuration and is subject to change by the TLD Manager contract admin. The intent is to keep TLD registration accessible while pricing out low-effort namespace squatting.

Registration fees from TLD acquisition flow to the protocol treasury (currently the founder address, transitioning to multisig on governance passage).

### 4.2 Subdomain Registration

Subdomain registration fees are set entirely by TLD owners. The protocol does not extract a fee from subdomain registrations — 100% of the fee goes to the recipient address configured in the TLD's subdomain policy. This recipient may be the TLD owner, a DAO treasury, a community fund, or any address.

This design creates a genuine namespace economy. TLD owners who build valuable namespaces — through marketing, integration, or community — capture the full economic upside. There is no protocol rent.

### 4.3 LP Commitment

Fifty percent of all platform earnings — including TLD registration fees, site storage fees, and any protocol revenue — will be deployed as liquidity to a designated Cosmos/ATOM pool on Osmosis for one year following governance passage.

At the end of year one, the LP principal contributed on behalf of the founder is returned interest-free. Yield generated during the year remains in the pool permanently as a contribution to Cosmos ecosystem liquidity. After year one, the default revenue split is 50% founder / 50% Cosmos Hub community pool, subject to revision by governance.

This commitment is not conditional on proposal passage. It reflects the founder's view that ATOM liquidity depth is a public good that directly benefits every participant in the ecosystem.

### 4.4 ATOM Demand

Every name registration, TLD acquisition, site deployment, marketplace transaction, and metadata update is denominated in uatom and executed as an on-chain ATOM transaction. As the platform scales, this creates sustained organic demand for ATOM as a utility asset — not speculative demand, but demand generated by real economic activity in the naming layer.

The ATOM Sales Widget extends this further: any seller who deploys the widget and registers a store namespace is conducting commerce in ATOM. Each seller is a new source of ATOM transaction volume. Each buyer is a new ATOM user.

---

## 5. Governance Structure

### 5.1 2-of-3 Multisig Design

On proposal passage, the eight deployed contracts will be migrated to a 2-of-3 multisig governance structure. The threshold is designed with a specific property: the founder holds one permanent required key. The community elects two additional keyholders through Hub governance.

The result: any action requires the founder plus at least one community keyholder. The two community keyholders alone cannot reach threshold. This prevents hostile community capture of the protocol while still giving the community genuine co-governance authority — no action can be taken without community participation.

The founder key cannot be removed from the multisig structure without the founder's own signature. This is enforced by the mathematics of the threshold, not by social agreement.

### 5.2 Keyholder Election

Community keyholders are elected through Cosmos Hub governance proposals. The initial election will be a signaling proposal nominating two community members or organizations as keyholders. Candidates are expected to have a demonstrated history of participation in the Cosmos ecosystem, technical literacy sufficient to review proposed contract migrations, and availability for time-sensitive decisions.

Keyholder terms and rotation schedules will be defined in a subsequent governance proposal after the initial recognition vote.

### 5.3 Migration Timeline

Contract migration to multisig governance will be completed within 90 days of proposal passage. The migration sequence is:

1. Deploy multisig contract on Cosmos Hub
2. Transfer admin authority from founder address to multisig
3. Verify all eight contracts respond correctly to multisig-signed governance transactions
4. Publish migration transaction hashes for community verification

### 5.4 Recognition vs. Control

This proposal requests recognition, not control. The Cosmos Hub community is not being asked to take ownership of the contracts, fund their operation, or assume liability for their behavior. The ask is an endorsement — a governance signal that the community considers Atom Registry the preferred namespace layer for the Hub.

Recognition can be revoked through a subsequent governance proposal at any time. The community retains full sovereignty over the Hub's official endorsements.

---

## 6. Ecosystem Integration

### 6.1 IBC Resolution

Any IBC-connected chain can resolve Atom Registry names with a standard CosmWasm smart query to Cosmos Hub. No bridge contract, no wrapped asset, no secondary deployment. The query path is:

```
GET /cosmwasm/wasm/v1/contract/{registry}/smart/{base64(query)}
```

Where query is `{"owner_of": {"name": "alice.atom"}}` or any Resolver query. This works from any chain that can reach a Cosmos Hub LCD endpoint — which, for IBC-connected chains, is all of them.

The practical implication: a single integration point gives every Cosmos application access to the full naming layer. A wallet that integrates Hub name resolution gets names from every namespace simultaneously.

### 6.2 Wallet Integration

Keplr, Leap, and Cosmostation are each offered their own top-level domain (`.keplr`, `.leap`) as an unconditional gift with no conditions attached to this proposal. The intent is to give wallet providers an immediate economic interest in the namespace layer.

A wallet that integrates name resolution can offer users human-readable send addresses, display `.keplr` verified identity badges, and monetize their own namespace by selling names to their user base. The wallet becomes a namespace operator. Every name sold under `.keplr` is revenue to Keplr/Chainapsis.

This is the wallet monetization model that does not exist anywhere in the Cosmos ecosystem today. It is ready to deploy.

### 6.3 Validator Identity

Validators currently compete for delegation through off-chain reputation — websites, social media, community participation. Atom Registry provides an on-chain identity anchor. A validator who registers `validatorname.val` can attach verifiable records: their commission address, their operator address, their governance voting record hash, their uptime attestation, and their organization's dSSL trust record.

Delegators can query validator identity through the same resolution interface used for wallets. This creates a verifiable, on-chain reputation layer that complements existing validator metrics.

### 6.4 DAO and Governance Identity

DAOs operating in the Cosmos ecosystem — particularly those managing community pool funds or interchain accounts — have no canonical identity. A DAO that registers `daoproposal.dao` can publish its governance address, its treasury address, its proposal history hash, and its membership attestations as Resolver records. The `.dao` TLD, gifted unconditionally to the Cosmos Hub community pool, provides the Hub's own governance structure with a permanent namespace home.

### 6.5 On-Chain Web Presence

The Site Registry enables any domain owner to publish a complete HTML page permanently to Cosmos Hub. The page is stored in contract state, served via the LCD query interface, and resolvable through the browser extension. This is not IPFS — the content lives in chain state and is secured by the same validator set that secures ATOM. There is no pinning requirement, no gateway dependency, and no content that can be unpinned.

The Atom Browser extension resolves `.stars`, `.atom`, `.cosmos`, and all other registered TLDs natively. Any page stored in the Site Registry is browsable without a traditional web server.

---

## 7. Competitive Landscape

### 7.1 ICNS (Interchain Name Service)

ICNS provides `.osmo` and chain-specific names for Cosmos addresses. It is Osmosis-native and requires Twitter verification for registration. It does not support custom TLDs, on-chain site storage, or TLD ownership economics. It is a fixed-namespace identity system, not a namespace platform.

Atom Registry and ICNS are not direct competitors. ICNS solves address lookup for a specific set of chains. Atom Registry solves namespace ownership as an economic primitive for the entire ecosystem.

### 7.2 Stargaze Names

Stargaze Names provides NFT-based `.stars` names on the Stargaze chain. Names are non-fungible tokens with marketplace trading. The system is Stargaze-specific and does not extend to Cosmos Hub or other chains without additional integration.

The `.stars` TLD is offered to the Stargaze Foundation as an unconditional gift. Stargaze Names and Atom Registry can coexist and complement each other — Stargaze provides a rich NFT experience for `.stars`, while Atom Registry provides the cross-chain resolution layer.

### 7.3 Unstoppable Domains / ENS

Both operate on EVM chains and have no native presence in the Cosmos ecosystem. Both charge renewal fees (Unstoppable moved away from renewals, ENS still charges). Neither supports the IBC resolution model. Neither enables custom TLD ownership as a first-class economic primitive.

### 7.4 Summary

No existing system in the Cosmos ecosystem provides: permanent ownership, custom TLD economics, cross-chain resolution via IBC, on-chain site storage, marketplace trading, metadata, and trust attestation in a single protocol deployed on Cosmos Hub. Atom Registry is not competing with existing solutions — it is filling a gap that does not exist in the current landscape.

---

## 8. Roadmap

### Phase 1 — Governance Recognition (Current)

- Forum discussion period: minimum 2 weeks
- Community feedback integration
- On-chain signaling proposal submission
- GitHub publication concurrent with this document

### Phase 2 — Post-Recognition (0–90 days)

- Multisig contract deployment and admin migration
- Community keyholder election proposal
- Formal third-party security audit (if required by community)
- Osmosis LP deployment (50% of earnings)
- Direct outreach to ecosystem teams for TLD claim

### Phase 3 — Integration (90–180 days)

- Keplr/Leap wallet name resolution integration (pending wallet team cooperation)
- Cosmostation integration
- IBC resolution documentation and reference implementation
- Enterprise namespace offering (corporations, protocols, DAOs)
- ATOM Sales Widget ecosystem distribution

### Phase 4 — Ecosystem Growth (180+ days)

- Validator identity layer activation
- dSSL trust attestation network effects
- Cross-chain address book standard proposal
- Fediverse identity integration (ActivityPub handle resolution)
- AT Protocol integration (Bluesky handle resolution)
- Additional chain-specific TLD gifts as ecosystem grows

---

## 9. Conclusion

Atom Registry is not a proposal for something to be built. It is a proposal to recognize something that is already built, already running, and already generating economic activity on Cosmos Hub mainnet.

Eight contracts. 122 top-level domains. A live registration platform. A payment widget. A browser extension. A governance framework. All of it self-funded, deployed without community pool resources, and offered to the community at no cost except an endorsement.

The ask is a signaling vote. The return is a naming layer that gives Cosmos Hub the same infrastructure capability that Ethereum, Solana, and every major L1 already has — built natively on CosmWasm, governed by the Hub's own validator set, and designed to generate sustained ATOM demand through genuine economic activity.

The namespace layer for Cosmos Hub exists. It is ready. It is yours if you want it.

---

## Appendix A — Contract Addresses

| Contract | Address | Status |
|---|---|---|
| Registry | cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe | Production |
| Registrar | cosmos1w4rknyllzt7mu6tsl6m7qm0sss66stwemvc4p4utdsyrjdf9q44ss0697x | Production |
| TLD Manager | cosmos12sseygvx4ykhp0df70ndg82l7p9a7ld7l0n0pptwj7c2h726cc9sahh4hz | Production |
| Resolver | cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv | Production |
| Marketplace | cosmos1m962xzr0teztzlp39y7leefhqadxwxv4vg4jyzq6jxh64e93v9hsmg62rc | Beta |
| Metadata | cosmos1cu35kuzrvlprssa3j5p0ypwy9v6j4s6ugc5sm7gz6klj4pxmjeksvxcea0 | Beta |
| dSSL Manager | cosmos1pmuxqc3ehdjkm8wzpqz5saxztwn97a84ga27uktt6huckxw3j8lszgjnpp | Beta |
| Site Registry | cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt | Beta |

## Appendix B — TLD Gift Registry

The following top-level domains are offered unconditionally to ecosystem teams, independent of this proposal's outcome. Claim by DMing @atomregistry on X from your official account with a Cosmos Hub wallet address. Transfer within 24 hours.

| TLD | Recipient |
|---|---|
| .osmosis | Osmosis Labs |
| .stargaze | Stargaze Foundation |
| .stars | Stargaze Foundation |
| .keplr | Keplr / Chainapsis |
| .leap | Leap Wallet |
| .ibc | Interchain Foundation |
| .cosmos | Interchain Foundation |
| .dao | Cosmos Hub Community Pool |
| .stride | Stride Labs |
| .injective | Injective Labs |
| .neutron | Neutron |
| .celestia | Celestia Labs |
| .akash | Akash Network |
| .noble | Noble |
| .dydx | dYdX Foundation |
| .juno | Juno Network / DAODAO |

## Appendix C — References

- Cosmos Hub Governance Proposal: https://forum.cosmos.network/t/draft-atom-registry-official-web3-universal-namespace-platform-for-cosmos-hub/16807
- Platform: https://atomregistry.com
- GitHub: https://github.com/atomregistry/atomregistry
- ATOM Sales Widget: https://atomregistry.com/sales/
- Browser Extension: https://atomregistry.com/atomextension.zip
