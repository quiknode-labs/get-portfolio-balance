import { connect } from "solana-kite";
import { address, type Address } from "@solana/kit";
import {
  type TokenAccount,
  type JupiterPriceData,
  type JupiterTokenInfo,
  type PortfolioToken,
  type TokenPriceInfo,
} from "./lib/interfaces.js";
import { ensureError } from "./lib/utils.js";

export const getTokenAccounts = async function (
  connection: ReturnType<typeof connect>,
  walletAddress: Address,
): Promise<Array<TokenAccount>> {
  const TOKEN_PROGRAM_ID = address(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

  const response = await connection.rpc
    .getTokenAccountsByOwner(walletAddress, {
      programId: TOKEN_PROGRAM_ID,
    }, {
      encoding: "jsonParsed",
    })
    .send();

  return response.value.map((accountInfo: any) => {
    const parsedInfo = accountInfo.account.data.parsed.info;
    return {
      mint: parsedInfo.mint,
      amount: parsedInfo.tokenAmount.uiAmount,
      decimals: parsedInfo.tokenAmount.decimals,
    };
  });
};

export const getTokenSymbols = async function (
  mintAddresses: Array<string>,
): Promise<Map<string, string>> {
  const jupiterApiKey = process.env.JUPITER_API_KEY;

  if (!jupiterApiKey) {
    console.warn("JUPITER_API_KEY not set, using shortened mint addresses");
    return new Map();
  }

  const symbolMap = new Map<string, string>();

  for (const mint of mintAddresses) {
    try {
      const response = await fetch(
        `https://api.jup.ag/tokens/v2/search?query=${mint}`,
        {
          headers: {
            "x-api-key": jupiterApiKey,
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const tokenInfo = data[0] as JupiterTokenInfo;
          symbolMap.set(mint, tokenInfo.symbol);
        }
      }
    } catch (thrownObject) {
      const error = ensureError(thrownObject);
      console.warn(`Failed to fetch symbol for ${mint}: ${error.message}`);
    }
  }

  return symbolMap;
};

export const getTokenPrices = async function (
  mintAddresses: Array<string>,
): Promise<Map<string, TokenPriceInfo>> {
  const jupiterApiKey = process.env.JUPITER_API_KEY;

  if (!jupiterApiKey) {
    console.warn("JUPITER_API_KEY not set, skipping price fetch");
    return new Map();
  }

  const idsParam = mintAddresses.join(",");
  const jupiterUrl = `https://api.jup.ag/price/v3?ids=${idsParam}`;

  try {
    const response = await fetch(jupiterUrl, {
      headers: {
        "x-api-key": jupiterApiKey,
      },
    });

    if (!response.ok) {
      console.warn(`Failed to fetch prices from Jupiter: ${response.status}`);
      return new Map();
    }

    const data = await response.json();
    const priceMap = new Map<string, TokenPriceInfo>();

    const symbolMap = await getTokenSymbols(mintAddresses);

    for (const [mint, priceData] of Object.entries(data)) {
      const jupiterData = priceData as JupiterPriceData;
      if (jupiterData.usdPrice) {
        const tokenSymbol = symbolMap.get(mint) || mint.substring(0, 8);
        priceMap.set(mint, {
          price: jupiterData.usdPrice,
          tokenSymbol: tokenSymbol,
        });
      }
    }

    return priceMap;
  } catch (thrownObject) {
    const error = ensureError(thrownObject);
    console.warn(`Error fetching prices from Jupiter: ${error.message}`);
    return new Map();
  }
};

export const getPortfolioBalance = async function (
  walletAddressString: string,
): Promise<void> {
  console.log(`\n💼 Address: ${walletAddressString}\n`);

  const connection = connect("quicknode-mainnet");
  const walletAddress = address(walletAddressString);

  const solBalanceResponse = await connection.rpc.getBalance(walletAddress).send();
  const solBalance = Number(solBalanceResponse.value) / 1000000000;

  const tokenAccounts = await getTokenAccounts(connection, walletAddress);

  const nonZeroAccounts = tokenAccounts.filter(
    (account) => account.amount > 0,
  );

  const allMintAddresses = [
    "So11111111111111111111111111111111111111112",
    ...nonZeroAccounts.map((account) => account.mint),
  ];

  const priceMap = await getTokenPrices(allMintAddresses);

  const portfolio: Array<PortfolioToken> = [];
  let totalValueUsd = 0;
  let tokensWithoutPrices = 0;

  const solMint = "So11111111111111111111111111111111111111112";
  const solPriceInfo = priceMap.get(solMint);
  if (solPriceInfo && solBalance > 0) {
    const solValueUsd = solBalance * solPriceInfo.price;
    totalValueUsd += solValueUsd;
    portfolio.push({
      mint: solMint,
      tokenSymbol: "SOL",
      balance: solBalance,
      priceUsd: solPriceInfo.price,
      valueUsd: solValueUsd,
    });
  }

  for (const tokenAccount of nonZeroAccounts) {
    const priceInfo = priceMap.get(tokenAccount.mint);

    if (!priceInfo) {
      tokensWithoutPrices++;
      continue;
    }

    const valueUsd = tokenAccount.amount * priceInfo.price;
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

  for (const token of portfolio) {
    const formattedBalance = token.balance.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const alignedBalance = formattedBalance.padStart(20);

    const formattedValue = token.valueUsd.toFixed(2);
    const alignedValue = formattedValue.padStart(10);

    console.log(
      `  ${token.tokenSymbol.padEnd(10)} ${alignedBalance} 💵 $${alignedValue}`,
    );
  }

  console.log(`\n💰 Total: $${totalValueUsd.toFixed(2)}`);

  if (tokensWithoutPrices > 0) {
    console.log(
      `\n❓ Plus ${tokensWithoutPrices} token${tokensWithoutPrices === 1 ? "" : "s"} for which no price could be obtained`,
    );
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const testWalletAddress = "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8";

  try {
    await getPortfolioBalance(testWalletAddress);
  } catch (thrownObject) {
    const error = ensureError(thrownObject);
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}
