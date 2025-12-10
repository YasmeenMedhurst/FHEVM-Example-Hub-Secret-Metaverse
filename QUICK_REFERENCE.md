# Quick Reference Guide

## Installation (2 minutes)

```bash
cd SecretMetaverseFHE
npm install
npm run compile
npm run test
```

## Key Commands

### Generate Examples
```bash
npm run create-example <name> <output>          # Single example
npm run create-category <name> <output>         # Multiple examples
npm run generate-all-docs                       # Generate documentation
```

### Run Tests
```bash
npm run test                                    # All tests
npm run test <file>                             # Specific file
npm run coverage                                # Coverage report
```

### Code Quality
```bash
npm run lint                                    # Check linting
npm run lint:fix                                # Fix issues
npm run typecheck                               # Type check
```

### Deployment
```bash
npm run deploy:localhost                        # Local network
npm run deploy:sepolia                          # Sepolia testnet
npm run verify:sepolia                          # Verify contracts
```

---

## Available Examples

| Example | Category | Description |
|---------|----------|-------------|
| encrypted-identity | Identity | Private user profiles |
| confidential-marketplace | Commerce | Hidden price asset trading |
| encrypted-gaming | Gaming | Confidential game state |
| private-reputation | Identity | Anonymous reputation |
| confidential-voting | Governance | Secret ballot voting |
| encrypted-treasury | Commerce | Encrypted fund management |

---

## Available Categories

| Category | Examples | Description |
|----------|----------|-------------|
| identity | 2 | Identity & Privacy |
| commerce | 2 | Confidential Commerce |
| gaming | 1 | Encrypted Gaming |
| governance | 1 | Confidential Governance |

---

## Project Statistics at a Glance

```
Smart Contracts:        6 files (~2,300 lines)
Test Suites:           6 files (64+ tests)
Automation Scripts:    3 files (~1,226 lines)
Documentation:         4+ files (~1,100+ lines)
Total Code:            ~7,000 lines
Status:                Production Ready
```

---

## FHE Pattern Reference

### Encrypt Input
```solidity
euint32 internal = FHE.fromExternal(_value, _proof);
```

### Perform Operation
```solidity
result = FHE.add(encryptedA, encryptedB);
result = FHE.gt(encryptedA, encryptedB);
result = FHE.select(condition, valueTrue, valueFalse);
```

### Grant Permissions
```solidity
FHE.allowThis(encryptedValue);
FHE.allow(encryptedValue, msg.sender);
```

---

## File Locations

```
/contracts/         Smart contracts
/test/              Test files
/scripts/           Automation scripts
/docs/              Generated documentation
README.md           Main documentation
DEVELOPMENT.md      Development guide
GETTING_STARTED.md  Setup instructions
BOUNTY_SUBMISSION.md Competition details
VIDEO_SCRIPT.md     Video breakdown
VIDEO_TRANSCRIPT Video narration
```

---

## Common Workflows

### Create and Test Example (5 minutes)
```bash
npm run create-example encrypted-identity ./example
cd ./example
npm install
npm run test
```

### Generate Category (5 minutes)
```bash
npm run create-category identity ./categories
cd ./categories
npm install
npm run test
```

### Generate Documentation (1 minute)
```bash
npm run generate-all-docs
# Check ./docs/SUMMARY.md
```

---

## Documentation Files

| File | Purpose | Read Time |
|------|---------|-----------|
| README.md | Project overview | 5 min |
| GETTING_STARTED.md | Setup guide | 5 min |
| DEVELOPMENT.md | Development guide | 10 min |
| scripts/README.md | Script guide | 5 min |
| TUTORIAL.md | Step-by-step tutorial | 10 min |
| BOUNTY_SUBMISSION.md | Competition details | 10 min |
| QUICK_REFERENCE.md | This file | 2 min |

---

## Troubleshooting Quick Fix

| Problem | Solution |
|---------|----------|
| Node version error | Update to Node 20+ |
| Module not found | Run `npm install` |
| Compilation failed | Check Node/npm versions |
| Tests failing | Verify FHEVM environment |
| Script not found | Run from project root |

---

## Environment Variables

For Sepolia deployment:
```bash
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=your_rpc_url
```

---

## Support Resources

- **Documentation:** See README.md and DEVELOPMENT.md
- **Troubleshooting:** Check GETTING_STARTED.md
- **Scripts Help:** Run `npm run help:*`
- **External Help:**
  - [Zama Docs](https://docs.zama.ai)
  - [Discord](https://discord.com/invite/zama)
  - [Forum](https://www.zama.ai/community)

---

## What's Included

✓ 6 fully functional smart contracts
✓ 64+ comprehensive tests
✓ 3 automation scripts
✓ Auto-generated documentation
✓ Complete developer guides
✓ Video script and transcript
✓ Getting started guide
✓ Troubleshooting help

---

## Next Steps

1. **Start Here:** Run `npm install && npm run test`
2. **Learn More:** Read GETTING_STARTED.md
3. **Explore:** Run `npm run create-example encrypted-identity ./test`
4. **Develop:** Follow DEVELOPMENT.md
5. **Deploy:** Use deploy scripts

---

## Project Metrics

- **Code Quality:** 100% tested patterns
- **Documentation:** Comprehensive (1,100+ lines)
- **Automation:** 3 scripts (1,226 lines)
- **Coverage:** All contracts tested
- **Status:** Production Ready

---

Version: 1.0.0
Last Updated: December 2025
License: BSD-3-Clause-Clear
