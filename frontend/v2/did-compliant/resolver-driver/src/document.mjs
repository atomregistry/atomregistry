import { CONFIG, DID_CONTEXT, IID_CONTEXT } from "./config.mjs";
import { parseAtomRegistryDid } from "./did-cosmos.mjs";
import {
  getAccountPubKey,
  getAllRecords,
  getChainAddress,
  getIpfs,
  getOwner,
  getSite,
  queryOnChainDidDocument,
} from "./lcd.mjs";
import { secp256k1PublicKeyToMultibase } from "./base58.mjs";

function contextArray(ctx) {
  if (Array.isArray(ctx)) return ctx;
  if (typeof ctx === "string") return [ctx];
  return [];
}

function normalizeDidDocument(value, did) {
  const doc = value?.didDocument || value?.did_document || value?.document || value;
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  if (doc.id !== did) return null;

  const contexts = contextArray(doc["@context"]);
  const next = { ...doc };
  const mergedContexts = [...contexts];
  if (!mergedContexts.includes(DID_CONTEXT)) mergedContexts.unshift(DID_CONTEXT);
  if (!mergedContexts.includes(IID_CONTEXT)) mergedContexts.push(IID_CONTEXT);
  next["@context"] = mergedContexts;
  return next;
}

function parseJsonMaybe(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function customDocFromRecords(records, did) {
  const candidates = ["DID_DOCUMENT", "DID_DOCUMENT_JSON", "didDocument", "did-document", "DID"];
  for (const key of candidates) {
    const parsed = parseJsonMaybe(records[key]);
    const doc = normalizeDidDocument(parsed, did);
    if (doc) return doc;
  }
  return null;
}

function toUri(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const trimmed = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return null;
}

function ipfsUri(cid) {
  if (!cid || typeof cid !== "string") return null;
  const clean = cid.replace(/^ipfs:\/\//i, "").trim();
  return clean ? `ipfs://${clean}` : null;
}

function pushService(services, service) {
  if (!service || !service.id || !service.type || service.serviceEndpoint == null) return;
  if (services.some((s) => s.id === service.id)) return;
  services.push(service);
}

function buildServices({ parsed, config, records, ipfs, site, cosmosAddress }) {
  const did = parsed.did;
  const domain = parsed.domain;
  const services = [];

  pushService(services, {
    id: `${did}#atomregistry`,
    type: "AtomRegistryResolver",
    serviceEndpoint: {
      chainId: config.chainId,
      chainspace: config.chainspace,
      namespace: config.namespace,
      domain,
      registryContract: config.registryContract,
      resolverContract: config.resolverContract,
      siteRegistryContract: config.siteRegistryContract || undefined,
      query: { owner_of: { domain } },
    },
  });

  const linkedDomain = toUri(records.URL || records.URI || records.CNAME || `https://${domain}`);
  if (linkedDomain) {
    pushService(services, {
      id: `${did}#linked-domain`,
      type: "LinkedDomains",
      serviceEndpoint: linkedDomain,
    });
  }

  for (const recordType of ["A", "AAAA", "TXT", "CNAME", "URL", "URI"]) {
    if (records[recordType] != null) {
      pushService(services, {
        id: `${did}#dns-${recordType.toLowerCase()}`,
        type: "DNSRecord",
        serviceEndpoint: { recordType, value: records[recordType] },
      });
    }
  }

  if (cosmosAddress) {
    pushService(services, {
      id: `${did}#cosmos-address`,
      type: "BlockchainAccountAddress",
      serviceEndpoint: {
        chainId: config.chainId,
        chainspace: config.chainspace,
        address: cosmosAddress,
      },
    });
  }

  const ipfsEndpoint = ipfsUri(ipfs || records.IPFS || records.ipfs);
  if (ipfsEndpoint) {
    pushService(services, {
      id: `${did}#ipfs`,
      type: "IPFS",
      serviceEndpoint: ipfsEndpoint,
    });
  }

  if (site) {
    pushService(services, {
      id: `${did}#on-chain-site`,
      type: "AtomRegistryOnChainSite",
      serviceEndpoint: {
        chainId: config.chainId,
        contract: config.siteRegistryContract,
        query: { site: { name: domain } },
      },
    });
  }

  return services;
}

function buildLinkedResources({ parsed, config, records, site }) {
  const resources = [];
  const did = parsed.did;
  const domain = parsed.domain;

  resources.push({
    id: `${did}#atomregistry-state`,
    path: `${did}/atomregistry-state`,
    type: "AtomRegistryDomainState",
    rel: "onChainState",
    resourceFormat: "application/json",
    endpoint: `cosmwasm://${config.chainId}/${config.registryContract}/${encodeURIComponent(JSON.stringify({ owner_of: { domain } }))}`,
  });

  if (Object.keys(records).length > 0) {
    resources.push({
      id: `${did}#resolver-records`,
      path: `${did}/resolver-records`,
      type: "AtomRegistryResolverRecords",
      rel: "metadata",
      resourceFormat: "application/json",
      resource: records,
    });
  }

  if (site) {
    resources.push({
      id: `${did}#site-resource`,
      path: `${did}/site`,
      type: "AtomRegistryOnChainSite",
      rel: "encodedRepresentation",
      resourceFormat: "text/html",
      endpoint: `cosmwasm://${config.chainId}/${config.siteRegistryContract}/${encodeURIComponent(JSON.stringify({ site: { name: domain } }))}`,
    });
  }

  return resources;
}

async function buildDeterministicDocument(parsed, config, owner, records) {
  const [pubKeyBytes, ipfs, cosmosAddress, site] = await Promise.all([
    getAccountPubKey(config, owner),
    getIpfs(config, parsed.domain),
    getChainAddress(config, parsed.domain, "cosmoshub").then((v) => v || getChainAddress(config, parsed.domain, "cosmos")),
    getSite(config, parsed.domain),
  ]);

  const doc = {
    "@context": [DID_CONTEXT, IID_CONTEXT],
    id: parsed.did,
    alsoKnownAs: [
      `https://atomregistry.com/search.html?name=${encodeURIComponent(parsed.domain)}`,
      `urn:cosmos:${config.chainId}:atomregistry:domain:${encodeURIComponent(parsed.domain)}`,
    ],
  };

  if (owner) {
    doc.alsoKnownAs.push(`urn:cosmos:${config.chainId}:address:${owner}`);
  }

  const publicKeyMultibase = secp256k1PublicKeyToMultibase(pubKeyBytes);
  if (publicKeyMultibase) {
    const keyId = `${parsed.did}#owner-key-1`;
    doc.controller = parsed.did;
    doc.verificationMethod = [
      {
        id: keyId,
        type: "EcdsaSecp256k1VerificationKey2019",
        controller: parsed.did,
        publicKeyMultibase,
      },
    ];
    doc.authentication = [keyId];
    doc.assertionMethod = [keyId];
    doc.capabilityInvocation = [keyId];
    doc.capabilityDelegation = [keyId];
  }

  const services = buildServices({ parsed, config, records, ipfs, site, cosmosAddress: cosmosAddress || owner });
  if (services.length > 0) doc.service = services;

  const linkedResource = buildLinkedResources({ parsed, config, records, site });
  if (linkedResource.length > 0) doc.linkedResource = linkedResource;

  return doc;
}

function didDocumentMetadata(parsed, config, owner, derived = true) {
  const metadata = {
    deactivated: false,
    versionId: derived ? `atomregistry-derived:${config.chainId}:${parsed.domain}` : `atomregistry-stored:${config.chainId}:${parsed.domain}`,
    atomregistry: {
      chainId: config.chainId,
      chainspace: config.chainspace,
      namespace: config.namespace,
      domain: parsed.domain,
      owner: owner || null,
      registryContract: config.registryContract,
      resolverContract: config.resolverContract,
      didResolverContract: config.didResolverContract || null,
    },
  };
  if (parsed.did !== parsed.canonicalDid || !parsed.versionWasExplicit) {
    metadata.canonicalId = parsed.canonicalDid;
    metadata.equivalentId = [parsed.did, parsed.canonicalDid].filter((v, i, arr) => arr.indexOf(v) === i);
  }
  return metadata;
}

function successResult(didDocument, didDocumentMetadata, parsed) {
  return {
    didDocument,
    didDocumentMetadata,
    didResolutionMetadata: {
      contentType: "application/did+ld+json",
      pattern: "^did:cosmos:(1:)?cosmoshub:atomregistry:.+$",
      did: parsed.did,
    },
  };
}

export function errorResult(error, message) {
  return {
    didDocument: null,
    didDocumentMetadata: {},
    didResolutionMetadata: {
      error,
      message,
    },
  };
}

export async function resolveAtomRegistryDid(identifier, config = CONFIG) {
  let parsed;
  try {
    parsed = parseAtomRegistryDid(identifier, config);
  } catch (err) {
    return errorResult(err.code || "invalidDid", err.message || String(err));
  }

  const owner = await getOwner(config, parsed.domain);
  if (!owner) {
    return errorResult("notFound", `AtomRegistry domain is not registered or owner_of returned null: ${parsed.domain}`);
  }

  const onChainDocResponse = await queryOnChainDidDocument(config, parsed.did);
  const onChainDoc = normalizeDidDocument(onChainDocResponse, parsed.did);
  if (onChainDoc) {
    return successResult(onChainDoc, didDocumentMetadata(parsed, config, owner, false), parsed);
  }

  const records = await getAllRecords(config, parsed.domain);
  const recordDoc = customDocFromRecords(records, parsed.did);
  if (recordDoc) {
    return successResult(recordDoc, didDocumentMetadata(parsed, config, owner, false), parsed);
  }

  const didDocument = await buildDeterministicDocument(parsed, config, owner, records);
  return successResult(didDocument, didDocumentMetadata(parsed, config, owner, true), parsed);
}

export async function dereferenceAtomRegistryDidUrl(identifier, config = CONFIG) {
  const result = await resolveAtomRegistryDid(identifier, config);
  if (!result.didDocument) return result;
  const parsed = parseAtomRegistryDid(identifier, config);

  if (!parsed.fragment && !parsed.path) return result;

  const targetId = parsed.fragment ? `${parsed.did}#${parsed.fragment}` : null;
  const collections = [
    result.didDocument.verificationMethod,
    result.didDocument.authentication,
    result.didDocument.assertionMethod,
    result.didDocument.capabilityInvocation,
    result.didDocument.capabilityDelegation,
    result.didDocument.keyAgreement,
    result.didDocument.service,
    result.didDocument.linkedResource,
  ].filter(Boolean);

  if (targetId) {
    for (const collection of collections) {
      const values = Array.isArray(collection) ? collection : [collection];
      for (const entry of values) {
        if (entry && typeof entry === "object" && entry.id === targetId) {
          return {
            dereferencingMetadata: { contentType: "application/json" },
            contentStream: entry,
            contentMetadata: {},
          };
        }
        if (typeof entry === "string" && entry === targetId) {
          return {
            dereferencingMetadata: { contentType: "text/plain" },
            contentStream: entry,
            contentMetadata: {},
          };
        }
      }
    }
  }

  if (parsed.path) {
    const linked = (result.didDocument.linkedResource || []).find((r) => r.path === `${parsed.did}${parsed.path}` || r.path === parsed.path);
    if (linked) {
      return {
        dereferencingMetadata: { contentType: "application/json" },
        contentStream: linked,
        contentMetadata: {},
      };
    }
  }

  return {
    dereferencingMetadata: { error: "notFound", message: "DID URL fragment/path not found in DID document" },
    contentStream: null,
    contentMetadata: {},
  };
}
