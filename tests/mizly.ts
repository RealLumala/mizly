import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Mizly } from "../target/types/mizly";
import {
  TOKEN_PROGRAM_ID,
  createMint,
  createAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { expect } from "chai";

describe("mizly", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Mizly as Program<Mizly>;
  const authority = provider.wallet.publicKey;

  let tokenAMint: anchor.web3.PublicKey;
  let tokenBMint: anchor.web3.PublicKey;
  let vaultA: anchor.web3.PublicKey;
  let vaultB: anchor.web3.PublicKey;
  let poolPda: anchor.web3.PublicKey;

  const FEE_BPS = 30;
  const INITIAL_PRICE = 150_000_000;
  const PRICE_DECIMALS = 9;

  before(async () => {
    tokenAMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      authority,
      null,
      9
    );

    tokenBMint = await createMint(
      provider.connection,
      provider.wallet.payer,
      authority,
      null,
      6
    );

    [poolPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        authority.toBuffer(),
        tokenAMint.toBuffer(),
        tokenBMint.toBuffer(),
      ],
      program.programId
    );

    const vaultAKeypair = anchor.web3.Keypair.generate();
    const vaultBKeypair = anchor.web3.Keypair.generate();

    vaultA = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      poolPda,
      vaultAKeypair
    );

    vaultB = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      poolPda,
      vaultBKeypair
    );

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      vaultA,
      authority,
      1_000_000_000_000
    );

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      vaultB,
      authority,
      150_000_000_000_000
    );
  });

  it("Initializes the Pool successfully", async () => {
    await program.methods
      .initialize(FEE_BPS, new anchor.BN(INITIAL_PRICE), PRICE_DECIMALS)
      .accounts({
        authority,
        pool: poolPda,
        tokenAMint,
        tokenBMint,
        vaultA,
        vaultB,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const pool = await program.account.pool.fetch(poolPda);
    expect(pool.authority.toBase58()).to.equal(authority.toBase58());
    expect(pool.currentPrice.toString()).to.equal(INITIAL_PRICE.toString());
    expect(pool.priceDecimals).to.equal(PRICE_DECIMALS);
    expect(pool.feeBps).to.equal(FEE_BPS);
    expect(pool.accumulatedFeesA.toString()).to.equal("0");
    expect(pool.accumulatedFeesB.toString()).to.equal("0");
  });

  it("Updates price by authority", async () => {
    const newPrice = new anchor.BN(160_000_000);

    await program.methods
      .updatePrice(newPrice)
      .accounts({
        pool: poolPda,
        authority,
      })
      .rpc();

    const pool = await program.account.pool.fetch(poolPda);
    expect(pool.currentPrice.toString()).to.equal(newPrice.toString());
  });

  it("Swaps Token A → Token B", async () => {
    const userTokenAKeypair = anchor.web3.Keypair.generate();
    const userTokenBKeypair = anchor.web3.Keypair.generate();

    const userTokenA = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      authority,
      userTokenAKeypair
    );

    const userTokenB = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      authority,
      userTokenBKeypair
    );

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      userTokenA,
      authority,
      1_000_000_000
    );

    await program.methods
      .swap(new anchor.BN(1_000_000_000), true)
      .accounts({
        pool: poolPda,
        authority,
        userTokenIn: userTokenA,
        userTokenOut: userTokenB,
        vaultA,
        vaultB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userB = await getAccount(provider.connection, userTokenB);
    expect(Number(userB.amount)).to.be.greaterThan(0);
  });

  it("Swaps Token B → Token A", async () => {
    const userTokenAKeypair = anchor.web3.Keypair.generate();
    const userTokenBKeypair = anchor.web3.Keypair.generate();

    const userTokenA = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      authority,
      userTokenAKeypair
    );

    const userTokenB = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      authority,
      userTokenBKeypair
    );

    await mintTo(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      userTokenB,
      authority,
      150_000_000
    );

    await program.methods
      .swap(new anchor.BN(150_000_000), false)
      .accounts({
        pool: poolPda,
        authority,
        userTokenIn: userTokenB,
        userTokenOut: userTokenA,
        vaultA,
        vaultB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const userA = await getAccount(provider.connection, userTokenA);
    expect(Number(userA.amount)).to.be.greaterThan(0);
  });

  it("Withdraws accumulated fees", async () => {
    const destAKeypair = anchor.web3.Keypair.generate();
    const destBKeypair = anchor.web3.Keypair.generate();

    const destA = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      authority,
      destAKeypair
    );

    const destB = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      authority,
      destBKeypair
    );

    await program.methods
      .withdrawFees()
      .accounts({
        pool: poolPda,
        authority,
        vaultA,
        vaultB,
        destinationA: destA,
        destinationB: destB,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const balanceA = await getAccount(provider.connection, destA);
    expect(Number(balanceA.amount)).to.be.greaterThan(0);
  });

  it("Rejects zero amount swap", async () => {
    const userTokenAKeypair = anchor.web3.Keypair.generate();
    const userTokenBKeypair = anchor.web3.Keypair.generate();

    const userTokenA = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenAMint,
      authority,
      userTokenAKeypair
    );

    const userTokenB = await createAccount(
      provider.connection,
      provider.wallet.payer,
      tokenBMint,
      authority,
      userTokenBKeypair
    );

    try {
      await program.methods
        .swap(new anchor.BN(0), true)
        .accounts({
          pool: poolPda,
          authority,
          userTokenIn: userTokenA,
          userTokenOut: userTokenB,
          vaultA,
          vaultB,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      expect.fail("Should have failed with ZeroAmount");
    } catch (err: any) {
      expect(err.message).to.include("ZeroAmount");
    }
  });

  it("Only authority can update price", async () => {
    const fakeSigner = anchor.web3.Keypair.generate();

    const sig = await provider.connection.requestAirdrop(
      fakeSigner.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .updatePrice(new anchor.BN(100_000_000))
        .accounts({
          pool: poolPda,
          authority: fakeSigner.publicKey,
        })
        .signers([fakeSigner])
        .rpc();
      expect.fail("Should have failed");
    } catch (err: any) {
      expect(err.message).to.include("ConstraintHasOne");
    }
  });
});