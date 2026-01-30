import { connect } from "solana-kite";
import { address, type Address, getProgramDerivedAddress } from "@solana/kit";
import { getBase58Encoder, getBase58Decoder } from "@solana/codecs";
import { createHash } from "node:crypto";
import { ensureError } from "../lib/utils.js";

// SNS Constants
const SNS_PROGRAM_ID = address("namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX");
const SOL_TLD_AUTHORITY = address("58PwtjSDuFHuUkYjH9BYnnQKHfwo9reZhC2zMJv9JPkx");
const SOL_TLD_AUTHORITY_BYTES = getBase58Encoder().encode(SOL_TLD_AUTHORITY);
const HASH_PREFIX = "SPL Name Service";


const getHashedName = function (name: string): Uint8Array {
  const input = HASH_PREFIX + name;
  const hash = createHash("sha256").update(input, "utf8").digest();
  return new Uint8Array(hash);
};

const resolveSNS = async function (domain: string): Promise<Address> {
  const connection = connect("quicknode-mainnet");

  // Remove .sol extension
  const name = domain.replace(".sol", "");

  // Hash the name
  const hashedName = getHashedName(name);

  // Prepare seeds: hashedName, class (undefined = zeros), parent (ROOT_DOMAIN_ACCOUNT)
  // For top-level .sol domains, class is zeros and parent is ROOT_DOMAIN_ACCOUNT
  const classBytes = new Uint8Array(32); // zeros for top-level domains

  // Derive PDA with three separate seeds (NOT concatenated)
  const [nameAccountKey] = await getProgramDerivedAddress({
    programAddress: SNS_PROGRAM_ID,
    seeds: [hashedName, classBytes, SOL_TLD_AUTHORITY_BYTES],
  });

  // Fetch account
  const accountInfo = await connection.rpc
    .getAccountInfo(nameAccountKey, { encoding: "base64" })
    .send();

  if (!accountInfo.value) {
    throw new Error(`Domain ${domain} not found`);
  }

  // Decode base64 data
  const data = Buffer.from(accountInfo.value.data[0], "base64");

  // Extract owner from bytes 32-63
  const ownerBytes = data.subarray(32, 64);
  const ownerAddress = getBase58Decoder().decode(ownerBytes);

  return address(ownerAddress);
};

export const resolveName = async function (input: string): Promise<Address> {
  // If input looks like a base58 address (no dots), return it directly
  if (!input.includes(".")) {
    try {
      return address(input);
    } catch (thrownObject) {
      const error = ensureError(thrownObject);
      throw new Error(`Invalid Solana address: ${error.message}`);
    }
  }

  // Extract TLD from the input
  const parts = input.split(".");
  if (parts.length < 2) {
    throw new Error(`Invalid domain format: ${input}`);
  }

  const tld = `.${parts[parts.length - 1]}`;

  // Handle .sol domains with SNS
  if (tld === ".sol") {
    try {
      return await resolveSNS(input);
    } catch (thrownObject) {
      const error = ensureError(thrownObject);
      throw new Error(`Failed to resolve SNS domain ${input}: ${error.message}`);
    }
  }

  // Other TLDs not yet supported
  throw new Error(`Domain TLD ${tld} not supported. Only .sol domains are currently supported.`);
};
