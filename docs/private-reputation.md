# Private Reputation System

**Category:** Identity & Privacy
**Description:** Implements anonymous reputation system maintaining user anonymity while enabling trustless reputation tracking and aggregation.

---

## Overview

The Private Reputation contract demonstrates how to build trust systems where users' reputation scores and history remain completely private while still enabling reputation-based access control and community trust mechanisms.

## Use Cases

- Anonymous reputation tracking in virtual worlds
- Trustless reputation systems
- Confidential rating aggregation
- Private credential systems
- Encrypted trust networks

---

## Key Features

### 1. Anonymous User Enrollment
- Users register without identity disclosure
- Reputation starts encrypted
- No public enrollment information

### 2. Encrypted Review Submission
- Reviews recorded as encrypted scores
- Reviewer identity kept private
- Review contents confidential

### 3. Confidential Reputation Aggregation
- Multiple encrypted reviews combined
- Aggregate score calculated in encrypted domain
- Total reputation hidden until decryption

### 4. Privacy-Preserving Reputation Comparisons
- Compare encrypted reputation scores
- Determine trust levels without disclosure
- Threshold-based access control

### 5. Public/Encrypted Separation
- Public statistics (count of reviews)
- Encrypted metrics (actual scores)
- Hybrid approach for flexibility

---

## Implementation Details

### Smart Contract

Located at `contracts/reputation/PrivateReputation.sol`

**Key Functions:**

```solidity
// Enroll in reputation system anonymously
function enrollUser() external

// Submit encrypted review/rating
function submitReview(
    address _subject,
    externalEuint32 _score,
    bytes calldata _proof
) external

// Get encrypted aggregate reputation
function getReputationScore(address _user) external view returns (euint32)

// Check if user meets reputation threshold
function meetsReputationThreshold(
    address _user,
    euint32 _threshold
) external view returns (euint32)

// Get review count (public information)
function getReviewCount(address _user) external view returns (uint256)
```

### Test Suite

Located at `test/reputation/PrivateReputation.ts`

**Test Coverage (17+ tests):**

- ✓ User enrollment
- ✓ Review submission
- ✓ Score encryption
- ✓ Reputation aggregation
- ✓ Threshold checking
- ✓ Multi-reviewer scenarios
- ✓ Reputation decay patterns
- ✗ Duplicate enrollments
- ✗ Invalid scores
- ✗ Unauthorized reviews
- ✗ Missing proofs

---

## FHE Patterns Demonstrated

### 1. Anonymous Enrollment Pattern

**What it does:**
Registers users without recording personal information.

```solidity
// Track if user is enrolled (but not who they are)
mapping(address => bool) private isEnrolled;

// Store encrypted reputation
mapping(address => euint32) private reputationScores;

// Enroll anonymously
function enrollUser() external {
    require(!isEnrolled[msg.sender], "Already enrolled");

    isEnrolled[msg.sender] = true;

    // Initialize with zero (encrypted)
    reputationScores[msg.sender] = FHE.asEuint32(0);

    FHE.allowThis(reputationScores[msg.sender]);
    FHE.allow(reputationScores[msg.sender], msg.sender);
}
```

**Key Points:**
- Only boolean flag stored (not personal info)
- Actual reputation fully encrypted
- Multiple users can use same contract
- No personal data linkage

### 2. Encrypted Score Aggregation Pattern

**What it does:**
Combines multiple encrypted scores into one aggregated value.

```solidity
// Store reviews per user (encrypted)
mapping(address => euint32[]) private userReviews;

// Submit encrypted review
function submitReview(
    address _subject,
    externalEuint32 _score,
    bytes calldata _proof
) external {
    require(isEnrolled[_subject], "User not enrolled");

    euint32 encryptedScore = FHE.fromExternal(_score, _proof);

    // Store review (can be aggregated later)
    userReviews[_subject].push(encryptedScore);
}

// Aggregate all reviews
function getReputationScore(address _user) external view returns (euint32) {
    if (userReviews[_user].length == 0) {
        return FHE.asEuint32(0);
    }

    euint32 total = userReviews[_user][0];

    // Sum all encrypted reviews
    for (uint i = 1; i < userReviews[_user].length; i++) {
        total = FHE.add(total, userReviews[_user][i]);
    }

    return total;
}
```

**Key Points:**
- Individual reviews stay encrypted
- Aggregation through FHE.add
- No intermediate exposure
- Final sum encrypted

### 3. Reputation Threshold Pattern

**What it does:**
Determines if reputation meets requirements without revealing score.

```solidity
// Check if meets threshold
function meetsReputationThreshold(
    address _user,
    euint32 _threshold
) external view returns (euint32) {
    euint32 reputation = getReputationScore(_user);

    // Compare encrypted reputation with threshold
    euint32 meetsThreshold = FHE.gte(reputation, _threshold);

    return meetsThreshold;
}
```

**Key Points:**
- Threshold provided as encrypted parameter
- Comparison encrypted
- Result encrypted boolean
- Access control based on result

### 4. Hybrid Public/Encrypted Pattern

**What it does:**
Stores some information publicly while keeping sensitive data encrypted.

```solidity
// Public: count of reviews (not values)
mapping(address => uint256) private reviewCounts;

// Encrypted: actual reputation scores
mapping(address => euint32) private reputationScores;

// Submit review
function submitReview(
    address _subject,
    externalEuint32 _score,
    bytes calldata _proof
) external {
    euint32 encrypted = FHE.fromExternal(_score, _proof);

    // Public: increment count
    reviewCounts[_subject]++;

    // Encrypted: add score
    reputationScores[_subject] = FHE.add(
        reputationScores[_subject],
        encrypted
    );

    FHE.allowThis(reputationScores[_subject]);
    FHE.allow(reputationScores[_subject], _subject);
}
```

**Key Points:**
- Count visible (doesn't reveal scores)
- Scores remain hidden
- Both tracks useful
- No information leakage from count

---

## Testing Your Understanding

### Success Scenarios (✓)

1. **User Enrollment**
   - User enrolls in reputation system
   - No personal information recorded
   - Ready to receive reviews

2. **Submit Encrypted Review**
   - Reviewer submits score
   - Score encrypted with proof
   - Review stored on-chain

3. **Aggregate Reputation**
   - Retrieve all user's reviews
   - Combine in encrypted domain
   - Total score remains encrypted

4. **Check Reputation Threshold**
   - Compare encrypted score with threshold
   - Result encrypted boolean
   - User learns if they qualify

5. **Multiple Reviews**
   - Different reviewers submit scores
   - Multiple encrypted additions
   - Aggregate includes all reviews

6. **Review Count Accuracy**
   - Public count correct
   - Count doesn't reveal scores
   - Matches number of submissions

### Failure Scenarios (✗)

1. **Duplicate Enrollment**
   - User tries to enroll twice
   - System rejects duplicate
   - Original enrollment preserved

2. **Review Non-Existent User**
   - Try to review unenrolled user
   - System checks enrollment
   - Transaction fails

3. **Invalid Review Score**
   - Malformed encrypted input
   - Missing proof
   - Contract rejects review

4. **Unauthorized Decryption**
   - Non-owner tries to decrypt reputation
   - Cryptographic verification fails
   - Access denied

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Storing Unencrypted Scores

**Wrong:**
```solidity
// Bad: plaintext reputation visible on-chain
mapping(address => uint256) public reputationScores;

function submitReview(address _subject, uint256 _score) external {
    reputationScores[_subject] += _score;  // Score exposed!
}
```

**Correct:**
```solidity
// Good: always use encrypted scores
mapping(address => euint32) private reputationScores;

function submitReview(address _subject, externalEuint32 _score, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_score, _proof);
    reputationScores[_subject] = FHE.add(reputationScores[_subject], encrypted);

    FHE.allowThis(reputationScores[_subject]);
    FHE.allow(reputationScores[_subject], _subject);
}
```

### ❌ Pitfall 2: Forgetting Permissions in Aggregation

**Wrong:**
```solidity
// Bad: sum without permissions
function getReputationScore(address _user) external view returns (euint32) {
    euint32 total = reviews[_user][0];

    for (uint i = 1; i < reviews[_user].length; i++) {
        total = FHE.add(total, reviews[_user][i]);
    }

    // Forgot to grant permissions!
    return total;
}
```

**Correct:**
```solidity
// Good: grant permissions for aggregated result
function aggregateAndAllow(address _user) external {
    euint32 total = reviews[_user][0];

    for (uint i = 1; i < reviews[_user].length; i++) {
        total = FHE.add(total, reviews[_user][i]);
    }

    FHE.allowThis(total);
    FHE.allow(total, _user);
    return total;
}
```

### ❌ Pitfall 3: Exposing Score Through Loop

**Wrong:**
```solidity
// Bad: iteration pattern might expose information
function getHighestRating(address _user) external view {
    euint32 highest = reviews[_user][0];

    for (uint i = 1; i < reviews[_user].length; i++) {
        if (reviews[_user][i] > highest) {  // Cannot use > with encrypted!
            highest = reviews[_user][i];
        }
    }
}
```

**Correct:**
```solidity
// Good: use encrypted max function
function getHighestRating(address _user) external view returns (euint32) {
    euint32 highest = reviews[_user][0];

    for (uint i = 1; i < reviews[_user].length; i++) {
        euint32 isGreater = FHE.gt(reviews[_user][i], highest);
        highest = FHE.select(isGreater, reviews[_user][i], highest);
    }

    return highest;
}
```

### ❌ Pitfall 4: Public Metadata Revealing Sensitive Information

**Wrong:**
```solidity
// Bad: public metadata combined with encrypted data can leak info
mapping(address => uint256) public averageReputationPublic;  // 95 = likely trusted

function submitReview(address _subject, externalEuint32 _score, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_score, _proof);
    // Update public average...
}
```

**Correct:**
```solidity
// Good: keep public metadata safe (only count, not statistics)
mapping(address => uint256) public reviewCount;  // Safe: just number

function submitReview(address _subject, externalEuint32 _score, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_score, _proof);
    reputationScores[_subject] = FHE.add(reputationScores[_subject], encrypted);
    reviewCount[_subject]++;  // Only counts, not stats
}
```

---

## Implementation Highlights

### Complete Anonymity

- User identity never recorded
- Reputation score completely private
- Review history encrypted
- No correlation possible

### Flexible Reputation System

- Multiple review aggregation
- Customizable thresholds
- Extensible scoring system
- Compatible with other systems

### Efficiency

- Single pass aggregation possible
- Batch review processing
- Optimized encrypted arithmetic
- Low gas per operation

---

## Advanced Patterns

### Reputation Decay

```solidity
// Implement time-weighted reputation
function applyDecay(euint32 _score, uint256 _age) external view returns (euint32) {
    // Score decreases with age
    // Calculation happens in encrypted domain
    euint32 decayFactor = getDecayFactor(_age);
    return FHE.mul(_score, decayFactor);
}
```

### Multi-Dimensional Reputation

```solidity
// Track multiple reputation scores encrypted
mapping(address => euint32) private trustScore;
mapping(address => euint32) private expertiseScore;
mapping(address => euint32) private communityScore;

function overallReputation(address _user) external view returns (euint32) {
    euint32 total = FHE.add(trustScore[_user], expertiseScore[_user]);
    return FHE.add(total, communityScore[_user]);
}
```

---

## Related Examples

- [Encrypted Identity](encrypted-identity.md) - User data encryption
- [Encrypted Gaming](encrypted-gaming.md) - Score accumulation
- [Confidential Voting](confidential-voting.md) - Aggregation patterns

---

## Resources

**FHEVM Documentation:**
- [Score Aggregation](https://docs.zama.ai)
- [Threshold Checking](https://docs.zama.ai)
- [Hybrid Public/Encrypted](https://docs.zama.ai)

---

**Total Lines:** ~300 contract code | ~440 test code
**Test Cases:** 17+ | **Categories:** 3
**Difficulty:** Intermediate

Excellent for learning reputation aggregation and anonymous systems!
