import { connect, SOL } from "solana-kite";
import { address } from "@solana/kit";
import { type TokenAccount, type PortfolioToken } from "./lib/interfaces.js";
import { ensureError } from "./lib/utils.js";
import { resolveName } from "./lib/sns.js";
import { getTokenPrices } from "./lib/jupiter.js";
import { displayPortfolio } from "./lib/formatting.js";
import { WRAPPED_SOL_MINT_ADDRESS } from "./lib/constants.js";

const walletAddressOrName = process.argv[2];

if (!walletAddressOrName) {
  console.error("Usage: npm run get-portfolio <address-or-domain>");
  console.error("Example: npm run get-portfolio mikemaccana.sol");
  console.error(
    "Example: npm run get-portfolio dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
  );
  process.exit(1);
}

try {
  console.log(`\n💼 Address: ${walletAddressOrName}\n`);

  const connection = connect("quicknode-mainnet");

  // Resolve domain name to address if needed
  const walletAddress = walletAddressOrName.endsWith(".sol")
    ? await resolveName(walletAddressOrName)
    : address(walletAddressOrName);

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
    // We use wrapped SOL as the identifier to get the price of regular, non wrapped SOL.
    WRAPPED_SOL_MINT_ADDRESS,
    ...tokenAccountsWithBalance.map((account: TokenAccount) => account.mint),
  ];

  const priceMap = await getTokenPrices(allMintAddresses);

  const portfolio: Array<PortfolioToken> = [];
  let totalValueUsd = 0;
  let tokensWithoutPrices = 0;

  const solPriceInfo = priceMap.get(WRAPPED_SOL_MINT_ADDRESS);
  if (solPriceInfo && solBalance > 0n) {
    const solValueUsd = (Number(solBalance) / Number(SOL)) * solPriceInfo.price;
    totalValueUsd += solValueUsd;
    portfolio.push({
      mint: WRAPPED_SOL_MINT_ADDRESS,
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

    const balanceInUiUnits =
      Number(tokenAccount.amount) / Math.pow(10, tokenAccount.decimals);
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
} catch (thrownObject) {
  const error = ensureError(thrownObject);
  console.error(`Error: ${error.message}`);
  process.exit(1);
}
