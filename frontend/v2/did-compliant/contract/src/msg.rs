use cosmwasm_std::Addr;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
    pub registry_contract: String,
    pub resolver_contract: String,
    pub site_registry_contract: Option<String>,
    pub chainspace: Option<String>,
    pub namespace: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    /// did:cosmos-style create operation. Creates did:cosmos:1:<chainspace>:<namespace>:<unique_id>.
    CreateIdentifier {
        unique_id: String,
        namespace: Option<String>,
        chainspace: Option<String>,
        document: Option<Value>,
    },
    /// Alias for domain owner-controlled DID document upsert.
    SetDidDocument { id: String, document: Value },
    /// did:cosmos-style update operation. Requires the DID to exist in this adapter.
    UpdateIidDocument { id: String, document: Value },
    /// Irreversible deactivation flag for a DID controlled by the current AtomRegistry domain owner.
    DeactivateIdentifier { id: String },
    /// Step 1 of admin transfer — propose a new admin. Only current admin can call.
    ProposeAdmin { new_admin: String },
    /// Step 2 of admin transfer — accept admin role. Only proposed admin can call.
    AcceptAdmin {},
    /// Admin-only operational config update (contracts only, not admin address).
    UpdateConfig {
        registry_contract: Option<String>,
        resolver_contract: Option<String>,
        site_registry_contract: Option<String>,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    QueryIdentifierDocument { id: String },
    ResolveDid { did: String },
    GetConfig {},
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct MigrateMsg {}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct QueryIdentifierDocumentResponse {
    pub did_document: Value,
    pub did_document_metadata: DidDocumentMetadata,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct DidDocumentMetadata {
    pub deactivated: bool,
    pub version_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub canonical_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub equivalent_id: Option<Vec<String>>,
    pub atomregistry: AtomRegistryMetadata,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct AtomRegistryMetadata {
    pub chain_id: String,
    pub chainspace: String,
    pub namespace: String,
    pub domain: String,
    pub owner: Option<String>,
    pub registry_contract: String,
    pub resolver_contract: String,
    pub site_registry_contract: Option<String>,
    pub derived: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct ConfigResponse {
    pub admin: Option<Addr>,
    pub pending_admin: Option<Addr>,
    pub registry_contract: Addr,
    pub resolver_contract: Addr,
    pub site_registry_contract: Option<Addr>,
    pub chain_id: String,
    pub chainspace: String,
    pub namespace: String,
}
