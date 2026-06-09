use anchor_lang::prelude::*;

pub fn calculate_amount_out(
    amount_in: u64,
    price: u64,
    price_decimals: u8,
    is_a_to_b: bool,
) -> Result<u64> {
    if amount_in == 0 {
        return Err(error!(crate::ErrorCode::ZeroAmount));
    }

    let amount_out = if is_a_to_b {
        (amount_in as u128)
            .checked_mul(price as u128)
            .ok_or(crate::ErrorCode::MathOverflow)?
            .checked_div(10u128.pow(price_decimals as u32))
            .ok_or(crate::ErrorCode::MathOverflow)? as u64
    } else {
        (amount_in as u128)
            .checked_mul(10u128.pow(price_decimals as u32))
            .ok_or(crate::ErrorCode::MathOverflow)?
            .checked_div(price as u128)
            .ok_or(crate::ErrorCode::MathOverflow)? as u64
    };

    Ok(amount_out)
}