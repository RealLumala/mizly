import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorWallet } from "@solana/wallet-adapter-react";
import { PROGRAM_ID, RPC_ENDPOINT } from "./constants";

// Import IDL — place your compiled IDL at this path
// After anchor build, copy target/idl/mizly.json to src/lib/mizly.json
import IDL from "./mizly.json";

export function getConnection(): Connection {
  return new Connection(RPC_ENDPOINT, "confirmed");
}

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = getConnection();
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(IDL as Idl, provider);
}

export function getReadonlyProgram(): Program {
  const connection = getConnection();
  // Readonly provider with no wallet — for fetching accounts
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program(IDL as Idl, provider);
}

export function derivePoolPda(
  authority: PublicKey,
  tokenAMint: PublicKey,
  tokenBMint: PublicKey
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("pool"),
      authority.toBuffer(),
      tokenAMint.toBuffer(),
      tokenBMint.toBuffer(),
    ],
    PROGRAM_ID
  );
}