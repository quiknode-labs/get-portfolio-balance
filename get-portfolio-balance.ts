import { connect, SOL } from "solana-kite";
import { address } from "@solana/kit";
import { type TokenAccount, type PortfolioToken } from "./lib/interfaces.js";
import { ensureError } from "./lib/utils.js";
import { resolveName } from "./lib/sns.js";
import { getTokenPrices } from "./lib/jupiter.js";
import { displayPortfolio } from "./lib/formatting.js";
import { WSOL_MINT } from "./lib/constants.js";

// Re-export WSOL_MINT for backwards compatibility
export { WSOL_MINT };

export const getPortfolioBalance = async function (
  walletAddressString: string,
): Promise<void> {
  console.log(`\n💼 Address: ${walletAddressString}\n`);

  const connection = connect("quicknode-mainnet");

  // Resolve domain name to address if needed
  const walletAddress = walletAddressString.endsWith(".sol")
    ? await resolveName(walletAddressString)
    : address(walletAddressString);

  const solBalance = await connection.getLamportBalance(walletAddress);

  const rawTokenAccounts = await connection.getTokenAccounts(
    walletAddress,
    true,
  );

  const tokenAccountsWithBalance = rawTokenAccounts.map((accountInfo: any) => {
    const parsedInfo = accountInfo.account.data.parsed.info;
    return {
      mint: parsedInfo.mint,
      amount: BigInt(parsedInfo.tokenAmount.amount),
      decimals: parsedInfo.tokenAmount.decimals,
    };
  });

  const allMintAddresses = [
    WSOL_MINT,
    ...tokenAccountsWithBalance.map((account: TokenAccount) => account.mint),
  ];

  const priceMap = await getTokenPrices(allMintAddresses);

  const portfolio: Array<PortfolioToken> = [];
  let totalValueUsd = 0;
  let tokensWithoutPrices = 0;

  const solPriceInfo = priceMap.get(WSOL_MINT);
  if (solPriceInfo && solBalance > 0n) {
    const solValueUsd = Number(solBalance) / Number(SOL) * solPriceInfo.price;
    totalValueUsd += solValueUsd;
    portfolio.push({
      mint: WSOL_MINT,
      tokenSymbol: "SOL",
      balance: solBalance,
      priceUsd: solPriceInfo.price,
      valueUsd: solValueUsd,
    });
  }

  for (const tokenAccount of tokenAccountsWithBalance) {
    const priceInfo = priceMap.get(tokenAccount.mint);

    if (!priceInfo) {
      tokensWithoutPrices++;
      continue;
    }

    const balanceInUiUnits = Number(tokenAccount.amount) / Math.pow(10, tokenAccount.decimals);
    const valueUsd = balanceInUiUnits * priceInfo.price;
    totalValueUsd += valueUsd;

    portfolio.push({
      mint: tokenAccount.mint,
      tokenSymbol: priceInfo.tokenSymbol,
      balance: tokenAccount.amount,
      priceUsd: priceInfo.price,
      valueUsd: valueUsd,
    });
  }

  portfolio.sort((a, b) => b.valueUsd - a.valueUsd);

  displayPortfolio(
    portfolio,
    tokenAccountsWithBalance,
    totalValueUsd,
    tokensWithoutPrices,
  );
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const walletAddressOrName = process.argv[2];

  if (!walletAddressOrName) {
    console.error("Usage: npm start <address-or-domain>");
    console.error("Example: npm start mikemaccana.sol");
    console.error(
      "Example: npm start dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    );
    process.exit(1);
  }

  try {
    await getPortfolioBalance(walletAddressOrName);
  } catch (thrownObject) {
    const error = ensureError(thrownObject);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
