#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

/**
 * Category Configuration
 * Groups related examples into deployable projects
 */
interface ContractConfig {
  path: string;
  testPath: string;
}

interface CategoryConfig {
  name: string;
  description: string;
  contracts: Record<string, ContractConfig>;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  identity: {
    name: "Identity & Privacy",
    description: "Encrypted identity management and privacy systems",
    contracts: {
      "encrypted-identity": {
        path: "contracts/identity/EncryptedIdentity.sol",
        testPath: "test/identity/EncryptedIdentity.ts",
      },
      "private-reputation": {
        path: "contracts/reputation/PrivateReputation.sol",
        testPath: "test/reputation/PrivateReputation.ts",
      },
    },
  },
  commerce: {
    name: "Confidential Commerce",
    description: "Privacy-preserving marketplace and trading systems",
    contracts: {
      "confidential-marketplace": {
        path: "contracts/marketplace/ConfidentialMarketplace.sol",
        testPath: "test/marketplace/ConfidentialMarketplace.ts",
      },
      "encrypted-treasury": {
        path: "contracts/treasury/EncryptedTreasury.sol",
        testPath: "test/treasury/EncryptedTreasury.ts",
      },
    },
  },
  gaming: {
    name: "Encrypted Gaming",
    description: "Confidential gaming systems with hidden state",
    contracts: {
      "encrypted-gaming": {
        path: "contracts/gaming/EncryptedGaming.sol",
        testPath: "test/gaming/EncryptedGaming.ts",
      },
    },
  },
  governance: {
    name: "Confidential Governance",
    description: "Privacy-preserving voting and governance",
    contracts: {
      "confidential-voting": {
        path: "contracts/governance/ConfidentialVoting.sol",
        testPath: "test/governance/ConfidentialVoting.ts",
      },
    },
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

function generateDeployScript(
  outputDir: string,
  contracts: Record<string, string>
): void {
  const deployDir = path.join(outputDir, "deploy");
  const deployScript = path.join(deployDir, "deploy.ts");

  const importStatements = Object.values(contracts)
    .map((name) => `  ${name},`)
    .join("\n");

  const deployStatements = Object.entries(contracts)
    .map(([, name]) => {
      return `  const ${name[0].toLowerCase()}${name.slice(1)} = await ethers.getContractFactory("${name}");\n  const ${name[0].toLowerCase()}${name.slice(1)}Instance = await ${name[0].toLowerCase()}${name.slice(1)}.deploy();\n  await ${name[0].toLowerCase()}${name.slice(1)}Instance.waitForDeployment();\n  console.log("${name} deployed to:", await ${name[0].toLowerCase()}${name.slice(1)}Instance.getAddress());`;
    })
    .join("\n\n");

  const deployContent = `import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with account:", deployer.address);

${deployStatements}

  console.log("All contracts deployed successfully!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
`;

  fs.writeFileSync(deployScript, deployContent);
}

function generateReadme(
  outputDir: string,
  categoryName: string,
  categoryDescription: string,
  contractCount: number
): void {
  const readmeContent = `# FHEVM Category: ${categoryName}

## Overview

${categoryDescription}

This project contains **${contractCount}** standalone FHEVM examples demonstrating privacy-preserving smart contracts using Fully Homomorphic Encryption (FHE) technology.

## Structure

\`\`\`
.
├── contracts/
│   └── [Multiple FHE contracts]
├── test/
│   └── [Test suites for each contract]
├── deploy/
│   └── deploy.ts                 # Deploy all contracts
├── hardhat.config.ts             # Hardhat configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Project dependencies
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

### Compile All Contracts

\`\`\`bash
npm run compile
\`\`\`

### Run All Tests

\`\`\`bash
npm run test
\`\`\`

### Deploy All Contracts

\`\`\`bash
npm run deploy:localhost
\`\`\`

## Available Examples

This category includes the following examples:

- **Encrypted Identity** - Private user identity management
- **Confidential Marketplace** - Privacy-preserving asset trading
- **Encrypted Gaming** - Confidential game state
- **Private Reputation** - Anonymous reputation systems
- **Confidential Voting** - Secret ballot governance
- **Encrypted Treasury** - Confidential balance management

## Key Concepts

### Fully Homomorphic Encryption

FHE allows computations on encrypted data without decryption:

\`\`\`solidity
// Operations performed on encrypted data
result = FHE.add(encryptedA, encryptedB);
\`\`\`

### Permission Management

All encrypted values require explicit permissions:

\`\`\`solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, userAddress);
\`\`\`

## License

BSD-3-Clause-Clear

## Support

For questions, visit the [Zama Community Forum](https://www.zama.ai/community)
`;

  const readmePath = path.join(outputDir, "README.md");
  fs.writeFileSync(readmePath, readmeContent);
}

function updatePackageJson(
  outputDir: string,
  categoryName: string,
  categoryDescription: string
): void {
  const packageJsonPath = path.join(outputDir, "package.json");
  let packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  packageJson.name = `fhevm-${categoryName.toLowerCase()}`;
  packageJson.description = `FHEVM Category: ${categoryDescription}`;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
}

async function createCategory(categoryName: string, outputPath: string): Promise<void> {
  if (!CATEGORIES[categoryName]) {
    log(`Error: Unknown category "${categoryName}"`, "red");
    log("Available categories:", "cyan");
    Object.keys(CATEGORIES).forEach((name) => {
      log(`  - ${name}`, "blue");
    });
    process.exit(1);
  }

  const category = CATEGORIES[categoryName];
  const templateDir = path.join(__dirname, "..", "fhevm-hardhat-template");

  log(`\n${"=".repeat(60)}`, "cyan");
  log(`Creating FHEVM Category: ${category.name}`, "cyan");
  log(`${"=".repeat(60)}\n`, "cyan");

  // Step 1: Copy template
  log("Step 1: Copying Hardhat template...", "blue");
  if (fs.existsSync(outputPath)) {
    fs.rmSync(outputPath, { recursive: true });
  }
  copyDirectoryRecursive(templateDir, outputPath);
  log("✓ Template copied", "green");

  // Step 2: Clear default template contracts and tests
  log("Step 2: Clearing template contracts...", "blue");
  const contractsDir = path.join(outputPath, "contracts");
  const testDir = path.join(outputPath, "test");

  if (fs.existsSync(contractsDir)) {
    fs.rmSync(contractsDir, { recursive: true });
    fs.mkdirSync(contractsDir, { recursive: true });
  }
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true });
    fs.mkdirSync(testDir, { recursive: true });
  }
  log("✓ Template cleared", "green");

  // Step 3: Copy category contracts
  log("Step 3: Copying category contracts...", "blue");
  const contractNameMap: Record<string, string> = {};

  for (const [exampleName, config] of Object.entries(category.contracts)) {
    const contractSrcPath = path.join(__dirname, "..", config.path);
    const testSrcPath = path.join(__dirname, "..", config.testPath);

    const contractName = getContractName(contractSrcPath);
    contractNameMap[exampleName] = contractName;

    // Copy contract preserving directory structure
    const contractDir = path.dirname(path.join(contractsDir, config.path.split("contracts/")[1]));
    if (!fs.existsSync(contractDir)) {
      fs.mkdirSync(contractDir, { recursive: true });
    }
    fs.copyFileSync(contractSrcPath, path.join(contractDir, `${contractName}.sol`));

    // Copy test preserving directory structure
    const testFileDir = path.dirname(path.join(testDir, config.testPath.split("test/")[1]));
    if (!fs.existsSync(testFileDir)) {
      fs.mkdirSync(testFileDir, { recursive: true });
    }
    fs.copyFileSync(testSrcPath, path.join(testFileDir, `${contractName}.ts`));

    log(`  ✓ ${contractName}`, "green");
  }

  // Step 4: Generate deploy script
  log("Step 4: Generating deployment script...", "blue");
  generateDeployScript(outputPath, contractNameMap);
  log("✓ Deployment script generated", "green");

  // Step 5: Update package.json
  log("Step 5: Updating package.json...", "blue");
  updatePackageJson(outputPath, categoryName, category.description);
  log("✓ Package configuration updated", "green");

  // Step 6: Generate README
  log("Step 6: Generating README...", "blue");
  generateReadme(
    outputPath,
    category.name,
    category.description,
    Object.keys(category.contracts).length
  );
  log("✓ README generated", "green");

  // Summary
  log(`\n${"=".repeat(60)}`, "green");
  log("✓ Category project created successfully!", "green");
  log(`${"=".repeat(60)}\n`, "green");

  log(`Created ${Object.keys(category.contracts).length} contracts in ${categoryName}`, "yellow");
  log("\nNext steps:", "yellow");
  log(`  1. cd ${outputPath}`, "yellow");
  log(`  2. npm install`, "yellow");
  log(`  3. npm run compile`, "yellow");
  log(`  4. npm run test`, "yellow");
  log("");
}

// CLI Entry Point
const args = process.argv.slice(2);

if (args.length < 2 || args.includes("--help")) {
  log("Usage: create-fhevm-category <category-name> <output-path>", "cyan");
  log("\nAvailable categories:", "cyan");
  Object.entries(CATEGORIES).forEach(([name, config]) => {
    log(`  ${name.padEnd(20)} - ${config.description}`, "blue");
  });
  process.exit(args.includes("--help") ? 0 : 1);
}

const categoryName = args[0];
const outputPath = path.resolve(args[1]);

createCategory(categoryName, outputPath).catch((error) => {
  log(`Error: ${error.message}`, "red");
  process.exit(1);
});
