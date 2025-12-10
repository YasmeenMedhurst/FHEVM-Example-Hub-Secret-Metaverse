// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, ebool, externalEuint32, externalEuint64, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedIdentity
 * @dev A privacy-preserving identity management contract using FHE
 * @notice This contract demonstrates how to manage user identities with encrypted attributes
 */
contract EncryptedIdentity is ZamaEthereumConfig {

    // User identity structure with encrypted attributes
    struct UserIdentity {
        bytes32 anonymousHandle;
        euint32 encryptedAge;
        euint64 encryptedReputation;
        bool isActive;
        uint256 registrationTime;
    }

    // State variables
    mapping(address => UserIdentity) public userIdentities;
    mapping(address => bool) public isRegistered;
    uint256 public totalUsers;
    address public owner;

    // Events
    event IdentityCreated(address indexed user, bytes32 handle);
    event IdentityVerified(address indexed user);
    event AgeUpdated(address indexed user);
    event ReputationUpdated(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a new encrypted identity
     * @param _handle Anonymous user handle
     * @param _encryptedAge Encrypted age value
     * @param _ageProof Proof for age encryption
     */
    function registerIdentity(
        bytes32 _handle,
        externalEuint32 _encryptedAge,
        bytes calldata _ageProof
    ) external {
        require(!isRegistered[msg.sender], "EncryptedIdentity: Already registered");
        require(_handle != bytes32(0), "EncryptedIdentity: Invalid handle");

        // Convert external encrypted input
        euint32 age = FHE.fromExternal(_encryptedAge, _ageProof);

        // Create identity with encrypted attributes
        UserIdentity storage identity = userIdentities[msg.sender];
        identity.anonymousHandle = _handle;
        identity.encryptedAge = age;
        identity.encryptedReputation = FHE.asEuint64(0);
        identity.isActive = true;
        identity.registrationTime = block.timestamp;

        // Grant permissions
        FHE.allowThis(identity.encryptedAge);
        FHE.allow(identity.encryptedAge, msg.sender);

        isRegistered[msg.sender] = true;
        totalUsers++;

        emit IdentityCreated(msg.sender, _handle);
    }

    /**
     * @dev Update user's encrypted age (privacy-preserving)
     * @param _newAge Encrypted new age value
     * @param _ageProof Proof for age encryption
     */
    function updateAge(
        externalEuint32 _newAge,
        bytes calldata _ageProof
    ) external {
        require(isRegistered[msg.sender], "EncryptedIdentity: Not registered");

        euint32 newAge = FHE.fromExternal(_newAge, _ageProof);
        userIdentities[msg.sender].encryptedAge = newAge;

        FHE.allowThis(newAge);
        FHE.allow(newAge, msg.sender);

        emit AgeUpdated(msg.sender);
    }

    /**
     * @dev Update encrypted reputation score
     * @param _reputationDelta Encrypted reputation change
     * @param _deltaProof Proof for reputation change
     */
    function updateReputation(
        externalEuint64 _reputationDelta,
        bytes calldata _deltaProof
    ) external {
        require(isRegistered[msg.sender], "EncryptedIdentity: Not registered");

        euint64 delta = FHE.fromExternal(_reputationDelta, _deltaProof);
        UserIdentity storage identity = userIdentities[msg.sender];

        // Update encrypted reputation using FHE addition
        identity.encryptedReputation = FHE.add(identity.encryptedReputation, delta);

        FHE.allowThis(identity.encryptedReputation);
        FHE.allow(identity.encryptedReputation, msg.sender);

        emit ReputationUpdated(msg.sender);
    }

    /**
     * @dev Get user's encrypted age (only accessible by user)
     */
    function getEncryptedAge(address _user) external view returns (euint32) {
        require(isRegistered[_user], "EncryptedIdentity: User not registered");
        return userIdentities[_user].encryptedAge;
    }

    /**
     * @dev Get user's encrypted reputation
     */
    function getEncryptedReputation(address _user) external view returns (euint64) {
        require(isRegistered[_user], "EncryptedIdentity: User not registered");
        return userIdentities[_user].encryptedReputation;
    }

    /**
     * @dev Get user's public identity information
     */
    function getPublicIdentity(address _user) external view returns (
        bytes32 handle,
        bool isActive,
        uint256 registrationTime
    ) {
        require(isRegistered[_user], "EncryptedIdentity: User not registered");
        UserIdentity storage identity = userIdentities[_user];
        return (identity.anonymousHandle, identity.isActive, identity.registrationTime);
    }

    /**
     * @dev Verify user identity is active
     */
    function isIdentityActive(address _user) external view returns (bool) {
        return isRegistered[_user] && userIdentities[_user].isActive;
    }

    /**
     * @dev Deactivate identity (only owner or user)
     */
    function deactivateIdentity() external {
        require(isRegistered[msg.sender], "EncryptedIdentity: Not registered");
        userIdentities[msg.sender].isActive = false;
    }

    /**
     * @dev Get total registered users
     */
    function getTotalUsers() external view returns (uint256) {
        return totalUsers;
    }

    /**
     * @dev Compare encrypted ages (result remains encrypted)
     */
    function compareAges(address _user1, address _user2) external returns (ebool) {
        require(isRegistered[_user1], "EncryptedIdentity: User1 not registered");
        require(isRegistered[_user2], "EncryptedIdentity: User2 not registered");

        euint32 age1 = userIdentities[_user1].encryptedAge;
        euint32 age2 = userIdentities[_user2].encryptedAge;

        // Compare encrypted values - result is encrypted
        ebool result = FHE.gt(age1, age2);

        FHE.allowThis(result);
        FHE.allow(result, _user1);
        FHE.allow(result, _user2);

        return result;
    }

    /**
     * @dev Emergency identity recovery (owner only)
     */
    function emergencyDeactivateIdentity(address _user) external {
        require(msg.sender == owner, "EncryptedIdentity: Only owner");
        require(isRegistered[_user], "EncryptedIdentity: User not registered");
        userIdentities[_user].isActive = false;
    }
}
