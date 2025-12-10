import { expect } from "chai";
import hre from "hardhat";
import { PrivateReputation } from "../../types";

/**
 * PrivateReputation Test Suite
 *
 * Demonstrates:
 * - Anonymous user enrollment with encrypted reputation
 * - Confidential review submission and processing
 * - FHE-based reputation score updates
 * - Privacy-preserving reputation comparisons
 */

describe("PrivateReputation", function () {
  let contract: PrivateReputation;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("PrivateReputation");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("User Enrollment", function () {
    it("✓ Should enroll user with encrypted reputation", async function () {
      const user = signers[1];
      const anonymousId = hre.ethers.id("anon_user_001");

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(100); // Initial reputation score
      const encrypted = await input.encrypt();

      const tx = await contract.connect(user).enrollUser(
        anonymousId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "UserEnrolled").withArgs(user.address, anonymousId);
      expect(await contract.isEnrolled(user.address)).to.be.true;
    });

    it("✓ Should decrypt enrolled reputation correctly", async function () {
      const user = signers[1];
      const anonymousId = hre.ethers.id("anon_user_002");
      const initialReputation = 250;

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(initialReputation);
      const encrypted = await input.encrypt();

      await contract.connect(user).enrollUser(
        anonymousId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const encryptedRep = await contract.getEncryptedReputation(user.address);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedRep, user);
      expect(decrypted).to.equal(initialReputation);
    });

    it("✗ Should reject duplicate enrollment", async function () {
      const user = signers[1];
      const anonymousId = hre.ethers.id("anon_duplicate");

      const input1 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input1.add64(100);
      const encrypted1 = await input1.encrypt();

      await contract.connect(user).enrollUser(
        anonymousId,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      const input2 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input2.add64(150);
      const encrypted2 = await input2.encrypt();

      await expect(
        contract.connect(user).enrollUser(
          anonymousId,
          encrypted2.handles[0],
          encrypted2.inputProof
        )
      ).to.be.revertedWith("PrivateReputation: Already enrolled");
    });

    it("✗ Should reject invalid anonymous ID", async function () {
      const user = signers[1];
      const invalidId = hre.ethers.zeroPadValue("0x00", 32);

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(100);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(user).enrollUser(
          invalidId,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("PrivateReputation: Invalid anonymous ID");
    });
  });

  describe("Review Submission", function () {
    it("✓ Should submit encrypted review", async function () {
      const reviewer = signers[1];
      const reviewee = signers[2];

      // Enroll both users
      const rev1 = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      rev1.add64(100);
      const revEncrypted = await rev1.encrypt();

      await contract.connect(reviewer).enrollUser(
        hre.ethers.id("reviewer"),
        revEncrypted.handles[0],
        revEncrypted.inputProof
      );

      const re1 = hre.fhevm.createEncryptedInput(contractAddress, reviewee.address);
      re1.add64(100);
      const reEncrypted = await re1.encrypt();

      await contract.connect(reviewee).enrollUser(
        hre.ethers.id("reviewee"),
        reEncrypted.handles[0],
        reEncrypted.inputProof
      );

      // Submit review
      const ratingInput = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      ratingInput.add32(5); // 5-star rating
      const ratingEncrypted = await ratingInput.encrypt();

      const tx = await contract.connect(reviewer).submitReview(
        reviewee.address,
        ratingEncrypted.handles[0],
        ratingEncrypted.inputProof,
        hre.ethers.id("Great seller!") // Encrypted comment
      );

      await expect(tx).to.emit(contract, "ReviewSubmitted");
    });

    it("✓ Should update encrypted reputation from review", async function () {
      const reviewer = signers[1];
      const reviewee = signers[2];

      // Enroll users
      const rev1 = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      rev1.add64(100);
      const revEncrypted = await rev1.encrypt();

      await contract.connect(reviewer).enrollUser(
        hre.ethers.id("reviewer2"),
        revEncrypted.handles[0],
        revEncrypted.inputProof
      );

      const re1 = hre.fhevm.createEncryptedInput(contractAddress, reviewee.address);
      re1.add64(100);
      const reEncrypted = await re1.encrypt();

      await contract.connect(reviewee).enrollUser(
        hre.ethers.id("reviewee2"),
        reEncrypted.handles[0],
        reEncrypted.inputProof
      );

      // Submit review with rating
      const ratingInput = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      ratingInput.add32(4); // 4-star rating
      const ratingEncrypted = await ratingInput.encrypt();

      await contract.connect(reviewer).submitReview(
        reviewee.address,
        ratingEncrypted.handles[0],
        ratingEncrypted.inputProof,
        hre.ethers.id("Good")
      );

      // Check updated reputation
      const updatedRep = await contract.getEncryptedReputation(reviewee.address);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, updatedRep, reviewee);
      expect(decrypted).to.equal(104); // 100 + 4
    });

    it("✗ Should not allow self-review", async function () {
      const user = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(100);
      const encrypted = await input.encrypt();

      await contract.connect(user).enrollUser(
        hre.ethers.id("self_reviewer"),
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Try to review self
      const ratingInput = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      ratingInput.add32(5);
      const ratingEncrypted = await ratingInput.encrypt();

      await expect(
        contract.connect(user).submitReview(
          user.address,
          ratingEncrypted.handles[0],
          ratingEncrypted.inputProof,
          hre.ethers.id("Self")
        )
      ).to.be.revertedWith("PrivateReputation: Cannot review yourself");
    });
  });

  describe("Reputation Updates", function () {
    it("✓ Should update reputation score", async function () {
      const user = signers[1];

      const input1 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input1.add64(100);
      const encrypted1 = await input1.encrypt();

      await contract.connect(user).enrollUser(
        hre.ethers.id("updater"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Update reputation
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input2.add64(50); // Add 50 to reputation
      const encrypted2 = await input2.encrypt();

      const tx = await contract.connect(user).updateReputationScore(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      await expect(tx).to.emit(contract, "ReputationUpdated");
    });

    it("✓ Should decrypt updated reputation correctly", async function () {
      const user = signers[1];

      const input1 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input1.add64(100);
      const encrypted1 = await input1.encrypt();

      await contract.connect(user).enrollUser(
        hre.ethers.id("dec_updater"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      const input2 = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input2.add64(75); // Add 75
      const encrypted2 = await input2.encrypt();

      await contract.connect(user).updateReputationScore(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      const encryptedRep = await contract.getEncryptedReputation(user.address);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedRep, user);
      expect(decrypted).to.equal(175); // 100 + 75
    });
  });

  describe("Reputation Comparison", function () {
    it("✓ Should compare encrypted reputations", async function () {
      const user1 = signers[1];
      const user2 = signers[2];

      // Enroll user 1 with reputation 100
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, user1.address);
      input1.add64(100);
      const encrypted1 = await input1.encrypt();

      await contract.connect(user1).enrollUser(
        hre.ethers.id("user_100"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Enroll user 2 with reputation 150
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, user2.address);
      input2.add64(150);
      const encrypted2 = await input2.encrypt();

      await contract.connect(user2).enrollUser(
        hre.ethers.id("user_150"),
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      // Compare (user2 > user1 should be true)
      const result = await contract.compareReputations(user2.address, user1.address);
      const decrypted = await hre.fhevm.userDecryptEbool(contractAddress, result, user1);
      expect(decrypted).to.be.true;
    });
  });

  describe("Profile Management", function () {
    it("✓ Should deactivate profile", async function () {
      const user = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(100);
      const encrypted = await input.encrypt();

      await contract.connect(user).enrollUser(
        hre.ethers.id("deactivator"),
        encrypted.handles[0],
        encrypted.inputProof
      );

      const tx = await contract.connect(user).deactivateProfile();

      await expect(tx).to.emit(contract, "UserDeactivated");
      expect(await contract.isUserActive(user.address)).to.be.false;
    });

    it("✓ Should get public profile information", async function () {
      const user = signers[1];
      const anonymousId = hre.ethers.id("public_user");

      const input = hre.fhevm.createEncryptedInput(contractAddress, user.address);
      input.add64(100);
      const encrypted = await input.encrypt();

      await contract.connect(user).enrollUser(
        anonymousId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [returnedId, isActive, joinedAt] = await contract.getPublicReputation(user.address);

      expect(returnedId).to.equal(anonymousId);
      expect(isActive).to.be.true;
      expect(joinedAt).to.be.gt(0);
    });
  });

  describe("Statistics", function () {
    it("✓ Should track total enrolled users", async function () {
      expect(await contract.getTotalEnrolledUsers()).to.equal(0);

      const user1 = signers[1];
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, user1.address);
      input1.add64(100);
      const encrypted1 = await input1.encrypt();

      await contract.connect(user1).enrollUser(
        hre.ethers.id("first_user"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      expect(await contract.getTotalEnrolledUsers()).to.equal(1);

      const user2 = signers[2];
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, user2.address);
      input2.add64(150);
      const encrypted2 = await input2.encrypt();

      await contract.connect(user2).enrollUser(
        hre.ethers.id("second_user"),
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      expect(await contract.getTotalEnrolledUsers()).to.equal(2);
    });

    it("✓ Should get encrypted review count", async function () {
      const reviewer = signers[1];
      const reviewee = signers[2];

      // Enroll users
      const rev1 = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      rev1.add64(100);
      const revEncrypted = await rev1.encrypt();

      await contract.connect(reviewer).enrollUser(
        hre.ethers.id("rev3"),
        revEncrypted.handles[0],
        revEncrypted.inputProof
      );

      const re1 = hre.fhevm.createEncryptedInput(contractAddress, reviewee.address);
      re1.add64(100);
      const reEncrypted = await re1.encrypt();

      await contract.connect(reviewee).enrollUser(
        hre.ethers.id("ree3"),
        reEncrypted.handles[0],
        reEncrypted.inputProof
      );

      // Submit review
      const ratingInput = hre.fhevm.createEncryptedInput(contractAddress, reviewer.address);
      ratingInput.add32(5);
      const ratingEncrypted = await ratingInput.encrypt();

      await contract.connect(reviewer).submitReview(
        reviewee.address,
        ratingEncrypted.handles[0],
        ratingEncrypted.inputProof,
        hre.ethers.id("review")
      );

      // Check count
      const encryptedCount = await contract.getEncryptedReviewCount(reviewee.address);
      const decrypted = await hre.fhevm.userDecryptEuint32(contractAddress, encryptedCount, reviewee);
      expect(decrypted).to.equal(1);
    });
  });
});
