import { describe, test } from "node:test";
import assert from "node:assert";
import { address, createSolanaRpc } from "@solana/kit";
import {
  ensureError,
  getTokenAccounts,
  getTokenPrice,
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

describe("getTokenPrice", () => {
  test("fetches price for valid token", async () => {
    const endpoint = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;
    if (!endpoint) {
      throw new Error("QUICKNODE_SOLANA_MAINNET_ENDPOINT not set");
    }

    const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    const priceData = await getTokenPrice(endpoint, usdcMint);

    if (priceData === null) {
      console.log(
        "⚠️  CoinPaprika addon not enabled - skipping price validation",
      );
      return;
    }

    assert.ok(priceData.symbol === "USDC");
    assert.ok(priceData.price_usd > 0);
    assert.ok(priceData.price_usd < 2);
  });

  test("returns null for invalid token", async () => {
    const endpoint = process.env.QUICKNODE_SOLANA_MAINNET_ENDPOINT;
    if (!endpoint) {
      throw new Error("QUICKNODE_SOLANA_MAINNET_ENDPOINT not set");
    }

    const invalidMint = "1111111111111111111111111111111111111111111";
    const priceData = await getTokenPrice(endpoint, invalidMint);

    assert.strictEqual(priceData, null);
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
