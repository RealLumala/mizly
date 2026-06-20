import { PublicKey } from "@solana/web3.js";

export const PROGRAM_ID = new PublicKey(
  "7xSVMPXfSkEuCfGFUttPssszwucmqEUA7oMS6BHUB2br"
);

export const POOL_SEED = "pool";
export const FEE_DENOMINATOR = 10_000;

export const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_ENDPOINT || "http://localhost:8899";