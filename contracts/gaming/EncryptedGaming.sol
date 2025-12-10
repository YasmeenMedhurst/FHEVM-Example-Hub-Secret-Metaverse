// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint32, euint64, externalEuint32, externalEuint64} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedGaming
 * @dev A confidential gaming contract with encrypted game state
 * @notice This contract demonstrates FHE-based game mechanics with hidden information
 */
contract EncryptedGaming is ZamaEthereumConfig {

    // Game session structure
    struct GameSession {
        address player;
        euint64 encryptedScore;
        euint32 encryptedLevel;
        bool isActive;
        uint256 startTime;
        uint256 lastAction;
    }

    // Player statistics structure
    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
        euint64 totalEncryptedScore;
        bool isRegistered;
    }

    // State variables
    mapping(address => PlayerStats) public playerStats;
    mapping(uint256 => GameSession) public gameSessions;
    uint256 public totalSessions;
    euint64 public encryptedLeaderboardScore;
    address public owner;

    // Events
    event GameStarted(address indexed player, uint256 indexed sessionId);
    event ScoreUpdated(address indexed player, uint256 indexed sessionId);
    event GameEnded(address indexed player, uint256 indexed sessionId);
    event PlayerRegistered(address indexed player);

    constructor() {
        owner = msg.sender;
        encryptedLeaderboardScore = FHE.asEuint64(0);
        FHE.allowThis(encryptedLeaderboardScore);
    }

    /**
     * @dev Register a new player
     */
    function registerPlayer() external {
        require(!playerStats[msg.sender].isRegistered, "EncryptedGaming: Already registered");

        PlayerStats storage stats = playerStats[msg.sender];
        stats.gamesPlayed = 0;
        stats.gamesWon = 0;
        stats.totalEncryptedScore = FHE.asEuint64(0);
        stats.isRegistered = true;

        FHE.allowThis(stats.totalEncryptedScore);

        emit PlayerRegistered(msg.sender);
    }

    /**
     * @dev Start a new game session with encrypted initial state
     * @param _encryptedStartingLevel Encrypted starting game level
     * @param _levelProof Proof for level encryption
     */
    function startGame(
        externalEuint32 _encryptedStartingLevel,
        bytes calldata _levelProof
    ) external {
        require(playerStats[msg.sender].isRegistered, "EncryptedGaming: Player not registered");

        euint32 level = FHE.fromExternal(_encryptedStartingLevel, _levelProof);

        // Create new game session
        GameSession storage session = gameSessions[totalSessions];
        session.player = msg.sender;
        session.encryptedScore = FHE.asEuint64(0);
        session.encryptedLevel = level;
        session.isActive = true;
        session.startTime = block.timestamp;
        session.lastAction = block.timestamp;

        // Grant permissions
        FHE.allowThis(session.encryptedScore);
        FHE.allow(session.encryptedScore, msg.sender);
        FHE.allowThis(session.encryptedLevel);
        FHE.allow(session.encryptedLevel, msg.sender);

        // Update player stats
        playerStats[msg.sender].gamesPlayed++;

        emit GameStarted(msg.sender, totalSessions);
        totalSessions++;
    }

    /**
     * @dev Update game score with encrypted value (confidential gameplay)
     * @param _sessionId Game session ID
     * @param _encryptedScoreDelta Encrypted score change
     * @param _deltaProof Proof for score change encryption
     */
    function updateScore(
        uint256 _sessionId,
        externalEuint64 _encryptedScoreDelta,
        bytes calldata _deltaProof
    ) external {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        require(gameSessions[_sessionId].player == msg.sender, "EncryptedGaming: Not session owner");
        require(gameSessions[_sessionId].isActive, "EncryptedGaming: Session not active");

        euint64 scoreDelta = FHE.fromExternal(_encryptedScoreDelta, _deltaProof);

        GameSession storage session = gameSessions[_sessionId];

        // Update encrypted score using FHE arithmetic
        session.encryptedScore = FHE.add(session.encryptedScore, scoreDelta);
        session.lastAction = block.timestamp;

        // Update total player score
        playerStats[msg.sender].totalEncryptedScore =
            FHE.add(playerStats[msg.sender].totalEncryptedScore, scoreDelta);

        // Update leaderboard score
        encryptedLeaderboardScore = FHE.add(encryptedLeaderboardScore, scoreDelta);

        // Grant permissions
        FHE.allowThis(session.encryptedScore);
        FHE.allow(session.encryptedScore, msg.sender);
        FHE.allowThis(playerStats[msg.sender].totalEncryptedScore);
        FHE.allow(playerStats[msg.sender].totalEncryptedScore, msg.sender);
        FHE.allowThis(encryptedLeaderboardScore);

        emit ScoreUpdated(msg.sender, _sessionId);
    }

    /**
     * @dev Increase encrypted level (progression system)
     * @param _sessionId Game session ID
     * @param _encryptedLevelIncrease Encrypted level increase
     * @param _increaseProof Proof for level increase
     */
    function levelUp(
        uint256 _sessionId,
        externalEuint32 _encryptedLevelIncrease,
        bytes calldata _increaseProof
    ) external {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        require(gameSessions[_sessionId].player == msg.sender, "EncryptedGaming: Not session owner");
        require(gameSessions[_sessionId].isActive, "EncryptedGaming: Session not active");

        euint32 levelIncrease = FHE.fromExternal(_encryptedLevelIncrease, _increaseProof);

        GameSession storage session = gameSessions[_sessionId];
        session.encryptedLevel = FHE.add(session.encryptedLevel, levelIncrease);
        session.lastAction = block.timestamp;

        FHE.allowThis(session.encryptedLevel);
        FHE.allow(session.encryptedLevel, msg.sender);

        emit ScoreUpdated(msg.sender, _sessionId);
    }

    /**
     * @dev End the current game session
     * @param _sessionId Game session ID to end
     */
    function endGame(uint256 _sessionId) external {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        require(gameSessions[_sessionId].player == msg.sender, "EncryptedGaming: Not session owner");
        require(gameSessions[_sessionId].isActive, "EncryptedGaming: Session already ended");

        GameSession storage session = gameSessions[_sessionId];
        session.isActive = false;

        // Update wins (assuming any score > 0 is a win)
        playerStats[msg.sender].gamesWon++;

        emit GameEnded(msg.sender, _sessionId);
    }

    /**
     * @dev Get encrypted game score
     */
    function getEncryptedScore(uint256 _sessionId) external view returns (euint64) {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        require(gameSessions[_sessionId].player == msg.sender, "EncryptedGaming: Not session owner");
        return gameSessions[_sessionId].encryptedScore;
    }

    /**
     * @dev Get encrypted game level
     */
    function getEncryptedLevel(uint256 _sessionId) external view returns (euint32) {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        require(gameSessions[_sessionId].player == msg.sender, "EncryptedGaming: Not session owner");
        return gameSessions[_sessionId].encryptedLevel;
    }

    /**
     * @dev Get player statistics (public data)
     */
    function getPlayerStats(address _player) external view returns (
        uint256 gamesPlayed,
        uint256 gamesWon,
        bool isRegistered
    ) {
        PlayerStats storage stats = playerStats[_player];
        return (stats.gamesPlayed, stats.gamesWon, stats.isRegistered);
    }

    /**
     * @dev Get encrypted total score for a player
     */
    function getEncryptedTotalScore(address _player) external view returns (euint64) {
        require(playerStats[_player].isRegistered, "EncryptedGaming: Player not registered");
        return playerStats[_player].totalEncryptedScore;
    }

    /**
     * @dev Get encrypted leaderboard top score
     */
    function getEncryptedLeaderboardScore() external view returns (euint64) {
        return encryptedLeaderboardScore;
    }

    /**
     * @dev Get session information (public data only)
     */
    function getSessionInfo(uint256 _sessionId) external view returns (
        address player,
        bool isActive,
        uint256 startTime,
        uint256 lastAction
    ) {
        require(_sessionId < totalSessions, "EncryptedGaming: Invalid session");
        GameSession storage session = gameSessions[_sessionId];
        return (session.player, session.isActive, session.startTime, session.lastAction);
    }

    /**
     * @dev Check if player is registered
     */
    function isPlayerRegistered(address _player) external view returns (bool) {
        return playerStats[_player].isRegistered;
    }
}
