import {
  address,
  createSolanaRpc,
  type Address,
} from "@solana/kit";

interface TokenAccount {
  mint: string;
  amount: number;
  decimals: number;
}

interface CoinPaprikaTokenData {
  price_sol: number;
  price_usd: number;
  name: string;
  symbol: string;
  decimals: number;
}

interface PortfolioToken {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  priceUsd: number;
  valueUsd: number;
}

export const ensureError = function (thrownObject: unknown): Error {
  if (thrownObject instanceof Error) {
    return thrownObject;
  }
  return new Error(`Non-Error thrown: ${String(thrownObject)}`);
};

export const getTokenAccounts = async function (
  rpc: ReturnType<typeof createSolanaRpc>,
  walletAddress: Address,
): Promise<Array<TokenAccount>> {
  const TOKEN_PROGRAM_ID = address(
    "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  );

  const response = await rpc
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

export const getTokenPrice = async function (
  quicknodeEndpoint: string,
  mintAddress: string,
): Promise<CoinPaprikaTokenData | null> {
  const endpointWithoutTrailingSlash = quicknodeEndpoint.replace(/\/$/, "");
  const coinPaprikaUrl = `${endpointWithoutTrailingSlash}/addon/912/networks/solana/tokens/${mintAddress}`;

  try {
    const response = await fetch(coinPaprikaUrl);

    if (!response.ok) {
      console.warn(
        `Failed to fetch price for ${mintAddress}: ${response.status}`,
      );
      return null;
    }

    const data = await response.json();
    return {
      price_sol: data.price_sol || 0,
      price_usd: data.price_usd || 0,
      name: data.name || "Unknown",
      symbol: data.symbol || "Unknown",
      decimals: data.decimals || 0,
    };
  } catch (thrownObject) {
    const error = ensureError(thrownObject);
    console.warn(`Error fetching price for ${mintAddress}: ${error.message}`);
    return null;
  }
};

export const getPortfolioBalance = async function (
  walletAddressString: string,
): Promise<void> {
  const quicknodeEndpoint = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;

  if (!quicknodeEndpoint) {
    throw new Error("QUICKNODE_SOLANA_MAINNET_ENDPOINT environment variable not set");
  }

  console.log(`Fetching portfolio for wallet: ${walletAddressString}\n`);

  const rpc = createSolanaRpc(quicknodeEndpoint);
  const walletAddress = address(walletAddressString);

  const tokenAccounts = await getTokenAccounts(rpc, walletAddress);

  console.log(`Found ${tokenAccounts.length} token accounts\n`);

  const portfolio: Array<PortfolioToken> = [];
  let totalValueUsd = 0;

  for (const tokenAccount of tokenAccounts) {
    if (tokenAccount.amount === 0) {
      continue;
    }

    const priceData = await getTokenPrice(
      quicknodeEndpoint,
      tokenAccount.mint,
    );

    if (!priceData) {
      console.log(
        `⚠️  ${tokenAccount.mint}: ${tokenAccount.amount} (price unavailable)`,
      );
      continue;
    }

    const valueUsd = tokenAccount.amount * priceData.price_usd;
    totalValueUsd += valueUsd;

    portfolio.push({
      mint: tokenAccount.mint,
      name: priceData.name,
      symbol: priceData.symbol,
      balance: tokenAccount.amount,
      priceUsd: priceData.price_usd,
      valueUsd: valueUsd,
    });

    console.log(
      `${priceData.symbol.padEnd(10)} ${tokenAccount.amount.toFixed(4).padStart(15)} × $${priceData.price_usd.toFixed(6).padStart(12)} = $${valueUsd.toFixed(2).padStart(12)}`,
    );
  }

  console.log("\n" + "=".repeat(70));
  console.log(`Total Portfolio Value: $${totalValueUsd.toFixed(2)}`);
  console.log("=".repeat(70));
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
