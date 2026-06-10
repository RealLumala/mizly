use anchor_lang::prelude::*;

declare_id!("7xSVMPXfSkEuCfGFUttPssszwucmqEUA7oMS6BHUB2br"); // ← Update after first build

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;
pub mod utils;

use crate::instructions::*;
use error::ErrorCode;

#[program]
pub mod prop_amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, fee_bps: u16, initial_price: u64, price_decimals: u8) -> Result<()> {
        instructions::initialize(ctx, fee_bps, initial_price, price_decimals)
    }

    pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
        instructions::update_price(ctx, new_price)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, is_a_to_b: bool) -> Result<()> {
        instructions::swap(ctx, amount_in, is_a_to_b)
    }

    pub fn withdraw_fees(ctx: Context<WithdrawFees>) -> Result<()> {
        instructions::withdraw_fees(ctx)
    }
}