use anchor_lang::prelude::*;
use crate::state::Pool;
use crate::ErrorCode;

#[derive(Accounts)]
pub struct UpdatePrice<'info> {
    #[account(mut, has_one = authority)]
    pub pool: Account<'info, Pool>,
    pub authority: Signer<'info>,
}

pub fn update_price(ctx: Context<UpdatePrice>, new_price: u64) -> Result<()> {
    require!(new_price > 0, ErrorCode::InvalidPrice);
    ctx.accounts.pool.current_price = new_price;
    Ok(())
}