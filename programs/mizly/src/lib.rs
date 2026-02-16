use anchor_lang::prelude::*;

declare_id!("APQtcvd4R68x6a8DcLCjyQWryyLn3UcoSEmuPUsbj3B9");

#[program]
pub mod mizly {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

// changes coming soon.
