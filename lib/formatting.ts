import { type PortfolioToken, type TokenAccount } from "./interfaces.js";
import { WRAPPED_SOL_MINT_ADDRESS } from "./constants.js";

/**
 * Formats a token balance from base units to UI units with proper decimal places.
 * @param balance - The token balance in base units (smallest unit, like lamports for SOL)
 * @param decimals - The number of decimals for the token
 * @returns Formatted balance string with 2 decimal places, right-aligned
 */
const formatTokenBalance = function (
  balance: bigint,
  decimals: number,
): string {
  const balanceInUiUnits = Number(balance) / Math.pow(10, decimals);

  const formattedBalance = balanceInUiUnits.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formattedBalance.padStart(20);
};

/**
 * Formats a USD value with 2 decimal places.
 * @param valueUsd - The USD value to format
 * @returns Formatted USD value string, right-aligned
 */
const formatUsdValue = function (valueUsd: number): string {
  const formattedValue = valueUsd.toFixed(2);
  return formattedValue.padStart(10);
};

/**
 * Displays a portfolio token line with symbol, balance, and USD value.
 * @param token - The portfolio token to display
 * @param tokenAccountsWithBalance - Array of token accounts to look up decimals
 */
export const displayPortfolioToken = function (
  token: PortfolioToken,
  tokenAccountsWithBalance: Array<TokenAccount>,
): void {
  const decimals =
    token.mint === WRAPPED_SOL_MINT_ADDRESS
      ? 9
      : (tokenAccountsWithBalance.find(
          (tokenAccount) => tokenAccount.mint === token.mint,
        )?.decimals ?? 0);

  const alignedBalance = formatTokenBalance(token.balance, decimals);
  const alignedValue = formatUsdValue(token.valueUsd);

  console.log(
    `  ${token.tokenSymbol.padEnd(10)} ${alignedBalance} 💵 $${alignedValue}`,
  );
};

/**
 * Displays the entire portfolio with all tokens and total value.
 * @param portfolio - Array of portfolio tokens sorted by value
 * @param tokenAccountsWithBalance - Array of token accounts to look up decimals
 * @param totalValueUsd - Total portfolio value in USD
 * @param tokensWithoutPrices - Count of tokens without price data
 */
export const displayPortfolio = function (
  portfolio: Array<PortfolioToken>,
  tokenAccountsWithBalance: Array<TokenAccount>,
  totalValueUsd: number,
  tokensWithoutPrices: number,
): void {
  for (const token of portfolio) {
    displayPortfolioToken(token, tokenAccountsWithBalance);
  }

  console.log(`\n💰 Total: $${totalValueUsd.toFixed(2)}`);

  if (tokensWithoutPrices > 0) {
    console.log(
      `\n❓ Plus ${tokensWithoutPrices} token${tokensWithoutPrices === 1 ? "" : "s"} for which no price could be obtained`,
    );
  }
};
