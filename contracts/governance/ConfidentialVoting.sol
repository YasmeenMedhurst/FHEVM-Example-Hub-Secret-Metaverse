// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool, externalEuint32, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialVoting
 * @dev Privacy-preserving governance voting with encrypted ballots
 * @notice This contract demonstrates FHE-based confidential voting mechanisms
 */
contract ConfidentialVoting is ZamaEthereumConfig {

    // Voting proposal structure
    struct Proposal {
        string title;
        string description;
        euint32 encryptedForVotes;
        euint32 encryptedAgainstVotes;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        bool executed;
    }

    // State variables
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    mapping(address => bool) public isVoter;
    uint256 public proposalCount;
    uint256 public registeredVoters;
    address public owner;

    // Events
    event VoterRegistered(address indexed voter);
    event ProposalCreated(uint256 indexed proposalId, string title);
    event VoteCast(address indexed voter, uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId);
    event VoterDeactivated(address indexed voter);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register as a voter
     */
    function registerAsVoter() external {
        require(!isVoter[msg.sender], "ConfidentialVoting: Already registered");
        isVoter[msg.sender] = true;
        registeredVoters++;
        emit VoterRegistered(msg.sender);
    }

    /**
     * @dev Create a new voting proposal
     * @param _title Proposal title
     * @param _description Proposal description
     * @param _votingDuration Duration of voting period in seconds
     */
    function createProposal(
        string memory _title,
        string memory _description,
        uint256 _votingDuration
    ) external {
        require(msg.sender == owner, "ConfidentialVoting: Only owner can create proposals");
        require(bytes(_title).length > 0, "ConfidentialVoting: Empty title");
        require(_votingDuration > 0, "ConfidentialVoting: Invalid duration");

        Proposal storage proposal = proposals[proposalCount];
        proposal.title = _title;
        proposal.description = _description;
        proposal.encryptedForVotes = FHE.asEuint32(0);
        proposal.encryptedAgainstVotes = FHE.asEuint32(0);
        proposal.startTime = block.timestamp;
        proposal.endTime = block.timestamp + _votingDuration;
        proposal.isActive = true;
        proposal.executed = false;

        // Grant permissions
        FHE.allowThis(proposal.encryptedForVotes);
        FHE.allowThis(proposal.encryptedAgainstVotes);

        emit ProposalCreated(proposalCount, _title);
        proposalCount++;
    }

    /**
     * @dev Cast an encrypted vote on a proposal
     * @param _proposalId ID of the proposal
     * @param _encryptedVote Encrypted vote (true = for, false = against)
     * @param _voteProof Proof for vote encryption
     */
    function castVote(
        uint256 _proposalId,
        externalEbool _encryptedVote,
        bytes calldata _voteProof
    ) external {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        require(isVoter[msg.sender], "ConfidentialVoting: Not a registered voter");
        require(!hasVoted[_proposalId][msg.sender], "ConfidentialVoting: Already voted on this proposal");
        require(proposals[_proposalId].isActive, "ConfidentialVoting: Proposal not active");
        require(block.timestamp <= proposals[_proposalId].endTime, "ConfidentialVoting: Voting period ended");

        ebool vote = FHE.fromExternal(_encryptedVote, _voteProof);

        // Record vote
        hasVoted[_proposalId][msg.sender] = true;

        Proposal storage proposal = proposals[_proposalId];

        // Update encrypted vote counts based on encrypted vote value
        // If vote is true (for), increment forVotes, else increment againstVotes
        euint32 voteValue = FHE.asEuint32(1);
        euint32 zeroValue = FHE.asEuint32(0);

        euint32 forIncrement = FHE.select(vote, voteValue, zeroValue);
        euint32 againstIncrement = FHE.select(vote, zeroValue, voteValue);

        proposal.encryptedForVotes = FHE.add(proposal.encryptedForVotes, forIncrement);
        proposal.encryptedAgainstVotes = FHE.add(proposal.encryptedAgainstVotes, againstIncrement);

        // Grant permissions
        FHE.allowThis(proposal.encryptedForVotes);
        FHE.allow(proposal.encryptedForVotes, msg.sender);
        FHE.allowThis(proposal.encryptedAgainstVotes);
        FHE.allow(proposal.encryptedAgainstVotes, msg.sender);

        emit VoteCast(msg.sender, _proposalId);
    }

    /**
     * @dev Get encrypted vote count for "for" votes
     */
    function getEncryptedForVotes(uint256 _proposalId) external view returns (euint32) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        return proposals[_proposalId].encryptedForVotes;
    }

    /**
     * @dev Get encrypted vote count for "against" votes
     */
    function getEncryptedAgainstVotes(uint256 _proposalId) external view returns (euint32) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        return proposals[_proposalId].encryptedAgainstVotes;
    }

    /**
     * @dev Check if proposal motion is winning (encrypted comparison)
     */
    function isProposalWinning(uint256 _proposalId) external returns (ebool) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");

        Proposal storage proposal = proposals[_proposalId];

        // Compare encrypted vote counts - result is encrypted
        ebool result = FHE.gt(proposal.encryptedForVotes, proposal.encryptedAgainstVotes);

        FHE.allowThis(result);
        FHE.allow(result, msg.sender);

        return result;
    }

    /**
     * @dev Get proposal information (public data only)
     */
    function getProposalInfo(uint256 _proposalId) external view returns (
        string memory title,
        string memory description,
        uint256 startTime,
        uint256 endTime,
        bool isActive,
        bool executed
    ) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        Proposal storage proposal = proposals[_proposalId];
        return (
            proposal.title,
            proposal.description,
            proposal.startTime,
            proposal.endTime,
            proposal.isActive,
            proposal.executed
        );
    }

    /**
     * @dev Check if voting period has ended
     */
    function hasVotingEnded(uint256 _proposalId) external view returns (bool) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        return block.timestamp > proposals[_proposalId].endTime;
    }

    /**
     * @dev Check if user has already voted
     */
    function userHasVoted(uint256 _proposalId, address _voter) external view returns (bool) {
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        return hasVoted[_proposalId][_voter];
    }

    /**
     * @dev Check if user is a registered voter
     */
    function isRegisteredVoter(address _voter) external view returns (bool) {
        return isVoter[_voter];
    }

    /**
     * @dev Close voting on a proposal
     */
    function closeVoting(uint256 _proposalId) external {
        require(msg.sender == owner, "ConfidentialVoting: Only owner can close voting");
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        require(proposals[_proposalId].isActive, "ConfidentialVoting: Already closed");

        proposals[_proposalId].isActive = false;
    }

    /**
     * @dev Mark proposal as executed
     */
    function executeProposal(uint256 _proposalId) external {
        require(msg.sender == owner, "ConfidentialVoting: Only owner can execute");
        require(_proposalId < proposalCount, "ConfidentialVoting: Invalid proposal ID");
        require(!proposals[_proposalId].isActive, "ConfidentialVoting: Voting still active");
        require(!proposals[_proposalId].executed, "ConfidentialVoting: Already executed");

        proposals[_proposalId].executed = true;
        emit ProposalExecuted(_proposalId);
    }

    /**
     * @dev Revoke voter status
     */
    function revokeVoter(address _voter) external {
        require(msg.sender == owner, "ConfidentialVoting: Only owner");
        require(isVoter[_voter], "ConfidentialVoting: Not a voter");
        isVoter[_voter] = false;
        registeredVoters--;
        emit VoterDeactivated(_voter);
    }

    /**
     * @dev Get total proposals
     */
    function getTotalProposals() external view returns (uint256) {
        return proposalCount;
    }

    /**
     * @dev Get total registered voters
     */
    function getTotalVoters() external view returns (uint256) {
        return registeredVoters;
    }
}
