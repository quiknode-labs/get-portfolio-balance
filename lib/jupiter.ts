import {
  type JupiterPriceData,
  type JupiterTokenInfo,
  type TokenPriceInfo,
} from "./interfaces.js";
import { ensureError } from "./utils.js";

/**
 * Fetches token symbols (short names like "SOL", "USDC") for given mint addresses.
 * A token symbol is the short, human-readable identifier for a token (like "BTC" for Bitcoin or "SOL" for Solana).
 * This is different from the mint address which is the full on-chain identifier.
 */
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
