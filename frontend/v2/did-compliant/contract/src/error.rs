use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("unauthorized")]
    Unauthorized {},

    #[error("invalid DID: {reason}")]
    InvalidDid { reason: String },

    #[error("unsupported did:cosmos component: {reason}")]
    Unsupported { reason: String },

    #[error("DID already exists")]
    AlreadyExists {},

    #[error("DID not found")]
    NotFound {},

    #[error("DID is deactivated")]
    Deactivated {},

    #[error("invalid DID document: {reason}")]
    InvalidDidDocument { reason: String },
}
