use atom_names_types::{EmptyMigrateMsg, ExistsResponse, RegistryExecuteMsg, RegistryQueryMsg};
use atom_names_utils::{expect_exact_payment, normalize_label, now, one_coin};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Order, Response, StdError, StdResult, Uint128, WasmMsg, WasmQuery,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use thiserror::Error;

const CONTRACT_NAME: &str = "crates.io:atom-names-tld-manager";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub registry: String,
    pub treasury: String,
    pub denom: String,
    pub tld_price: Uint128,
    pub min_commit_age: u64,
    pub max_commit_age: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    SetReserved { label: String, reserved: bool },
    Commit { commitment: String },
    RegisterTld { label: String, owner: String, secret: String },
    CleanExpired { limit: Option<u32> },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Reserved { label: String },
    Commitment { sender: String },
}

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub pending_admin: Option<Addr>,
    pub registry: Addr,
    pub treasury: Addr,
    pub denom: String,
    pub tld_price: Uint128,
    pub min_commit_age: u64,
    pub max_commit_age: u64,
}

#[cw_serde]
pub struct CommitmentRecord {
    pub commitment: String,
    pub created_at: u64,
}

const CONFIG: Item<Config> = Item::new("config");
const RESERVED: Map<&str, bool> = Map::new("reserved");
const COMMITMENTS: Map<&Addr, CommitmentRecord> = Map::new("commitments");

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
    #[error("reserved label")]
    Reserved,
    #[error("commitment missing")]
    CommitmentMissing,
    #[error("commitment too young")]
    CommitmentTooYoung,
    #[error("commitment expired")]
    CommitmentExpired,
    #[error("commitment mismatch")]
    CommitmentMismatch,
    #[error("tld already exists")]
    Exists,
}

fn derive_commitment(owner: &str, label: &str, secret: &str) -> String {
    format!("{}:{}:{}", owner, label, secret)
}

#[entry_point]
pub fn instantiate(deps: DepsMut, _env: Env, _info: MessageInfo, msg: InstantiateMsg) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &Config {
        admin: deps.api.addr_validate(&msg.admin)?,
        pending_admin: None,
        registry: deps.api.addr_validate(&msg.registry)?,
        treasury: deps.api.addr_validate(&msg.treasury)?,
        denom: msg.denom,
        tld_price: msg.tld_price,
        min_commit_age: msg.min_commit_age,
        max_commit_age: msg.max_commit_age,
    })?;
    Ok(Response::new())
}

#[entry_point]
pub fn execute(mut deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::TransferAdmin { new_admin } => {
            let pending = deps.api.addr_validate(&new_admin)?;
            let mut cfg = CONFIG.load(deps.storage)?;
            if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
            cfg.pending_admin = Some(pending);
            CONFIG.save(deps.storage, &cfg)?;
            Ok(Response::new().add_attribute("action", "transfer_admin"))
        }
        ExecuteMsg::AcceptAdmin {} => {
            let mut cfg = CONFIG.load(deps.storage)?;
            let pending = cfg.pending_admin.clone().ok_or(ContractError::NoPendingAdmin)?;
            if pending != info.sender { return Err(ContractError::Unauthorized); }
            cfg.admin = pending;
            cfg.pending_admin = None;
            CONFIG.save(deps.storage, &cfg)?;
            Ok(Response::new().add_attribute("action", "accept_admin"))
        }
        ExecuteMsg::SetReserved { label, reserved } => {
            let cfg = CONFIG.load(deps.storage)?;
            if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
            let label = normalize_label(&label)?;
            if reserved { RESERVED.save(deps.storage, &label, &true)?; } else { RESERVED.remove(deps.storage, &label); }
            Ok(Response::new().add_attribute("action", "set_reserved").add_attribute("label", label))
        }
        ExecuteMsg::Commit { commitment } => {
            COMMITMENTS.save(deps.storage, &info.sender, &CommitmentRecord { commitment, created_at: now(&env) })?;
            Ok(Response::new().add_attribute("action", "commit"))
        }
        ExecuteMsg::RegisterTld { label, owner, secret } => {
            let cfg = CONFIG.load(deps.storage)?;
            let label = normalize_label(&label)?;
            if RESERVED.may_load(deps.storage, &label)?.unwrap_or(false) { return Err(ContractError::Reserved); }
            let owner = deps.api.addr_validate(&owner)?;
            let rec = COMMITMENTS.may_load(deps.storage, &info.sender)?.ok_or(ContractError::CommitmentMissing)?;
            let age = now(&env).saturating_sub(rec.created_at);
            if age < cfg.min_commit_age { return Err(ContractError::CommitmentTooYoung); }
            if age > cfg.max_commit_age { return Err(ContractError::CommitmentExpired); }
            if rec.commitment != derive_commitment(owner.as_str(), &label, &secret) { return Err(ContractError::CommitmentMismatch); }
            let exists: ExistsResponse = deps.querier.query(&WasmQuery::Smart {
                contract_addr: cfg.registry.to_string(),
                msg: to_json_binary(&RegistryQueryMsg::Exists { name: label.clone() })?,
            }.into())?;
            if exists.exists { return Err(ContractError::Exists); }
            expect_exact_payment(&info, &cfg.denom, cfg.tld_price)?;
            COMMITMENTS.remove(deps.storage, &info.sender);
            let msgs: Vec<CosmosMsg> = vec![
                BankMsg::Send { to_address: cfg.treasury.to_string(), amount: vec![one_coin(cfg.denom, cfg.tld_price)] }.into(),
                WasmMsg::Execute {
                    contract_addr: cfg.registry.to_string(),
                    msg: to_json_binary(&RegistryExecuteMsg::Mint { name: label.clone(), owner: owner.to_string() })?,
                    funds: vec![],
                }.into(),
            ];
            Ok(Response::new().add_messages(msgs).add_attribute("action", "register_tld").add_attribute("tld", label))
        }
        ExecuteMsg::CleanExpired { limit } => {
            let cfg = CONFIG.load(deps.storage)?;
            let now_ts = now(&env);
            let limit = limit.unwrap_or(50).min(200);
            let keys: StdResult<Vec<_>> = COMMITMENTS
                .range(deps.storage, None, None, Order::Ascending)
                .take(limit as usize)
                .filter_map(|item| match item {
                    Ok((addr, rec)) if now_ts.saturating_sub(rec.created_at) > cfg.max_commit_age => Some(Ok(addr)),
                    Ok(_) => None,
                    Err(e) => Some(Err(e)),
                })
                .collect();
            let mut removed = 0u32;
            for key in keys? {
                COMMITMENTS.remove(deps.storage, &key);
                removed += 1;
            }
            Ok(Response::new().add_attribute("action", "clean_expired").add_attribute("removed", removed.to_string()))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Reserved { label } => to_json_binary(&RESERVED.may_load(deps.storage, &normalize_label(&label)?)?.unwrap_or(false)),
        QueryMsg::Commitment { sender } => to_json_binary(&COMMITMENTS.may_load(deps.storage, &deps.api.addr_validate(&sender)?)?),
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> {
    Ok(Response::new().add_attribute("action", "migrate"))
}
