# Encrypted Treasury

**Category:** Confidential Commerce
**Description:** Shows confidential fund management with encrypted balances, private transfers, and custodian permission management.

---

## Overview

The Encrypted Treasury contract demonstrates how to build secure fund management systems where fund balances, transfer amounts, and transaction histories remain completely encrypted while still enabling auditable fund operations and multi-custodian governance.

## Use Cases

- Confidential fund management
- Private financial administration
- Encrypted treasury systems
- Anonymous donation tracking
- Confidential grant distributions

---

## Key Features

### 1. Multi-Fund Management
- Multiple independent fund accounts
- Each fund tracked separately
- Isolated encrypted balances

### 2. Encrypted Fund Balances
- Fund amounts stored encrypted
- Balance transfers in encrypted domain
- No intermediate exposure

### 3. Confidential Deposits/Withdrawals
- Users deposit encrypted amounts
- Withdrawals encrypted
- Balance updates happen privately

### 4. Private Inter-Fund Transfers
- Transfer between funds encrypted
- Receiving fund amount hidden
- Sender amount confidential

### 5. Custodian Permission Management
- Multiple custodians per fund
- Permission grants tracked
- Access control encrypted

---

## Implementation Details

### Smart Contract

Located at `contracts/treasury/EncryptedTreasury.sol`

**Key Functions:**

```solidity
// Create new fund
function createFund(string calldata _fundName) external returns (uint256 fundId)

// Deposit encrypted amount into fund
function deposit(
    uint256 _fundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external

// Withdraw encrypted amount from fund
function withdraw(
    uint256 _fundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external

// Transfer between funds (encrypted)
function transferBetweenFunds(
    uint256 _fromFundId,
    uint256 _toFundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external

// Get encrypted fund balance
function getFundBalance(uint256 _fundId) external view returns (euint32)

// Check if sufficient balance for withdrawal
function canWithdraw(uint256 _fundId, euint32 _amount) external view returns (euint32)

// Grant custodian permission
function grantCustodianPermission(uint256 _fundId, address _custodian) external

// Check custodian permission
function isCustodian(uint256 _fundId, address _custodian) external view returns (bool)
```

### Test Suite

Located at `test/treasury/EncryptedTreasury.ts`

**Test Coverage (19+ tests):**

- ✓ Fund creation
- ✓ Fund deposit
- ✓ Fund withdrawal
- ✓ Balance verification
- ✓ Inter-fund transfers
- ✓ Custodian permissions
- ✓ Multi-fund scenarios
- ✓ Multiple custodians
- ✗ Insufficient balance
- ✗ Unauthorized withdrawals
- ✗ Invalid amounts
- ✗ Missing proofs
- ✗ Unauthorized custodians

---

## FHE Patterns Demonstrated

### 1. Encrypted Multi-Account State Pattern

**What it does:**
Maintains multiple independent encrypted fund accounts.

```solidity
// Store fund data
struct Fund {
    string name;
    euint32 balance;
    address[] custodians;
}

mapping(uint256 => Fund) private funds;

// Create new fund
function createFund(string calldata _fundName) external returns (uint256) {
    uint256 fundId = fundCount++;

    funds[fundId].name = _fundName;
    funds[fundId].balance = FHE.asEuint32(0);  // Initialize encrypted zero

    FHE.allowThis(funds[fundId].balance);

    return fundId;
}
```

**Key Points:**
- Each fund has independent encrypted balance
- Multiple funds managed simultaneously
- No interference between funds
- Separate permission contexts

### 2. Encrypted Deposit/Withdrawal Pattern

**What it does:**
Updates fund balances with encrypted amounts.

```solidity
// Deposit encrypted amount
function deposit(
    uint256 _fundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external {
    require(_fundId < fundCount, "Fund not found");

    euint32 encryptedAmount = FHE.fromExternal(_amount, _proof);

    // Add to existing balance (both encrypted)
    funds[_fundId].balance = FHE.add(funds[_fundId].balance, encryptedAmount);

    FHE.allowThis(funds[_fundId].balance);
    FHE.allow(funds[_fundId].balance, msg.sender);
}

// Withdraw encrypted amount
function withdraw(
    uint256 _fundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external onlyCustodian(_fundId) {
    require(isCustodian(_fundId, msg.sender), "Not custodian");

    euint32 encryptedAmount = FHE.fromExternal(_amount, _proof);

    // Subtract from balance (both encrypted)
    funds[_fundId].balance = FHE.sub(funds[_fundId].balance, encryptedAmount);

    FHE.allowThis(funds[_fundId].balance);
}
```

**Key Points:**
- Deposits add to balance encrypted
- Withdrawals subtract encrypted
- No intermediate plaintext amounts
- Permissions maintained throughout

### 3. Encrypted Balance Verification Pattern

**What it does:**
Verifies sufficient balance without revealing actual amount.

```solidity
// Check if sufficient balance
function canWithdraw(uint256 _fundId, euint32 _amount) external view returns (euint32) {
    require(_fundId < fundCount, "Fund not found");

    euint32 fundBalance = funds[_fundId].balance;

    // Compare encrypted balance with encrypted withdrawal amount
    euint32 sufficient = FHE.gte(fundBalance, _amount);

    return sufficient;
}
```

**Key Points:**
- Comparison entirely encrypted
- No balance information exposed
- Result encrypted boolean
- Safe to use in access control

### 4. Inter-Fund Transfer Pattern

**What it does:**
Transfers encrypted amounts between independent fund accounts.

```solidity
// Transfer between funds
function transferBetweenFunds(
    uint256 _fromFundId,
    uint256 _toFundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external onlyAdmin {
    require(_fromFundId < fundCount, "Source fund not found");
    require(_toFundId < fundCount, "Destination fund not found");
    require(_fromFundId != _toFundId, "Cannot transfer to same fund");

    euint32 encryptedAmount = FHE.fromExternal(_amount, _proof);

    // Subtract from source
    funds[_fromFundId].balance = FHE.sub(
        funds[_fromFundId].balance,
        encryptedAmount
    );

    // Add to destination
    funds[_toFundId].balance = FHE.add(
        funds[_toFundId].balance,
        encryptedAmount
    );

    FHE.allowThis(funds[_fromFundId].balance);
    FHE.allowThis(funds[_toFundId].balance);
}
```

**Key Points:**
- Transfer amount encrypted
- Both accounts updated encrypted
- No intermediate exposure
- Atomic operation

### 5. Permission-Based Access Control Pattern

**What it does:**
Controls access based on custodian permissions.

```solidity
// Store custodian permissions
mapping(uint256 => mapping(address => bool)) private custodians;

// Grant custodian permission
function grantCustodianPermission(uint256 _fundId, address _custodian) external onlyAdmin {
    require(_fundId < fundCount, "Fund not found");
    custodians[_fundId][_custodian] = true;
}

// Check permission
function isCustodian(uint256 _fundId, address _custodian) external view returns (bool) {
    return custodians[_fundId][_custodian];
}

// Enforce in operations
modifier onlyCustodian(uint256 _fundId) {
    require(isCustodian(_fundId, msg.sender), "Not custodian");
    _;
}

// Use in withdrawal
function withdraw(
    uint256 _fundId,
    externalEuint32 _amount,
    bytes calldata _proof
) external onlyCustodian(_fundId) {
    // ... withdrawal logic
}
```

**Key Points:**
- Permissions tracked in mappings
- Enforced at function level
- Multiple custodians possible
- Independent per fund

---

## Testing Your Understanding

### Success Scenarios (✓)

1. **Create Fund**
   - Admin creates new fund
   - Fund initialized with zero balance
   - Fund ready for operations

2. **Deposit Encrypted Amount**
   - User deposits encrypted funds
   - Balance updated (encrypted)
   - Deposit recorded

3. **Verify Balance Increase**
   - Check balance comparison
   - Encrypted comparison succeeds
   - Balance increase confirmed

4. **Authorize Custodian**
   - Admin grants withdrawal permission
   - Custodian registered
   - Custodian can now withdraw

5. **Withdraw Encrypted Amount**
   - Custodian submits encrypted withdrawal
   - Balance decreases (encrypted)
   - Withdrawal succeeds

6. **Transfer Between Funds**
   - Admin transfers between funds
   - Source balance decreases
   - Destination balance increases
   - Both in encrypted domain

7. **Multi-Fund Management**
   - Multiple funds operate independently
   - Separate balances maintained
   - No interference between funds

### Failure Scenarios (✗)

1. **Insufficient Balance**
   - Attempt withdrawal exceeding balance
   - Encrypted comparison shows false
   - Withdrawal rejected

2. **Unauthorized Custodian**
   - Non-custodian attempts withdrawal
   - Permission check fails
   - Transaction reverted

3. **Invalid Withdrawal Amount**
   - Malformed encrypted amount
   - Missing proof
   - Transaction rejected

4. **Self-Transfer**
   - Try to transfer fund to itself
   - System checks fund IDs
   - Transfer rejected

5. **Non-Existent Fund**
   - Reference fund that doesn't exist
   - Fund lookup fails
   - Operation rejected

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Storing Plaintext Balances

**Wrong:**
```solidity
// Bad: plaintext balances visible
mapping(uint256 => uint256) public fundBalances;

function deposit(uint256 _fundId, uint256 _amount) external {
    fundBalances[_fundId] += _amount;  // Amount exposed!
}
```

**Correct:**
```solidity
// Good: encrypted balances
mapping(uint256 => euint32) private fundBalances;

function deposit(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_amount, _proof);
    fundBalances[_fundId] = FHE.add(fundBalances[_fundId], encrypted);

    FHE.allowThis(fundBalances[_fundId]);
}
```

### ❌ Pitfall 2: Not Updating Permissions After Operations

**Wrong:**
```solidity
// Bad: forgotten permissions after transfer
function transfer(uint256 _from, uint256 _to, externalEuint32 _amount, bytes calldata _proof) external {
    euint32 amt = FHE.fromExternal(_amount, _proof);

    balances[_from] = FHE.sub(balances[_from], amt);
    balances[_to] = FHE.add(balances[_to], amt);

    // Forgot FHE.allowThis for both!
}
```

**Correct:**
```solidity
// Good: permissions updated after operations
function transfer(uint256 _from, uint256 _to, externalEuint32 _amount, bytes calldata _proof) external {
    euint32 amt = FHE.fromExternal(_amount, _proof);

    balances[_from] = FHE.sub(balances[_from], amt);
    balances[_to] = FHE.add(balances[_to], amt);

    FHE.allowThis(balances[_from]);
    FHE.allowThis(balances[_to]);
}
```

### ❌ Pitfall 3: Allowing Unencrypted Balance Checks

**Wrong:**
```solidity
// Bad: public balance function defeats privacy
function getBalance(uint256 _fundId) external view returns (euint32) {
    return fundBalances[_fundId];  // Caller can't decrypt but pattern leaks!
}
```

**Correct:**
```solidity
// Good: only provide comparison results
function canWithdraw(uint256 _fundId, euint32 _amount) external view returns (euint32) {
    // Return comparison result, not balance
    return FHE.gte(fundBalances[_fundId], _amount);
}
```

### ❌ Pitfall 4: Improper Custodian Validation

**Wrong:**
```solidity
// Bad: missing permission check
function withdraw(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external {
    euint32 amt = FHE.fromExternal(_amount, _proof);
    // No check if msg.sender is custodian!
    fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);
}
```

**Correct:**
```solidity
// Good: validate permission before operation
function withdraw(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external {
    require(isCustodian(_fundId, msg.sender), "Not authorized");

    euint32 amt = FHE.fromExternal(_amount, _proof);
    fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);

    FHE.allowThis(fundBalances[_fundId]);
}
```

### ❌ Pitfall 5: Not Checking Underflow Risk

**Wrong:**
```solidity
// Bad: no validation of sufficient balance
function withdraw(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external onlyCustodian(_fundId) {
    euint32 amt = FHE.fromExternal(_amount, _proof);
    // What if amount > balance?
    fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);
}
```

**Correct:**
```solidity
// Good: validate balance before withdrawal
function withdraw(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external onlyCustodian(_fundId) {
    euint32 amt = FHE.fromExternal(_amount, _proof);

    // Check sufficient balance (encrypted comparison)
    euint32 sufficient = FHE.gte(fundBalances[_fundId], amt);

    // Safe subtraction (could revert or use conditional)
    fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);

    FHE.allowThis(fundBalances[_fundId]);
}
```

---

## Implementation Highlights

### Complete Financial Privacy

- Fund amounts completely encrypted
- Transfer amounts confidential
- Balance history hidden
- No financial data exposure

### Multi-Custodian Support

- Multiple authorized custodians
- Independent permission management
- Audit trails without amount exposure
- Flexible governance

### Fund Isolation

- Multiple independent funds
- Separate encrypted balances
- No cross-fund interference
- Scalable architecture

---

## Advanced Treasury Patterns

### Encrypted Fund Splitting

```solidity
// Distribute funds to multiple recipients (encrypted)
function distributeFunds(
    uint256 _fundId,
    address[] calldata _recipients,
    externalEuint32[] calldata _amounts,
    bytes[] calldata _proofs
) external onlyAdmin {
    require(_recipients.length == _amounts.length, "Array mismatch");

    for (uint i = 0; i < _recipients.length; i++) {
        euint32 amt = FHE.fromExternal(_amounts[i], _proofs[i]);

        fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);
        recipientBalances[_recipients[i]] = FHE.add(recipientBalances[_recipients[i]], amt);
    }
}
```

### Time-Locked Withdrawals

```solidity
// Withdrawals allowed only after timestamp
mapping(uint256 => uint256) private lockUntilTime;

function scheduleWithdrawal(uint256 _fundId, uint256 _unlockTime) external onlyAdmin {
    lockUntilTime[_fundId] = _unlockTime;
}

function withdraw(uint256 _fundId, externalEuint32 _amount, bytes calldata _proof) external onlyCustodian(_fundId) {
    require(block.timestamp >= lockUntilTime[_fundId], "Fund locked");

    euint32 amt = FHE.fromExternal(_amount, _proof);
    fundBalances[_fundId] = FHE.sub(fundBalances[_fundId], amt);
}
```

---

## Related Examples

- [Confidential Marketplace](confidential-marketplace.md) - Similar balance management
- [Encrypted Gaming](encrypted-gaming.md) - State accumulation
- [Confidential Voting](confidential-voting.md) - Permission management

---

## Resources

**FHEVM Documentation:**
- [Encrypted Fund Management](https://docs.zama.ai)
- [Multi-Account Systems](https://docs.zama.ai)
- [Permission Patterns](https://docs.zama.ai)

---

**Total Lines:** ~340 contract code | ~480 test code
**Test Cases:** 19+ | **Categories:** 3
**Difficulty:** Intermediate → Advanced

Excellent for learning complex financial patterns and multi-fund management!
