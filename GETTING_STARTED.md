# Getting Started with FHEVM Example Hub

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js:** Version 20.0.0 or higher
- **npm:** Version 7.0.0 or higher
- **Git:** For cloning repositories
- **A text editor or IDE:** VS Code, WebStorm, or similar

### Verify Installation

```bash
node --version    # Should output v20.x.x or higher
npm --version     # Should output 7.x.x or higher
git --version     # Should output 2.x.x or higher
```

---

## Installation

### Step 1: Navigate to the Project Directory

```bash
cd SecretMetaverseFHE
```

### Step 2: Install Dependencies

```bash
npm install
```

This command will install all required dependencies including:
- Hardhat
- @fhevm/solidity
- @fhevm/hardhat-plugin
- Chai (testing framework)
- TypeScript
- And other development tools

**Installation time:** 2-5 minutes depending on internet speed

### Step 3: Verify Installation

```bash
npm run compile
```

This should compile all Solidity contracts successfully. You should see:
```
Successfully compiled x contracts
```

---

## Running Tests

### Run All Tests

```bash
npm run test
```

This executes all test suites and displays results. Expected output:
```
64+ passing tests
0 failing tests
```

### Run Specific Test File

```bash
npm run test test/identity/EncryptedIdentity.ts
```

### Run with Coverage

```bash
npm run coverage
```

Generates a coverage report showing test coverage for all contracts.

### Run with Gas Reporter

```bash
npm run test
```

Shows gas usage for each function call during testing.

---

## Using Automation Scripts

### Generate a Single Example Repository

Creates a standalone Hardhat project for a specific example:

```bash
npm run create-example <example-name> <output-path>
```

**Example:**

```bash
npm run create-example encrypted-identity ./my-identity-example
```

**What this does:**
1. Copies the base Hardhat template
2. Copies the EncryptedIdentity contract
3. Copies all test files
4. Generates deployment script
5. Updates package.json
6. Creates example-specific README

**Available examples:**
- `encrypted-identity`
- `confidential-marketplace`
- `encrypted-gaming`
- `private-reputation`
- `confidential-voting`
- `encrypted-treasury`

### Generate a Category Project

Creates a project containing multiple examples from a category:

```bash
npm run create-category <category-name> <output-path>
```

**Example:**

```bash
npm run create-category identity ./my-identity-examples
```

**What this does:**
1. Copies base Hardhat template
2. Copies all contracts in the category
3. Copies all test files
4. Generates unified deployment script
5. Creates category README

**Available categories:**
- `identity` - Identity & Privacy examples
- `commerce` - Confidential Commerce examples
- `gaming` - Encrypted Gaming examples
- `governance` - Confidential Governance examples

### Generate Documentation

Creates GitBook-formatted documentation for examples:

```bash
# Generate docs for single example
npm run generate-docs <example-name>

# Generate docs for all examples
npm run generate-all-docs
```

**Example:**

```bash
npm run generate-all-docs
```

Creates:
- `docs/SUMMARY.md` - Documentation index
- `docs/*.md` - Individual example documentation

---

## Workflow: Create and Test a Complete Project

### 1. Create an Example Repository

```bash
npm run create-example encrypted-identity ./my-first-example
```

### 2. Navigate to the New Repository

```bash
cd ./my-first-example
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Compile Contracts

```bash
npm run compile
```

### 5. Run Tests

```bash
npm run test
```

### 6. Deploy Locally (Optional)

```bash
npm run deploy:localhost
```

---

## Workflow: Create and Explore a Category

### 1. Create a Category Project

```bash
npm run create-category identity ./my-identity-project
```

### 2. Navigate to the Project

```bash
cd ./my-identity-project
```

### 3. Install and Test

```bash
npm install
npm run compile
npm run test
```

### 4. Explore the Contracts

All contracts are in `contracts/`:
- `contracts/identity/EncryptedIdentity.sol`
- `contracts/reputation/PrivateReputation.sol`

All tests are in `test/`:
- `test/identity/EncryptedIdentity.ts`
- `test/reputation/PrivateReputation.ts`

---

## Understanding the Project Structure

### Main Project Directory

```
SecretMetaverseFHE/
├── contracts/              # All Solidity contracts
├── test/                   # All test files
├── scripts/                # Automation tools
├── fhevm-hardhat-template/ # Base template for generation
├── docs/                   # Generated documentation
├── package.json            # Dependencies and npm scripts
├── hardhat.config.ts       # Hardhat configuration
└── README.md               # Full documentation
```

### Generated Example Repository

```
my-example/
├── contracts/
│   ├── ContractName.sol    # Your smart contract
├── test/
│   ├── ContractName.ts     # Test file
├── deploy/
│   ├── deploy.ts           # Deployment script
├── hardhat.config.ts       # Hardhat configuration
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript config
└── README.md               # Example documentation
```

---

## Available npm Scripts

### Development

```bash
npm run compile           # Compile Solidity contracts
npm run test              # Run all tests
npm run lint              # Lint contracts and tests
npm run lint:fix          # Fix linting issues
npm run typecheck         # TypeScript type checking
npm run clean             # Clean build artifacts
```

### Automation

```bash
npm run create-example    # Generate single example
npm run create-category   # Generate category project
npm run generate-docs     # Generate documentation
npm run generate-all-docs # Generate all docs
```

### Help

```bash
npm run help:create       # Help for create-example
npm run help:category     # Help for create-category
npm run help:docs         # Help for generate-docs
```

### Deployment

```bash
npm run deploy            # Deploy (requires configuration)
npm run deploy:localhost  # Deploy to local network
npm run deploy:sepolia    # Deploy to Sepolia testnet
npm run verify:sepolia    # Verify on Sepolia
```

### Analysis

```bash
npm run coverage          # Code coverage report
```

---

## Compiling Your First Example

### Step 1: Generate an Example

```bash
npm run create-example encrypted-identity ./test-identity
cd ./test-identity
```

### Step 2: Install Dependencies

```bash
npm install
```

Wait for all dependencies to be installed.

### Step 3: Compile the Contract

```bash
npm run compile
```

You should see output similar to:

```
Compiling contracts...
Successfully compiled 1 contract
No files changed, compilation successful
```

### Step 4: Run Tests

```bash
npm run test
```

Expected output shows all tests passing:

```
EncryptedIdentity
  ✓ Should register identity
  ✓ Should encrypt age correctly
  ✓ Should update age
  ... (more tests)

15 passing
```

---

## Testing Your Understanding

### Test 1: Generate and Run Example

```bash
npm run create-example confidential-marketplace ./test-marketplace
cd ./test-marketplace
npm install
npm run compile
npm run test
```

Expected: All tests pass (14+ tests)

### Test 2: Generate Category

```bash
npm run create-category commerce ./test-commerce
cd ./test-commerce
npm install
npm run compile
npm run test
```

Expected: Multiple contracts compiled, 30+ tests pass

### Test 3: Generate Documentation

```bash
npm run generate-all-docs
```

Expected: Creates `docs/SUMMARY.md` and individual .md files

---

## Troubleshooting

### Issue: "Node version not supported"

**Solution:** Install Node.js 20 or higher

```bash
# Check version
node --version

# If version is too old, download from nodejs.org
```

### Issue: "Module not found"

**Solution:** Run npm install

```bash
npm install
```

### Issue: "Compilation failed"

**Solution:** Ensure you're in the correct directory and dependencies are installed

```bash
pwd  # Verify current directory
npm install
npm run compile
```

### Issue: "Tests failing"

**Solution:** Verify FHEVM environment is properly set up

```bash
npm run test
```

If tests fail, check:
1. Dependencies are installed
2. All contracts compile successfully
3. You're using Node.js 20+

### Issue: "Script not found"

**Solution:** Ensure you're running from the main project directory

```bash
cd SecretMetaverseFHE
npm run help:create  # Should show help text
```

---

## Next Steps

### Explore the Examples

1. Read through the 6 example contracts
2. Study the test patterns
3. Understand FHE concepts
4. Review the documentation

### Learn FHE Patterns

1. Read DEVELOPMENT.md
2. Study the provided pattern examples
3. Experiment with modifications
4. Create your own examples

### Create New Examples

1. Follow the guide in DEVELOPMENT.md
2. Create new contract in `contracts/`
3. Create test in `test/`
4. Update script configurations
5. Generate documentation

### Deploy Examples

1. Set up environment variables
2. Run deployment scripts
3. Verify on testnet
4. Interact with deployed contracts

---

## Resources

### Documentation
- [README.md](./README.md) - Project overview
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development guide
- [scripts/README.md](./scripts/README.md) - Script documentation

### External Resources
- [Zama Documentation](https://docs.zama.ai)
- [FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [Hardhat Documentation](https://hardhat.org)
- [Solidity Documentation](https://docs.soliditylang.org)

### Community Support
- [Zama Forum](https://www.zama.ai/community)
- [Discord Server](https://discord.com/invite/zama)

---

## Common Questions

**Q: Do I need special hardware for FHE?**
A: No, the mock FHEVM environment runs on standard computers for development and testing.

**Q: Can I modify the generated examples?**
A: Yes, the generated projects are fully editable and ready for customization.

**Q: How do I add a new example?**
A: Follow the guide in DEVELOPMENT.md for adding new examples to the automation system.

**Q: Where can I get help?**
A: Check the documentation files or visit the Zama community forum.

---

## Verification Checklist

Before moving forward, verify:

- [ ] Node.js 20+ is installed
- [ ] npm 7+ is installed
- [ ] All dependencies installed with `npm install`
- [ ] Contracts compile with `npm run compile`
- [ ] All tests pass with `npm run test`
- [ ] Can generate examples with `npm run create-example`
- [ ] Can generate categories with `npm run create-category`
- [ ] Can generate docs with `npm run generate-all-docs`

---

**Ready to start?** Begin with the Quick Start section or follow one of the workflows above!

For more detailed information, see [README.md](./README.md) and [DEVELOPMENT.md](./DEVELOPMENT.md).
