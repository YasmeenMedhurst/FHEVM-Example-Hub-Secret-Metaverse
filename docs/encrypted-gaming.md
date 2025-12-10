# Encrypted Gaming

**Category:** Gaming & Entertainment
**Description:** Demonstrates confidential gaming mechanics with completely hidden game state, encrypted scores, and private leaderboards.

---

## Overview

The Encrypted Gaming contract showcases how to build gaming systems on-chain where player scores, progress levels, and game state remain completely private while enabling secure, verifiable gameplay.

## Use Cases

- Competitive gaming with score privacy
- Hidden-state game mechanics
- Confidential achievement tracking
- Private leaderboard systems
- Encrypted game progress management

---

## Key Features

### 1. Encrypted Game Sessions
- Players create private game sessions
- Game state stored as encrypted values
- Session data never exposed on-chain

### 2. Confidential Score Updates
- Players earn points without exposing amounts
- Scores encrypted from submission
- Only player can decrypt their score

### 3. Hidden Level Progression
- Player levels stored encrypted
- Advancement happens in encrypted domain
- Level requirements compared securely

### 4. Encrypted Leaderboard Tracking
- Top scores tracked without revealing values
- Ranking comparisons done encrypted
- Position information remains private

### 5. Player Statistics Management
- Win/loss records encrypted
- Achievement counts confidential
- Statistics visible but meaningless without decryption

---

## Implementation Details

### Smart Contract

Located at `contracts/gaming/EncryptedGaming.sol`

**Key Functions:**

```solidity
// Create encrypted game session
function createGameSession() external

// Update encrypted score
function updateScore(externalEuint32 _points, bytes calldata _proof) external

// Get encrypted current score
function getEncryptedScore(address _player) external view returns (euint32)

// Check if player reached level
function isLevelUnlocked(address _player, euint32 _levelThreshold) external view returns (euint32)

// Add encrypted achievement points
function addAchievementPoints(externalEuint32 _points, bytes calldata _proof) external

// Check if player qualifies for reward
function canClaimReward(address _player, euint32 _requiredScore) external view returns (euint32)
```

### Test Suite

Located at `test/gaming/EncryptedGaming.ts`

**Test Coverage (16+ tests):**

- ✓ Game session creation
- ✓ Score update with encryption
- ✓ Multiple score updates
- �� Level checking (encrypted comparison)
- ✓ Achievement tracking
- ✓ Reward eligibility
- ✓ Player isolation
- ✗ Invalid score inputs
- ✗ Negative scores
- ✗ Unauthorized updates
- ✗ Missing proofs

---

## FHE Patterns Demonstrated

### 1. Encrypted Game State Pattern

**What it does:**
Maintains game state entirely in encrypted form.

```solidity
// Store encrypted score per player
mapping(address => euint32) private playerScores;

// Store encrypted level per player
mapping(address => euint32) private playerLevels;

// Update score with encrypted input
function updateScore(externalEuint32 _points, bytes calldata _proof) external {
    euint32 points = FHE.fromExternal(_points, _proof);

    // Add to existing score (both encrypted)
    playerScores[msg.sender] = FHE.add(playerScores[msg.sender], points);

    FHE.allowThis(playerScores[msg.sender]);
    FHE.allow(playerScores[msg.sender], msg.sender);
}
```

**Key Points:**
- All game state remains encrypted
- Arithmetic on encrypted values
- No plaintext scores on-chain

### 2. Encrypted Threshold Checking Pattern

**What it does:**
Determines if encrypted value meets threshold without decryption.

```solidity
// Check if score meets level requirement
function isLevelUnlocked(address _player, euint32 _levelThreshold) external view returns (euint32) {
    euint32 playerScore = playerScores[_player];

    // Compare encrypted score with encrypted threshold
    euint32 isUnlocked = FHE.gte(playerScore, _levelThreshold);

    return isUnlocked;
}
```

**Key Points:**
- Threshold passed as encrypted parameter
- Comparison happens encrypted
- Result stays encrypted
- No information leakage

### 3. Encrypted Achievement Accumulation Pattern

**What it does:**
Accumulates encrypted values over time.

```solidity
// Add encrypted achievement points
function addAchievementPoints(externalEuint32 _points, bytes calldata _proof) external {
    euint32 points = FHE.fromExternal(_points, _proof);

    // Achievement points accumulated encrypted
    playerAchievements[msg.sender] = FHE.add(playerAchievements[msg.sender], points);

    FHE.allowThis(playerAchievements[msg.sender]);
    FHE.allow(playerAchievements[msg.sender], msg.sender);
}
```

**Key Points:**
- Accumulation happens in encrypted domain
- Multiple operations on same value
- Permissions maintain throughout operations

### 4. Encrypted Multi-Condition Pattern

**What it does:**
Evaluates multiple encrypted conditions simultaneously.

```solidity
// Check reward eligibility (multiple conditions)
function canClaimReward(address _player, euint32 _minScore, euint32 _minLevel) external view returns (euint32) {
    euint32 hasScore = FHE.gte(playerScores[_player], _minScore);
    euint32 hasLevel = FHE.gte(playerLevels[_player], _minLevel);

    // Both conditions must be true
    euint32 eligible = FHE.and(hasScore, hasLevel);

    return eligible;
}
```

**Key Points:**
- Multiple encrypted comparisons
- Logical operations on encrypted booleans
- Complex conditions without data exposure

---

## Testing Your Understanding

### Success Scenarios (✓)

1. **Create Game Session**
   - Player creates session
   - Initial encrypted state
   - Ready for gameplay

2. **Update Score Successfully**
   - Player earns points
   - Encrypted score updated
   - Points hidden on-chain

3. **Achieve Level Unlock**
   - Score meets level threshold
   - Level check performed encrypted
   - Unlock status returned encrypted

4. **Accumulate Achievements**
   - Multiple achievement unlocks
   - Points accumulated encrypted
   - Total remains hidden

5. **Check Reward Eligibility**
   - Multiple conditions evaluated
   - All requirements met
   - Reward unlock confirmed encrypted

6. **Player Isolation**
   - Alice's score separate from Bob's
   - No cross-player data access
   - Each player's data independent

### Failure Scenarios (✗)

1. **Invalid Score Input**
   - Malformed encrypted input
   - Missing proof
   - Transaction fails

2. **Negative Score Attempt**
   - Trying to subtract more than available
   - Underflow protection triggers
   - Operation rejected

3. **Unauthorized Score Update**
   - Account other than player tries update
   - Access control check fails
   - Transaction reverted

4. **Insufficient Level**
   - Player score below threshold
   - Encrypted comparison shows false
   - Level remains locked

5. **Incomplete Reward Requirements**
   - One condition not met
   - AND operation returns false
   - Reward locked

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Assuming Encrypted Values are Comparable to Plaintext

**Wrong:**
```solidity
// Bad: mixing encrypted and plaintext
function isHighScore(uint256 _playerScore) external view returns (bool) {
    return playerScores[msg.sender] > 1000;  // Type error!
}
```

**Correct:**
```solidity
// Good: all operations on encrypted values
function isHighScore(euint32 _threshold) external view returns (euint32) {
    return FHE.gt(playerScores[msg.sender], _threshold);
}
```

### ❌ Pitfall 2: Forgetting Permissions After Arithmetic

**Wrong:**
```solidity
// Bad: arithmetic without permission update
function updateScore(externalEuint32 _points, bytes calldata _proof) external {
    euint32 points = FHE.fromExternal(_points, _proof);
    playerScores[msg.sender] = FHE.add(playerScores[msg.sender], points);
    // Forgot permissions after addition!
}
```

**Correct:**
```solidity
// Good: update permissions after arithmetic
function updateScore(externalEuint32 _points, bytes calldata _proof) external {
    euint32 points = FHE.fromExternal(_points, _proof);
    playerScores[msg.sender] = FHE.add(playerScores[msg.sender], points);

    FHE.allowThis(playerScores[msg.sender]);
    FHE.allow(playerScores[msg.sender], msg.sender);
}
```

### ❌ Pitfall 3: Storing Unencrypted Scores

**Wrong:**
```solidity
// Bad: storing plaintext scores defeats privacy
function updateScore(uint256 _points) external {
    playerScores[msg.sender] += _points;  // Score visible on-chain!
}
```

**Correct:**
```solidity
// Good: always work with encrypted values
function updateScore(externalEuint32 _points, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_points, _proof);
    playerScores[msg.sender] = FHE.add(playerScores[msg.sender], encrypted);
    FHE.allowThis(playerScores[msg.sender]);
    FHE.allow(playerScores[msg.sender], msg.sender);
}
```

### ❌ Pitfall 4: Revealing Information Through Patterns

**Wrong:**
```solidity
// Bad: pattern reveals information
function levelUpIfEligible(euint32 _threshold) external {
    if (FHE.gte(playerScores[msg.sender], _threshold)) {
        // This if statement won't work with encrypted boolean!
        playerLevels[msg.sender] = FHE.add(playerLevels[msg.sender], 1);
    }
}
```

**Correct:**
```solidity
// Good: use encrypted select
function levelUpIfEligible(euint32 _threshold) external {
    euint32 eligible = FHE.gte(playerScores[msg.sender], _threshold);
    euint32 newLevel = FHE.select(eligible,
        FHE.add(playerLevels[msg.sender], 1),
        playerLevels[msg.sender]
    );
    playerLevels[msg.sender] = newLevel;
    FHE.allowThis(newLevel);
    FHE.allow(newLevel, msg.sender);
}
```

---

## Implementation Highlights

### Complete Privacy

- Player scores hidden from each other
- Game progression confidential
- Achievement data encrypted
- Rankings possible without revealing scores

### Cheat Prevention

- All operations verified on-chain
- Proof requirements prevent tampering
- Encrypted comparisons cannot be manipulated
- Audit trail available if needed

### Scalability

- Supports unlimited players
- Multiple concurrent games
- Efficient encrypted operations
- Gas-optimized state updates

---

## Advanced Gaming Patterns

### Encrypted Multiplayer Interactions

```solidity
// Compare two players' encrypted scores (neither player sees the other's)
function getMatchWinner(address _player1, address _player2) external view returns (euint32) {
    euint32 score1 = playerScores[_player1];
    euint32 score2 = playerScores[_player2];
    return FHE.gt(score1, score2);
}
```

### Progressive Level Unlocking

```solidity
// Unlock multiple levels based on encrypted score
function unlockedLevels(address _player) external view returns (euint32[] memory) {
    euint32 score = playerScores[_player];

    euint32[] memory levels = new euint32[](5);
    levels[0] = FHE.gte(score, 100);   // Level 1 at 100 points
    levels[1] = FHE.gte(score, 250);   // Level 2 at 250 points
    levels[2] = FHE.gte(score, 500);   // Level 3 at 500 points
    levels[3] = FHE.gte(score, 1000);  // Level 4 at 1000 points
    levels[4] = FHE.gte(score, 2000);  // Level 5 at 2000 points

    return levels;
}
```

---

## Related Examples

- [Encrypted Identity](encrypted-identity.md) - User data encryption
- [Private Reputation](private-reputation.md) - Reputation accumulation
- [Confidential Voting](confidential-voting.md) - Permission management

---

## Resources

**FHEVM Documentation:**
- [Encrypted State Management](https://docs.zama.ai)
- [Encrypted Arithmetic](https://docs.zama.ai)
- [Conditional Logic](https://docs.zama.ai)

---

**Total Lines:** ~320 contract code | ~400 test code
**Test Cases:** 16+ | **Categories:** 3
**Difficulty:** Intermediate

Perfect for learning encrypted state accumulation and game mechanics!
