# FHEVM Automation Scripts

This directory contains TypeScript-based automation tools for generating standalone FHEVM example repositories, managing example categories, and generating documentation.

## Overview

Three main automation scripts are available:

- **create-fhevm-example.ts** - Generate standalone repositories for individual examples
- **create-fhevm-category.ts** - Generate projects containing multiple related examples
- **generate-docs.ts** - Generate GitBook-formatted documentation from contracts and tests

## Installation

### Prerequisites

- Node.js >= 20
- npm >= 7
- TypeScript knowledge (helpful but not required)

### Setup

```bash
npm install
```

## Usage

### 1. Generate Single Example Repository

Create a standalone Hardhat project for a specific example:

```bash
npm run create-example <example-name> <output-path>
```

#### Example:

```bash
npm run create-example encrypted-identity ./examples/identity
cd ./examples/identity
npm install
npm run compile
npm run test
```

#### Available Examples:

- `encrypted-identity` - Private user identity management
- `confidential-marketplace` - Privacy-preserving asset marketplace
- `encrypted-gaming` - Confidential gaming with hidden state
- `private-reputation` - Anonymous reputation system
- `confidential-voting` - Secret ballot governance voting
- `encrypted-treasury` - Confidential treasury management

### 2. Generate Category Project

Create a project containing multiple examples from a category:

```bash
npm run create-category <category-name> <output-path>
```

#### Example:

```bash
npm run create-category identity ./examples/all-identity
cd ./examples/all-identity
npm install
npm run test
```

#### Available Categories:

- `identity` - Identity & Privacy examples (Encrypted Identity + Private Reputation)
- `commerce` - Confidential Commerce examples (Marketplace + Treasury)
- `gaming` - Encrypted Gaming examples
- `governance` - Confidential Governance examples (Voting)

### 3. Generate Documentation

Generate GitBook-formatted documentation for one or all examples:

```bash
# Single example
npm run generate-docs <example-name>

# All examples
npm run generate-all-docs
```

#### Example:

```bash
npm run generate-docs encrypted-identity
npm run generate-all-docs
```

Generated files are created in the `docs/` directory with a `SUMMARY.md` index.

## Script Details

### create-fhevm-example.ts

**Purpose:** Generates complete standalone Hardhat projects for individual examples

**Features:**
- Copies Hardhat template from `fhevm-hardhat-template/`
- Copies specific contract and test files
- Updates deployment scripts with contract name
- Generates example-specific README
- Updates package.json metadata
- Color-coded console output for easy reading

**Configuration:**
Examples are defined in the `EXAMPLES_MAP` object at the top of the script. To add a new example:

```typescript
const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "your-example": {
    contract: "contracts/your/contract.sol",
    test: "test/your/test.ts",
    description: "Your example description",
    testFixture?: "test/fixtures/optional.ts" // Optional
  },
  // ... other examples
};
```

### create-fhevm-category.ts

**Purpose:** Generates projects containing multiple examples from a category

**Features:**
- Groups related examples into deployable projects
- Creates unified deployment script for all contracts
- Generates category-specific documentation
- Deduplicates test and contract copying
- Supports optional test fixtures per contract

**Configuration:**
Categories are defined in the `CATEGORIES` object. To add a new category:

```typescript
const CATEGORIES: Record<string, CategoryConfig> = {
  "your-category": {
    name: "Display Name",
    description: "Category description",
    contracts: {
      "example-1": {
        path: "contracts/example1.sol",
        testPath: "test/example1.ts"
      },
      "example-2": {
        path: "contracts/example2.sol",
        testPath: "test/example2.ts"
      }
    }
  },
  // ... other categories
};
```

### generate-docs.ts

**Purpose:** Generates GitBook-formatted documentation with tabbed code examples

**Features:**
- Extracts contract and test code
- Generates tabbed markdown interfaces
- Auto-generates SUMMARY.md index
- Categorizes examples by type
- Includes code placement hints

**Configuration:**
Examples are defined in the `EXAMPLES_CONFIG` object. To add a new example:

```typescript
const EXAMPLES_CONFIG: Record<string, DocConfig> = {
  "your-example": {
    title: "Display Title",
    description: "Full description of the example",
    contract: "contracts/path/to/contract.sol",
    test: "test/path/to/test.ts",
    output: "docs/your-example.md",
    category: "Category Name"
  },
  // ... other examples
};
```

## Project Structure

```
scripts/
├── create-fhevm-example.ts      # Single example generator (424 lines)
├── create-fhevm-category.ts     # Category project generator (483 lines)
├── generate-docs.ts             # Documentation generator (319 lines)
└── README.md                    # This file

../
├── contracts/                   # Source contracts
│   ├── identity/
│   ├── marketplace/
│   ├── gaming/
│   ├── reputation/
│   ├── governance/
│   └── treasury/
├── test/                        # Test suites
│   ├── identity/
│   ├── marketplace/
│   ├── gaming/
│   ├── reputation/
│   ├── governance/
│   └── treasury/
├── docs/                        # Generated documentation
├── fhevm-hardhat-template/      # Base Hardhat template
└── package.json                 # Project configuration
```

## Key Concepts

### Automated Scaffolding

The scripts automate:
- Directory structure creation
- Contract copying and naming
- Test file integration
- Configuration file generation
- Documentation creation

### FHE Patterns Demonstrated

All examples follow FHEVM best practices:

```solidity
// 1. Create encrypted input
euint32 internal = FHE.fromExternal(externalEuint32, inputProof);

// 2. Perform FHE operations
result = FHE.add(encrypted1, encrypted2);

// 3. Grant permissions
FHE.allowThis(result);
FHE.allow(result, userAddress);
```

### Testing Patterns

Tests demonstrate:
- ✓ Successful operations (marked with checkmark)
- ✗ Failed/pitfall cases (marked with X)
- Permission management
- Data encryption/decryption
- Multiple signer scenarios

## Common Workflows

### Create and Test a Single Example

```bash
npm run create-example encrypted-identity ./my-example
cd ./my-example
npm install
npm run compile
npm run test
```

### Create a Complete Category

```bash
npm run create-category identity ./my-category
cd ./my-category
npm install
npm run test
npm run deploy:localhost
```

### Generate All Documentation

```bash
npm run generate-all-docs
# Creates ./docs/SUMMARY.md and individual .md files
```

### Update a Single Example Documentation

```bash
npm run generate-docs encrypted-identity
# Updates ./docs/encrypted-identity.md
```

## Troubleshooting

### Issue: "FHEVM environment not detected"

**Solution:** Make sure you're running tests in the FHEVM mock environment:

```bash
npm run test
# Uses hardhat.config.ts with FHEVM mock
```

### Issue: "File not found" when generating docs

**Solution:** Verify contract and test paths in the script configuration match actual file locations.

### Issue: Scripts not executing

**Solution:** Ensure Node.js >= 20 is installed:

```bash
node --version  # Should be v20 or higher
```

## Development

### Adding a New Example

1. Create contract in `contracts/category/ContractName.sol`
2. Create test in `test/category/ContractName.ts`
3. Add entry to `EXAMPLES_MAP` in create-fhevm-example.ts
4. Add entry to appropriate category in create-fhevm-category.ts
5. Add entry to `EXAMPLES_CONFIG` in generate-docs.ts
6. Run `npm run generate-all-docs` to update documentation

### Testing Scripts Locally

```bash
# Test example generation
npx ts-node scripts/create-fhevm-example.ts encrypted-identity ./test-output/example
cd ./test-output/example
npm install
npm run test

# Test category generation
npx ts-node scripts/create-fhevm-category.ts identity ./test-output/category
cd ./test-output/category
npm install
npm run test

# Test documentation
npx ts-node scripts/generate-docs.ts --all
```

## Performance Notes

- Copying large template directories: ~1-2 seconds
- Generating single example: ~3-5 seconds
- Generating full category: ~5-10 seconds
- Generating all documentation: ~2-3 seconds

## Support & Resources

- [Zama Official Documentation](https://docs.zama.ai)
- [FHEVM GitHub Repository](https://github.com/zama-ai/fhevm)
- [Zama Community Forum](https://www.zama.ai/community)
- [Zama Discord Server](https://discord.com/invite/zama)

## License

BSD-3-Clause-Clear
