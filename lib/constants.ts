// Wrapped SOL mint address - used as the identifier for SOL pricing in Jupiter API.
// Native SOL and wrapped SOL are 1:1 price equivalent, so we use this mint address
// to fetch prices for both native SOL (from getLamportBalance) and wrapped SOL (from token accounts).
export const WSOL_MINT = "So11111111111111111111111111111111111111112";
