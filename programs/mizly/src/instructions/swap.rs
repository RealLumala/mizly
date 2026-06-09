use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{state::Pool, utils::calculate_amount_out, ErrorCode, constants};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    pub authority: Signer<'info>,

    #[account(mut)]
    pub user_token_in: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,

    #[account(mut)]
    pub vault_a: Account<'info, TokenAccount>,
    #[account(mut)]
    pub vault_b: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

pub fn swap(ctx: Context<Swap>, amount_in: u64, is_a_to_b: bool) -> Result<()> {
    // Extract account infos before mutable borrow of pool
    let pool_account_info = ctx.accounts.pool.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let vault_a_info = ctx.accounts.vault_a.to_account_info();
    let vault_b_info = ctx.accounts.vault_b.to_account_info();
    let user_token_in_info = ctx.accounts.user_token_in.to_account_info();
    let user_token_out_info = ctx.accounts.user_token_out.to_account_info();

    let pool = &mut ctx.accounts.pool;

    let amount_out = calculate_amount_out(
        amount_in,
        pool.current_price,
        pool.price_decimals,
        is_a_to_b,
    )?;

    let fee = (amount_out as u128)
        .checked_mul(pool.fee_bps as u128)
        .and_then(|v| v.checked_div(constants::FEE_DENOMINATOR as u128))
        .ok_or(ErrorCode::MathOverflow)? as u64;

    let amount_out_after_fee = amount_out
        .checked_sub(fee)
        .ok_or(ErrorCode::MathOverflow)?;

    // Transfer input tokens: user → vault
    let (vault_in_info, vault_out_info) = if is_a_to_b {
        (vault_a_info.clone(), vault_b_info.clone())
    } else {
        (vault_b_info.clone(), vault_a_info.clone())
    };

    let transfer_in = CpiContext::new(
        token_program_info.clone(),
        Transfer {
            from: user_token_in_info.clone(),
            to: vault_in_info,
            authority: authority_info,
        },
    );
    token::transfer(transfer_in, amount_in)?;

    // Build PDA signer seeds
    let seeds = &[
        b"pool".as_ref(),
        pool.authority.as_ref(),
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    // Transfer output tokens: vault → user (signed by pool PDA)
    let transfer_out = CpiContext::new_with_signer(
        token_program_info,
        Transfer {
            from: vault_out_info,
            to: user_token_out_info,
            authority: pool_account_info,  // PDA signs, no borrow conflict
        },
        signer,
    );
    token::transfer(transfer_out, amount_out_after_fee)?;

    // Accumulate fees
    if is_a_to_b {
        pool.accumulated_fees_b = pool
            .accumulated_fees_b
            .checked_add(fee)
            .ok_or(ErrorCode::MathOverflow)?;
    } else {
        pool.accumulated_fees_a = pool
            .accumulated_fees_a
            .checked_add(fee)
            .ok_or(ErrorCode::MathOverflow)?;
    }

    Ok(())
}