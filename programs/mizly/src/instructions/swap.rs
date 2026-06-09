use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::{state::Pool, utils::calculate_amount_out, ErrorCode, constants};

#[derive(Accounts)]
pub struct Swap<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    pub authority: Signer<'info>, // Swapper (anyone)

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
    let pool = &mut ctx.accounts.pool;

    let amount_out = calculate_amount_out(amount_in, pool.current_price, pool.price_decimals, is_a_to_b)?;

    let fee = (amount_out as u128 * pool.fee_bps as u128 / constants::FEE_DENOMINATOR as u128) as u64;
    let amount_out_after_fee = amount_out.checked_sub(fee).ok_or(ErrorCode::MathOverflow)?;

    // Transfer input
    let (vault_in, user_in) = if is_a_to_b {
        (&ctx.accounts.vault_a, &ctx.accounts.user_token_in)
    } else {
        (&ctx.accounts.vault_b, &ctx.accounts.user_token_in)
    };

    let transfer_in = CpiContext::new(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: user_in.to_account_info(),
            to: vault_in.to_account_info(),
            authority: ctx.accounts.authority.to_account_info(),
        },
    );
    token::transfer(transfer_in, amount_in)?;

    // Transfer output (PDA)
    let seeds = &[
        b"pool".as_ref(),
        pool.authority.as_ref(),
        pool.token_a_mint.as_ref(),
        pool.token_b_mint.as_ref(),
        &[pool.bump],
    ];
    let signer = &[&seeds[..]];

    let (vault_out, user_out) = if is_a_to_b {
        (&ctx.accounts.vault_b, &ctx.accounts.user_token_out)
    } else {
        (&ctx.accounts.vault_a, &ctx.accounts.user_token_out)
    };

    let transfer_out = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        Transfer {
            from: vault_out.to_account_info(),
            to: user_out.to_account_info(),
            authority: ctx.accounts.pool.to_account_info(),
        },
        signer,
    );
    token::transfer(transfer_out, amount_out_after_fee)?;

    // Accumulate fee
    if is_a_to_b {
        pool.accumulated_fees_b = pool.accumulated_fees_b.checked_add(fee).ok_or(ErrorCode::MathOverflow)?;
    } else {
        pool.accumulated_fees_a = pool.accumulated_fees_a.checked_add(fee).ok_or(ErrorCode::MathOverflow)?;
    }

    Ok(())
}