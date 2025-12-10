# FHEVM Example Template

This is a base Hardhat template for FHEVM (Fully Homomorphic Encryption Virtual Machine) smart contract development.

## Prerequisites

- Node.js >= 20
- npm >= 7.0.0

## Installation

```bash
npm install
```

## Compile Contracts

```bash
npm run compile
```

## Run Tests

```bash
npm run test
```

## Deploy

### Local Network

```bash
npm run deploy:localhost
```

### Sepolia Testnet

```bash
# Set environment variables first
export MNEMONIC="your twelve word mnemonic"
export INFURA_API_KEY="your_infura_api_key"

# Deploy
npm run deploy:sepolia
```

## Project Structure

```
.
├── contracts/          # Solidity smart contracts
├── test/              # Test files
├── deploy/            # Deployment scripts
├── hardhat.config.ts  # Hardhat configuration
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript configuration
└── README.md          # This file
```

## Available Scripts

- `npm run compile` - Compile smart contracts
- `npm run test` - Run tests
- `npm run clean` - Clean artifacts
- `npm run lint` - Lint contracts
- `npm run coverage` - Generate coverage report
- `npm run deploy:localhost` - Deploy to local network
- `npm run deploy:sepolia` - Deploy to Sepolia testnet

## License

BSD-3-Clause-Clear
