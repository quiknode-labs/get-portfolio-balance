# Get Portfolio Balance

Get the USD value of all tokens in a Solana wallet using QuickNode's CoinPaprika addon.

## Setup

Enable the CoinPaprika Solana Token Price addon in your QuickNode dashboard, then set your endpoint:

```bash
export QUICKNODE_SOLANA_MAINNET_ENDPOINT="https://your-endpoint.solana-mainnet.quiknode.pro/your-key/"
```

To enable the addon:
1. Go to your QuickNode endpoint dashboard
2. Navigate to the "Add-ons" section
3. Enable "CoinPaprika Solana Token Price & Liquidity Pools API" (addon #912)

Install dependencies:

```bash
npm install
```

## Usage

### Using QuickNode CoinPaprika (requires addon enabled):

```bash
npm start
```

### Using DeFiLlama (free, no addon required):

```bash
npm run start:defillama
```

Modify the wallet address in the respective file to check a different wallet.

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT
