import { describe, test } from "node:test";
import assert from "node:assert";
import { address, createSolanaRpc } from "@solana/kit";
import {
  ensureError,
  getTokenAccounts,
  getTokenPrices,
  getPortfolioBalance,
} from "../get-portfolio-balance.js";

describe("ensureError", () => {
  test("returns Error instance when Error is thrown", () => {
    const error = new Error("Test error");
    const result = ensureError(error);
    assert.strictEqual(result, error);
  });

  test("wraps non-Error thrown objects", () => {
    const result = ensureError("string error");
    assert.ok(result instanceof Error);
    assert.ok(result.message.includes("string error"));
  });

  test("wraps thrown numbers", () => {
    const result = ensureError(42);
    assert.ok(result instanceof Error);
    assert.ok(result.message.includes("42"));
  });
});

describe("getTokenPrices", () => {
  test("fetches prices for valid tokens", async () => {
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const priceMap = await getTokenPrices([usdcMint]);

    const usdcPrice = priceMap.get(usdcMint);
    assert.ok(usdcPrice !== undefined);
    assert.ok(usdcPrice > 0);
    assert.ok(usdcPrice < 2);
  });

  test("returns empty map for invalid tokens", async () => {
    const invalidMint = "1111111111111111111111111111111111111111111";
    const priceMap = await getTokenPrices([invalidMint]);

    assert.ok(priceMap instanceof Map);
    assert.strictEqual(priceMap.size, 0);
  });

  test("fetches prices for multiple tokens", async () => {
    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const solMint = "So11111111111111111111111111111111111111112";
    const priceMap = await getTokenPrices([usdcMint, solMint]);

    assert.ok(priceMap.size > 0);
    const usdcPrice = priceMap.get(usdcMint);
    assert.ok(usdcPrice !== undefined);
    assert.ok(usdcPrice > 0);
  });
});

describe("getTokenAccounts", () => {
  test("fetches token accounts for wallet with tokens", async () => {
    const endpoint = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;
    if (!endpoint) {
      throw new Error("QUICKNODE_SOLANA_MAINNET_ENDPOINT not set");
    }

    const rpc = createSolanaRpc(endpoint);
    const walletAddress = address(
      "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    );

    const tokenAccounts = await getTokenAccounts(rpc, walletAddress);

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
    const endpoint = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;
    if (!endpoint) {
      throw new Error("QUICKNODE_SOLANA_MAINNET_ENDPOINT not set");
    }

    await getPortfolioBalance(
      "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
    );
  });

  test("throws error when environment variable not set", async () => {
    const originalEnv = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;
    delete process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;

    await assert.rejects(
      async () => {
        await getPortfolioBalance(
          "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8",
        );
      },
      {
        message: "QUICKNODE_SOLANA_MAINNET_ENDPOINT environment variable not set",
      },
    );

    process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT = originalEnv;
  });
});
