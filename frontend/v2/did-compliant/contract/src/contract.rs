use cosmwasm_std::{entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response};
use cw2::set_contract_version;
use serde_json::Value;

use crate::error::ContractError;
use crate::helpers::{
    assert_domain_controller, build_minimal_document, did_for_domain, metadata, parse_atomregistry_did,
    query_domain_owner, validate_did_document,
};
use crate::msg::{ConfigResponse, ExecuteMsg, InstantiateMsg, MigrateMsg, QueryIdentifierDocumentResponse, QueryMsg};
use crate::state::{Config, DidRecord, CONFIG, DID_RECORDS};

const CONTRACT_NAME: &str = "crates.io:atomregistry-did-cosmos-adapter";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(deps: DepsMut, env: Env, _info: MessageInfo, msg: InstantiateMsg) -> Result<Response, ContractError> {
    let cfg = Config {
        admin: msg.admin.map(|a| deps.api.addr_validate(&a)).transpose()?,
        pending_admin: None,
        registry_contract: deps.api.addr_validate(&msg.registry_contract)?,
        resolver_contract: deps.api.addr_validate(&msg.resolver_contract)?,
        site_registry_contract: msg
            .site_registry_contract
            .map(|a| deps.api.addr_validate(&a))
            .transpose()?,
        chain_id: env.block.chain_id,
        chainspace: msg.chainspace.unwrap_or_else(|| "cosmoshub".to_string()),
        namespace: msg.namespace.unwrap_or_else(|| "atomregistry".to_string()),
    };
    CONFIG.save(deps.storage, &cfg)?;
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("chainspace", cfg.chainspace.clone())
        .add_attribute("namespace", cfg.namespace.clone())
        .add_attribute("registry_contract", cfg.registry_contract.to_string())
        .add_attribute("resolver_contract", cfg.resolver_contract.to_string()))
}

#[entry_point]
pub fn execute(deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::CreateIdentifier {
            unique_id,
            namespace,
            chainspace,
            document,
        } => execute_create_identifier(deps, env, info, unique_id, namespace, chainspace, document),
        ExecuteMsg::SetDidDocument { id, document } => execute_set_did_document(deps, env, info, id, document, true),
        ExecuteMsg::UpdateIidDocument { id, document } => execute_set_did_document(deps, env, info, id, document, false),
        ExecuteMsg::DeactivateIdentifier { id } => execute_deactivate_identifier(deps, env, info, id),
        ExecuteMsg::ProposeAdmin { new_admin } => execute_propose_admin(deps, info, new_admin),
        ExecuteMsg::AcceptAdmin {} => execute_accept_admin(deps, info),
        ExecuteMsg::UpdateConfig {
            registry_contract,
            resolver_contract,
            site_registry_contract,
        } => execute_update_config(deps, info, registry_contract, resolver_contract, site_registry_contract),
    }
}

fn execute_create_identifier(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    unique_id: String,
    namespace: Option<String>,
    chainspace: Option<String>,
    document: Option<Value>,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    if namespace.as_deref().unwrap_or(&cfg.namespace) != cfg.namespace {
        return Err(ContractError::Unsupported {
            reason: "namespace mismatch".to_string(),
        });
    }
    if chainspace.as_deref().unwrap_or(&cfg.chainspace) != cfg.chainspace {
        return Err(ContractError::Unsupported {
            reason: "chainspace mismatch".to_string(),
        });
    }

    let id = did_for_domain(&unique_id, &cfg)?;
    if DID_RECORDS.has(deps.storage, &id) {
        return Err(ContractError::AlreadyExists {});
    }
    let parts = parse_atomregistry_did(&id, &cfg)?;
    let owner = assert_domain_controller(deps.as_ref(), &cfg, &parts.domain, &info.sender)?;

    let doc = match document {
        Some(doc) => {
            validate_did_document(&doc, &id)?;
            doc
        }
        None => build_minimal_document(&parts, &cfg, Some(&owner)),
    };

    let now = env.block.time.seconds();
    DID_RECORDS.save(
        deps.storage,
        &id,
        &DidRecord {
            document: doc,
            created_seconds: now,
            updated_seconds: now,
            version: 1,
            deactivated: false,
        },
    )?;

    Ok(Response::new()
        .add_attribute("action", "create_identifier")
        .add_attribute("id", id)
        .add_attribute("domain", parts.domain)
        .add_attribute("controller", owner))
}

fn execute_set_did_document(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
    document: Value,
    upsert: bool,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let parts = parse_atomregistry_did(&id, &cfg)?;
    let owner = assert_domain_controller(deps.as_ref(), &cfg, &parts.domain, &info.sender)?;
    validate_did_document(&document, &id)?;

    let now = env.block.time.seconds();
    let existing = DID_RECORDS.may_load(deps.storage, &id)?;
    if existing.is_none() && !upsert {
        return Err(ContractError::NotFound {});
    }
    if matches!(existing, Some(DidRecord { deactivated: true, .. })) {
        return Err(ContractError::Deactivated {});
    }

    let record = match existing {
        Some(mut old) => {
            old.document = document;
            old.updated_seconds = now;
            old.version += 1;
            old
        }
        None => DidRecord {
            document,
            created_seconds: now,
            updated_seconds: now,
            version: 1,
            deactivated: false,
        },
    };
    let version = record.version;
    DID_RECORDS.save(deps.storage, &id, &record)?;

    Ok(Response::new()
        .add_attribute("action", if upsert { "set_did_document" } else { "update_iid_document" })
        .add_attribute("id", id)
        .add_attribute("domain", parts.domain)
        .add_attribute("controller", owner)
        .add_attribute("version", version.to_string()))
}

fn execute_deactivate_identifier(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    id: String,
) -> Result<Response, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let parts = parse_atomregistry_did(&id, &cfg)?;
    let owner = assert_domain_controller(deps.as_ref(), &cfg, &parts.domain, &info.sender)?;

    DID_RECORDS.update(deps.storage, &id, |record| -> Result<DidRecord, ContractError> {
        let mut record = record.ok_or(ContractError::NotFound {})?;
        record.deactivated = true;
        record.updated_seconds = env.block.time.seconds();
        record.version += 1;
        Ok(record)
    })?;

    Ok(Response::new()
        .add_attribute("action", "deactivate_identifier")
        .add_attribute("id", id)
        .add_attribute("domain", parts.domain)
        .add_attribute("controller", owner))
}

fn execute_propose_admin(
    deps: DepsMut,
    info: MessageInfo,
    new_admin: String,
) -> Result<Response, ContractError> {
    CONFIG.update(deps.storage, |mut cfg| -> Result<Config, ContractError> {
        if cfg.admin.as_ref() != Some(&info.sender) {
            return Err(ContractError::Unauthorized {});
        }
        cfg.pending_admin = if new_admin.trim().is_empty() {
            None
        } else {
            Some(deps.api.addr_validate(&new_admin)?)
        };
        Ok(cfg)
    })?;
    Ok(Response::new()
        .add_attribute("action", "propose_admin")
        .add_attribute("pending_admin", new_admin))
}

fn execute_accept_admin(
    deps: DepsMut,
    info: MessageInfo,
) -> Result<Response, ContractError> {
    CONFIG.update(deps.storage, |mut cfg| -> Result<Config, ContractError> {
        if cfg.pending_admin.as_ref() != Some(&info.sender) {
            return Err(ContractError::Unauthorized {});
        }
        cfg.admin = cfg.pending_admin.take();
        Ok(cfg)
    })?;
    Ok(Response::new().add_attribute("action", "accept_admin"))
}

fn execute_update_config(
    deps: DepsMut,
    info: MessageInfo,
    registry_contract: Option<String>,
    resolver_contract: Option<String>,
    site_registry_contract: Option<String>,
) -> Result<Response, ContractError> {
    CONFIG.update(deps.storage, |mut cfg| -> Result<Config, ContractError> {
        if cfg.admin.as_ref() != Some(&info.sender) {
            return Err(ContractError::Unauthorized {});
        }
        if let Some(addr) = registry_contract {
            cfg.registry_contract = deps.api.addr_validate(&addr)?;
        }
        if let Some(addr) = resolver_contract {
            cfg.resolver_contract = deps.api.addr_validate(&addr)?;
        }
        if let Some(addr) = site_registry_contract {
            cfg.site_registry_contract = if addr.trim().is_empty() {
                None
            } else {
                Some(deps.api.addr_validate(&addr)?)
            };
        }
        Ok(cfg)
    })?;
    Ok(Response::new().add_attribute("action", "update_config"))
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> Result<Binary, ContractError> {
    match msg {
        QueryMsg::QueryIdentifierDocument { id } => to_json_binary(&query_identifier_document(deps, id)?).map_err(Into::into),
        QueryMsg::ResolveDid { did } => to_json_binary(&query_identifier_document(deps, did)?).map_err(Into::into),
        QueryMsg::GetConfig {} => to_json_binary(&query_config(deps)?).map_err(Into::into),
    }
}

fn query_identifier_document(deps: Deps, id: String) -> Result<QueryIdentifierDocumentResponse, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    let parts = parse_atomregistry_did(&id, &cfg)?;
    let owner = query_domain_owner(deps, &cfg, &parts.domain)?;

    if owner.is_none() {
        return Err(ContractError::NotFound {});
    }

    if let Some(record) = DID_RECORDS.may_load(deps.storage, &id)? {
        let meta = metadata(
            &cfg,
            &parts,
            owner.as_ref(),
            record.deactivated,
            false,
            record.version,
            Some(record.created_seconds),
            Some(record.updated_seconds),
        );
        let document = if record.deactivated { Value::Null } else { record.document };
        return Ok(QueryIdentifierDocumentResponse {
            did_document: document,
            did_document_metadata: meta,
        });
    }

    let doc = build_minimal_document(&parts, &cfg, owner.as_ref());
    Ok(QueryIdentifierDocumentResponse {
        did_document: doc,
        did_document_metadata: metadata(&cfg, &parts, owner.as_ref(), false, true, 0, None, None),
    })
}

fn query_config(deps: Deps) -> Result<ConfigResponse, ContractError> {
    let cfg = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        admin: cfg.admin,
        pending_admin: cfg.pending_admin,
        registry_contract: cfg.registry_contract,
        resolver_contract: cfg.resolver_contract,
        site_registry_contract: cfg.site_registry_contract,
        chain_id: cfg.chain_id,
        chainspace: cfg.chainspace,
        namespace: cfg.namespace,
    })
}

#[entry_point]
pub fn migrate(deps: DepsMut, _env: Env, _msg: MigrateMsg) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    Ok(Response::new()
        .add_attribute("action", "migrate")
        .add_attribute("contract", CONTRACT_NAME)
        .add_attribute("version", CONTRACT_VERSION))
}
