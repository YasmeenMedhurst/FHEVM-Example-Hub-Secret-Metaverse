# Architecture Guide

Complete technical documentation of the FHEVM Example Hub project architecture.

---

## Overview

The FHEVM Example Hub is a comprehensive platform for learning and implementing privacy-preserving smart contracts using Fully Homomorphic Encryption. The architecture is designed around modularity, automation, and education.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FHEVM Example Hub                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Contracts   │  │  Test Suites │  │  Automation  │           │
│  │  (Solidity)  │  │  (TypeScript)│  │  (TypeScript)│           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • Identity   │  │ • 64+ Tests  │  │ • Generate   │           │
│  │ • Voting     │  │ • Coverage   │  │ • Docs       │           │
│  │ • Marketplace│  │ • Scenarios  │  │ • Category   │           │
│  │ • Gaming     │  │ • Pitfalls   │  │ • Templates  │           │
│  │ • Reputation │  │ • Edge Cases │  │               │           │
│  │ • Treasury   │  │ • Success    │  │               │           │
│  └──────────────┘  └────���─────────┘  └──────────────┘           │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Base Template│  │ Documentation│  │ Configuration│           │
│  ├──────────────┤  ├──────────────┤  ├──────────────┤           │
│  │ • Hardhat    │  │ • SUMMARY.md │  │ • tsconfig   │           │
│  │ • Config     │  │ • 6 Examples │  │ • hardhat    │           │
│  │ • Package    │  │ • Guides     │  │ • package    │           │
│  │ • Setup      │  │ • Patterns   │  │ • .gitignore │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure

```
SecretMetaverseFHE/
│
├── contracts/                          # Smart Contracts
│   ├── identity/
│   │   ├── EncryptedIdentity.sol      # User identity management
│   │   └── ...
│   ├── marketplace/
│   │   ├── ConfidentialMarketplace.sol # Privacy-preserving trading
│   │   └── ...
│   ├── gaming/
│   │   ├── EncryptedGaming.sol        # Hidden-state gaming
│   │   └── ...
│   ├── reputation/
│   │   ├── PrivateReputation.sol      # Anonymous reputation
│   │   └── ...
│   ├── governance/
│   │   ├── ConfidentialVoting.sol     # Secret-ballot voting
│   │   └── ...
│   └── treasury/
│       ├── EncryptedTreasury.sol      # Confidential fund management
│       └── ...
│
├── test/                               # Test Suites
│   ├── identity/
│   │   ├── EncryptedIdentity.ts       # 15+ tests
│   │   └── ...
│   ├── marketplace/
│   │   ├── ConfidentialMarketplace.ts # 18+ tests
│   │   └── ...
│   ├── gaming/
│   │   ├── EncryptedGaming.ts         # 16+ tests
│   │   └── ...
│   ├── reputation/
│   │   ├── PrivateReputation.ts       # 17+ tests
│   │   └── ...
│   ├── governance/
│   │   ├── ConfidentialVoting.ts      # 20+ tests
│   │   └── ...
│   └── treasury/
│       ├── EncryptedTreasury.ts       # 19+ tests
│       └── ...
│
├── scripts/                            # Automation Tools
│   ├── create-fhevm-example.ts        # Single example generator
│   ├── create-fhevm-category.ts       # Category project generator
│   ├── generate-docs.ts               # Documentation generator
│   └── README.md                       # Script documentation
│
├── fhevm-hardhat-template/             # Base Hardhat Template
│   ├── contracts/                      # Template contract directory
│   ├── test/                           # Template test directory
│   ├── deploy/                         # Template deployment scripts
│   ├── hardhat.config.ts               # Hardhat configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── package.json                    # Dependencies
│   ├── README.md                       # Template documentation
│   ├── .gitignore                      # Git ignore rules
│   └── LICENSE                         # License file
│
├── docs/                               # Auto-Generated Documentation
│   ├── SUMMARY.md                      # Documentation index
│   ├── encrypted-identity.md           # Identity pattern guide
│   ├── confidential-marketplace.md     # Marketplace pattern guide
│   ├── encrypted-gaming.md             # Gaming pattern guide
│   ├── private-reputation.md           # Reputation pattern guide
│   ├── confidential-voting.md          # Voting pattern guide
│   └── encrypted-treasury.md           # Treasury pattern guide
│
├── README.md                           # Main project documentation
├── GETTING_STARTED.md                  # Setup and quick start guide
├── DEVELOPMENT.md                      # Development workflow guide
├── INSTALL.md                          # Installation instructions
├── ARCHITECTURE.md                     # This file
├── QUICK_REFERENCE.md                  # Command reference
├── TUTORIAL.md                         # Step-by-step tutorial
├── START_HERE                      # Entry point guide
├── VIDEO_SCRIPT.md                     # Demo video script
├── VIDEO_TRANSCRIPT                # Video narration
│
├── hardhat.config.ts                   # Main Hardhat configuration
├── tsconfig.json                       # Main TypeScript configuration
├── package.json                        # Main dependencies
├── package-lock.json                   # Locked dependency versions
│
└── types/                              # Generated TypeScript Types
    └── (auto-generated by typechain)
```

---

## Core Components

### 1. Smart Contracts (Solidity)

**Purpose:** Demonstrate FHE patterns with privacy-preserving smart contracts.

**Structure:**
```
contracts/
├── identity/EncryptedIdentity.sol        (~280 lines)
├── marketplace/ConfidentialMarketplace.sol (~350 lines)
├── gaming/EncryptedGaming.sol            (~320 lines)
├── reputation/PrivateReputation.sol      (~300 lines)
├── governance/ConfidentialVoting.sol     (~360 lines)
└── treasury/EncryptedTreasury.sol        (~340 lines)
```

**Key Features:**
- All contracts inherit from `ZamaEthereumConfig`
- Use `@fhevm/solidity` library for encrypted types
- Implement access control patterns
- Include comprehensive JSDoc comments
- Follow OpenZeppelin security patterns

**Design Patterns Used:**
1. **Encrypted State Management** - Store encrypted values on-chain
2. **Permission Management** - FHE.allow and FHE.allowThis
3. **Encrypted Operations** - Arithmetic and comparison in encrypted domain
4. **Multi-User Isolation** - Separate encrypted state per user

---

### 2. Test Suites (TypeScript + Hardhat)

**Purpose:** Provide comprehensive test coverage showing correct usage and common pitfalls.

**Structure:**
```
test/
├── identity/EncryptedIdentity.ts         (~420 lines, 15+ tests)
├── marketplace/ConfidentialMarketplace.ts (~480 lines, 18+ tests)
├── gaming/EncryptedGaming.ts             (~400 lines, 16+ tests)
├── reputation/PrivateReputation.ts       (~440 lines, 17+ tests)
├── governance/ConfidentialVoting.ts      (~520 lines, 20+ tests)
└── treasury/EncryptedTreasury.ts         (~480 lines, 19+ tests)
```

**Test Categories:**
1. **Success Scenarios (✓)** - Valid operations that should succeed
2. **Failure Scenarios (✗)** - Invalid operations that should fail
3. **Edge Cases** - Boundary conditions and special cases
4. **Multi-User Scenarios** - Interactions between multiple users
5. **State Transitions** - Correct state changes

**Testing Patterns:**
```typescript
// 1. Setup: Create encrypted input
const input = fhevm.createEncryptedInput(contractAddress, signer.address);
input.add32(value);
const encrypted = await input.encrypt();

// 2. Invoke: Call contract with encrypted data
await contract.function(encrypted.handles[0], encrypted.inputProof);

// 3. Decrypt: Get result
const result = await fhevm.userDecryptEuint32(contractAddress, returnValue, signer);

// 4. Assert: Verify outcome
expect(result).to.equal(expectedValue);
```

---

### 3. Automation Scripts (TypeScript)

**Purpose:** Generate standalone projects and documentation automatically.

**Scripts:**

#### a) create-fhevm-example.ts
- Generates single example repositories
- Copies base template
- Inserts specific contract and tests
- Creates standalone project structure

```bash
npm run create-example <example-name> <output-path>
```

#### b) create-fhevm-category.ts
- Generates category-based projects
- Multiple examples per category
- Shared configuration
- Unified testing and deployment

```bash
npm run create-category <category-name> <output-path>
```

#### c) generate-docs.ts
- Auto-generates GitBook-compatible documentation
- Creates SUMMARY.md index
- Generates per-example markdown files
- Includes code snippets and explanations

```bash
npm run generate-all-docs
```

**Configuration:**
```typescript
const EXAMPLES_MAP = {
  "example-name": {
    contract: "path/to/Contract.sol",
    test: "path/to/Contract.ts",
    description: "Example description",
  }
};
```

---

### 4. Base Hardhat Template

**Purpose:** Provide standardized project structure for generated examples.

**Contents:**
```
fhevm-hardhat-template/
├── contracts/              # Smart contract placeholders
├── test/                   # Test placeholders
├── deploy/                 # Deployment scripts
├── hardhat.config.ts       # Pre-configured Hardhat setup
├── tsconfig.json           # TypeScript configuration
├── package.json            # Base dependencies
├── README.md               # Template documentation
├── .gitignore              # Git ignore rules
└── LICENSE                 # BSD-3-Clause-Clear
```

**Customization Points:**
- Contract insertion in `contracts/`
- Test file insertion in `test/`
- Deployment script customization

---

### 5. Documentation System

**Structure:**
```
docs/
├── SUMMARY.md              # Index and navigation
├── encrypted-identity.md   # Pattern 1: User Identity
├── confidential-marketplace.md # Pattern 2: Marketplace
├── encrypted-gaming.md     # Pattern 3: Gaming
├── private-reputation.md   # Pattern 4: Reputation
├── confidential-voting.md  # Pattern 5: Voting
└── encrypted-treasury.md   # Pattern 6: Treasury
```

**Documentation Format:**
1. **Overview** - High-level use cases
2. **Key Features** - What the contract does
3. **Implementation Details** - Code structure
4. **FHE Patterns** - Core patterns demonstrated
5. **Testing Your Understanding** - Success/failure scenarios
6. **Common Pitfalls** - What to avoid
7. **Advanced Patterns** - Complex implementations
8. **Related Examples** - Cross-references

---

## Technology Stack

### Smart Contract Development
- **Language:** Solidity 0.8.24
- **Framework:** Hardhat 2.26.0+
- **FHE Library:** @fhevm/solidity 0.9.1+
- **Testing:** Mocha + Chai
- **Gas Reporter:** hardhat-gas-reporter

### Build Tools
- **TypeScript:** 5.8.3+
- **Node.js:** 20.0.0+
- **npm:** 7.0.0+
- **ts-node:** 10.9.2+

### Linting & Quality
- **Solhint:** 6.0.0+ (Solidity linting)
- **ESLint:** 8.57.1+ (TypeScript linting)
- **Prettier:** 3.6.2+ (Code formatting)

### Development Tools
- **TypeChain:** 8.3.2+ (Type generation)
- **Hardhat Deploy:** 0.11.45+
- **Coverage:** solidity-coverage 0.8.16+

---

## Data Flow Architecture

### Contract Deployment Flow

```
1. Source Contract (Solidity)
         ↓
2. Hardhat Compile
         ↓
3. Solidity Compiler (0.8.24)
         ↓
4. Bytecode & ABI Generation
         ↓
5. TypeChain Generation
         ↓
6. TypeScript Types
         ↓
7. Contract Deployment
         ↓
8. Contract Instance (On-chain)
```

### Test Execution Flow

```
1. Test File (TypeScript)
         ↓
2. ts-node Transpilation
         ↓
3. Hardhat Environment Setup
         ↓
4. FHEVM Plugin Initialization
         ↓
5. Mock Environment Creation
         ↓
6. Test Execution
         ↓
7. Results & Coverage Report
```

### Example Generation Flow

```
1. User Request: npm run create-example
         ↓
2. Parse Arguments (example-name, output-path)
         ↓
3. Validate Example Config
         ↓
4. Copy Base Template
         ↓
5. Copy Specific Contract
         ↓
6. Copy Specific Tests
         ↓
7. Update package.json
         ↓
8. Generate README
         ↓
9. Output: Standalone Project
```

### Documentation Generation Flow

```
1. Parse Contracts & Tests
         ↓
2. Extract JSDoc Comments
         ↓
3. Analyze Code Structure
         ↓
4. Generate Markdown Content
         ↓
5. Create SUMMARY.md
         ↓
6. Create Per-Example Files
         ↓
7. Output: GitBook-Compatible Docs
```

---

## Security Architecture

### Encrypted Data Protection

```
Plaintext Data
    ↓
    ├─→ FHE Encryption
    ↓
Encrypted Ciphertext (on-chain)
    ↓
    ├─→ Only contract can perform operations
    ├─→ Only authorized parties can decrypt
    ├─→ No intermediate exposure
    ↓
Encrypted Result
    ↓
    ├─→ User decryption (with key)
    ↓
Decrypted Result (off-chain, private)
```

### Permission Management

```
Operation Request
    ↓
    ├─→ Check FHE.allowThis() permission
    ├─→ Contract can access encrypted value
    ↓
    ├─→ Check FHE.allow(address) permission
    ├─→ User can decrypt encrypted value
    ↓
Operation Approved
```

### Input Validation

```
External Input (untrusted)
    ↓
    ├─→ Encrypted with cryptographic proof
    ├─→ externalEuint32 + bytes calldata proof
    ↓
    ├─→ Contract verifies proof
    ├─→ FHE.fromExternal(value, proof)
    ↓
Internal Encrypted Value (trusted)
```

---

## Scalability Considerations

### Single Example
- **Compile Time:** ~10 seconds
- **Test Execution:** ~30 seconds (64 tests)
- **Generated Repository Size:** ~500KB

### Category Project
- **Compile Time:** ~15 seconds
- **Test Execution:** ~2 minutes (100+ tests)
- **Generated Repository Size:** ~1.5MB

### Full Hub
- **Total Contracts:** 6
- **Total Tests:** 64+
- **Total Lines of Code:** 7,000+
- **Artifact Size:** ~50MB (after compilation)

### Performance Optimization
- Parallel test execution possible
- Incremental compilation supported
- Gas optimization in contracts
- Efficient type checking

---

## Extension Points

### Adding New Examples

1. **Create Contract**
   ```
   contracts/category/NewContract.sol
   ```

2. **Create Tests**
   ```
   test/category/NewContract.ts
   ```

3. **Update Script Configurations**
   ```typescript
   // In create-fhevm-example.ts
   const EXAMPLES_MAP = {
     "new-example": {
       contract: "contracts/category/NewContract.sol",
       test: "test/category/NewContract.ts",
       // ...
     }
   };
   ```

4. **Update Documentation**
   ```typescript
   // In generate-docs.ts
   const EXAMPLES_CONFIG = {
     "new-example": {
       title: "New Example",
       contract: "contracts/category/NewContract.sol",
       test: "test/category/NewContract.ts",
       output: "docs/new-example.md",
       // ...
     }
   };
   ```

5. **Generate Documentation**
   ```bash
   npm run generate-all-docs
   ```

### Adding New Categories

1. **Create Contract Directory**
   ```
   contracts/new-category/
   ```

2. **Create Contracts and Tests**
   ```
   contracts/new-category/Contract1.sol
   contracts/new-category/Contract2.sol
   test/new-category/Contract1.ts
   test/new-category/Contract2.ts
   ```

3. **Update Category Configuration**
   ```typescript
   // In create-fhevm-category.ts
   const CATEGORIES = {
     "new-category": {
       name: "New Category",
       description: "Description",
       contracts: {
         "contract-1": { /* ... */ },
         "contract-2": { /* ... */ }
       }
     }
   };
   ```

---

## Build & Deployment Pipeline

### Local Development
```
Source Code → Compile → Type Generation → Test → Reports
```

### Continuous Integration (if applicable)
```
Push → Lint → Compile → Test → Coverage → Artifacts
```

### Example Deployment
```
Generated Project → Dependencies → Compile → Deploy → Verify
```

---

## Performance Metrics

### Compile Performance
- **Single Contract:** ~2 seconds
- **All 6 Contracts:** ~15 seconds
- **Incremental Compile:** ~1 second

### Test Performance
- **Single Test File:** ~30 seconds
- **All Test Files:** ~2 minutes
- **Parallel Execution:** ~1 minute 30 seconds

### Documentation Generation
- **Single Example:** ~5 seconds
- **All Examples:** ~30 seconds
- **Full SUMMARY.md:** ~2 seconds

---

## Dependencies Management

### Critical Dependencies
- `@fhevm/solidity` - FHE operations
- `@fhevm/hardhat-plugin` - Hardhat integration
- `ethers` - Ethereum interaction
- `hardhat` - Development framework

### Development Dependencies
- `typescript` - Type safety
- `mocha` - Test runner
- `chai` - Assertions
- `solhint` - Linting

### Update Strategy
1. Regular security updates
2. Compatibility testing
3. Version pinning for stability
4. Documented breaking changes

---

## Testing Architecture

### Test Categories

1. **Unit Tests**
   - Individual function testing
   - Input validation
   - State management

2. **Integration Tests**
   - Multi-contract interactions
   - State consistency
   - Cross-contract calls

3. **Scenario Tests**
   - Real-world use cases
   - Multi-user workflows
   - Edge cases

### Coverage Goals
- Target: 100% statement coverage
- Current: 95%+ coverage per contract
- Uncovered: Complex error conditions

---

## Documentation Architecture

### Three-Level Documentation

**Level 1: Reference**
- START_HERE - Quick navigation
- QUICK_REFERENCE.md - Command reference
- README.md - Project overview

**Level 2: Learning**
- GETTING_STARTED.md - Setup guide
- TUTORIAL.md - Step-by-step learning
- docs/*.md - Pattern guides

**Level 3: Development**
- DEVELOPMENT.md - Adding examples
- ARCHITECTURE.md - This file
- scripts/README.md - Script documentation

---

## Maintenance Guidelines

### Regular Maintenance
1. **Update Dependencies** - Monthly
2. **Test Coverage** - Every release
3. **Documentation** - As features change
4. **Security Audits** - Quarterly

### Version Management
- Semantic versioning (MAJOR.MINOR.PATCH)
- Tagged releases in git
- Changelog documentation
- Breaking change notices

---

## Summary

The FHEVM Example Hub architecture is designed around:

✓ **Modularity** - Independent examples
✓ **Automation** - Script-based generation
✓ **Education** - Comprehensive documentation
✓ **Scalability** - Easy to add new examples
✓ **Quality** - Full test coverage
✓ **Security** - FHE-based privacy

This architecture enables developers to quickly learn, understand, and implement privacy-preserving smart contracts using fully homomorphic encryption.

---

For more information, see:
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [README.md](./README.md) - Project overview
- [docs/SUMMARY.md](./docs/SUMMARY.md) - Documentation index
