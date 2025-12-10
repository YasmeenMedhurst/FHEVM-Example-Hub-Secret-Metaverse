# Development Guide

## Project Overview

This is a comprehensive FHEVM (Fully Homomorphic Encryption Virtual Machine) example hub demonstrating privacy-preserving smart contracts for a Secret Metaverse. The project includes:

- **6 Example Contracts** demonstrating various FHE patterns
- **Comprehensive Test Suites** showing correct usage and common pitfalls
- **Automation Scripts** for generating standalone repositories
- **Documentation Generation** tools for creating tutorials

## Architecture

### Contracts

Each contract demonstrates a specific privacy-preserving use case:

1. **EncryptedIdentity** - User identity management with encrypted attributes
2. **ConfidentialMarketplace** - Privacy-preserving asset trading
3. **EncryptedGaming** - Confidential gaming with hidden state
4. **PrivateReputation** - Anonymous reputation tracking
5. **ConfidentialVoting** - Secret ballot governance
6. **EncryptedTreasury** - Confidential fund management

### Directory Structure

```
SecretMetaverseFHE/
├── contracts/
│   ├── identity/
│   │   └── EncryptedIdentity.sol
│   ├── marketplace/
│   │   └── ConfidentialMarketplace.sol
│   ├── gaming/
│   │   └── EncryptedGaming.sol
│   ├── reputation/
│   │   └── PrivateReputation.sol
│   ├── governance/
│   │   └── ConfidentialVoting.sol
│   └── treasury/
│       └── EncryptedTreasury.sol
├── test/
│   ├── identity/
│   │   └── EncryptedIdentity.ts
│   ├── marketplace/
│   │   └── ConfidentialMarketplace.ts
│   ├── gaming/
│   │   └── EncryptedGaming.ts
│   ├── reputation/
│   │   └── PrivateReputation.ts
│   ├── governance/
│   │   └── ConfidentialVoting.ts
│   └── treasury/
│       └── EncryptedTreasury.ts
├── scripts/
│   ├── create-fhevm-example.ts      # Single example generator
│   ├── create-fhevm-category.ts     # Category project generator
│   ├── generate-docs.ts             # Documentation generator
│   └── README.md                    # Scripts documentation
├── docs/
│   ├── SUMMARY.md                   # Documentation index
│   └── *.md                         # Generated example docs
├── fhevm-hardhat-template/          # Base Hardhat template
├── hardhat.config.ts                # Hardhat configuration
├── tsconfig.json                    # TypeScript configuration
├── package.json                     # Dependencies and scripts
└── DEVELOPMENT.md                   # This file
```

## Setup & Installation

### Prerequisites

- Node.js >= 20
- npm >= 7
- Solidity knowledge
- Basic understanding of FHE concepts

### Installation

```bash
cd SecretMetaverseFHE
npm install
```

### Environment Setup

```bash
# Create .env file
cp .env.example .env

# Add your environment variables
# PRIVATE_KEY=your_private_key
# SEPOLIA_RPC_URL=your_rpc_url
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test test/identity/EncryptedIdentity.ts

# Run with coverage
npm run coverage
```

### Compiling Contracts

```bash
# Compile all contracts
npm run compile

# Clean and recompile
npm run clean
npm run compile
```

### Code Quality

```bash
# Lint Solidity
npm run lint

# Fix linting issues
npm run lint:fix

# Type check TypeScript
npm run typecheck
```

## Adding a New Example

### Step 1: Create Contract

Create a new Solidity file in `contracts/category/ContractName.sol`:

```solidity
// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title YourContract
 * @dev Description of your contract
 */
contract YourContract is ZamaEthereumConfig {
  // Implementation
}
```

### Step 2: Create Tests

Create comprehensive tests in `test/category/ContractName.ts`:

```typescript
import { expect } from "chai";
import hre from "hardhat";
import { YourContract } from "../../types";

describe("YourContract", function () {
  let contract: YourContract;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("YourContract");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Your Feature", function () {
    it("✓ Should do something", async function () {
      // Test implementation
    });
  });
});
```

### Step 3: Update Configuration Files

Add entries to automation scripts:

**scripts/create-fhevm-example.ts:**

```typescript
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "your-example": {
    contract: "contracts/category/YourContract.sol",
    test: "test/category/YourContract.ts",
    description: "Description of your example",
  },
  // ... existing examples
};
```

**scripts/create-fhevm-category.ts:**

```typescript
const CATEGORIES: Record<string, CategoryConfig> = {
  "your-category": {
    name: "Your Category",
    description: "Category description",
    contracts: {
      "your-example": {
        path: "contracts/category/YourContract.sol",
        testPath: "test/category/YourContract.ts",
      },
    },
  },
  // ... existing categories
};
```

**scripts/generate-docs.ts:**

```typescript
const EXAMPLES_CONFIG: Record<string, DocConfig> = {
  "your-example": {
    title: "Your Example Title",
    description: "Full description",
    contract: "contracts/category/YourContract.sol",
    test: "test/category/YourContract.ts",
    output: "docs/your-example.md",
    category: "Your Category",
  },
  // ... existing examples
};
```

### Step 4: Generate Documentation

```bash
npm run generate-docs your-example
npm run generate-all-docs
```

### Step 5: Test Your Example

```bash
npm run create-example your-example ./test-output/your-example
cd ./test-output/your-example
npm install
npm run compile
npm run test
```

## FHE Programming Patterns

### Pattern 1: Encrypt Input

```solidity
function myFunction(externalEuint32 _value, bytes calldata _proof) external {
  // Convert external to internal encrypted type
  euint32 internal = FHE.fromExternal(_value, _proof);
}
```

### Pattern 2: Perform Operations

```solidity
// Addition
result = FHE.add(a, b);

// Comparison
result = FHE.gt(a, b);  // returns encrypted boolean

// Conditional
result = FHE.select(condition, valueIfTrue, valueIfFalse);
```

### Pattern 3: Grant Permissions

```solidity
// Always grant both permissions:
FHE.allowThis(encryptedValue);        // Contract can access
FHE.allow(encryptedValue, msg.sender);  // User can decrypt
```

### Pattern 4: Return Encrypted Values

```solidity
function getEncryptedValue() external view returns (euint32) {
  return encryptedState;
}
```

## Testing Best Practices

### Test Structure

```typescript
describe("FeatureName", function () {
  // Setup
  before(async function () { /* check environment */ });
  beforeEach(async function () { /* deploy fresh contract */ });

  describe("Successful Cases", function () {
    it("✓ Should do X", async function () {
      // Arrange: create encrypted inputs
      // Act: call contract function
      // Assert: verify results
    });
  });

  describe("Failure Cases", function () {
    it("✗ Should reject invalid input", async function () {
      // Verify error conditions
    });
  });
});
```

### Key Testing Patterns

```typescript
// 1. Create encrypted input
const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
input.add32(value);
const encrypted = await input.encrypt();

// 2. Send to contract
await contract.connect(signer).myFunction(encrypted.handles[0], encrypted.inputProof);

// 3. Decrypt result
const result = await contract.getEncryptedValue();
const decrypted = await hre.fhevm.userDecryptEuint32(contractAddress, result, signer);

// 4. Verify
expect(decrypted).to.equal(expectedValue);
```

## Common Pitfalls

### ❌ Missing Permissions

```solidity
// WRONG - user cannot decrypt
euint32 internal = FHE.fromExternal(_value, _proof);
return internal;

// CORRECT
euint32 internal = FHE.fromExternal(_value, _proof);
FHE.allowThis(internal);
FHE.allow(internal, msg.sender);
return internal;
```

### ❌ View Functions Returning Encrypted Values

```solidity
// WRONG - view functions cannot return encrypted values
function getValue() external view returns (euint32) {
  return encryptedValue;
}

// Can access encrypted value but caller cannot use it directly
```

### ❌ Forgetting Input Proof

```solidity
// WRONG - missing proof
contract.myFunction(encryptedValue.handles[0]);

// CORRECT
contract.myFunction(encryptedValue.handles[0], encryptedValue.inputProof);
```

### ❌ Not Testing Edge Cases

```typescript
// WRONG - only tests happy path
it("Should update value", async function () {
  await contract.updateValue(...);
});

// CORRECT - test both success and failure
it("✓ Should update valid value", async function () { });
it("✗ Should reject invalid value", async function () { });
it("✗ Should reject unauthorized access", async function () { });
```

## Deployment

### Local Deployment

```bash
npm run deploy:localhost
```

### Sepolia Testnet

```bash
# Set environment variables
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_rpc_url

# Deploy
npm run deploy:sepolia

# Verify
npm run verify:sepolia
```

## Troubleshooting

### Issue: "FHEVM environment not detected"

**Cause:** Running tests without FHEVM mock setup

**Solution:**
```bash
# Make sure to use npm test (which loads hardhat.config.ts properly)
npm run test
```

### Issue: "Gas estimation failed"

**Cause:** FHE operations have high gas costs

**Solution:**
- Use local mock environment for testing
- Set appropriate gas limits for testnet deployment

### Issue: "Module not found"

**Cause:** Dependencies not installed

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run compile
```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - run: npm run lint
      - run: npm run compile
      - run: npm run test
      - run: npm run coverage
```

## Documentation

### Generating Documentation

```bash
# Single example
npm run generate-docs encrypted-identity

# All examples
npm run generate-all-docs

# Output in docs/SUMMARY.md and docs/*.md
```

### Documentation Standards

- Use JSDoc comments in Solidity
- Include test examples in documentation
- Explain FHE-specific patterns
- Include common pitfalls and how to avoid them

## Performance Optimization

### Gas Optimization Tips

1. **Minimize FHE Operations:** Each operation has gas cost
2. **Batch Operations:** Combine multiple updates when possible
3. **Use Appropriate Types:** uint32 is cheaper than uint256 where applicable

### Testing Performance

```bash
npm run coverage  # Shows gas usage per function
```

## Contributing

### Code Style

- Solidity: Follow OpenZeppelin patterns
- TypeScript: Use Prettier formatting
- Comments: Explain "why" not "what"

### Pre-commit Checks

```bash
npm run lint:fix
npm run typecheck
npm run test
```

## Resources

- [FHEVM Documentation](https://docs.zama.ai)
- [Zama Examples](https://github.com/zama-ai/fhevm-examples)
- [Hardhat Documentation](https://hardhat.org)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com)

## Support

For questions or issues:

1. Check the [FHEVM Documentation](https://docs.zama.ai)
2. Visit [Zama Community Forum](https://www.zama.ai/community)
3. Join [Zama Discord](https://discord.com/invite/zama)
4. Open an [GitHub Issue](https://github.com/zama-ai/fhevm-examples/issues)

## License

BSD-3-Clause-Clear
