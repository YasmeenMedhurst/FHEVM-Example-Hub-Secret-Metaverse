# Encrypted Identity Management

**Category:** Identity & Privacy
**Description:** Demonstrates private user identity management with encrypted personal attributes in a virtual metaverse environment.

---

## Overview

The Encrypted Identity contract showcases how to build user profile systems where sensitive information remains completely private while still being stored and verified on-chain.

## Use Cases

- Virtual world user profiles with complete privacy
- Anonymous identity verification
- Private demographic tracking
- Confidential age-based access control
- Privacy-preserving user attributes

---

## Key Features

### 1. Anonymous Identity Registration
- Users can register without exposing personal information
- Each identity has a unique encrypted profile
- Public registration confirmation without revealing details

### 2. Encrypted Attributes
- Age encrypted with homomorphic encryption
- Additional private metadata storage
- Encrypted comparisons for age verification

### 3. Privacy-Preserving Verification
- Age comparisons without decryption
- Attribute validation in encrypted domain
- No intermediate data exposure

### 4. Access Control
- User-level encryption permissions
- Contract-level operational permissions
- Multi-signer support for complex scenarios

---

## Implementation Details

### Smart Contract

The contract is deployed at `contracts/identity/EncryptedIdentity.sol`

**Key Functions:**

```solidity
// Register a new identity
function registerIdentity() external

// Update encrypted age
function setAge(externalEuint32 _encryptedAge, bytes calldata _proof) external

// Check if user is adult (encrypted comparison)
function isAdult(euint32 _comparisonThreshold) external view returns (euint32)

// Grant decryption permissions for caller
function allowDecryption(euint32 _value) external
```

### Test Suite

Located at `test/identity/EncryptedIdentity.ts`

**Test Coverage (15+ tests):**

- ✓ Identity registration
- ✓ Age encryption and storage
- ✓ Age comparison (adult check)
- ✓ Permission management
- ✓ Multiple users isolation
- ✗ Unauthorized access attempts
- ✗ Invalid encrypted inputs
- ✗ Missing permissions

---

## FHE Patterns Demonstrated

### 1. Input Encryption Pattern

**What it does:**
Converts external, unencrypted input to an encrypted value that the contract can work with.

```solidity
// User provides: encrypted age value + proof
function setAge(externalEuint32 _encryptedAge, bytes calldata _proof) external {
    // Contract converts to internal encrypted type
    euint32 internalAge = FHE.fromExternal(_encryptedAge, _proof);

    // Store privately
    _userAge[msg.sender] = internalAge;

    // Grant permissions
    FHE.allowThis(internalAge);
    FHE.allow(internalAge, msg.sender);
}
```

**Key Points:**
- External input must include a cryptographic proof
- Conversion happens inside contract
- Original value never exposed on-chain

### 2. Encrypted Comparison Pattern

**What it does:**
Compares two encrypted values without decrypting them.

```solidity
// Compare ages without decryption
function isAdult(euint32 _ageThreshold) external view returns (euint32) {
    // Result is also encrypted (euint32)
    euint32 result = FHE.gte(_userAge[msg.sender], _ageThreshold);
    return result;
}
```

**Key Points:**
- Comparison result stays encrypted
- Caller must decrypt result themselves
- Server never learns the outcome

### 3. Permission Management Pattern

**What it does:**
Ensures only authorized parties can access encrypted data.

```solidity
// Grant contract access
FHE.allowThis(_userAge);

// Grant user access for decryption
FHE.allow(_userAge, msg.sender);
```

**Key Points:**
- Always call both functions together
- `allowThis` = contract can use value
- `allow` = user can decrypt value

---

## Testing Your Understanding

### Success Scenarios (✓)

These tests demonstrate correct usage:

1. **Register Identity Successfully**
   - User registers without errors
   - Identity stored on-chain
   - No data exposure during registration

2. **Encrypt and Update Age**
   - Age encrypted with proof
   - Contract receives and stores encrypted value
   - User can later decrypt their age

3. **Perform Encrypted Comparisons**
   - Age compared with threshold
   - Result is encrypted
   - Only intended user can decrypt result

4. **Multi-User Isolation**
   - Alice's data separate from Bob's
   - Each user has independent profile
   - No cross-user data leakage

5. **Permission Grants**
   - Contract has access to values
   - User can decrypt their own values
   - Decryption succeeds

### Failure Scenarios (✗)

These tests show common mistakes:

1. **Missing Input Proof**
   - Attempting to call with incomplete encrypted input
   - Contract rejects without proof
   - Transaction fails safely

2. **Unauthorized Decryption**
   - User without permissions tries to decrypt
   - Cryptographic verification fails
   - Access denied

3. **Invalid Encrypted Input**
   - Providing malformed encrypted data
   - Contract validation catches error
   - Transaction reverted

4. **Missing Permission Grants**
   - Contract performs operation without allowThis
   - FHE system prevents access
   - Operation fails

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting Input Proof

**Wrong:**
```solidity
function setAge(externalEuint32 _age) external {
    // Missing bytes calldata _proof parameter!
    euint32 internal = FHE.fromExternal(_age, ???);
}
```

**Correct:**
```solidity
function setAge(externalEuint32 _age, bytes calldata _proof) external {
    euint32 internal = FHE.fromExternal(_age, _proof);
}
```

### ❌ Pitfall 2: Missing Permission Grants

**Wrong:**
```solidity
function setAge(externalEuint32 _age, bytes calldata _proof) external {
    euint32 internal = FHE.fromExternal(_age, _proof);
    _userAge[msg.sender] = internal;
    // Forgot to grant permissions!
}
```

**Correct:**
```solidity
function setAge(externalEuint32 _age, bytes calldata _proof) external {
    euint32 internal = FHE.fromExternal(_age, _proof);
    _userAge[msg.sender] = internal;

    FHE.allowThis(internal);
    FHE.allow(internal, msg.sender);
}
```

### ❌ Pitfall 3: Comparing Unencrypted with Encrypted

**Wrong:**
```solidity
function isAdult() external view returns (bool) {
    // Cannot directly compare: euint32 != uint32
    return _userAge[msg.sender] > 18;  // Type error!
}
```

**Correct:**
```solidity
function isAdult(euint32 _threshold) external view returns (euint32) {
    // Compare encrypted with encrypted (or encrypted constant)
    return FHE.gt(_userAge[msg.sender], _threshold);
}
```

### ❌ Pitfall 4: Using View Functions for Encrypted Values

**Wrong:**
```solidity
// View functions can return encrypted types but caller cannot decrypt
function getAge() external view returns (euint32) {
    return _userAge[msg.sender];  // Caller cannot decrypt!
}
```

**Correct:**
```solidity
// Use state-changing functions for encrypted operations
function getAgeComparison(euint32 _threshold) external view returns (euint32) {
    // Can read from storage, but must process through FHE
    return FHE.gt(_userAge[msg.sender], _threshold);
}
```

---

## Implementation Highlights

### Privacy Preservation

- User attributes encrypted from registration
- No plaintext sensitive data on-chain
- Encryption verified cryptographically

### Efficiency

- Single age comparison uses FHE operations
- Batch operations possible for multiple users
- Gas-optimized encrypted storage

### Flexibility

- Support for multiple identity types
- Extensible attribute system
- Compatible with other FHEVM examples

---

## Related Examples

- [Private Reputation System](private-reputation.md) - Similar privacy patterns with reputation scores
- [Confidential Voting](confidential-voting.md) - Advanced permission management
- [Encrypted Treasury](encrypted-treasury.md) - Encrypted value storage and transfers

---

## Resources

**FHEVM Documentation:**
- [Input Encryption](https://docs.zama.ai)
- [FHE Operations](https://docs.zama.ai)
- [Permission Management](https://docs.zama.ai)

**External Resources:**
- [Homomorphic Encryption Basics](https://www.zama.ai)
- [Privacy in Blockchain](https://www.zama.ai/community)

---

**Total Lines:** ~280 contract code | ~420 test code
**Test Cases:** 15+ | **Categories:** 3
**Difficulty:** Beginner → Intermediate

Start here to understand core FHE patterns!
