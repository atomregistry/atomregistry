use cosmwasm_std::{Coin, Env, MessageInfo, StdError, StdResult, Uint128};

pub const MAX_NAME_LEN: usize = 253;
pub const MAX_LABEL_LEN: usize = 63;

pub fn now(env: &Env) -> u64 {
    env.block.time.seconds()
}

pub fn normalize_name(input: &str) -> StdResult<String> {
    let value = input.trim().to_ascii_lowercase();
    if value.is_empty() || value.len() > MAX_NAME_LEN {
        return Err(StdError::generic_err("invalid name length"));
    }
    let parts: Vec<&str> = value.split('.').collect();
    if parts.iter().any(|p| p.is_empty()) {
        return Err(StdError::generic_err("invalid name"));
    }
    for part in &parts {
        validate_label(part)?;
    }
    Ok(value)
}

pub fn normalize_label(input: &str) -> StdResult<String> {
    let value = input.trim().to_ascii_lowercase();
    validate_label(&value)?;
    Ok(value)
}

pub fn validate_label(label: &str) -> StdResult<()> {
    if label.is_empty() || label.len() > MAX_LABEL_LEN {
        return Err(StdError::generic_err("invalid label length"));
    }
    if label.starts_with('-') || label.ends_with('-') {
        return Err(StdError::generic_err("label cannot start or end with hyphen"));
    }
    if !label.chars().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-') {
        return Err(StdError::generic_err("invalid label characters"));
    }
    Ok(())
}

pub fn parent_of(name: &str) -> Option<String> {
    let mut iter = name.split('.');
    iter.next()?;
    let rest: Vec<&str> = iter.collect();
    if rest.is_empty() { None } else { Some(rest.join(".")) }
}

pub fn bounded_limit(limit: Option<u32>, default: u32, max: u32) -> usize {
    limit.unwrap_or(default).min(max) as usize
}

pub fn expect_exact_payment(info: &MessageInfo, denom: &str, amount: Uint128) -> StdResult<()> {
    let paid = info.funds.iter().find(|c| c.denom == denom).map(|c| c.amount).unwrap_or_default();
    if paid != amount {
        return Err(StdError::generic_err(format!("expected {}{} got {}{}", amount, denom, paid, denom)));
    }
    for coin in &info.funds {
        if coin.denom != denom && !coin.amount.is_zero() {
            return Err(StdError::generic_err("unexpected extra funds"));
        }
    }
    Ok(())
}

pub fn checked_bps(amount: Uint128, bps: u16) -> StdResult<Uint128> {
    amount
        .checked_mul(Uint128::from(bps as u128))?
        .checked_div(Uint128::from(10_000u128))
        .map_err(Into::into)
}

pub fn one_coin(denom: impl Into<String>, amount: Uint128) -> Coin {
    Coin { denom: denom.into(), amount }
}
