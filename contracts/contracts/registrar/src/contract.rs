use atom_names_types::{EmptyMigrateMsg, RegistryExecuteMsg, RegistryQueryMsg, ExistsResponse};
use atom_names_utils::{expect_exact_payment, normalize_name, now, one_coin};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Response, StdError, StdResult, Uint128, WasmMsg, WasmQuery,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use thiserror::Error;

const CONTRACT_NAME: &str = "crates.io:atom-names-registrar";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub registry: String,
    pub treasury: String,
    pub denom: String,
    pub price: Uint128,
    pub min_commit_age: u64,
    pub max_commit_age: u64,
}

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    UpdatePricing { price: Uint128 },
    Commit { commitment: String },
    Register { name: String, owner: String, secret: String },
    CleanExpired { limit: Option<u32> },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Commitment { sender: String },
    Quote { name: String },
}

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub pending_admin: Option<Addr>,
    pub registry: Addr,
    pub treasury: Addr,
    pub denom: String,
    pub price: Uint128,
    pub min_commit_age: u64,
    pub max_commit_age: u64,
}

#[cw_serde]
pub struct CommitmentRecord {
    pub commitment: String,
    pub created_at: u64,
}

const CONFIG: Item<Config> = Item::new("config");
const COMMITMENTS: Map<&Addr, CommitmentRecord> = Map::new("commitments");

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
    #[error("commitment missing")]
    CommitmentMissing,
    #[error("commitment too young")]
    CommitmentTooYoung,
    #[error("commitment expired")]
    CommitmentExpired,
    #[error("commitment mismatch")]
    CommitmentMismatch,
    #[error("name already exists")]
    NameExists,
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
        price: msg.price,
        min_commit_age: msg.min_commit_age,
        max_commit_age: msg.max_commit_age,
    })?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

fn derive_commitment(owner: &str, name: &str, secret: &str) -> String {
    format!("{}:{}:{}", owner, name, secret)
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
        ExecuteMsg::UpdatePricing { price } => {
            CONFIG.update(deps.storage, |mut cfg| -> Result<_, ContractError> {
                if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
                cfg.price = price;
                Ok(cfg)
            })?;
            Ok(Response::new().add_attribute("action", "update_pricing"))
        }
        ExecuteMsg::Commit { commitment } => {
            COMMITMENTS.save(deps.storage, &info.sender, &CommitmentRecord { commitment, created_at: now(&env) })?;
            Ok(Response::new().add_attribute("action", "commit"))
        }
        ExecuteMsg::Register { name, owner, secret } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            let owner_addr = deps.api.addr_validate(&owner)?;
            let record = COMMITMENTS.may_load(deps.storage, &info.sender)?.ok_or(ContractError::CommitmentMissing)?;
            let age = now(&env).saturating_sub(record.created_at);
            if age < cfg.min_commit_age { return Err(ContractError::CommitmentTooYoung); }
            if age > cfg.max_commit_age { return Err(ContractError::CommitmentExpired); }
            if record.commitment != derive_commitment(owner_addr.as_str(), &name, &secret) {
                return Err(ContractError::CommitmentMismatch);
            }
            let exists: ExistsResponse = deps.querier.query(&WasmQuery::Smart {
                contract_addr: cfg.registry.to_string(),
                msg: to_json_binary(&RegistryQueryMsg::Exists { name: name.clone() })?,
            }.into())?;
            if exists.exists { return Err(ContractError::NameExists); }
            expect_exact_payment(&info, &cfg.denom, cfg.price)?;
            COMMITMENTS.remove(deps.storage, &info.sender);
            let msgs: Vec<CosmosMsg> = vec![
                BankMsg::Send { to_address: cfg.treasury.to_string(), amount: vec![one_coin(cfg.denom, cfg.price)] }.into(),
                WasmMsg::Execute {
                    contract_addr: cfg.registry.to_string(),
                    msg: to_json_binary(&RegistryExecuteMsg::Mint { name: name.clone(), owner: owner_addr.to_string() })?,
                    funds: vec![],
                }.into(),
            ];
            Ok(Response::new().add_messages(msgs).add_attribute("action", "register").add_attribute("name", name))
        }
        ExecuteMsg::CleanExpired { limit } => {
            let cfg = CONFIG.load(deps.storage)?;
            let mut removed = 0u32;
            let limit = limit.unwrap_or(50).min(200);
            let now_ts = now(&env);
            let keys: StdResult<Vec<_>> = COMMITMENTS
                .range(deps.storage, None, None, cosmwasm_std::Order::Ascending)
                .take(limit as usize)
                .filter_map(|item| match item {
                    Ok((addr, rec)) if now_ts.saturating_sub(rec.created_at) > cfg.max_commit_age => Some(Ok(addr)),
                    Ok(_) => None,
                    Err(e) => Some(Err(e)),
                })
                .collect();
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
        QueryMsg::Commitment { sender } => to_json_binary(&COMMITMENTS.may_load(deps.storage, &deps.api.addr_validate(&sender)?)?),
        QueryMsg::Quote { .. } => to_json_binary(&CONFIG.load(deps.storage)?.price),
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> {
    Ok(Response::new().add_attribute("action", "migrate"))
}
