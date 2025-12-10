# Installation Guide

Complete step-by-step guide to set up the FHEVM Example Hub project.

---

## System Requirements

### Minimum Requirements

- **OS:** Windows, macOS, or Linux
- **Node.js:** v20.0.0 or higher
- **npm:** v7.0.0 or higher
- **Git:** v2.0.0 or higher

### Recommended Requirements

- **Node.js:** v20.19.0 or higher
- **npm:** v10.0.0 or higher
- **Memory:** 4GB RAM minimum, 8GB recommended
- **Disk Space:** 2GB free space

---

## Step 1: Verify Prerequisites

Before installation, verify you have the required tools:

```bash
# Check Node.js version
node --version
# Expected: v20.x.x or higher

# Check npm version
npm --version
# Expected: 7.x.x or higher (ideally 10.x.x+)

# Check Git version
git --version
# Expected: 2.x.x or higher
```

### Installing Node.js

If you don't have Node.js installed:

**Windows & macOS:**
1. Visit https://nodejs.org/
2. Download LTS version (20.x or higher)
3. Run the installer and follow prompts
4. Verify: `node --version`

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Linux (Using nvm - recommended):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
```

---

## Step 2: Clone or Download Project

### Option A: Using Git

```bash
git clone https://github.com/your-repo/SecretMetaverseFHE.git
cd SecretMetaverseFHE
```

### Option B: Manual Download

1. Download the project ZIP from repository
2. Extract to desired location
3. Open terminal/command prompt in the extracted folder

---

## Step 3: Install Dependencies

Navigate to project root directory and install all dependencies:

```bash
# From project root directory
cd SecretMetaverseFHE

# Install dependencies
npm install

# This will take 2-5 minutes depending on internet speed
```

### What Gets Installed

- **Hardhat** - Smart contract development framework
- **@fhevm/solidity** - FHEVM solidity library
- **@fhevm/hardhat-plugin** - FHEVM Hardhat integration
- **ethers.js** - Ethereum JavaScript library
- **TypeScript** - Type-safe JavaScript
- **Testing frameworks** - Chai, Mocha
- **Linting tools** - Solhint, ESLint
- **Additional utilities** - Gas reporter, coverage tools

---

## Step 4: Verify Installation

Compile the contracts to verify everything is set up correctly:

```bash
# Compile all contracts
npm run compile

# Expected output:
# Successfully compiled X contracts
```

If compilation succeeds, installation is complete!

---

## Step 5: Run Tests (Optional but Recommended)

Verify the setup by running tests:

```bash
# Run all tests
npm run test

# Expected output:
# passing (64+ tests should pass)
```

If all tests pass, your installation is working correctly!

---

## Troubleshooting

### Issue: "Node version not supported"

**Error Message:**
```
The engine "node" is incompatible with this module.
```

**Solution:**
```bash
# Update Node.js to version 20 or higher
# Check current version
node --version

# Use nvm to switch versions (if installed)
nvm install 20
nvm use 20

# Verify
node --version  # Should show v20.x.x or higher
```

### Issue: "npm ERR! code EACCES"

**Error Message:**
```
npm ERR! code EACCES
npm ERR! syscall mkdir
```

**Solution (Linux/macOS):**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
```

### Issue: "Module not found" or "Cannot find module"

**Error Message:**
```
Cannot find module '@fhevm/solidity'
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# On Windows:
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Issue: "Compilation failed"

**Error Message:**
```
Error: Compilation failed
```

**Solution:**
```bash
# Clean and recompile
npm run clean
npm install
npm run compile

# Check for syntax errors in contracts
npm run lint:sol
```

### Issue: "Tests fail with FHEVM errors"

**Error Message:**
```
FHEVM environment not detected
```

**Solution:**
```bash
# Ensure you're using npm test (not hardhat test directly)
npm run test

# If still failing, update dependencies
npm update
npm run compile
npm run test
```

### Issue: "Port already in use"

**Error Message:**
```
Error: listen EADDRINUSE :::8545
```

**Solution:**
```bash
# Kill process on port 8545
# macOS/Linux:
lsof -ti :8545 | xargs kill -9

# Windows:
netstat -ano | findstr :8545
taskkill /PID <PID> /F
```

---

## Post-Installation

### Generate a Single Example

After successful installation, try generating an example:

```bash
# Generate encrypted identity example
npm run create-example encrypted-identity ./my-identity-example

# Navigate to generated example
cd ./my-identity-example

# Install its dependencies
npm install

# Compile and test
npm run compile
npm run test
```

### Generate a Category Project

Create a project with multiple examples:

```bash
# Generate identity category (multiple examples)
npm run create-category identity ./my-identity-project

# Navigate and test
cd ./my-identity-project
npm install
npm run compile
npm run test
```

### Generate Documentation

Create GitBook-compatible documentation:

```bash
# Generate all documentation
npm run generate-all-docs

# Check generated docs
ls -la docs/
```

---

## Environment Setup (Optional)

For deployment to testnet, set up environment variables:

```bash
# Create .env file
cp .env.example .env

# Edit .env with your values
# - PRIVATE_KEY: Your wallet's private key
# - INFURA_API_KEY: Your Infura API key (for Sepolia)
# - ETHERSCAN_API_KEY: For contract verification
```

**Important:** Never commit `.env` file! It contains sensitive data.

---

## Verify Complete Setup

Run this checklist to ensure everything is installed correctly:

- [ ] Node.js v20+ installed: `node --version`
- [ ] npm 7+ installed: `npm --version`
- [ ] Dependencies installed: `ls node_modules` (folder exists)
- [ ] Contracts compile: `npm run compile` (succeeds)
- [ ] Tests pass: `npm run test` (64+ tests pass)
- [ ] Can generate examples: `npm run create-example encrypted-identity ./test`
- [ ] Can generate docs: `npm run generate-all-docs`

If all items checked, installation is complete!

---

## Next Steps

After successful installation:

1. **Read Documentation**
   - Review `README.md` for project overview
   - Check `GETTING_STARTED.md` for quick start

2. **Explore Examples**
   - Read through 6 smart contract examples
   - Study test patterns
   - Understand FHE concepts

3. **Generate Examples**
   - Try `npm run create-example`
   - Test generated repositories
   - Modify and experiment

4. **Review Development Guide**
   - See `DEVELOPMENT.md`
   - Learn to add new examples
   - Understand automation scripts

---

## Getting Help

If you encounter issues:

1. **Check Documentation**
   - Review relevant `.md` files
   - Search for error message

2. **Review Existing Issues**
   - Check GitHub issues (if applicable)
   - Look for similar problems

3. **Check Resources**
   - [FHEVM Documentation](https://docs.zama.ai)
   - [Zama Community Forum](https://www.zama.ai/community)
   - [Discord Server](https://discord.com/invite/zama)

4. **Report Issues**
   - Document error message
   - Include system information
   - Provide reproduction steps

---

## Advanced Configuration

### Custom Network Configuration

Edit `hardhat.config.ts` to add custom networks:

```typescript
networks: {
  mynetwork: {
    url: "https://your-rpc-url.com",
    accounts: {
      mnemonic: process.env.MNEMONIC || "test test test..."
    },
    chainId: 1337,
  }
}
```

### Gas Reporter Configuration

Modify gas reporter settings in `hardhat.config.ts`:

```typescript
gasReporter: {
  enabled: true,
  currency: "USD",
  coinmarketcap: process.env.COINMARKETCAP_API_KEY,
}
```

---

**Installation Complete!** You're ready to start developing with FHEVM.

For detailed usage instructions, see [GETTING_STARTED.md](./GETTING_STARTED.md)
