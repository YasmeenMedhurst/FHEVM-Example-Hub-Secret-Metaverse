// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title PrivateReputation
 * @dev An encrypted reputation system maintaining user anonymity
 * @notice This contract demonstrates privacy-preserving reputation tracking
 */
contract PrivateReputation is ZamaEthereumConfig {

    // User reputation structure
    struct UserReputation {
        bytes32 anonymousId;
        euint64 encryptedScore;
        euint32 encryptedReviewCount;
        bool isActive;
        uint256 joinedAt;
    }

    // Review structure
    struct Review {
        address reviewer;
        address reviewee;
        euint32 encryptedRating;
        bytes32 encryptedComment;
        uint256 timestamp;
    }

    // State variables
    mapping(address => UserReputation) public reputations;
    mapping(address => bool) public isEnrolled;
    mapping(address => Review[]) public userReviews;
    uint256 public totalEnrolledUsers;
    address public owner;

    // Events
    event UserEnrolled(address indexed user, bytes32 anonymousId);
    event ReviewSubmitted(address indexed reviewer, address indexed reviewee);
    event ReputationUpdated(address indexed user);
    event UserDeactivated(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Enroll in the reputation system with anonymous identity
     * @param _anonymousId User's anonymous identifier
     * @param _initialScore Encrypted initial reputation score
     * @param _scoreProof Proof for initial score encryption
     */
    function enrollUser(
        bytes32 _anonymousId,
        externalEuint64 _initialScore,
        bytes calldata _scoreProof
    ) external {
        require(!isEnrolled[msg.sender], "PrivateReputation: Already enrolled");
        require(_anonymousId != bytes32(0), "PrivateReputation: Invalid anonymous ID");

        // Convert external encrypted score
        euint64 score = FHE.fromExternal(_initialScore, _scoreProof);

        // Create reputation profile
        UserReputation storage reputation = reputations[msg.sender];
        reputation.anonymousId = _anonymousId;
        reputation.encryptedScore = score;
        reputation.encryptedReviewCount = FHE.asEuint32(0);
        reputation.isActive = true;
        reputation.joinedAt = block.timestamp;

        // Grant permissions
        FHE.allowThis(reputation.encryptedScore);
        FHE.allow(reputation.encryptedScore, msg.sender);
        FHE.allowThis(reputation.encryptedReviewCount);
        FHE.allow(reputation.encryptedReviewCount, msg.sender);

        isEnrolled[msg.sender] = true;
        totalEnrolledUsers++;

        emit UserEnrolled(msg.sender, _anonymousId);
    }

    /**
     * @dev Submit an encrypted review for a user
     * @param _reviewee Address of the user being reviewed
     * @param _encryptedRating Encrypted rating (1-5 scale typically)
     * @param _ratingProof Proof for rating encryption
     * @param _encryptedComment Encrypted review comment
     */
    function submitReview(
        address _reviewee,
        externalEuint32 _encryptedRating,
        bytes calldata _ratingProof,
        bytes32 _encryptedComment
    ) external {
        require(isEnrolled[msg.sender], "PrivateReputation: Not enrolled");
        require(isEnrolled[_reviewee], "PrivateReputation: Reviewee not enrolled");
        require(msg.sender != _reviewee, "PrivateReputation: Cannot review yourself");
        require(reputations[msg.sender].isActive, "PrivateReputation: Your account inactive");
        require(reputations[_reviewee].isActive, "PrivateReputation: Reviewee account inactive");

        euint32 rating = FHE.fromExternal(_encryptedRating, _ratingProof);

        // Record review
        Review memory review = Review({
            reviewer: msg.sender,
            reviewee: _reviewee,
            encryptedRating: rating,
            encryptedComment: _encryptedComment,
            timestamp: block.timestamp
        });

        userReviews[_reviewee].push(review);

        // Update reviewee's encrypted score and review count
        UserReputation storage revieweeRep = reputations[_reviewee];
        revieweeRep.encryptedScore = FHE.add(revieweeRep.encryptedScore, FHE.asEuint64(rating));
        revieweeRep.encryptedReviewCount = FHE.add(revieweeRep.encryptedReviewCount, FHE.asEuint32(1));

        // Grant permissions for updated values
        FHE.allowThis(revieweeRep.encryptedScore);
        FHE.allow(revieweeRep.encryptedScore, _reviewee);
        FHE.allowThis(revieweeRep.encryptedReviewCount);
        FHE.allow(revieweeRep.encryptedReviewCount, _reviewee);

        emit ReviewSubmitted(msg.sender, _reviewee);
        emit ReputationUpdated(_reviewee);
    }

    /**
     * @dev Update user's reputation score (bulk update)
     * @param _scoreAdjustment Encrypted score adjustment
     * @param _adjustmentProof Proof for adjustment encryption
     */
    function updateReputationScore(
        externalEuint64 _scoreAdjustment,
        bytes calldata _adjustmentProof
    ) external {
        require(isEnrolled[msg.sender], "PrivateReputation: Not enrolled");
        require(reputations[msg.sender].isActive, "PrivateReputation: Account inactive");

        euint64 adjustment = FHE.fromExternal(_scoreAdjustment, _adjustmentProof);

        UserReputation storage reputation = reputations[msg.sender];
        reputation.encryptedScore = FHE.add(reputation.encryptedScore, adjustment);

        FHE.allowThis(reputation.encryptedScore);
        FHE.allow(reputation.encryptedScore, msg.sender);

        emit ReputationUpdated(msg.sender);
    }

    /**
     * @dev Get encrypted reputation score
     */
    function getEncryptedReputation(address _user) external view returns (euint64) {
        require(isEnrolled[_user], "PrivateReputation: User not enrolled");
        return reputations[_user].encryptedScore;
    }

    /**
     * @dev Get encrypted review count
     */
    function getEncryptedReviewCount(address _user) external view returns (euint32) {
        require(isEnrolled[_user], "PrivateReputation: User not enrolled");
        return reputations[_user].encryptedReviewCount;
    }

    /**
     * @dev Get number of reviews received
     */
    function getReviewCount(address _user) external view returns (uint256) {
        require(isEnrolled[_user], "PrivateReputation: User not enrolled");
        return userReviews[_user].length;
    }

    /**
     * @dev Get public reputation information
     */
    function getPublicReputation(address _user) external view returns (
        bytes32 anonymousId,
        bool isActive,
        uint256 joinedAt
    ) {
        require(isEnrolled[_user], "PrivateReputation: User not enrolled");
        UserReputation storage reputation = reputations[_user];
        return (reputation.anonymousId, reputation.isActive, reputation.joinedAt);
    }

    /**
     * @dev Compare reputation scores (encrypted comparison)
     */
    function compareReputations(address _user1, address _user2) external returns (ebool) {
        require(isEnrolled[_user1] && isEnrolled[_user2], "PrivateReputation: User not enrolled");

        euint64 score1 = reputations[_user1].encryptedScore;
        euint64 score2 = reputations[_user2].encryptedScore;

        // Compare encrypted scores - result is encrypted
        ebool result = FHE.gt(score1, score2);

        FHE.allowThis(result);
        FHE.allow(result, _user1);
        FHE.allow(result, _user2);

        return result;
    }

    /**
     * @dev Deactivate reputation profile
     */
    function deactivateProfile() external {
        require(isEnrolled[msg.sender], "PrivateReputation: Not enrolled");
        reputations[msg.sender].isActive = false;
        emit UserDeactivated(msg.sender);
    }

    /**
     * @dev Get total enrolled users
     */
    function getTotalEnrolledUsers() external view returns (uint256) {
        return totalEnrolledUsers;
    }

    /**
     * @dev Check if user is enrolled and active
     */
    function isUserActive(address _user) external view returns (bool) {
        return isEnrolled[_user] && reputations[_user].isActive;
    }

    /**
     * @dev Emergency deactivation (owner only)
     */
    function emergencyDeactivate(address _user) external {
        require(msg.sender == owner, "PrivateReputation: Only owner");
        require(isEnrolled[_user], "PrivateReputation: User not enrolled");
        reputations[_user].isActive = false;
    }
}
