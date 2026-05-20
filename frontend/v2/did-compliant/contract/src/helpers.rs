use cosmwasm_std::{Addr, Deps, StdResult};
use percent_encoding::percent_decode_str;
use serde::de::DeserializeOwned;
use serde::Deserialize;
use serde_json::{json, Value};
use std::collections::BTreeSet;

use crate::error::ContractError;
use crate::msg::{AtomRegistryMetadata, DidDocumentMetadata};
use crate::state::Config;

pub const DID_CONTEXT: &str = "https://www.w3.org/ns/did/v1";
pub const IID_CONTEXT: &str = "https://w3id.org/earth/NS/iid/v1";

#[derive(Clone, Debug, PartialEq)]
pub struct DidParts {
    pub did: String,
    pub version: String,
    pub version_was_explicit: bool,
    pub chainspace: String,
    pub namespace: String,
    pub domain: String,
    pub canonical_id: String,
}

#[derive(Deserialize)]
struct OwnerObj {
    owner: Option<String>,
}

pub fn parse_atomregistry_did(id: &str, cfg: &Config) -> Result<DidParts, ContractError> {
    if !id.starts_with("did:cosmos:") {
        return Err(ContractError::InvalidDid {
            reason: "DID must start with lowercase did:cosmos:".to_string(),
        });
    }
    if id.contains('?') || id.contains('#') || id.contains('/') {
        return Err(ContractError::InvalidDid {
            reason: "pass only a DID to QueryIdentifierDocument; DID URL query is not supported".to_string(),
        });
    }

    let method_specific = &id["did:cosmos:".len()..];
    let parts: Vec<&str> = method_specific.split(':').collect();
    if parts.is_empty() || parts[0].is_empty() {
        return Err(ContractError::InvalidDid {
            reason: "missing method-specific-id".to_string(),
        });
    }

    let mut index = 0usize;
    let mut version = "1".to_string();
    let mut version_was_explicit = false;
    if parts[0].chars().all(|c| c.is_ascii_digit()) {
        if parts[0] == "0" || parts[0].starts_with('0') {
            return Err(ContractError::InvalidDid {
                reason: "version must be a positive integer without leading zeroes".to_string(),
            });
        }
        version = parts[0].to_string();
        version_was_explicit = true;
        index = 1;
    }

    let chainspace = parts.get(index).copied().unwrap_or_default().to_string();
    index += 1;
    let namespace = parts.get(index).copied().unwrap_or_default().to_string();
    index += 1;
    let unique = parts[index..].join(":");

    if version != "1" {
        return Err(ContractError::Unsupported {
            reason: format!("unsupported did:cosmos version {version}"),
        });
    }
    if chainspace != cfg.chainspace {
        return Err(ContractError::Unsupported {
            reason: format!("unsupported chainspace {chainspace}; expected {}", cfg.chainspace),
        });
    }
    if namespace != cfg.namespace {
        return Err(ContractError::Unsupported {
            reason: format!("unsupported namespace {namespace}; expected {}", cfg.namespace),
        });
    }
    if unique.is_empty() {
        return Err(ContractError::InvalidDid {
            reason: "missing AtomRegistry domain unique-id".to_string(),
        });
    }

    let decoded = percent_decode_str(&unique)
        .decode_utf8()
        .map_err(|_| ContractError::InvalidDid {
            reason: "invalid percent encoding in unique-id".to_string(),
        })?
        .to_lowercase();
    validate_domain(&decoded)?;

    let canonical_id = format!(
        "did:cosmos:1:{}:{}:{}",
        cfg.chainspace, cfg.namespace, decoded
    );

    Ok(DidParts {
        did: id.to_string(),
        version,
        version_was_explicit,
        chainspace,
        namespace,
        domain: decoded,
        canonical_id,
    })
}

pub fn did_for_domain(domain: &str, cfg: &Config) -> Result<String, ContractError> {
    let normalized = domain.trim().to_lowercase();
    validate_domain(&normalized)?;
    Ok(format!(
        "did:cosmos:1:{}:{}:{}",
        cfg.chainspace, cfg.namespace, normalized
    ))
}

pub fn validate_domain(domain: &str) -> Result<(), ContractError> {
    if domain.len() > 253 || !domain.contains('.') {
        return Err(ContractError::InvalidDid {
            reason: "domain unique-id must be a fully-qualified AtomRegistry name such as alice.atom".to_string(),
        });
    }
    for label in domain.split('.') {
        if label.is_empty() || label.len() > 63 {
            return Err(ContractError::InvalidDid {
                reason: "domain label length is invalid".to_string(),
            });
        }
        let bytes = label.as_bytes();
        if !bytes[0].is_ascii_alphanumeric() || !bytes[bytes.len() - 1].is_ascii_alphanumeric() {
            return Err(ContractError::InvalidDid {
                reason: "domain labels must start and end with alphanumeric characters".to_string(),
            });
        }
        if !bytes.iter().all(|b| b.is_ascii_alphanumeric() || *b == b'-') {
            return Err(ContractError::InvalidDid {
                reason: "domain labels may contain only lowercase ASCII letters, digits and hyphens".to_string(),
            });
        }
    }
    Ok(())
}

pub fn validate_did_document(doc: &Value, did: &str) -> Result<(), ContractError> {
    let obj = doc.as_object().ok_or_else(|| ContractError::InvalidDidDocument {
        reason: "document must be a JSON object".to_string(),
    })?;
    if obj.get("id").and_then(Value::as_str) != Some(did) {
        return Err(ContractError::InvalidDidDocument {
            reason: "document.id must exactly equal the DID being written".to_string(),
        });
    }

    let ctx = obj.get("@context").ok_or_else(|| ContractError::InvalidDidDocument {
        reason: "missing @context".to_string(),
    })?;
    let contexts: Vec<&str> = match ctx {
        Value::String(s) => vec![s.as_str()],
        Value::Array(items) => items.iter().filter_map(Value::as_str).collect(),
        _ => vec![],
    };
    if !contexts.contains(&DID_CONTEXT) || !contexts.contains(&IID_CONTEXT) {
        return Err(ContractError::InvalidDidDocument {
            reason: "@context must include DID Core and IID contexts".to_string(),
        });
    }

    if let Some(Value::Array(services)) = obj.get("service") {
        let mut seen = BTreeSet::new();
        for service in services {
            let sid = service
                .get("id")
                .and_then(Value::as_str)
                .ok_or_else(|| ContractError::InvalidDidDocument {
                    reason: "each service must have an id".to_string(),
                })?;
            if !seen.insert(sid.to_string()) {
                return Err(ContractError::InvalidDidDocument {
                    reason: "duplicate service.id values are not allowed".to_string(),
                });
            }
            if service.get("type").is_none() || service.get("serviceEndpoint").is_none() {
                return Err(ContractError::InvalidDidDocument {
                    reason: "each service must have type and serviceEndpoint".to_string(),
                });
            }
        }
    }

    Ok(())
}

fn wasm_smart<T: DeserializeOwned>(deps: Deps, contract: &Addr, msg: &Value) -> StdResult<T> {
    deps.querier.query_wasm_smart(contract.as_str(), msg)
}

pub fn query_domain_owner(deps: Deps, cfg: &Config, domain: &str) -> StdResult<Option<Addr>> {
    let msg_domain = json!({"owner_of": {"domain": domain}});
    if let Ok(owner) = wasm_smart::<Option<String>>(deps, &cfg.registry_contract, &msg_domain) {
        return owner.map(|a| deps.api.addr_validate(&a)).transpose();
    }
    if let Ok(obj) = wasm_smart::<OwnerObj>(deps, &cfg.registry_contract, &msg_domain) {
        return obj.owner.map(|a| deps.api.addr_validate(&a)).transpose();
    }

    let msg_name = json!({"owner_of": {"name": domain}});
    if let Ok(owner) = wasm_smart::<Option<String>>(deps, &cfg.registry_contract, &msg_name) {
        return owner.map(|a| deps.api.addr_validate(&a)).transpose();
    }
    if let Ok(obj) = wasm_smart::<OwnerObj>(deps, &cfg.registry_contract, &msg_name) {
        return obj.owner.map(|a| deps.api.addr_validate(&a)).transpose();
    }

    Ok(None)
}

pub fn assert_domain_controller(deps: Deps, cfg: &Config, domain: &str, sender: &Addr) -> Result<Addr, ContractError> {
    if cfg.admin.as_ref() == Some(sender) {
        return Ok(sender.clone());
    }
    let owner = query_domain_owner(deps, cfg, domain)?.ok_or(ContractError::NotFound {})?;
    if owner != *sender {
        return Err(ContractError::Unauthorized {});
    }
    Ok(owner)
}

pub fn build_minimal_document(parts: &DidParts, cfg: &Config, owner: Option<&Addr>) -> Value {
    let mut also_known_as = vec![
        Value::String(format!(
            "https://atomregistry.com/search.html?name={}",
            parts.domain
        )),
        Value::String(format!(
            "urn:cosmos:{}:atomregistry:domain:{}",
            cfg.chain_id, parts.domain
        )),
    ];
    if let Some(owner) = owner {
        also_known_as.push(Value::String(format!(
            "urn:cosmos:{}:address:{}",
            cfg.chain_id, owner
        )));
    }

    json!({
        "@context": [DID_CONTEXT, IID_CONTEXT],
        "id": parts.did,
        "alsoKnownAs": also_known_as,
        "service": [{
            "id": format!("{}#atomregistry", parts.did),
            "type": "AtomRegistryResolver",
            "serviceEndpoint": {
                "chainId": cfg.chain_id,
                "chainspace": cfg.chainspace,
                "namespace": cfg.namespace,
                "domain": parts.domain,
                "registryContract": cfg.registry_contract,
                "resolverContract": cfg.resolver_contract,
                "siteRegistryContract": cfg.site_registry_contract.as_ref().map(|a| a.to_string()),
                "query": { "owner_of": { "domain": parts.domain } }
            }
        }],
        "linkedResource": [{
            "id": format!("{}#atomregistry-state", parts.did),
            "path": format!("{}/atomregistry-state", parts.did),
            "type": "AtomRegistryDomainState",
            "rel": "onChainState",
            "resourceFormat": "application/json",
            "endpoint": format!("cosmwasm://{}/{}/owner_of/{}", cfg.chain_id, cfg.registry_contract, parts.domain)
        }]
    })
}

#[allow(clippy::too_many_arguments)]
pub fn metadata(
    cfg: &Config,
    parts: &DidParts,
    owner: Option<&Addr>,
    deactivated: bool,
    derived: bool,
    version: u64,
    created_seconds: Option<u64>,
    updated_seconds: Option<u64>,
) -> DidDocumentMetadata {
    let needs_equivalence = parts.did != parts.canonical_id || !parts.version_was_explicit;
    DidDocumentMetadata {
        deactivated,
        version_id: if derived {
            format!("atomregistry-derived:{}:{}", cfg.chain_id, parts.domain)
        } else {
            format!("atomregistry-stored:{}:{}:{}", cfg.chain_id, parts.domain, version)
        },
        created: created_seconds.map(unix_to_rfc3339),
        updated: updated_seconds.map(unix_to_rfc3339),
        canonical_id: needs_equivalence.then(|| parts.canonical_id.clone()),
        equivalent_id: needs_equivalence.then(|| vec![parts.did.clone(), parts.canonical_id.clone()]),
        atomregistry: AtomRegistryMetadata {
            chain_id: cfg.chain_id.clone(),
            chainspace: cfg.chainspace.clone(),
            namespace: cfg.namespace.clone(),
            domain: parts.domain.clone(),
            owner: owner.map(|a| a.to_string()),
            registry_contract: cfg.registry_contract.to_string(),
            resolver_contract: cfg.resolver_contract.to_string(),
            site_registry_contract: cfg.site_registry_contract.as_ref().map(|a| a.to_string()),
            derived,
        },
    }
}

pub fn unix_to_rfc3339(seconds: u64) -> String {
    let days = (seconds / 86_400) as i64;
    let secs_of_day = seconds % 86_400;
    let hour = secs_of_day / 3_600;
    let minute = (secs_of_day % 3_600) / 60;
    let second = secs_of_day % 60;

    let z = days + 719_468;
    let era = if z >= 0 { z } else { z - 146_096 } / 146_097;
    let doe = z - era * 146_097;
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let mut y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = doy - (153 * mp + 2) / 5 + 1;
    let m = mp + if mp < 10 { 3 } else { -9 };
    if m <= 2 {
        y += 1;
    }

    format!("{y:04}-{m:02}-{d:02}T{hour:02}:{minute:02}:{second:02}Z")
}
