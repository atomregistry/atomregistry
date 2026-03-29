use atom_names_types::{
    EmptyMigrateMsg, OwnerOfResponse, RegistryExecuteMsg, RegistryQueryMsg, RoyaltyQuoteResponse,
};
use atom_names_utils::{expect_exact_payment, normalize_name, one_coin};
use cosmwasm_schema::cw_serde;
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, CosmosMsg, Deps, DepsMut, Env,
    MessageInfo, Response, StdError, StdResult, Uint128, WasmMsg, WasmQuery,
};
use cw2::set_contract_version;
use cw_storage_plus::{Item, Map};
use thiserror::Error;

const CONTRACT_NAME: &str = "crates.io:atom-names-marketplace";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[cw_serde]
pub struct InstantiateMsg {
    pub admin: String,
    pub registry: String,
    pub denom: String,
}

#[cw_serde]
pub enum ExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    List { name: String, price: Uint128 },
    Cancel { name: String },
    Buy { name: String },
}

#[cw_serde]
pub enum QueryMsg {
    Config {},
    Listing { name: String },
}

#[cw_serde]
pub struct Config {
    pub admin: Addr,
    pub pending_admin: Option<Addr>,
    pub registry: Addr,
    pub denom: String,
}

#[cw_serde]
pub struct Listing {
    pub name: String,
    pub seller: Addr,
    pub price: Uint128,
    pub created_at: u64,
}

const CONFIG: Item<Config> = Item::new("config");
const LISTINGS: Map<&str, Listing> = Map::new("listings");

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
    #[error("listing missing")]
    ListingMissing,
    #[error("seller mismatch with registry")]
    StaleListing,
}

fn owner_of(deps: Deps, registry: &Addr, name: &str) -> StdResult<Option<String>> {
    let resp: OwnerOfResponse = deps.querier.query(&WasmQuery::Smart {
        contract_addr: registry.to_string(),
        msg: to_json_binary(&RegistryQueryMsg::OwnerOf { name: name.to_string() })?,
    }.into())?;
    Ok(resp.owner)
}

#[entry_point]
pub fn instantiate(deps: DepsMut, _env: Env, _info: MessageInfo, msg: InstantiateMsg) -> Result<Response, ContractError> {
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &Config {
        admin: deps.api.addr_validate(&msg.admin)?,
        pending_admin: None,
        registry: deps.api.addr_validate(&msg.registry)?,
        denom: msg.denom,
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
        ExecuteMsg::List { name, price } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            let current_owner = owner_of(deps.as_ref(), &cfg.registry, &name)?.ok_or(ContractError::StaleListing)?;
            if current_owner != info.sender.as_str() { return Err(ContractError::Unauthorized); }
            LISTINGS.save(deps.storage, &name, &Listing { name: name.clone(), seller: info.sender.clone(), price, created_at: env.block.time.seconds() })?;
            Ok(Response::new().add_attribute("action", "list").add_attribute("name", name))
        }
        ExecuteMsg::Cancel { name } => {
            let name = normalize_name(&name)?;
            let listing = LISTINGS.may_load(deps.storage, &name)?.ok_or(ContractError::ListingMissing)?;
            if listing.seller != info.sender { return Err(ContractError::Unauthorized); }
            LISTINGS.remove(deps.storage, &name);
            Ok(Response::new().add_attribute("action", "cancel").add_attribute("name", name))
        }
        ExecuteMsg::Buy { name } => {
            let cfg = CONFIG.load(deps.storage)?;
            let name = normalize_name(&name)?;
            let listing = LISTINGS.may_load(deps.storage, &name)?.ok_or(ContractError::ListingMissing)?;
            expect_exact_payment(&info, &cfg.denom, listing.price)?;
            let current_owner = owner_of(deps.as_ref(), &cfg.registry, &name)?;
            if current_owner.as_deref() != Some(listing.seller.as_str()) {
                LISTINGS.remove(deps.storage, &name);
                return Ok(Response::new().add_attribute("action", "cancel_stale_listing").add_attribute("name", name));
            }
            LISTINGS.remove(deps.storage, &name);
            let royalty: RoyaltyQuoteResponse = deps.querier.query(&WasmQuery::Smart {
                contract_addr: cfg.registry.to_string(),
                msg: to_json_binary(&RegistryQueryMsg::RoyaltyQuote { sale_price: listing.price })?,
            }.into())?;
            let seller_amount = listing.price.checked_sub(royalty.amount)?;
            let mut msgs: Vec<CosmosMsg> = vec![
                WasmMsg::Execute {
                    contract_addr: cfg.registry.to_string(),
                    msg: to_json_binary(&RegistryExecuteMsg::Transfer { name: name.clone(), to: info.sender.to_string() })?,
                    funds: vec![],
                }.into(),
            ];
            if !royalty.amount.is_zero() {
                msgs.push(BankMsg::Send { to_address: royalty.recipient.to_string(), amount: vec![one_coin(cfg.denom.clone(), royalty.amount)] }.into());
            }
            if !seller_amount.is_zero() {
                msgs.push(BankMsg::Send { to_address: listing.seller.to_string(), amount: vec![one_coin(cfg.denom, seller_amount)] }.into());
            }
            Ok(Response::new().add_messages(msgs).add_attribute("action", "buy").add_attribute("name", name))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::Config {} => to_json_binary(&CONFIG.load(deps.storage)?),
        QueryMsg::Listing { name } => to_json_binary(&LISTINGS.may_load(deps.storage, &normalize_name(&name)?)?),
    }
}

#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: EmptyMigrateMsg) -> StdResult<Response> {
    Ok(Response::new())
}
