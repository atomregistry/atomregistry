use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Option<Addr>,
    pub pending_admin: Option<Addr>,
    pub registry_contract: Addr,
    pub resolver_contract: Addr,
    pub site_registry_contract: Option<Addr>,
    pub chain_id: String,
    pub chainspace: String,
    pub namespace: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct DidRecord {
    pub document: Value,
    pub created_seconds: u64,
    pub updated_seconds: u64,
    pub version: u64,
    pub deactivated: bool,
}

pub const CONFIG: Item<Config> = Item::new("config");
pub const DID_RECORDS: Map<&str, DidRecord> = Map::new("did_records");
