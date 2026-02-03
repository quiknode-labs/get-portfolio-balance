// Used as the identifier for SOL pricing in Jupiter API.
// Native SOL and wrapped SOL are 1:1 price equivalent, so we use this mint address
// to fetch prices for both native SOL (from getLamportBalance) and wrapped SOL (from token accounts).
export const WRAPPED_SOL_MINT_ADDRESS =
  "So11111111111111111111111111111111111111112";
