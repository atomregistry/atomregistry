export const CONFIG = Object.freeze({
  chainspace: process.env.ATOMREGISTRY_DID_CHAINSPACE || process.env.ATOMREGISTRY_CHAINSPACE || "cosmoshub",
  chainId: process.env.ATOMREGISTRY_DID_CHAIN_ID || process.env.ATOMREGISTRY_CHAIN_ID || "cosmoshub-4",
  namespace: process.env.ATOMREGISTRY_DID_NAMESPACE || process.env.ATOMREGISTRY_NAMESPACE || "atomregistry",

  registryContract:
    process.env.ATOMREGISTRY_REGISTRY_CONTRACT ||
    "cosmos16nff0lmuegn2zr6ca3dp8jnqltpq2c9ayhmqn3avjq0wne95h2xqkhn9qe",
  resolverContract:
    process.env.ATOMREGISTRY_RESOLVER_CONTRACT ||
    "cosmos1swmjnderkae2hpegvt75dn34kya388vydxg5k5mzd0dl6wme2teq2xxpkv",
  siteRegistryContract:
    process.env.ATOMREGISTRY_SITE_REGISTRY_CONTRACT ||
    "cosmos1xg6jh7nechv6kxrw35m08qdpaysnu97xjz5alql75p2k5xrcdvjs8rx7jt",

  // Set this to the same address as resolverContract after AtomRegistry migrates the
  // resolver, or to the adapter contract address if they deploy the adapter from /contract.
  didResolverContract: process.env.ATOMREGISTRY_DID_RESOLVER_CONTRACT || "",

  lcdEndpoints: (process.env.ATOMREGISTRY_LCD_ENDPOINTS ||
    "https://cosmos-rest.publicnode.com,https://rest.cosmos.directory/cosmoshub,https://cosmoshub-api.lavenderfive.com,https://cosmos-api.polkachu.com")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean),

  requestTimeoutMs: Number(process.env.ATOMREGISTRY_REQUEST_TIMEOUT_MS || 12000),
  port: Number(process.env.PORT || 8080),
});

export const DID_CONTEXT = "https://www.w3.org/ns/did/v1";
export const IID_CONTEXT = "https://w3id.org/earth/NS/iid/v1";
