use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),
    #[error("unauthorized")]
    Unauthorized,
    #[error("pending admin missing")]
    NoPendingAdmin,
    #[error("name already exists")]
    NameExists,
    #[error("name missing")]
    NameMissing,
    #[error("invalid royalty bps")]
    InvalidRoyalty,
    #[error("subdomain policy disabled")]
    SubdomainDisabled,
    #[error("subdomain limit reached")]
    SubdomainLimitReached,
}
