import http from "node:http";
import { CONFIG } from "./config.mjs";
import { dereferenceAtomRegistryDidUrl, resolveAtomRegistryDid } from "./document.mjs";

function sendJson(res, status, body, contentType = "application/json") {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": `${contentType}; charset=utf-8`,
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function identifierFromPath(pathname, prefix) {
  if (!pathname.startsWith(prefix)) return null;
  const raw = pathname.slice(prefix.length);
  return raw ? decodeURIComponent(raw) : null;
}

function landing() {
  return {
    service: "atomregistry-did-cosmos-driver",
    method: "did:cosmos",
    supportedPattern: "^did:cosmos:(1:)?cosmoshub:atomregistry:.+$",
    examples: [
      "did:cosmos:1:cosmoshub:atomregistry:cosmos.atom",
      "did:cosmos:cosmoshub:atomregistry:cosmos.atom",
    ],
    contracts: {
      registry: CONFIG.registryContract,
      resolver: CONFIG.resolverContract,
      siteRegistry: CONFIG.siteRegistryContract,
      didResolver: CONFIG.didResolverContract || null,
    },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,OPTIONS",
        "access-control-allow-headers": "accept,content-type",
      });
      return res.end();
    }
    if (req.method !== "GET") {
      return sendJson(res, 405, { error: "methodNotAllowed" });
    }
    if (url.pathname === "/" || url.pathname === "/healthz") {
      return sendJson(res, 200, landing());
    }

    const resolvePrefixes = ["/1.0/identifiers/", "/identifiers/"];
    for (const prefix of resolvePrefixes) {
      const identifier = identifierFromPath(url.pathname, prefix);
      if (identifier) {
        const result = await resolveAtomRegistryDid(identifier, CONFIG);
        const status = result.didResolutionMetadata?.error ? (result.didResolutionMetadata.error === "notFound" ? 404 : 400) : 200;
        return sendJson(res, status, result, "application/did-resolution+json");
      }
    }

    const dereferencePrefixes = ["/1.0/dereference/", "/dereference/"];
    for (const prefix of dereferencePrefixes) {
      const identifier = identifierFromPath(url.pathname, prefix);
      if (identifier) {
        const result = await dereferenceAtomRegistryDidUrl(identifier, CONFIG);
        const status = result.dereferencingMetadata?.error ? 404 : 200;
        return sendJson(res, status, result, "application/json");
      }
    }

    return sendJson(res, 404, { error: "notFound" });
  } catch (err) {
    return sendJson(res, 500, { error: "internalError", message: err?.message || String(err) });
  }
});

server.listen(CONFIG.port, () => {
  console.log(`atomregistry did:cosmos driver listening on :${CONFIG.port}`);
});
