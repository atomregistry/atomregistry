import { base64ToBytes } from "./base58.mjs";

export class LcdError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "LcdError";
    this.details = details;
  }
}

function withTimeout(ms) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return { controller, done: () => clearTimeout(timeout) };
}

async function fetchJson(url, timeoutMs) {
  const { controller, done } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { accept: "application/json" },
    });
    const text = await res.text();
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`non-JSON response ${res.status}: ${text.slice(0, 160)}`);
    }
    if (!res.ok) {
      const msg = json?.message || json?.error || text || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  } finally {
    done();
  }
}

export async function lcdGet(config, path) {
  const errors = [];
  for (const endpoint of config.lcdEndpoints) {
    const url = `${endpoint}${path.startsWith("/") ? path : `/${path}`}`;
    try {
      return await fetchJson(url, config.requestTimeoutMs);
    } catch (err) {
      errors.push({ endpoint, error: err?.message || String(err) });
    }
  }
  throw new LcdError(`all LCD endpoints failed for ${path}`, errors);
}

export async function smartQuery(config, contract, query) {
  const encoded = encodeURIComponent(Buffer.from(JSON.stringify(query), "utf8").toString("base64"));
  const json = await lcdGet(config, `/cosmwasm/wasm/v1/contract/${contract}/smart/${encoded}`);
  if (json && Object.prototype.hasOwnProperty.call(json, "data")) return json.data;
  return json;
}

function unwrapValue(result) {
  if (result == null) return null;
  if (typeof result === "string") return result || null;
  if (typeof result === "boolean") return result;
  if (typeof result !== "object") return result;
  for (const key of ["value", "record", "address", "owner", "ipfs", "hash", "cid", "name", "domain"]) {
    if (typeof result[key] === "string" && result[key]) return result[key];
  }
  if (result.data && typeof result.data !== "object") return result.data;
  return result;
}

export function normalizeOwner(result) {
  const value = unwrapValue(result);
  if (typeof value === "string") return value.startsWith("cosmos1") ? value : null;
  if (value && typeof value === "object") {
    for (const key of ["owner", "address", "addr"]) {
      if (typeof value[key] === "string" && value[key].startsWith("cosmos1")) return value[key];
    }
  }
  return null;
}

export async function getOwner(config, domain) {
  const variants = [
    { owner_of: { domain } },
    { owner_of: { name: domain } },
  ];
  const errors = [];
  for (const query of variants) {
    try {
      const result = await smartQuery(config, config.registryContract, query);
      const owner = normalizeOwner(result);
      if (owner) return owner;
      if (result === null || result?.owner === null) return null;
    } catch (err) {
      errors.push(err?.message || String(err));
    }
  }
  return null;
}

function normalizeRecords(result) {
  if (!result) return {};
  const source = result.records || result.data || result;
  if (Array.isArray(source)) {
    const out = {};
    for (const entry of source) {
      if (Array.isArray(entry) && entry.length >= 2) out[String(entry[0])] = entry[1];
      else if (entry && typeof entry === "object") {
        const k = entry.record_type || entry.type || entry.key || entry.name;
        const v = entry.value || entry.record || entry.address || entry.hash;
        if (k && v != null) out[String(k)] = v;
      }
    }
    return out;
  }
  if (source && typeof source === "object") return { ...source };
  return {};
}

async function getRecordByType(config, domain, recordType) {
  const variants = [
    { get_record: { domain, record_type: recordType } },
    { get_record: { name: domain, record_type: recordType } },
    { resolve: { name: domain, record_type: recordType } },
    { resolve: { domain, record_type: recordType } },
  ];
  for (const query of variants) {
    try {
      const result = await smartQuery(config, config.resolverContract, query);
      const value = unwrapValue(result);
      if (value != null && value !== "") return value;
    } catch {
      // Keep going. Existing docs have shown both get_record and resolve variants.
    }
  }
  return null;
}

export async function getAllRecords(config, domain) {
  const variants = [
    { get_all_records: { domain, start_after: null, limit: 100 } },
    { get_all_records: { name: domain, start_after: null, limit: 100 } },
  ];
  for (const query of variants) {
    try {
      const result = await smartQuery(config, config.resolverContract, query);
      const records = normalizeRecords(result);
      if (Object.keys(records).length > 0) return records;
    } catch {
      // Fallback below.
    }
  }

  const out = {};
  const types = [
    "A",
    "AAAA",
    "CNAME",
    "URL",
    "URI",
    "TXT",
    "DID",
    "DID_DOCUMENT",
    "DID_DOCUMENT_JSON",
    "didDocument",
    "did-document",
  ];
  await Promise.all(
    types.map(async (type) => {
      const value = await getRecordByType(config, domain, type);
      if (value != null) out[type] = value;
    })
  );
  return out;
}

export async function getIpfs(config, domain) {
  for (const query of [{ get_ipfs: { domain } }, { get_ipfs: { name: domain } }]) {
    try {
      const result = await smartQuery(config, config.resolverContract, query);
      const value = unwrapValue(result);
      if (typeof value === "string" && value) return value;
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getChainAddress(config, domain, chain) {
  for (const query of [{ get_address: { domain, chain } }, { get_address: { name: domain, chain } }]) {
    try {
      const result = await smartQuery(config, config.resolverContract, query);
      const value = unwrapValue(result);
      if (typeof value === "string" && value) return value;
    } catch {
      // ignore
    }
  }
  return null;
}

export async function getSite(config, domain) {
  if (!config.siteRegistryContract) return null;
  try {
    const hasSite = await smartQuery(config, config.siteRegistryContract, { has_site: { name: domain } });
    const exists = hasSite === true || hasSite?.has_site === true || hasSite?.exists === true;
    if (!exists) return null;
  } catch {
    // Some deployments may not have has_site; try direct query.
  }
  try {
    return await smartQuery(config, config.siteRegistryContract, { site: { name: domain } });
  } catch {
    return null;
  }
}

function findSecp256k1PubKey(node) {
  if (!node || typeof node !== "object") return null;
  if (typeof node["@type"] === "string" && /secp256k1\.PubKey$/.test(node["@type"]) && typeof node.key === "string") {
    return base64ToBytes(node.key);
  }
  for (const value of Object.values(node)) {
    const found = findSecp256k1PubKey(value);
    if (found) return found;
  }
  return null;
}

export async function getAccountPubKey(config, address) {
  try {
    const account = await lcdGet(config, `/cosmos/auth/v1beta1/accounts/${address}`);
    return findSecp256k1PubKey(account);
  } catch {
    return null;
  }
}

export async function queryOnChainDidDocument(config, did) {
  if (!config.didResolverContract) return null;
  try {
    const result = await smartQuery(config, config.didResolverContract, { query_identifier_document: { id: did } });
    return result || null;
  } catch {
    return null;
  }
}
