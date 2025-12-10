#!/usr/bin/env node

import * as fs from "fs";
import * as path from "path";

/**
 * Documentation Configuration
 * Defines how to generate docs for each example
 */
interface DocConfig {
  title: string;
  description: string;
  contract: string;
  test: string;
  output: string;
  category: string;
}

const EXAMPLES_CONFIG: Record<string, DocConfig> = {
  "encrypted-identity": {
    title: "Encrypted Identity",
    description:
      "Demonstrates how to build an identity management system using FHEVM, where personal data remains encrypted while enabling identity verification.",
    contract: "contracts/identity/EncryptedIdentity.sol",
    test: "test/identity/EncryptedIdentity.ts",
    output: "docs/encrypted-identity.md",
    category: "Identity & Privacy",
  },
  "confidential-marketplace": {
    title: "Confidential Marketplace",
    description:
      "Shows how to implement a privacy-preserving marketplace where prices and transaction amounts remain hidden from public view while enabling secure trading.",
    contract: "contracts/marketplace/ConfidentialMarketplace.sol",
    test: "test/marketplace/ConfidentialMarketplace.ts",
    output: "docs/confidential-marketplace.md",
    category: "Confidential Commerce",
  },
  "encrypted-gaming": {
    title: "Encrypted Gaming",
    description:
      "Demonstrates confidential gaming contracts where game state, player scores, and strategic decisions remain encrypted throughout gameplay.",
    contract: "contracts/gaming/EncryptedGaming.sol",
    test: "test/gaming/EncryptedGaming.ts",
    output: "docs/encrypted-gaming.md",
    category: "Encrypted Gaming",
  },
  "private-reputation": {
    title: "Private Reputation",
    description:
      "Shows how to implement an anonymous reputation system where user scores and ratings remain encrypted, maintaining privacy while enabling reputation tracking.",
    contract: "contracts/reputation/PrivateReputation.sol",
    test: "test/reputation/PrivateReputation.ts",
    output: "docs/private-reputation.md",
    category: "Identity & Privacy",
  },
  "confidential-voting": {
    title: "Confidential Voting",
    description:
      "Demonstrates secure governance voting where votes remain encrypted, ensuring ballot secrecy while allowing verifiable vote tallying.",
    contract: "contracts/governance/ConfidentialVoting.sol",
    test: "test/governance/ConfidentialVoting.ts",
    output: "docs/confidential-voting.md",
    category: "Confidential Governance",
  },
  "encrypted-treasury": {
    title: "Encrypted Treasury",
    description:
      "Shows how to implement treasury management with encrypted balance tracking, where fund amounts and transfers remain confidential.",
    contract: "contracts/treasury/EncryptedTreasury.sol",
    test: "test/treasury/EncryptedTreasury.ts",
    output: "docs/encrypted-treasury.md",
    category: "Confidential Commerce",
  },
};

interface Colors {
  reset: string;
  green: string;
  cyan: string;
  yellow: string;
  blue: string;
}

const colors: Colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
};

function log(message: string, color: keyof Colors = "reset"): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function readFile(filePath: string): string {
  const fullPath = path.join(__dirname, "..", filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${fullPath}`);
  }
  return fs.readFileSync(fullPath, "utf-8");
}

function getContractName(filePath: string): string {
  const content = readFile(filePath);
  const match = content.match(/^\s*contract\s+(\w+)(?:\s+is\s+|\s*\{)/m);
  return match ? match[1] : "ExampleContract";
}

function extractDescription(filePath: string): string {
  const content = readFile(filePath);
  // Look for JSDoc comments at the start
  const jsdocMatch = content.match(/\/\*\*[\s\S]*?\*\//);
  if (jsdocMatch) {
    const lines = jsdocMatch[0]
      .split("\n")
      .filter((line) => !line.trim().startsWith("*") && !line.includes("/**"))
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return lines.join(" ");
  }
  return "FHEVM Example Contract";
}

function generateGitBookMarkdown(
  config: DocConfig,
  contractCode: string,
  testCode: string
): string {
  const contractName = getContractName(config.contract);
  const testFileName = path.basename(config.test);

  return `# ${config.title}

${config.description}

{% hint style="info" %}
To run this example correctly, make sure the files are placed in the following directories:

- \`.sol\` file → \`<your-project-root-dir>/contracts/\`
- \`.ts\` file → \`<your-project-root-dir>/test/\`

This ensures Hardhat can compile and test your contracts as expected.
{% endhint %}

## Contract Overview

This example demonstrates:
- Encrypted state management
- FHE operations on confidential data
- Permission-based access control
- Privacy-preserving smart contract patterns

{% tabs %}
{% tab title="${contractName}.sol" %}
\`\`\`solidity
${contractCode}
\`\`\`
{% endtab %}

{% tab title="${testFileName}" %}
\`\`\`typescript
${testCode}
\`\`\`
{% endtab %}
{% endtabs %}

## Key Concepts

### Fully Homomorphic Encryption (FHE)

This contract uses FHE to perform computations on encrypted data without ever decrypting it, maintaining complete privacy throughout the contract's execution.

### Encrypted State Variables

State variables are encrypted using FHEVM types:
\`\`\`solidity
euint32 private encryptedValue;
euint64 private encryptedBalance;
ebool private encryptedFlag;
\`\`\`

### FHE Operations

Operations on encrypted values:
\`\`\`solidity
result = FHE.add(encryptedA, encryptedB);
result = FHE.sub(encryptedA, encryptedB);
result = FHE.mul(encryptedA, encryptedB);
result = FHE.eq(encryptedA, encryptedB);
result = FHE.gt(encryptedA, encryptedB);
\`\`\`

### Permission Management

All encrypted values require explicit permissions:
\`\`\`solidity
// Grant contract access
FHE.allowThis(encryptedValue);

// Grant user access for decryption
FHE.allow(encryptedValue, userAddress);
\`\`\`

## Testing

Tests demonstrate:
- Correct encryption binding
- FHE operations producing correct results
- Permission requirements
- Common pitfalls to avoid

## Important Notes

- Always grant both \`allowThis()\` and \`allow(address)\` permissions
- Encrypted values cannot be returned from view functions
- Test thoroughly with the mock FHEVM environment
- Consider gas implications of FHE operations in production

## Related Examples

- [Encrypted Identity](./encrypted-identity.md)
- [Confidential Marketplace](./confidential-marketplace.md)
- [Private Reputation](./private-reputation.md)

## License

BSD-3-Clause-Clear

## Support

For detailed information about FHEVM development:
- [Zama Official Documentation](https://docs.zama.ai)
- [Zama Community Forum](https://www.zama.ai/community)
- [GitHub Repository](https://github.com/zama-ai/fhevm-examples)
`;
}

function updateSummary(docsDir: string, noSummary: boolean = false): void {
  if (noSummary) {
    return;
  }

  const summaryPath = path.join(docsDir, "SUMMARY.md");

  // Group examples by category
  const categories: Record<string, string[]> = {};

  for (const [exampleName, config] of Object.entries(EXAMPLES_CONFIG)) {
    if (!categories[config.category]) {
      categories[config.category] = [];
    }
    categories[config.category].push(exampleName);
  }

  let summaryContent = "# FHEVM Examples Documentation\n\n";

  for (const [categoryName, examples] of Object.entries(categories)) {
    summaryContent += `## ${categoryName}\n\n`;

    for (const exampleName of examples) {
      const config = EXAMPLES_CONFIG[exampleName];
      const docFileName = path.basename(config.output).replace(".md", "");
      summaryContent += `- [${config.title}](${docFileName}.md)\n`;
    }

    summaryContent += "\n";
  }

  fs.writeFileSync(summaryPath, summaryContent);
}

async function generateDocs(
  exampleName: string,
  noSummary: boolean = false
): Promise<void> {
  if (!EXAMPLES_CONFIG[exampleName]) {
    log(`Error: Unknown example "${exampleName}"`, "reset");
    log("Available examples:", "cyan");
    Object.keys(EXAMPLES_CONFIG).forEach((name) => {
      log(`  - ${name}`, "blue");
    });
    process.exit(1);
  }

  const config = EXAMPLES_CONFIG[exampleName];

  log(`Generating documentation for: ${exampleName}`, "cyan");

  // Read contract and test files
  const contractCode = readFile(config.contract);
  const testCode = readFile(config.test);

  // Generate markdown
  const markdown = generateGitBookMarkdown(config, contractCode, testCode);

  // Write to output file
  const docsDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const outputPath = path.join(docsDir, path.basename(config.output));
  fs.writeFileSync(outputPath, markdown);

  log(`✓ Generated: ${path.basename(config.output)}`, "green");

  // Update SUMMARY.md if not disabled
  if (!noSummary) {
    updateSummary(docsDir);
  }
}

async function generateAllDocs(): Promise<void> {
  const docsDir = path.join(__dirname, "..", "docs");
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  log("Generating documentation for all examples...", "cyan");
  log("", "reset");

  for (const exampleName of Object.keys(EXAMPLES_CONFIG)) {
    const config = EXAMPLES_CONFIG[exampleName];

    try {
      const contractCode = readFile(config.contract);
      const testCode = readFile(config.test);

      const markdown = generateGitBookMarkdown(config, contractCode, testCode);

      const outputPath = path.join(docsDir, path.basename(config.output));
      fs.writeFileSync(outputPath, markdown);

      log(`✓ ${exampleName}`, "green");
    } catch (error) {
      log(`✗ ${exampleName}: ${error instanceof Error ? error.message : String(error)}`, "reset");
    }
  }

  // Update SUMMARY.md once at the end
  updateSummary(docsDir);
  log("", "reset");
  log("✓ Updated SUMMARY.md", "green");
}

// CLI Entry Point
const args = process.argv.slice(2);

if (args.includes("--help")) {
  log("Usage: generate-docs [example-name] [--all]", "cyan");
  log("\nOptions:", "cyan");
  log("  --all        Generate documentation for all examples", "blue");
  log("  --help       Show this help message", "blue");
  log("\nAvailable examples:", "cyan");
  Object.keys(EXAMPLES_CONFIG).forEach((name) => {
    log(`  ${name}`, "blue");
  });
  process.exit(0);
}

if (args.includes("--all")) {
  generateAllDocs().catch((error) => {
    log(`Error: ${error.message}`, "reset");
    process.exit(1);
  });
} else if (args.length > 0) {
  const exampleName = args[0];
  const noSummary = args.includes("--no-summary");

  generateDocs(exampleName, noSummary).catch((error) => {
    log(`Error: ${error.message}`, "reset");
    process.exit(1);
  });
} else {
  log("Usage: generate-docs [example-name] [--all]", "cyan");
  log("Run with --help for more information", "yellow");
  process.exit(1);
}
