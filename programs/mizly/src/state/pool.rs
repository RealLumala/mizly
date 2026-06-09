use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    pub authority: Pubkey,
    pub token_a_mint: Pubkey,
    pub token_b_mint: Pubkey,
    pub vault_a: Pubkey,
    pub vault_b: Pubkey,
    pub current_price: u64,          // scaled price of A in B
    pub price_decimals: u8,
    pub fee_bps: u16,
    pub accumulated_fees_a: u64,
    pub accumulated_fees_b: u64,
    pub bump: u8,
}

impl Pool {
    pub const LEN: usize = 8 + 32 * 5 + 8 + 1 + 2 + 8 * 2 + 1;
}