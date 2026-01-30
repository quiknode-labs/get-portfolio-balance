import { describe, test } from "node:test";
import assert from "node:assert";
import { connect } from "solana-kite";
import { address } from "@solana/kit";
import {
  getTokenAccounts,
  getTokenSymbols,
  getTokenPrices,
  getPortfolioBalance,
} from "../get-portfolio-balance.js";

describe("getTokenSymbols", () => {
  test("fetches symbols for known tokens", async () => {
    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (!jupiterApiKey) {
      console.log("⚠️  JUPITER_API_KEY not set - skipping test");
      return;
    }

    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const symbolMap = await getTokenSymbols([usdcMint]);

    const symbol = symbolMap.get(usdcMint);
    assert.strictEqual(symbol, "USDC");
  });

  test("returns empty map when API key not set", async () => {
    const originalKey = process.env.JUPITER_API_KEY;
    delete process.env.JUPITER_API_KEY;

    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const symbolMap = await getTokenSymbols([usdcMint]);

    assert.ok(symbolMap instanceof Map);
    assert.strictEqual(symbolMap.size, 0);

    process.env.JUPITER_API_KEY = originalKey;
  });
});

describe("getTokenPrices", () => {
  test("fetches prices for valid tokens", async () => {
    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (!jupiterApiKey) {
      console.log("⚠️  JUPITER_API_KEY not set - skipping test");
      return;
    }

    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const priceMap = await getTokenPrices([usdcMint]);

    const usdcPriceInfo = priceMap.get(usdcMint);
    assert.ok(usdcPriceInfo !== undefined);
    assert.ok(usdcPriceInfo.price > 0);
    assert.ok(usdcPriceInfo.price < 2);
    assert.strictEqual(usdcPriceInfo.tokenSymbol, "USDC");
  });

  test("fetches prices for multiple tokens", async () => {
    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (!jupiterApiKey) {
      console.log("⚠️  JUPITER_API_KEY not set - skipping test");
      return;
    }

    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const solMint = "So11111111111111111111111111111111111111112";
    const priceMap = await getTokenPrices([usdcMint, solMint]);

    assert.ok(priceMap.size > 0);
    const usdcPriceInfo = priceMap.get(usdcMint);
    assert.ok(usdcPriceInfo !== undefined);
    assert.ok(usdcPriceInfo.price > 0);

    const solPriceInfo = priceMap.get(solMint);
    assert.ok(solPriceInfo !== undefined);
    assert.ok(solPriceInfo.price > 0);
    assert.strictEqual(solPriceInfo.tokenSymbol, "SOL");
  });
});

describe("getTokenAccounts", () => {
  test("fetches token accounts for wallet with tokens", async () => {
    const connection = connect("quicknode-mainnet");
    const walletAddress = address(
      "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    );

    const tokenAccounts = await getTokenAccounts(connection, walletAddress);

    assert.ok(Array.isArray(tokenAccounts));
    tokenAccounts.forEach((account) => {
      assert.ok(typeof account.mint === "string");
      assert.ok(typeof account.amount === "number");
      assert.ok(typeof account.decimals === "number");
    });
  });
});

describe("getPortfolioBalance", () => {
  test("calculates portfolio balance for valid wallet", async () => {
    const jupiterApiKey = process.env.JUPITER_API_KEY;
    if (!jupiterApiKey) {
      console.log("⚠️  JUPITER_API_KEY not set - skipping test");
      return;
    }

    await getPortfolioBalance(
      "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    );
  });
});
