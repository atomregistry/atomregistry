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

const CONTRACT_NAME: &str = "crates.io:atom-names-resolver";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cw_serde]
pub struct InstantiateMsg { pub admin: String, pub registry: String }

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    SetText { name: String, key: String, value: String },
    DeleteText { name: String, key: String },
    SetFederation { name: String, chain: String, address: String },
    DeleteFederation { name: String, chain: String },
    ClearAll { name: String },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Text { name: String, key: String },
    Texts { name: String, start_after: Option<String>, limit: Option<u32> },
    Federation { name: String, chain: String },
    Federations { name: String },
}

#[cw_serde]
pub struct Config { pub admin: Addr, pub pending_admin: Option<Addr>, pub registry: Addr }
const CONFIG: Item<Config> = Item::new("config");
const TEXTS: Map<(&str, &str), String> = Map::new("texts");
const FEDS: Map<(&str, &str), String> = Map::new("feds");

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
    CONFIG.save(deps.storage, &Config {
        admin: deps.api.addr_validate(&msg.admin)?,
        pending_admin: None,
        registry: deps.api.addr_validate(&msg.registry)?,
    })?;
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
        ExecuteMsg::SetText { name, key, value } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            TEXTS.save(deps.storage, (&name, key.as_str()), &value)?;
            Ok(Response::new().add_attribute("action", "set_text"))
        }
        ExecuteMsg::DeleteText { name, key } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            TEXTS.remove(deps.storage, (&name, key.as_str()));
            Ok(Response::new().add_attribute("action", "delete_text"))
        }
        ExecuteMsg::SetFederation { name, chain, address } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            FEDS.save(deps.storage, (&name, chain.as_str()), &address)?;
            Ok(Response::new().add_attribute("action", "set_federation"))
        }
        ExecuteMsg::DeleteFederation { name, chain } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            FEDS.remove(deps.storage, (&name, chain.as_str()));
            Ok(Response::new().add_attribute("action", "delete_federation"))
        }
        ExecuteMsg::ClearAll { name } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            let text_keys: StdResult<Vec<String>> = TEXTS.prefix(&name).range(deps.storage, None, None, Order::Ascending).map(|x| x.map(|(k, _)| k.to_string())).collect();
            for key in text_keys? { TEXTS.remove(deps.storage, (&name, key.as_str())); }
            let fed_keys: StdResult<Vec<String>> = FEDS.prefix(&name).range(deps.storage, None, None, Order::Ascending).map(|x| x.map(|(k, _)| k.to_string())).collect();
            for key in fed_keys? { FEDS.remove(deps.storage, (&name, key.as_str())); }
            Ok(Response::new().add_attribute("action", "clear_all"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Text { name, key } => to_json_binary(&TEXTS.may_load(deps.storage, (&normalize_name(&name)?, key.as_str()))?),
        QueryMsg::Texts { name, start_after, limit } => {
            let name = normalize_name(&name)?;
            let start = start_after.as_deref().map(Bound::exclusive);
            let out: StdResult<Vec<(String, String)>> = TEXTS.prefix(&name).range(deps.storage, start, None, Order::Ascending)
                .take(bounded_limit(limit, 20, 100)).map(|r| r.map(|(k,v)| (k.to_string(), v))).collect();
            to_json_binary(&out?)
        }
        QueryMsg::Federation { name, chain } => to_json_binary(&FEDS.may_load(deps.storage, (&normalize_name(&name)?, chain.as_str()))?),
        QueryMsg::Federations { name } => {
            let name = normalize_name(&name)?;
            let out: StdResult<Vec<(String, String)>> = FEDS.prefix(&name).range(deps.storage, None, None, Order::Ascending).map(|r| r.map(|(k,v)| (k.to_string(), v))).collect();
            to_json_binary(&out?)
        }
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> { Ok(Response::new()) }
