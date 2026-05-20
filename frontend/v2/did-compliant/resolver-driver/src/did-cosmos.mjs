const DID_PREFIX = "did:cosmos:";
const VERSION_RE = /^[1-9][0-9]*$/;
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export class DidParseError extends Error {
  constructor(message, code = "invalidDid") {
    super(message);
    this.name = "DidParseError";
    this.code = code;
  }
}

export function encodeUniqueId(value) {
  return encodeURIComponent(value).replace(/%2E/gi, ".").replace(/%2D/gi, "-").replace(/%5F/gi, "_");
}

export function decodeUniqueId(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    throw new DidParseError("unique-id contains invalid percent encoding");
  }
}

export function didForDomain(domain, { version = "1", chainspace = "cosmoshub", namespace = "atomregistry" } = {}) {
  const normalized = normalizeDomain(domain);
  return `did:cosmos:${version}:${chainspace}:${namespace}:${encodeUniqueId(normalized)}`;
}

export function normalizeDomain(domain) {
  if (typeof domain !== "string") throw new DidParseError("domain must be a string");
  const normalized = domain.trim().toLowerCase();
  if (!DOMAIN_RE.test(normalized)) {
    throw new DidParseError(`invalid AtomRegistry domain unique-id: ${domain}`);
  }
  return normalized;
}

export function splitDidUrl(input) {
  if (typeof input !== "string" || input.trim() === "") {
    throw new DidParseError("identifier is empty");
  }
  const value = input.trim();
  const hashIndex = value.indexOf("#");
  const beforeFragment = hashIndex === -1 ? value : value.slice(0, hashIndex);
  const fragment = hashIndex === -1 ? "" : value.slice(hashIndex + 1);

  if (beforeFragment.includes("?")) {
    throw new DidParseError("did:cosmos DID URLs do not support query parts", "invalidDidUrl");
  }

  const slashIndex = beforeFragment.indexOf("/", DID_PREFIX.length);
  const did = slashIndex === -1 ? beforeFragment : beforeFragment.slice(0, slashIndex);
  const path = slashIndex === -1 ? "" : beforeFragment.slice(slashIndex);
  return { did, path, fragment, didUrl: value };
}

export function parseAtomRegistryDid(input, config) {
  const { did, path, fragment, didUrl } = splitDidUrl(input);

  if (!did.startsWith(DID_PREFIX)) {
    throw new DidParseError("DID must start with lowercase did:cosmos:");
  }
  const methodSpecificId = did.slice(DID_PREFIX.length);
  if (methodSpecificId.length === 0) {
    throw new DidParseError("missing did:cosmos method-specific-id");
  }

  const parts = methodSpecificId.split(":");
  let index = 0;
  let version = "1";
  let versionWasExplicit = false;

  if (VERSION_RE.test(parts[0])) {
    version = parts[0];
    versionWasExplicit = true;
    index = 1;
  }

  const chainspace = parts[index++];
  if (!chainspace) throw new DidParseError("missing chainspace");

  const namespace = parts[index++];
  const uniqueRaw = parts.slice(index).join(":");

  if (chainspace !== config.chainspace) {
    throw new DidParseError(`unsupported chainspace '${chainspace}', expected '${config.chainspace}'`, "methodNotSupported");
  }
  if (version !== "1") {
    throw new DidParseError(`unsupported did:cosmos version '${version}'`, "methodNotSupported");
  }
  if (!namespace || !uniqueRaw) {
    throw new DidParseError("this driver resolves AtomRegistry asset DIDs only: did:cosmos:1:cosmoshub:atomregistry:<domain>", "notFound");
  }
  if (namespace !== config.namespace) {
    throw new DidParseError(`unsupported namespace '${namespace}', expected '${config.namespace}'`, "methodNotSupported");
  }

  const domain = normalizeDomain(decodeUniqueId(uniqueRaw));
  const canonicalDid = didForDomain(domain, { version: "1", chainspace: config.chainspace, namespace: config.namespace });

  return {
    did,
    didUrl,
    path,
    fragment,
    version,
    versionWasExplicit,
    chainspace,
    namespace,
    uniqueId: domain,
    domain,
    canonicalDid,
  };
}
