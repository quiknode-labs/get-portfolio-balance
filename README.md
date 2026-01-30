# Get Portfolio Balance

Get the USD value of all tokens in a Solana wallet using Jupiter Price API v3.

## Setup

Set your QuickNode Solana mainnet endpoint and Jupiter API key:

```bash
export QUICKNODE_SOLANA_MAINNET_ENDPOINT="https://your-endpoint.solana-mainnet.quiknode.pro/your-key/"
export JUPITER_API_KEY="your-jupiter-api-key"
```

Get a Jupiter API key at: https://portal.jup.ag

Install dependencies:

```bash
npm install
```

## Usage

Run the script with the test wallet:

```bash
npm start
```

Modify the wallet address in [get-portfolio-balance.ts](get-portfolio-balance.ts) to check a different wallet.

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT
