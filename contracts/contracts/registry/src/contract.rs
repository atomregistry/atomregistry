use crate::error::ContractError;
use crate::state::{
    ADMIN, MARKETPLACE, NAMES, OWNER_INDEX, PENDING_ADMIN, PRIMARY, REGISTRAR, ROYALTY_BPS,
    ROYALTY_RECIPIENT, SUBDOMAIN_MINTS, SUBDOMAIN_POLICIES, TLD_MANAGER,
};
use atom_names_types::{
    ExistsResponse, NameRecord, NameResponse, NamesByOwnerResponse, OwnerOfResponse,
    PrimaryOfResponse, RegistryConfigResponse, RegistryExecuteMsg, RegistryInstantiateMsg,
    RegistryOperatorKind, RegistryQueryMsg, RoyaltyQuoteResponse,
};
use atom_names_utils::{
    bounded_limit, checked_bps, expect_exact_payment, normalize_label, normalize_name, now,
    one_coin, parent_of,
};
use cosmwasm_std::{
    entry_point, to_json_binary, Addr, BankMsg, Binary, Deps, DepsMut, Env, MessageInfo, Order,
    Response, StdResult,
};
use cw2::set_contract_version;
use cw_storage_plus::Bound;

const CONTRACT_NAME: &str = "crates.io:atom-names-registry";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: RegistryInstantiateMsg,
) -> Result<Response, ContractError> {
    if msg.royalty_bps > 10_000 {
        return Err(ContractError::InvalidRoyalty);
    }
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    ADMIN.save(deps.storage, &deps.api.addr_validate(&msg.admin)?)?;
    PENDING_ADMIN.save(deps.storage, &None)?;
    REGISTRAR.save(deps.storage, &None)?;
    TLD_MANAGER.save(deps.storage, &None)?;
    MARKETPLACE.save(deps.storage, &None)?;
    ROYALTY_RECIPIENT.save(deps.storage, &deps.api.addr_validate(&msg.royalty_recipient)?)?;
    ROYALTY_BPS.save(deps.storage, &msg.royalty_bps)?;
    Ok(Response::new().add_attribute("action", "instantiate"))
}

fn assert_admin(deps: Deps, sender: &Addr) -> Result<(), ContractError> {
    if ADMIN.load(deps.storage)? != *sender {
        return Err(ContractError::Unauthorized);
    }
    Ok(())
}

fn load_operator(deps: Deps, kind: RegistryOperatorKind) -> StdResult<Option<Addr>> {
    match kind {
        RegistryOperatorKind::Registrar => REGISTRAR.load(deps.storage),
        RegistryOperatorKind::TldManager => TLD_MANAGER.load(deps.storage),
        RegistryOperatorKind::Marketplace => MARKETPLACE.load(deps.storage),
    }
}

fn is_operator(deps: Deps, kind: RegistryOperatorKind, sender: &Addr) -> StdResult<bool> {
    Ok(load_operator(deps, kind)?.map(|a| a == *sender).unwrap_or(false))
}

fn store_name(storage: &mut dyn cosmwasm_std::Storage, record: &NameRecord) -> StdResult<()> {
    let owner = Addr::unchecked(record.owner.clone());
    NAMES.save(storage, &record.name, record)?;
    OWNER_INDEX.save(storage, (&owner, &record.name), &true)?;
    Ok(())
}

fn remove_name(storage: &mut dyn cosmwasm_std::Storage, record: &NameRecord) {
    let owner = Addr::unchecked(record.owner.clone());
    NAMES.remove(storage, &record.name);
    OWNER_INDEX.remove(storage, (&owner, &record.name));
}

fn assert_owner_or_marketplace(deps: Deps, sender: &Addr, name: &str) -> Result<NameRecord, ContractError> {
    let record = NAMES.may_load(deps.storage, name)?.ok_or(ContractError::NameMissing)?;
    if record.owner == sender.as_str() || is_operator(deps, RegistryOperatorKind::Marketplace, sender)? {
        return Ok(record);
    }
    Err(ContractError::Unauthorized)
}

fn mint_record(
    deps: DepsMut,
    env: &Env,
    name: String,
    owner: Addr,
    parent: Option<String>,
) -> Result<(), ContractError> {
    if NAMES.has(deps.storage, &name) {
        return Err(ContractError::NameExists);
    }
    let record = NameRecord {
        name,
        owner: owner.to_string(),
        minted_at: now(env),
        parent,
    };
    store_name(deps.storage, &record)?;
    Ok(())
}

#[entry_point]
pub fn execute(
    mut deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: RegistryExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        RegistryExecuteMsg::TransferAdmin { new_admin } => {
            assert_admin(deps.as_ref(), &info.sender)?;
            let new_admin = deps.api.addr_validate(&new_admin)?;
            PENDING_ADMIN.save(deps.storage, &Some(new_admin.clone()))?;
            Ok(Response::new().add_attribute("action", "transfer_admin").add_attribute("pending_admin", new_admin))
        }
        RegistryExecuteMsg::AcceptAdmin {} => {
            let pending = PENDING_ADMIN.load(deps.storage)?.ok_or(ContractError::NoPendingAdmin)?;
            if pending != info.sender {
                return Err(ContractError::Unauthorized);
            }
            ADMIN.save(deps.storage, &pending)?;
            PENDING_ADMIN.save(deps.storage, &None)?;
            Ok(Response::new().add_attribute("action", "accept_admin"))
        }
        RegistryExecuteMsg::SetOperator { kind, address } => {
            assert_admin(deps.as_ref(), &info.sender)?;
            let validated = address.map(|a| deps.api.addr_validate(&a)).transpose()?;
            match kind {
                RegistryOperatorKind::Registrar => REGISTRAR.save(deps.storage, &validated)?,
                RegistryOperatorKind::TldManager => TLD_MANAGER.save(deps.storage, &validated)?,
                RegistryOperatorKind::Marketplace => MARKETPLACE.save(deps.storage, &validated)?,
            }
            Ok(Response::new().add_attribute("action", "set_operator"))
        }
        RegistryExecuteMsg::SetRoyalty { recipient, bps } => {
            assert_admin(deps.as_ref(), &info.sender)?;
            if bps > 10_000 {
                return Err(ContractError::InvalidRoyalty);
            }
            ROYALTY_RECIPIENT.save(deps.storage, &deps.api.addr_validate(&recipient)?)?;
            ROYALTY_BPS.save(deps.storage, &bps)?;
            Ok(Response::new().add_attribute("action", "set_royalty"))
        }
        RegistryExecuteMsg::Mint { name, owner } => {
            let name = normalize_name(&name)?;
            let owner = deps.api.addr_validate(&owner)?;
            let can_mint = assert_admin(deps.as_ref(), &info.sender).is_ok()
                || is_operator(deps.as_ref(), RegistryOperatorKind::Registrar, &info.sender)?
                || is_operator(deps.as_ref(), RegistryOperatorKind::TldManager, &info.sender)?;
            if !can_mint || parent_of(&name).is_some() {
                return Err(ContractError::Unauthorized);
            }
            mint_record(deps, &env, name.clone(), owner.clone(), None)?;
            Ok(Response::new().add_attribute("action", "mint").add_attribute("name", name).add_attribute("owner", owner))
        }
        RegistryExecuteMsg::MintSubdomain { parent, label, owner } => {
            let parent = normalize_name(&parent)?;
            let label = normalize_label(&label)?;
            let parent_record = NAMES.may_load(deps.storage, &parent)?.ok_or(ContractError::NameMissing)?;
            let owner = deps.api.addr_validate(&owner)?;
            let allowed = parent_record.owner == info.sender.as_str()
                || is_operator(deps.as_ref(), RegistryOperatorKind::Registrar, &info.sender)?
                || is_operator(deps.as_ref(), RegistryOperatorKind::TldManager, &info.sender)?;
            if !allowed {
                return Err(ContractError::Unauthorized);
            }
            let full = format!("{}.{}", label, parent);
            mint_record(deps, &env, full.clone(), owner.clone(), Some(parent))?;
            Ok(Response::new().add_attribute("action", "mint_subdomain").add_attribute("name", full).add_attribute("owner", owner))
        }
        RegistryExecuteMsg::Transfer { name, to } => {
            let name = normalize_name(&name)?;
            let record = assert_owner_or_marketplace(deps.as_ref(), &info.sender, &name)?;
            let from = Addr::unchecked(record.owner.clone());
            let to = deps.api.addr_validate(&to)?;
            remove_name(deps.storage, &record);
            store_name(deps.storage, &NameRecord { owner: to.to_string(), ..record.clone() })?;
            if PRIMARY.may_load(deps.storage, &from)?.as_deref() == Some(name.as_str()) {
                PRIMARY.remove(deps.storage, &from);
            }
            Ok(Response::new().add_attribute("action", "transfer").add_attribute("name", name).add_attribute("to", to))
        }
        RegistryExecuteMsg::Burn { name } => {
            let name = normalize_name(&name)?;
            let record = assert_owner_or_marketplace(deps.as_ref(), &info.sender, &name)?;
            let owner = Addr::unchecked(record.owner.clone());
            remove_name(deps.storage, &record);
            if PRIMARY.may_load(deps.storage, &owner)?.as_deref() == Some(name.as_str()) {
                PRIMARY.remove(deps.storage, &owner);
            }
            Ok(Response::new().add_attribute("action", "burn").add_attribute("name", name))
        }
        RegistryExecuteMsg::SetPrimary { name } => {
            let name = normalize_name(&name)?;
            let record = NAMES.may_load(deps.storage, &name)?.ok_or(ContractError::NameMissing)?;
            if record.owner != info.sender.as_str() {
                return Err(ContractError::Unauthorized);
            }
            PRIMARY.save(deps.storage, &info.sender, &name)?;
            Ok(Response::new().add_attribute("action", "set_primary").add_attribute("name", name))
        }
        RegistryExecuteMsg::ClearPrimary {} => {
            PRIMARY.remove(deps.storage, &info.sender);
            Ok(Response::new().add_attribute("action", "clear_primary"))
        }
        RegistryExecuteMsg::SetSubdomainPolicy { name, policy } => {
            let name = normalize_name(&name)?;
            let record = NAMES.may_load(deps.storage, &name)?.ok_or(ContractError::NameMissing)?;
            if record.owner != info.sender.as_str() {
                return Err(ContractError::Unauthorized);
            }
            match policy {
                Some(policy) => SUBDOMAIN_POLICIES.save(deps.storage, &name, &policy)?,
                None => SUBDOMAIN_POLICIES.remove(deps.storage, &name),
            }
            Ok(Response::new().add_attribute("action", "set_subdomain_policy"))
        }
        RegistryExecuteMsg::RegisterSubdomain { parent, label } => {
            let parent = normalize_name(&parent)?;
            let label = normalize_label(&label)?;
            let policy = SUBDOMAIN_POLICIES.may_load(deps.storage, &parent)?.ok_or(ContractError::SubdomainDisabled)?;
            if !policy.enabled || !policy.registration_open {
                return Err(ContractError::SubdomainDisabled);
            }
            let count = SUBDOMAIN_MINTS.may_load(deps.storage, (&parent, &info.sender))?.unwrap_or_default();
            if count >= policy.max_per_address {
                return Err(ContractError::SubdomainLimitReached);
            }
            expect_exact_payment(&info, &policy.denom, policy.price)?;
            let full = format!("{}.{}", label, parent.clone());
            mint_record(deps.branch(), &env, full.clone(), info.sender.clone(), Some(parent.clone()))?;
            SUBDOMAIN_MINTS.save(deps.storage, (&parent, &info.sender), &(count + 1))?;
            Ok(Response::new()
                .add_message(BankMsg::Send {
                    to_address: deps.api.addr_validate(&policy.recipient)?.to_string(),
                    amount: vec![one_coin(policy.denom, policy.price)],
                })
                .add_attribute("action", "register_subdomain")
                .add_attribute("name", full))
        }
    }
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: RegistryQueryMsg) -> StdResult<Binary> {
    match msg {
        RegistryQueryMsg::Config {} => to_json_binary(&RegistryConfigResponse {
            admin: ADMIN.load(deps.storage)?.to_string(),
            pending_admin: PENDING_ADMIN.load(deps.storage)?.map(|a| a.to_string()),
            registrar: REGISTRAR.load(deps.storage)?.map(|a| a.to_string()),
            tld_manager: TLD_MANAGER.load(deps.storage)?.map(|a| a.to_string()),
            marketplace: MARKETPLACE.load(deps.storage)?.map(|a| a.to_string()),
            royalty_recipient: ROYALTY_RECIPIENT.load(deps.storage)?.to_string(),
            royalty_bps: ROYALTY_BPS.load(deps.storage)?,
        }),
        RegistryQueryMsg::OwnerOf { name } => {
            let name = normalize_name(&name)?;
            to_json_binary(&OwnerOfResponse { owner: NAMES.may_load(deps.storage, &name)?.map(|r| r.owner) })
        }
        RegistryQueryMsg::Name { name } => {
            let name = normalize_name(&name)?;
            to_json_binary(&NameResponse { record: NAMES.may_load(deps.storage, &name)? })
        }
        RegistryQueryMsg::Exists { name } => {
            let name = normalize_name(&name)?;
            to_json_binary(&ExistsResponse { exists: NAMES.has(deps.storage, &name) })
        }
        RegistryQueryMsg::NamesByOwner { owner, start_after, limit } => {
            let owner = deps.api.addr_validate(&owner)?;
            let start = start_after.as_deref().map(Bound::exclusive);
            let names = OWNER_INDEX
                .prefix(&owner)
                .range(deps.storage, start, None, Order::Ascending)
                .take(bounded_limit(limit, 20, 100))
                .map(|item| item.map(|(name, _)| name.to_string()))
                .collect::<StdResult<Vec<_>>>()?;
            to_json_binary(&NamesByOwnerResponse { names })
        }
        RegistryQueryMsg::PrimaryOf { owner } => {
            let owner = deps.api.addr_validate(&owner)?;
            to_json_binary(&PrimaryOfResponse { name: PRIMARY.may_load(deps.storage, &owner)? })
        }
        RegistryQueryMsg::RoyaltyQuote { sale_price } => {
            to_json_binary(&RoyaltyQuoteResponse {
                recipient: ROYALTY_RECIPIENT.load(deps.storage)?,
                amount: checked_bps(sale_price, ROYALTY_BPS.load(deps.storage)?)?,
            })
        }
        RegistryQueryMsg::SubdomainPolicy { name } => {
            let name = normalize_name(&name)?;
            to_json_binary(&SUBDOMAIN_POLICIES.may_load(deps.storage, &name)?)
        }
    }
}


#[entry_point]
pub fn migrate(_deps: DepsMut, _env: Env, _msg: atom_names_types::EmptyMigrateMsg) -> StdResult<Response> {
    Ok(Response::new().add_attribute("action", "migrate"))
}
