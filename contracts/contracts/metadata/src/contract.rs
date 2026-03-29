use atom_names_types::{EmptyMigrateMsg, OwnerOfResponse, RegistryQueryMsg};
use atom_names_utils::{bounded_limit, normalize_name};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdError, StdResult, WasmQuery,
};
use cw2::set_contract_version;
use cw_storage_plus::{Bound, Item, Map};
use thiserror::Error;

const CONTRACT_NAME: &str = "crates.io:atom-names-metadata";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cw_serde]
pub struct InstantiateMsg { pub admin: String, pub registry: String }

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    SetField { name: String, key: String, value: String, public: bool },
    DeleteField { name: String, key: String },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Field { name: String, key: String, include_private: bool },
    Fields { name: String, include_private: bool, start_after: Option<String>, limit: Option<u32> },
}

#[cw_serde]
pub struct Config { pub admin: Addr, pub pending_admin: Option<Addr>, pub registry: Addr }
#[cw_serde]
pub struct FieldValue { pub value: String, pub public: bool }
const CONFIG: Item<Config> = Item::new("config");
const FIELDS: Map<(&str, &str), FieldValue> = Map::new("fields");

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
}

fn assert_owner(deps: Deps, registry: &Addr, sender: &Addr, name: &str) -> Result<(), ContractError> {
    let owner: OwnerOfResponse = deps.querier.query(&WasmQuery::Smart {
        contract_addr: registry.to_string(),
        msg: to_json_binary(&RegistryQueryMsg::OwnerOf { name: name.to_string() })?,
    }.into())?;
    if owner.owner.as_deref() != Some(sender.as_str()) { return Err(ContractError::Unauthorized); }
    Ok(())
}

#[entry_point]
pub fn instantiate(deps: DepsMut, _env: Env, _info: MessageInfo, msg: InstantiateMsg) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &Config { admin: deps.api.addr_validate(&msg.admin)?, pending_admin: None, registry: deps.api.addr_validate(&msg.registry)? })?;
    Ok(Response::new())
}

#[entry_point]
pub fn execute(mut deps: DepsMut, _env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::TransferAdmin { new_admin } => {
            let pending = deps.api.addr_validate(&new_admin)?;
            let mut cfg = CONFIG.load(deps.storage)?;
            if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
            cfg.pending_admin = Some(pending);
            CONFIG.save(deps.storage, &cfg)?;
            Ok(Response::new())
        }
        ExecuteMsg::AcceptAdmin {} => {
            let mut cfg = CONFIG.load(deps.storage)?;
            let pending = cfg.pending_admin.clone().ok_or(ContractError::NoPendingAdmin)?;
            if pending != info.sender { return Err(ContractError::Unauthorized); }
            cfg.admin = pending;
            cfg.pending_admin = None;
            CONFIG.save(deps.storage, &cfg)?;
            Ok(Response::new())
        }
        ExecuteMsg::SetField { name, key, value, public } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            FIELDS.save(deps.storage, (&name, key.as_str()), &FieldValue { value, public })?;
            Ok(Response::new().add_attribute("action", "set_field"))
        }
        ExecuteMsg::DeleteField { name, key } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            FIELDS.remove(deps.storage, (&name, key.as_str()));
            Ok(Response::new().add_attribute("action", "delete_field"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Field { name, key, include_private } => {
            let field = FIELDS.may_load(deps.storage, (&normalize_name(&name)?, key.as_str()))?;
            let visible = field.filter(|f| include_private || f.public);
            to_json_binary(&visible)
        }
        QueryMsg::Fields { name, include_private, start_after, limit } => {
            let name = normalize_name(&name)?;
            let start = start_after.as_deref().map(Bound::exclusive);
            let out: StdResult<Vec<(String, FieldValue)>> = FIELDS.prefix(&name).range(deps.storage, start, None, Order::Ascending)
                .filter_map(|item| match item {
                    Ok((k, v)) if include_private || v.public => Some(Ok((k.to_string(), v))),
                    Ok(_) => None,
                    Err(e) => Some(Err(e)),
                })
                .take(bounded_limit(limit, 20, 100))
                .collect();
            to_json_binary(&out?)
        }
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> { Ok(Response::new()) }
