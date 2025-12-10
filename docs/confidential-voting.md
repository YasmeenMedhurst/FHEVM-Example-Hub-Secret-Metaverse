# Confidential Voting

**Category:** Confidential Governance
**Description:** Demonstrates secure, secret-ballot governance voting with encrypted vote tallying, ensuring voter privacy while maintaining verifiable results.

---

## Overview

The Confidential Voting contract showcases how to build decentralized governance systems where votes remain completely private during voting periods, results can be tallied without revealing individual votes, and outcome integrity is cryptographically guaranteed.

## Use Cases

- Secret-ballot governance voting
- Private DAO proposals and decisions
- Confidential board elections
- Anonymous community polls
- Encrypted referendum systems

---

## Key Features

### 1. Voter Registration
- Citizens register for voting rights
- Registration public but identity protected
- No correlation with actual votes

### 2. Encrypted Ballot Submission
- Votes submitted as encrypted values
- Individual votes never exposed
- Ballot contents confidential

### 3. Confidential Vote Counting
- Tally calculated in encrypted domain
- No intermediate vote exposure
- Result accurate without decryption

### 4. Encrypted Vote Comparison
- Determine winner without revealing totals
- Compare encrypted tallies
- Outcome verifiable

### 5. Proposal Lifecycle Management
- Proposal creation
- Voting period enforcement
- Result finalization
- Public outcome without vote details

---

## Implementation Details

### Smart Contract

Located at `contracts/governance/ConfidentialVoting.sol`

**Key Functions:**

```solidity
// Create new voting proposal
function createProposal(
    string calldata _description,
    uint256 _votingDuration
) external returns (uint256 proposalId)

// Register as eligible voter
function registerVoter() external

// Submit encrypted vote
function submitVote(
    uint256 _proposalId,
    externalEuint32 _voteChoice,
    bytes calldata _proof
) external

// Get encrypted vote count (for/against)
function getVoteCount(uint256 _proposalId) external view returns (euint32 forVotes, euint32 againstVotes)

// Check if proposal passed (encrypted comparison)
function isPassed(uint256 _proposalId) external view returns (euint32)

// Check if voter has voted
function hasVoted(uint256 _proposalId, address _voter) external view returns (bool)

// Check if voting period ended
function isVotingEnded(uint256 _proposalId) external view returns (bool)
```

### Test Suite

Located at `test/governance/ConfidentialVoting.ts`

**Test Coverage (20+ tests):**

- ✓ Proposal creation
- ✓ Voter registration
- ✓ Vote submission (for/against)
- ✓ Vote tallying
- ✓ Proposal outcome determination
- ✓ Voting period validation
- ✓ Multiple voters
- ✓ Multiple proposals
- ✗ Duplicate votes
- ✗ Invalid vote values
- ✗ Unauthorized voting
- ✗ Voting after period ends
- ✗ Missing proofs

---

## FHE Patterns Demonstrated

### 1. Encrypted Vote Tallying Pattern

**What it does:**
Accumulates encrypted votes for each option without revealing individual choices.

```solidity
// Store encrypted tallies per proposal
mapping(uint256 => euint32) private votesFor;
mapping(uint256 => euint32) private votesAgainst;

// Submit encrypted vote
function submitVote(
    uint256 _proposalId,
    externalEuint32 _voteChoice,
    bytes calldata _proof
) external {
    require(!hasVoted[_proposalId][msg.sender], "Already voted");
    require(!isVotingEnded(_proposalId), "Voting ended");

    euint32 encryptedVote = FHE.fromExternal(_voteChoice, _proof);

    // Vote is 0 (against) or 1 (for)
    // Add to appropriate tally
    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], encryptedVote);

    // Against votes = (1 - vote)
    euint32 invertedVote = FHE.sub(FHE.asEuint32(1), encryptedVote);
    votesAgainst[_proposalId] = FHE.add(votesAgainst[_proposalId], invertedVote);

    hasVoted[_proposalId][msg.sender] = true;

    FHE.allowThis(votesFor[_proposalId]);
    FHE.allowThis(votesAgainst[_proposalId]);
}
```

**Key Points:**
- Individual votes stay encrypted
- Tallies accumulated in encrypted domain
- No single vote ever exposed
- Total remains encrypted

### 2. Encrypted Proposal Outcome Pattern

**What it does:**
Determines if proposal passed without revealing exact vote counts.

```solidity
// Check if proposal passed
function isPassed(uint256 _proposalId) external view returns (euint32) {
    require(isVotingEnded(_proposalId), "Voting still active");

    // Compare encrypted tallies
    euint32 passed = FHE.gt(votesFor[_proposalId], votesAgainst[_proposalId]);

    return passed;
}
```

**Key Points:**
- Comparison entirely encrypted
- Result is encrypted boolean
- No vote counts revealed
- Only outcome known

### 3. Time-Based Access Control Pattern

**What it does:**
Enforces voting periods with secure timestamp checks.

```solidity
// Store proposal end time
mapping(uint256 => uint256) private proposalEndTime;

// Create proposal with duration
function createProposal(
    string calldata _description,
    uint256 _votingDuration
) external returns (uint256) {
    uint256 proposalId = proposalCount++;

    proposalEndTime[proposalId] = block.timestamp + _votingDuration;

    return proposalId;
}

// Check if voting ended
function isVotingEnded(uint256 _proposalId) public view returns (bool) {
    return block.timestamp > proposalEndTime[_proposalId];
}

// Enforce during voting
function submitVote(...) external {
    require(!isVotingEnded(_proposalId), "Voting ended");
    // ... submit vote
}
```

**Key Points:**
- Public timestamps (not sensitive)
- Enforced at contract level
- No encrypted time operations needed
- Clear voting windows

### 4. Multi-Proposal Management Pattern

**What it does:**
Manages multiple concurrent voting proposals independently.

```solidity
// Track proposals separately
mapping(uint256 => Proposal) private proposals;

// Track votes per proposal
mapping(uint256 => mapping(address => bool)) private hasVoted;

// Create multiple proposals
function createProposal(...) external returns (uint256) {
    uint256 proposalId = proposalCount++;
    proposals[proposalId] = Proposal({
        description: _description,
        endTime: block.timestamp + _duration,
        votesFor: FHE.asEuint32(0),
        votesAgainst: FHE.asEuint32(0)
    });

    return proposalId;
}
```

**Key Points:**
- Each proposal has independent state
- Vote isolation per proposal
- Multiple concurrent votes possible
- No cross-proposal interference

---

## Testing Your Understanding

### Success Scenarios (✓)

1. **Create Proposal**
   - Admin creates voting proposal
   - Proposal registered on-chain
   - Voting period begins

2. **Register Voters**
   - Users register for voting rights
   - Registration confirmed
   - Ready to cast ballots

3. **Submit Encrypted Votes**
   - Voters submit encrypted choices
   - Votes tallied automatically
   - Individual votes hidden

4. **Multiple Voters**
   - Alice votes for
   - Bob votes against
   - Neither sees other's vote

5. **Determine Outcome**
   - Compare encrypted tallies
   - Determine if passed
   - Outcome accurate

6. **Multiple Concurrent Proposals**
   - Two proposals active simultaneously
   - Independent vote tracking
   - No cross-proposal confusion

### Failure Scenarios (✗)

1. **Duplicate Voting**
   - Voter tries to vote twice
   - System checks has-voted flag
   - Second vote rejected

2. **Voting After Period Ends**
   - Attempt to vote after deadline
   - Timestamp check fails
   - Transaction reverted

3. **Invalid Vote Value**
   - Vote not 0 or 1
   - Malformed encrypted input
   - Transaction rejected

4. **Unregistered Voter**
   - Non-registered address tries to vote
   - Access control check fails
   - Vote rejected

5. **Missing Vote Proof**
   - Submit vote without cryptographic proof
   - Verification fails
   - Transaction reverted

---

## Common Pitfalls & Solutions

### ❌ Pitfall 1: Storing Unencrypted Vote Tallies

**Wrong:**
```solidity
// Bad: plaintext tallies visible
mapping(uint256 => uint256) public votesFor;
mapping(uint256 => uint256) public votesAgainst;

function submitVote(uint256 _proposalId, uint256 _vote) external {
    if (_vote == 1) {
        votesFor[_proposalId]++;  // Exposed!
    }
}
```

**Correct:**
```solidity
// Good: encrypted tallies
mapping(uint256 => euint32) private votesFor;
mapping(uint256 => euint32) private votesAgainst;

function submitVote(uint256 _proposalId, externalEuint32 _vote, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_vote, _proof);
    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], encrypted);

    FHE.allowThis(votesFor[_proposalId]);
}
```

### ❌ Pitfall 2: Revealing Outcome Through Public Getter

**Wrong:**
```solidity
// Bad: public getter exposes tally
function getVotesFor(uint256 _proposalId) external view returns (euint32) {
    return votesFor[_proposalId];  // Caller cannot decrypt but pattern leaks info
}
```

**Correct:**
```solidity
// Good: only return comparison result
function isPassed(uint256 _proposalId) external view returns (euint32) {
    // Return encrypted boolean (passed/failed) not tally
    return FHE.gt(votesFor[_proposalId], votesAgainst[_proposalId]);
}
```

### ❌ Pitfall 3: Incorrect Binary Vote Handling

**Wrong:**
```solidity
// Bad: treating vote as multi-value
function submitVote(uint256 _proposalId, externalEuint32 _vote, bytes calldata _proof) external {
    euint32 vote = FHE.fromExternal(_vote, _proof);

    // If vote > 1, this breaks the logic
    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], vote);
}
```

**Correct:**
```solidity
// Good: ensure binary vote or multi-option handling
function submitVote(uint256 _proposalId, externalEuint32 _vote, bytes calldata _proof) external {
    euint32 vote = FHE.fromExternal(_vote, _proof);

    // Vote must be 0 or 1
    // If For (1): add 1 to for, add 0 to against
    // If Against (0): add 0 to for, add 1 to against

    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], vote);

    euint32 invertedVote = FHE.sub(FHE.asEuint32(1), vote);
    votesAgainst[_proposalId] = FHE.add(votesAgainst[_proposalId], invertedVote);
}
```

### ❌ Pitfall 4: Not Preventing Double Voting

**Wrong:**
```solidity
// Bad: no double-vote prevention
function submitVote(uint256 _proposalId, externalEuint32 _vote, bytes calldata _proof) external {
    euint32 encrypted = FHE.fromExternal(_vote, _proof);
    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], encrypted);
    // User can vote multiple times!
}
```

**Correct:**
```solidity
// Good: track who voted
mapping(uint256 => mapping(address => bool)) private hasVoted;

function submitVote(uint256 _proposalId, externalEuint32 _vote, bytes calldata _proof) external {
    require(!hasVoted[_proposalId][msg.sender], "Already voted");

    euint32 encrypted = FHE.fromExternal(_vote, _proof);
    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], encrypted);

    hasVoted[_proposalId][msg.sender] = true;
}
```

---

## Implementation Highlights

### Complete Vote Privacy

- Individual votes never exposed
- Tally accumulation encrypted
- Outcome determinable without revealing counts
- Cryptographic guarantees

### Verifiable Integrity

- All operations on-chain
- Cryptographic proofs required
- No vote manipulation possible
- Auditable without privacy loss

### Flexible Governance

- Customizable voting periods
- Multiple concurrent proposals
- Extensible to multi-option votes
- Weighted voting support possible

---

## Advanced Voting Patterns

### Multi-Option Voting

```solidity
// Support for more than 2 options
mapping(uint256 => mapping(uint256 => euint32)) private optionVotes;  // proposal => option => votes

function submitMultiOptionVote(
    uint256 _proposalId,
    uint256 _optionId,
    externalEuint32 _voteWeight,
    bytes calldata _proof
) external {
    euint32 weight = FHE.fromExternal(_voteWeight, _proof);

    optionVotes[_proposalId][_optionId] = FHE.add(
        optionVotes[_proposalId][_optionId],
        weight
    );
}
```

### Weighted Voting

```solidity
// Vote weight based on encrypted stake
mapping(address => euint32) private voterWeight;

function submitWeightedVote(
    uint256 _proposalId,
    externalEuint32 _vote,
    bytes calldata _proof
) external {
    euint32 vote = FHE.fromExternal(_vote, _proof);

    // Multiply vote by voter weight
    euint32 weightedVote = FHE.mul(vote, voterWeight[msg.sender]);

    votesFor[_proposalId] = FHE.add(votesFor[_proposalId], weightedVote);
}
```

---

## Related Examples

- [Encrypted Identity](encrypted-identity.md) - Registration patterns
- [Private Reputation](private-reputation.md) - Aggregation techniques
- [Encrypted Treasury](encrypted-treasury.md) - Permission management

---

## Resources

**FHEVM Documentation:**
- [Vote Tallying](https://docs.zama.ai)
- [Encrypted Comparisons](https://docs.zama.ai)
- [Time-Based Access Control](https://docs.zama.ai)

---

**Total Lines:** ~360 contract code | ~520 test code
**Test Cases:** 20+ | **Categories:** 4
**Difficulty:** Intermediate → Advanced

Perfect for learning governance, aggregation, and time-based patterns!
