#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

/**
 * Example Configuration
 * Defines all available standalone examples
 */
interface ExampleConfig {
  contract: string;
  test: string;
  description: string;
  testFixture?: string;
}

const EXAMPLES_MAP: Record<string, ExampleConfig> = {
  "encrypted-identity": {
    contract: "contracts/identity/EncryptedIdentity.sol",
    test: "test/identity/EncryptedIdentity.ts",
    description: "Private user identity management with encrypted personal data",
  },
  "confidential-marketplace": {
    contract: "contracts/marketplace/ConfidentialMarketplace.sol",
    test: "test/marketplace/ConfidentialMarketplace.ts",
    description: "Privacy-preserving virtual asset marketplace with hidden prices",
  },
  "encrypted-gaming": {
    contract: "contracts/gaming/EncryptedGaming.sol",
    test: "test/gaming/EncryptedGaming.ts",
    description: "Confidential gaming with encrypted game state",
  },
  "private-reputation": {
    contract: "contracts/reputation/PrivateReputation.sol",
    test: "test/reputation/PrivateReputation.ts",
    description: "Encrypted reputation system maintaining user anonymity",
  },
  "confidential-voting": {
    contract: "contracts/governance/ConfidentialVoting.sol",
    test: "test/governance/ConfidentialVoting.ts",
    description: "Privacy-preserving governance voting with encrypted ballots",
  },
  "encrypted-treasury": {
    contract: "contracts/treasury/EncryptedTreasury.sol",
    test: "test/treasury/EncryptedTreasury.ts",
    description: "Confidential treasury management with encrypted balances",
  },
};

interface Colors {
  reset: string;
  green: string;
  cyan: string;
  yellow: string;
  blue: string;
  red: string;
}

const colors: Colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
};

function log(message: string, color: keyof Colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function copyDirectoryRecursive(src: string, dest: string): void {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);
  for (const file of files) {
    // Skip node_modules, artifacts, cache, and lock files
    if (
      ["node_modules", "artifacts", "cache", ".git", "dist"].includes(file) ||
      file.endsWith(".lock")
    ) {
      continue;
    }

    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    if (fs.statSync(srcPath).isDirectory()) {
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getContractName(filePath: string): string {
  const content = fs.readFileSync(filePath, "utf-8");
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : "ExampleContract";
}

function updateDeployScript(outputDir: string, contractName: string, contractPath: string): void {
  const deployDir = path.join(outputDir, "deploy");
  const deployScript = path.join(deployDir, "deploy.ts");

  const deployContent = `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying ${contractName} with account:", deployer.address);

  const Contract = await ethers.getContractFactory("${contractName}");
  const contract = await Contract.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("${contractName} deployed to:", contractAddress);

  return contractAddress;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

  fs.writeFileSync(deployScript, deployContent);
}

function updatePackageJson(outputDir: string, exampleName: string, description: string): void {
  const packageJsonPath = path.join(outputDir, "package.json");
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  packageJson.name = `fhevm-example-${exampleName}`;
  packageJson.description = `FHEVM Example: ${description}`;
  packageJson.homepage = `https://github.com/zama-ai/fhevm-examples/tree/main/examples/${exampleName}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

function generateReadme(
  outputDir: string,
  exampleName: string,
  description: string,
  contractName: string
): void {
  const readmeContent = `# FHEVM Example: ${exampleName.replace(/-/g, " ").toUpperCase()}

## Overview

${description}

## Description

This is a standalone FHEVM example demonstrating privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) technology.

## Structure

\`\`\`
.
├── contracts/
│   └── ${contractName}.sol          # Main contract
├── test/
│   └── ${contractName}.ts           # Contract tests
├── hardhat.config.ts               # Hardhat configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json                    # Project dependencies
\`\`\`

## Setup

### Prerequisites

- Node.js >= 20
- npm >= 7

### Installation

\`\`\`bash
npm install
\`\`\`

## Usage

### Compile Contracts

\`\`\`bash
npm run compile
\`\`\`

### Run Tests

\`\`\`bash
npm run test
\`\`\`

### Deploy (Local)

\`\`\`bash
npm run deploy:localhost
\`\`\`

### Deploy (Sepolia Testnet)

\`\`\`bash
npm run deploy:sepolia
\`\`\`

## Key Concepts

### Encrypted State

The contract uses encrypted state variables to maintain privacy:

\`\`\`solidity
euint32 private encryptedValue;
\`\`\`

### FHE Operations

Operations are performed directly on encrypted data:

\`\`\`solidity
// Encrypt external input
euint32 internal = FHE.fromExternal(externalEuint32, inputProof);

// Perform computation on encrypted data
result = FHE.add(encryptedValue, internal);

// Grant permissions for access
FHE.allowThis(result);
FHE.allow(result, msg.sender);
\`\`\`

### Permission Management

All encrypted values require explicit permission grants:

- \`FHE.allowThis(value)\` - Allows the contract to access the value
- \`FHE.allow(value, address)\` - Allows a specific address to decrypt the value

## Important Notes

- This example demonstrates fundamental FHEVM patterns
- Never expose private encrypted values without explicit permission
- Always grant both contract and user permissions when needed
- Test thoroughly with various inputs before mainnet deployment

## License

BSD-3-Clause-Clear

## Support

For questions and support, visit:
- [Zama Community Forum](https://www.zama.ai/community)
- [Zama Discord](https://discord.com/invite/zama)
- [GitHub Issues](https://github.com/zama-ai/fhevm-examples/issues)
`;

  const readmePath = path.join(outputDir, "README.md");
  fs.writeFileSync(readmePath, readmeContent);
}

async function createExample(exampleName: string, outputPath: string): Promise<void> {
  if (!EXAMPLES_MAP[exampleName]) {
    log(`Error: Unknown example "${exampleName}"`, "red");
    log("Available examples:", "cyan");
    Object.keys(EXAMPLES_MAP).forEach((name) => {
      log(`  - ${name}`, "blue");
    });
    process.exit(1);
  }

  const example = EXAMPLES_MAP[exampleName];
  const templateDir = path.join(__dirname, "..", "fhevm-hardhat-template");

  log(`\n${"=".repeat(60)}`, "cyan");
  log(`Creating FHEVM Example: ${exampleName}`, "cyan");
  log(`${"=".repeat(60)}\n`, "cyan");

  // Step 1: Copy template
  log("Step 1: Copying Hardhat template...", "blue");
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true });
  }
  copyDirectoryRecursive(templateDir, outputPath);
  log("✓ Template copied", "green");

  // Step 2: Copy contract
  log("Step 2: Copying contract...", "blue");
  const contractSrcPath = path.join(__dirname, "..", example.contract);
  const contractName = getContractName(contractSrcPath);
  const contractDestDir = path.join(outputPath, "contracts");
  if (!fs.existsSync(contractDestDir)) {
    fs.mkdirSync(contractDestDir, { recursive: true });
  }
  fs.copyFileSync(contractSrcPath, path.join(contractDestDir, `${contractName}.sol`));
  log(`✓ Contract copied: ${contractName}`, "green");

  // Step 3: Copy test
  log("Step 3: Copying tests...", "blue");
  const testSrcPath = path.join(__dirname, "..", example.test);
  const testDestDir = path.join(outputPath, "test");
  if (!fs.existsSync(testDestDir)) {
    fs.mkdirSync(testDestDir, { recursive: true });
  }
  fs.copyFileSync(testSrcPath, path.join(testDestDir, `${contractName}.ts`));
  log("✓ Tests copied", "green");

  // Step 4: Update deploy script
  log("Step 4: Updating deployment script...", "blue");
  updateDeployScript(outputPath, contractName, example.contract);
  log("✓ Deployment script updated", "green");

  // Step 5: Update package.json
  log("Step 5: Updating package.json...", "blue");
  updatePackageJson(outputPath, exampleName, example.description);
  log("✓ Package configuration updated", "green");

  // Step 6: Generate README
  log("Step 6: Generating README...", "blue");
  generateReadme(outputPath, exampleName, example.description, contractName);
  log("✓ README generated", "green");

  // Summary
  log(`\n${"=".repeat(60)}`, "green");
  log("✓ Example created successfully!", "green");
  log(`${"=".repeat(60)}\n`, "green");

  log("Next steps:", "yellow");
  log(`  1. cd ${outputPath}`, "yellow");
  log(`  2. npm install`, "yellow");
  log(`  3. npm run compile`, "yellow");
  log(`  4. npm run test`, "yellow");
  log("");
}

// CLI Entry Point
const args = process.argv.slice(2);

if (args.length < 2 || args.includes("--help")) {
  log("Usage: create-fhevm-example <example-name> <output-path>", "cyan");
  log("\nAvailable examples:", "cyan");
  Object.entries(EXAMPLES_MAP).forEach(([name, config]) => {
    log(`  ${name.padEnd(30)} - ${config.description}`, "blue");
  });
  process.exit(args.includes("--help") ? 0 : 1);
}

const exampleName = args[0];
const outputPath = path.resolve(args[1]);

createExample(exampleName, outputPath).catch((error) => {
  log(`Error: ${error.message}`, "red");
  process.exit(1);
});
