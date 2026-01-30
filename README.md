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

Run the script with a Solana address or .sol domain:

```bash
npm start <address-or-domain>
```

Examples:

```bash
npm start mikemaccana.sol
npm start dDCQNnDmNbFVi8cQhKAgXhyhXeJ625tvwsunRyRc7c8
```

## Testing

Run the test suite:

```bash
npm test
```

## License

MIT
