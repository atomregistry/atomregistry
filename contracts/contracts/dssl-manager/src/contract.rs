use atom_names_types::{DsslAttestation, EmptyMigrateMsg, OwnerOfResponse, RegistryQueryMsg};
use atom_names_utils::{bounded_limit, normalize_name};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdError, StdResult, WasmQuery,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use thiserror::Error;

const CONTRACT_NAME: &str = "crates.io:atom-names-dssl-manager";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");
const MAX_ATTESTORS_PER_NAME: u32 = 32;
const MAX_SCORE: u16 = 1000;

#[cw_serde]
pub struct InstantiateMsg { pub admin: String, pub registry: String }

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    SetAttestor { address: String, active: bool },
    UpsertRecord { name: String, target: String, expires_at: u64 },
    RevokeRecord { name: String },
    Attest { name: String, score_boost: u8, note: Option<String> },
    RemoveAttestation { name: String, attestor: String },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Record { name: String },
    Attestation { name: String, attestor: String },
    Attestations { name: String, limit: Option<u32> },
}

#[cw_serde]
pub struct Config { pub admin: Addr, pub pending_admin: Option<Addr>, pub registry: Addr }
#[cw_serde]
pub struct DsslRecord { pub target: String, pub expires_at: u64, pub active: bool }
#[cw_serde]
pub struct Aggregate { pub attestor_count: u32, pub score: u16 }

const CONFIG: Item<Config> = Item::new("config");
const ATTESTORS: Map<&Addr, bool> = Map::new("attestors");
const RECORDS: Map<&str, DsslRecord> = Map::new("records");
const AGG: Map<&str, Aggregate> = Map::new("agg");
const ATTESTATIONS: Map<(&str, &Addr), DsslAttestation> = Map::new("attestations");

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
    #[error("record missing")]
    RecordMissing,
    #[error("attestor limit reached")]
    AttestorLimitReached,
}

fn assert_name_owner(deps: Deps, registry: &Addr, sender: &Addr, name: &str) -> Result<(), ContractError> {
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
pub fn execute(mut deps: DepsMut, env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
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
        ExecuteMsg::SetAttestor { address, active } => {
            let cfg = CONFIG.load(deps.storage)?;
            if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
            let addr = deps.api.addr_validate(&address)?;
            ATTESTORS.save(deps.storage, &addr, &active)?;
            Ok(Response::new().add_attribute("action", "set_attestor"))
        }
        ExecuteMsg::UpsertRecord { name, target, expires_at } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_name_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            RECORDS.save(deps.storage, &name, &DsslRecord { target, expires_at, active: true })?;
            AGG.update(deps.storage, &name, |old| -> StdResult<_> { Ok(old.unwrap_or(Aggregate { attestor_count: 0, score: 0 })) })?;
            Ok(Response::new().add_attribute("action", "upsert_record"))
        }
        ExecuteMsg::RevokeRecord { name } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            assert_name_owner(deps.as_ref(), &cfg.registry, &info.sender, &name)?;
            RECORDS.remove(deps.storage, &name);
            Ok(Response::new().add_attribute("action", "revoke_record"))
        }
        ExecuteMsg::Attest { name, score_boost, note } => {
            let cfg = CONFIG.load(deps.storage)?;
            if !ATTESTORS.may_load(deps.storage, &info.sender)?.unwrap_or(false) { return Err(ContractError::Unauthorized); }
            let name = normalize_name(&name)?;
            let _record = RECORDS.may_load(deps.storage, &name)?.ok_or(ContractError::RecordMissing)?;
            let existing = ATTESTATIONS.may_load(deps.storage, (&name, &info.sender))?;
            let mut agg = AGG.may_load(deps.storage, &name)?.unwrap_or(Aggregate { attestor_count: 0, score: 0 });
            if existing.is_none() {
                if agg.attestor_count >= MAX_ATTESTORS_PER_NAME { return Err(ContractError::AttestorLimitReached); }
                agg.attestor_count += 1;
            } else if let Some(prev) = existing.clone() {
                agg.score = agg.score.saturating_sub(prev.score_boost as u16);
            }
            agg.score = agg.score.saturating_add(score_boost as u16).min(MAX_SCORE);
            AGG.save(deps.storage, &name, &agg)?;
            ATTESTATIONS.save(deps.storage, (&name, &info.sender), &DsslAttestation {
                attestor: info.sender.to_string(),
                score_boost,
                note,
                created_at: env.block.time.seconds(),
            })?;
            Ok(Response::new().add_attribute("action", "attest"))
        }
        ExecuteMsg::RemoveAttestation { name, attestor } => {
            let cfg = CONFIG.load(deps.storage)?;
            if cfg.admin != info.sender { return Err(ContractError::Unauthorized); }
            let name = normalize_name(&name)?;
            let attestor = deps.api.addr_validate(&attestor)?;
            if let Some(prev) = ATTESTATIONS.may_load(deps.storage, (&name, &attestor))? {
                let mut agg = AGG.may_load(deps.storage, &name)?.unwrap_or(Aggregate { attestor_count: 0, score: 0 });
                agg.attestor_count = agg.attestor_count.saturating_sub(1);
                agg.score = agg.score.saturating_sub(prev.score_boost as u16);
                AGG.save(deps.storage, &name, &agg)?;
                ATTESTATIONS.remove(deps.storage, (&name, &attestor));
            }
            Ok(Response::new().add_attribute("action", "remove_attestation"))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Record { name } => {
            let name = normalize_name(&name)?;
            to_json_binary(&(RECORDS.may_load(deps.storage, &name)?, AGG.may_load(deps.storage, &name)?))
        }
        QueryMsg::Attestation { name, attestor } => {
            let name = normalize_name(&name)?;
            let att = deps.api.addr_validate(&attestor)?;
            to_json_binary(&ATTESTATIONS.may_load(deps.storage, (&name, &att))?)
        }
        QueryMsg::Attestations { name, limit } => {
            let name = normalize_name(&name)?;
            let out: StdResult<Vec<DsslAttestation>> = ATTESTATIONS.prefix(&name).range(deps.storage, None, None, Order::Ascending)
                .take(bounded_limit(limit, 20, 100)).map(|r| r.map(|(_, v)| v)).collect();
            to_json_binary(&out?)
        }
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> { Ok(Response::new()) }
