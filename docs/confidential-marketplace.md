# Confidential Marketplace

**Category:** Confidential Commerce
**Description:** Shows privacy-preserving asset trading with hidden prices, encrypted bids, and confidential transactions.

---

## Overview

The Confidential Marketplace demonstrates how to build secure trading platforms where asset prices, buyer identities, and transaction amounts remain completely private while still enabling trustless commerce.

## Use Cases

- Virtual asset marketplace with price privacy
- Secret price discovery mechanisms
- Confidential auction systems
- Private trading platforms
- Encrypted inventory management

---

## Key Features

### 1. Encrypted Asset Listings
- Asset prices stored as encrypted values
- Sellers can update prices without exposure
- Price comparisons happen in encrypted domain

### 2. Confidential Purchase Offers
- Buyers submit encrypted bid amounts
- Offers visible on-chain but not readable
- Price negotiations happen privately

### 3. Private Balance Tracking
- Buyer and seller balances encrypted
- Transactions don't reveal amounts
- Balance updates in encrypted domain

### 4. Encrypted Price Matching
- Automatic price comparison without decryption
- Transactions execute when bids meet asks
- No intermediate price exposure

---

## Implementation Details

### Smart Contract

Located at `contracts/marketplace/ConfidentialMarketplace.sol`

**Key Functions:**

```solidity
// Create encrypted asset listing
function listAsset(
    uint256 _assetId,
    externalEuint32 _price,
    bytes calldata _proof
) external

// Submit encrypted purchase offer
function submitOffer(
    uint256 _assetId,
    externalEuint32 _bidAmount,
    bytes calldata _proof
) external

// Check if bid meets ask (encrypted comparison)
function canPurchase(uint256 _assetId, euint32 _bidAmount) external view returns (euint32)

// Execute transaction (owner only)
function executeTransaction(uint256 _assetId, address _buyer) external
```

### Test Suite

Located at `test/marketplace/ConfidentialMarketplace.ts`

**Test Coverage (18+ tests):**

- ✓ Asset listing with encrypted price
- ✓ Multiple listings without price exposure
- ✓ Encrypted bid submission
- ✓ Price comparison (can purchase check)
- ✓ Successful transactions
- ✓ Balance updates
- ✗ Duplicate listings
- ✗ Invalid bid amounts
- ✗ Unauthorized purchases
- ✗ Missing price proofs
- ✗ Insufficient balance
- ✗ Invalid asset IDs

---

## FHE Patterns Demonstrated

### 1. Encrypted Value Storage Pattern

**What it does:**
Stores multiple encrypted values with independent permissions.

```solidity
// Mapping from asset ID to encrypted price
mapping(uint256 => euint32) private assetPrices;

// Store encrypted price
function listAsset(
    uint256 _assetId,
    externalEuint32 _price,
    bytes calldata _proof
) external {
    euint32 encryptedPrice = FHE.fromExternal(_price, _proof);

    assetPrices[_assetId] = encryptedPrice;

    // Grant permissions for this specific price
    FHE.allowThis(encryptedPrice);
    FHE.allow(encryptedPrice, msg.sender);
}
```

**Key Points:**
- Each encrypted value stored independently
- Permissions apply to individual values
- No cross-asset data leakage

### 2. Encrypted Comparison in Storage Pattern

**What it does:**
Compares encrypted values retrieved from storage.

```solidity
// Check if buyer's bid meets seller's ask
function canPurchase(uint256 _assetId, euint32 _bidAmount) external view returns (euint32) {
    // Retrieve encrypted ask price from storage
    euint32 askPrice = assetPrices[_assetId];

    // Compare encrypted values
    // Result is encrypted boolean (euint32 with 0 or 1)
    euint32 canBuy = FHE.gte(_bidAmount, askPrice);

    return canBuy;
}
```

**Key Points:**
- Retrieved values inherit storage permissions
- Comparisons happen in encrypted domain
- Result stays encrypted until decrypted by authorized party

### 3. Multi-User Encrypted State Pattern

**What it does:**
Manages encrypted state for multiple market participants.

```solidity
// Track encrypted balances per user
mapping(address => euint32) private userBalances;

// Update balance with encrypted amount
function depositBalance(externalEuint32 _amount, bytes calldata _proof) external {
    euint32 encryptedAmount = FHE.fromExternal(_amount, _proof);

    // Add to existing balance (both encrypted)
    userBalances[msg.sender] = FHE.add(userBalances[msg.sender], encryptedAmount);

    FHE.allowThis(userBalances[msg.sender]);
    FHE.allow(userBalances[msg.sender], msg.sender);
}
```

**Key Points:**
- Each user has independent encrypted balance
- Arithmetic on encrypted values possible
- User permissions isolated per account

---

## Testing Your Understanding

### Success Scenarios (✓)

1. **Create Asset Listing**
   - Asset listed with encrypted price
   - Price stored but not exposed
   - Seller can manage listing

2. **Submit Encrypted Bid**
   - Buyer submits encrypted bid amount
   - Bid visible on-chain but not readable
   - Seller cannot see actual bid amount

3. **Price Comparison (Can Purchase)**
   - Compare encrypted bid with encrypted ask
   - Result encrypted boolean
   - Only authorized parties can decrypt result

4. **Execute Transaction**
   - Owner executes trade when conditions met
   - Encrypted balance updates occur
   - Transaction completes successfully

5. **Multiple Assets**
   - List multiple assets with different prices
   - Maintain separate encrypted prices per asset
   - Prevent price comparison across assets

6. **Encrypted Balance Updates**
   - Deposit encrypted amounts
   - Withdraw encrypted amounts
   - Balance remains hidden

### Failure Scenarios (✗)

1. **Invalid Encrypted Price**
   - Malformed price data
   - Missing proof
   - Contract rejects listing

2. **Unauthorized Bid**
   - User without funds attempts purchase
   - System checks encrypted balance
   - Transaction fails safely

3. **Duplicate Asset Listing**
   - Attempting to list same asset twice
   - System prevents overwrite
   - Original listing preserved

4. **Missing Proof Data**
   - Submitting encrypted value without proof
   - Cryptographic verification fails
   - Transaction reverted

5. **Invalid Asset ID**
   - Bidding on non-existent asset
   - System checks asset existence
   - Operation rejected

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Forgetting Separate Permissions per Asset

**Wrong:**
```solidity
// Bad: sharing permissions across assets
function listAsset(uint256 _id, externalEuint32 _price, bytes calldata _proof) external {
    euint32 price = FHE.fromExternal(_price, _proof);
    assetPrices[_id] = price;

    // Only grant once - all assets share same permissions!
    FHE.allowThis(price);
    FHE.allow(price, msg.sender);
}
```

**Correct:**
```solidity
// Good: grant permissions for each asset's price independently
function listAsset(uint256 _id, externalEuint32 _price, bytes calldata _proof) external {
    euint32 price = FHE.fromExternal(_price, _proof);
    assetPrices[_id] = price;

    // Grant permissions for this specific asset
    FHE.allowThis(price);
    FHE.allow(price, msg.sender);
}
```

### ❌ Pitfall 2: Comparing Across Different Encrypted Contexts

**Wrong:**
```solidity
// Bad: comparing values with different permission contexts
function canPurchase(uint256 _assetId, euint32 _userBid) external view {
    // User's bid (user context) vs stored price (contract context)
    return FHE.gte(_userBid, assetPrices[_assetId]);  // Context mismatch!
}
```

**Correct:**
```solidity
// Good: retrieve and compare within consistent context
function canPurchase(uint256 _assetId, euint32 _userBid) external view returns (euint32) {
    euint32 askPrice = assetPrices[_assetId];
    // Now both in same context
    return FHE.gte(_userBid, askPrice);
}
```

### ❌ Pitfall 3: Exposing Asset Price Through Separate Query

**Wrong:**
```solidity
// Bad: function that returns price directly (caller cannot decrypt)
function getPrice(uint256 _assetId) external view returns (euint32) {
    return assetPrices[_assetId];
}
```

**Correct:**
```solidity
// Good: provide comparison results instead of raw prices
function comparePrices(uint256 _assetId1, uint256 _assetId2) external view returns (euint32) {
    euint32 price1 = assetPrices[_assetId1];
    euint32 price2 = assetPrices[_assetId2];
    return FHE.gt(price1, price2);  // Result encrypted, not price
}
```

### ❌ Pitfall 4: Not Handling Encrypted Arithmetic Properly

**Wrong:**
```solidity
// Bad: treating encrypted arithmetic like unencrypted
function updatePrice(uint256 _assetId, externalEuint32 _newPrice, bytes calldata _proof) external {
    euint32 price = FHE.fromExternal(_newPrice, _proof);
    // Cannot reassign without permissions!
    assetPrices[_assetId] = price;
}
```

**Correct:**
```solidity
// Good: grant permissions for updated value
function updatePrice(uint256 _assetId, externalEuint32 _newPrice, bytes calldata _proof) external {
    euint32 price = FHE.fromExternal(_newPrice, _proof);
    assetPrices[_assetId] = price;

    FHE.allowThis(price);
    FHE.allow(price, msg.sender);
}
```

---

## Implementation Highlights

### Privacy Guarantees

- Asset prices completely hidden
- Bid amounts confidential
- Seller identity protected
- Transaction amounts private

### Scalability

- Support for unlimited asset listings
- Multiple concurrent bids per asset
- Efficient encrypted comparisons
- Gas-optimized operations

### Real-World Applicability

- Works with existing blockchain infrastructure
- Compatible with token standards
- Extensible for complex trading logic
- Suitable for high-value transactions

---

## Advanced Patterns

### Encrypted Auction

```solidity
// Multiple encrypted bids on same asset
// System finds highest bid without exposing amounts
euint32 highestBid = bids[0];

for (uint i = 1; i < bids.length; i++) {
    euint32 isGreater = FHE.gt(bids[i], highestBid);
    highestBid = FHE.select(isGreater, bids[i], highestBid);
}

// Only winning bidder can decrypt the amount
```

### Price Discovery Without Disclosure

```solidity
// Buyer learns if bid matches without learning exact price
euint32 canBuy = FHE.gte(bidAmount, assetPrice);

// Result tells buyer "yes" or "no" but reveals no actual prices
```

---

## Related Examples

- [Encrypted Identity](encrypted-identity.md) - Similar encrypted storage patterns
- [Encrypted Treasury](encrypted-treasury.md) - Encrypted value management
- [Confidential Voting](confidential-voting.md) - Advanced permission patterns

---

## Resources

**FHEVM Documentation:**
- [Encrypted Storage](https://docs.zama.ai)
- [Encrypted Comparisons](https://docs.zama.ai)
- [Multi-user Patterns](https://docs.zama.ai)

---

**Total Lines:** ~350 contract code | ~480 test code
**Test Cases:** 18+ | **Categories:** 3
**Difficulty:** Intermediate

Great for learning encrypted state management and commerce patterns!
