use anchor_lang::prelude::*;
use crate::state::Pool;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Pool::LEN,
        seeds = [b"pool", authority.key().as_ref(), token_a_mint.key().as_ref(), token_b_mint.key().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    pub token_a_mint: Account<'info, anchor_spl::token::Mint>,
    pub token_b_mint: Account<'info, anchor_spl::token::Mint>,

    #[account(
        mut,
        constraint = vault_a.mint == token_a_mint.key() && vault_a.owner == pool.key()
    )]
    pub vault_a: Account<'info, anchor_spl::token::TokenAccount>,

    #[account(
        mut,
        constraint = vault_b.mint == token_b_mint.key() && vault_b.owner == pool.key()
    )]
    pub vault_b: Account<'info, anchor_spl::token::TokenAccount>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, anchor_spl::token::Token>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn initialize(
    ctx: Context<Initialize>,
    fee_bps: u16,
    initial_price: u64,
    price_decimals: u8,
) -> Result<()> {
    let pool = &mut ctx.accounts.pool;

    pool.authority = ctx.accounts.authority.key();
    pool.token_a_mint = ctx.accounts.token_a_mint.key();
    pool.token_b_mint = ctx.accounts.token_b_mint.key();
    pool.vault_a = ctx.accounts.vault_a.key();
    pool.vault_b = ctx.accounts.vault_b.key();
    pool.current_price = initial_price;
    pool.price_decimals = price_decimals;
    pool.fee_bps = fee_bps;
    pool.accumulated_fees_a = 0;
    pool.accumulated_fees_b = 0;
    pool.bump = ctx.bumps.pool;

    Ok(())
}