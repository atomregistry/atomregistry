use cosmwasm_schema::cw_serde;
use cosmwasm_std::{Addr, Uint128};

#[cw_serde]
pub enum RegistryOperatorKind {
    Registrar,
    TldManager,
    Marketplace,
}

#[cw_serde]
pub struct SubdomainPolicy {
    pub enabled: bool,
    pub registration_open: bool,
    pub denom: String,
    pub price: Uint128,
    pub recipient: String,
    pub max_per_address: u32,
}

#[cw_serde]
pub struct NameRecord {
    pub name: String,
    pub owner: String,
    pub minted_at: u64,
    pub parent: Option<String>,
}

#[cw_serde]
pub struct RegistryInstantiateMsg {
    pub admin: String,
    pub royalty_recipient: String,
    pub royalty_bps: u16,
}

#[cw_serde]
pub enum RegistryExecuteMsg {
    TransferAdmin { new_admin: String },
    AcceptAdmin {},
    SetOperator { kind: RegistryOperatorKind, address: Option<String> },
    SetRoyalty { recipient: String, bps: u16 },
    Mint { name: String, owner: String },
    MintSubdomain { parent: String, label: String, owner: String },
    Transfer { name: String, to: String },
    Burn { name: String },
    SetPrimary { name: String },
    ClearPrimary {},
    SetSubdomainPolicy { name: String, policy: Option<SubdomainPolicy> },
    RegisterSubdomain { parent: String, label: String },
}

#[cw_serde]
pub enum RegistryQueryMsg {
    Config {},
    OwnerOf { name: String },
    Name { name: String },
    Exists { name: String },
    NamesByOwner { owner: String, start_after: Option<String>, limit: Option<u32> },
    PrimaryOf { owner: String },
    RoyaltyQuote { sale_price: Uint128 },
    SubdomainPolicy { name: String },
}

#[cw_serde]
pub struct RegistryConfigResponse {
    pub admin: String,
    pub pending_admin: Option<String>,
    pub registrar: Option<String>,
    pub tld_manager: Option<String>,
    pub marketplace: Option<String>,
    pub royalty_recipient: String,
    pub royalty_bps: u16,
}

#[cw_serde]
pub struct OwnerOfResponse {
    pub owner: Option<String>,
}

#[cw_serde]
pub struct NameResponse {
    pub record: Option<NameRecord>,
}

#[cw_serde]
pub struct ExistsResponse {
    pub exists: bool,
}

#[cw_serde]
pub struct NamesByOwnerResponse {
    pub names: Vec<String>,
}

#[cw_serde]
pub struct PrimaryOfResponse {
    pub name: Option<String>,
}

#[cw_serde]
pub struct RoyaltyQuoteResponse {
    pub recipient: Addr,
    pub amount: Uint128,
}

#[cw_serde]
pub struct EmptyMigrateMsg {}
