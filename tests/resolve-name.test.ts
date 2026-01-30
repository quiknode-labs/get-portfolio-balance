import { describe, test } from "node:test";
import assert from "node:assert";
import { resolveName } from "../name-resolution/resolve-name.js";

describe("resolveName", () => {
  test("passes through valid Solana address", async () => {
    const testAddress = "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8";
    const resolved = await resolveName(testAddress);

    assert.strictEqual(resolved, testAddress);
  });

  test("resolves .sol domain via SNS", async () => {
    const domain = "mikemaccana.sol";
    const resolved = await resolveName(domain);

    assert.strictEqual(resolved, "dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8");
  });

  test("throws error for invalid address", async () => {
    await assert.rejects(
      async () => await resolveName("not-a-valid-address"),
      /Invalid Solana address/,
    );
  });

  test("throws error for non-existent domain", async () => {
    await assert.rejects(
      async () => await resolveName("thisdoesnotexist12345.sol"),
      /Failed to resolve/,
    );
  });

  test("throws error for unsupported TLD", async () => {
    await assert.rejects(
      async () => await resolveName("test.poor"),
      /not supported/,
    );
  });
});
