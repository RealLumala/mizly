import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import BN from "bn.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAmount(amount: BN | number | string, decimals = 9): string {
  const raw = typeof amount === "object" && "toNumber" in amount
    ? (amount as BN).toNumber()
    : Number(amount);
  return (raw / Math.pow(10, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export function toRawAmount(amount: string, decimals = 9): BN {
  const val = parseFloat(amount);
  if (isNaN(val)) return new BN(0);
  return new BN(Math.floor(val * Math.pow(10, decimals)));
}

export function formatPrice(price: BN | number, decimals = 9): string {
  const raw = typeof price === "object" && "toNumber" in price
    ? (price as BN).toNumber()
    : Number(price);
  return (raw / Math.pow(10, decimals)).toLocaleString(undefined, {
    maximumFractionDigits: 4,
  });
}

export function formatBps(bps: number): string {
  return `${(bps / 100).toFixed(2)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

export function calculateAmountOut(
  amountIn: number,
  price: number,
  priceDecimals: number,
  isAtoB: boolean
): number {
  if (isAtoB) {
    return (amountIn * price) / Math.pow(10, priceDecimals);
  } else {
    return (amountIn * Math.pow(10, priceDecimals)) / price;
  }
}