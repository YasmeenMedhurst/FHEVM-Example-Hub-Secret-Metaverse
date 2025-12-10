import { expect } from "chai";
import hre from "hardhat";
import { EncryptedGaming } from "../../types";

/**
 * EncryptedGaming Test Suite
 *
 * Demonstrates:
 * - Player registration and encrypted game sessions
 * - Confidential score updates using FHE
 * - Hidden game level progression
 * - Encrypted leaderboard tracking
 */

describe("EncryptedGaming", function () {
  let contract: EncryptedGaming;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("EncryptedGaming");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Player Registration", function () {
    it("✓ Should register new player", async function () {
      const player = signers[1];

      const tx = await contract.connect(player).registerPlayer();

      await expect(tx).to.emit(contract, "PlayerRegistered").withArgs(player.address);
      expect(await contract.isPlayerRegistered(player.address)).to.be.true;
    });

    it("✗ Should not allow duplicate registration", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      await expect(
        contract.connect(player).registerPlayer()
      ).to.be.revertedWith("EncryptedGaming: Already registered");
    });
  });

  describe("Game Sessions", function () {
    it("✓ Should start new game session", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const input = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      input.add32(1); // Starting level
      const encrypted = await input.encrypt();

      const tx = await contract.connect(player).startGame(
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "GameStarted").withArgs(player.address, 0);
    });

    it("✓ Should track game sessions", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const input = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      input.add32(1);
      const encrypted = await input.encrypt();

      await contract.connect(player).startGame(
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [sessionPlayer, isActive, startTime] = await contract.getSessionInfo(0);
      expect(sessionPlayer).to.equal(player.address);
      expect(isActive).to.be.true;
      expect(startTime).to.be.gt(0);
    });

    it("✗ Should not allow game start from unregistered player", async function () {
      const player = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      input.add32(1);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(player).startGame(encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("EncryptedGaming: Player not registered");
    });
  });

  describe("Score Updates", function () {
    it("✓ Should update encrypted game score", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      // Update score
      const scoreInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      scoreInput.add64(100); // Score increase
      const scoreEncrypted = await scoreInput.encrypt();

      const tx = await contract.connect(player).updateScore(
        0,
        scoreEncrypted.handles[0],
        scoreEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "ScoreUpdated");
    });

    it("✓ Should encrypt and decrypt score correctly", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      // Update with specific score
      const testScore = 5000;
      const scoreInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      scoreInput.add64(testScore);
      const scoreEncrypted = await scoreInput.encrypt();

      await contract.connect(player).updateScore(
        0,
        scoreEncrypted.handles[0],
        scoreEncrypted.inputProof
      );

      // Decrypt and verify
      const encryptedScore = await contract.getEncryptedScore(0);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedScore, player);
      expect(decrypted).to.equal(testScore);
    });

    it("✗ Should only allow session owner to update score", async function () {
      const player = signers[1];
      const hacker = signers[2];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      // Hacker tries to update
      const scoreInput = hre.fhevm.createEncryptedInput(contractAddress, hacker.address);
      scoreInput.add64(999999);
      const scoreEncrypted = await scoreInput.encrypt();

      await expect(
        contract.connect(hacker).updateScore(
          0,
          scoreEncrypted.handles[0],
          scoreEncrypted.inputProof
        )
      ).to.be.revertedWith("EncryptedGaming: Not session owner");
    });
  });

  describe("Level Progression", function () {
    it("✓ Should increase encrypted level", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      // Level up
      const increaseInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      increaseInput.add32(1); // Level increase
      const increaseEncrypted = await increaseInput.encrypt();

      const tx = await contract.connect(player).levelUp(
        0,
        increaseEncrypted.handles[0],
        increaseEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "ScoreUpdated");
    });

    it("✓ Should decrypt encrypted level", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const initialLevel = 5;
      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(initialLevel);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      const encryptedLevel = await contract.getEncryptedLevel(0);
      const decrypted = await hre.fhevm.userDecryptEuint32(contractAddress, encryptedLevel, player);
      expect(decrypted).to.equal(initialLevel);
    });
  });

  describe("Game Completion", function () {
    it("✓ Should end game session", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      const tx = await contract.connect(player).endGame(0);

      await expect(tx).to.emit(contract, "GameEnded");
    });

    it("✓ Should increment games won", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      await contract.connect(player).endGame(0);

      const [gamesPlayed, gamesWon] = await contract.getPlayerStats(player.address);
      expect(gamesPlayed).to.equal(1);
      expect(gamesWon).to.equal(1);
    });
  });

  describe("Player Statistics", function () {
    it("✓ Should track player statistics", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const [gamesPlayed, gamesWon, isRegistered] = await contract.getPlayerStats(player.address);
      expect(gamesPlayed).to.equal(0);
      expect(gamesWon).to.equal(0);
      expect(isRegistered).to.be.true;
    });

    it("✓ Should get encrypted total score", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      const testScore = 1000;
      const scoreInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      scoreInput.add64(testScore);
      const scoreEncrypted = await scoreInput.encrypt();

      await contract.connect(player).updateScore(
        0,
        scoreEncrypted.handles[0],
        scoreEncrypted.inputProof
      );

      const totalScore = await contract.getEncryptedTotalScore(player.address);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, totalScore, player);
      expect(decrypted).to.equal(testScore);
    });
  });

  describe("Leaderboard", function () {
    it("✓ Should track encrypted leaderboard score", async function () {
      const player = signers[1];

      await contract.connect(player).registerPlayer();

      const levelInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      levelInput.add32(1);
      const levelEncrypted = await levelInput.encrypt();

      await contract.connect(player).startGame(
        levelEncrypted.handles[0],
        levelEncrypted.inputProof
      );

      const scoreInput = hre.fhevm.createEncryptedInput(contractAddress, player.address);
      scoreInput.add64(500);
      const scoreEncrypted = await scoreInput.encrypt();

      await contract.connect(player).updateScore(
        0,
        scoreEncrypted.handles[0],
        scoreEncrypted.inputProof
      );

      const leaderboardScore = await contract.getEncryptedLeaderboardScore();
      expect(leaderboardScore).to.not.be.undefined;
    });
  });
});
