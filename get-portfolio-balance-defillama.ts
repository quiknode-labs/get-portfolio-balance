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

interface DeFiLlamaPriceData {
  decimals: number;
  symbol: string;
  price: number;
  timestamp: number;
  confidence: number;
}

interface PortfolioToken {
  mint: string;
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

export const getTokenPrices = async function (
  mintAddresses: Array<string>,
): Promise<Map<string, number>> {
  const coinsParam = mintAddresses
    .map((mint) => `solana:${mint}`)
    .join(",");
  const defiLlamaUrl = `https://coins.llama.fi/prices/current/${coinsParam}`;

  try {
    const response = await fetch(defiLlamaUrl);

    if (!response.ok) {
      console.warn(`Failed to fetch prices from DeFiLlama: ${response.status}`);
      return new Map();
    }

    const data = await response.json();
    const priceMap = new Map<string, number>();

    if (data.coins) {
      for (const [key, priceData] of Object.entries(data.coins)) {
        const mint = key.replace("solana:", "");
        const price = (priceData as DeFiLlamaPriceData).price;
        if (price) {
          priceMap.set(mint, price);
        }
      }
    }

    return priceMap;
  } catch (thrownObject) {
    const error = ensureError(thrownObject);
    console.warn(`Error fetching prices from DeFiLlama: ${error.message}`);
    return new Map();
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

  const nonZeroAccounts = tokenAccounts.filter(
    (account) => account.amount > 0,
  );

  if (nonZeroAccounts.length === 0) {
    console.log("No tokens with non-zero balances found");
    console.log("\n" + "=".repeat(70));
    console.log("Total Portfolio Value: $0.00");
    console.log("=".repeat(70));
    return;
  }

  const mintAddresses = nonZeroAccounts.map((account) => account.mint);
  const priceMap = await getTokenPrices(mintAddresses);

  const portfolio: Array<PortfolioToken> = [];
  let totalValueUsd = 0;

  for (const tokenAccount of nonZeroAccounts) {
    const priceUsd = priceMap.get(tokenAccount.mint);

    if (!priceUsd) {
      console.log(
        `⚠️  ${tokenAccount.mint}: ${tokenAccount.amount} (price unavailable)`,
      );
      continue;
    }

    const valueUsd = tokenAccount.amount * priceUsd;
    totalValueUsd += valueUsd;

    portfolio.push({
      mint: tokenAccount.mint,
      balance: tokenAccount.amount,
      priceUsd: priceUsd,
      valueUsd: valueUsd,
    });

    console.log(
      `${tokenAccount.mint.substring(0, 10)}... ${tokenAccount.amount.toFixed(4).padStart(15)} × $${priceUsd.toFixed(6).padStart(12)} = $${valueUsd.toFixed(2).padStart(12)}`,
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
