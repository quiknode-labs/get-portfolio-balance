export interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
}

export interface JupiterPriceData {
  createdAt: string;
  liquidity: number;
  usdPrice: number;
  blockId: number;
  decimals: number;
  priceChange24h: number;
}

export interface JupiterTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI: string;
  tags: Array<string>;
  daily_volume: number;
  freeze_authority: string | null;
  mint_authority: string | null;
}

export interface PortfolioToken {
  mint: string;
  tokenSymbol: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
}

export interface TokenPriceInfo {
  price: number;
  tokenSymbol: string;
}
