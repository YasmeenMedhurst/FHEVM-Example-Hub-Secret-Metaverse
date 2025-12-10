import { expect } from "chai";
import hre from "hardhat";
import { EncryptedIdentity } from "../../types";

/**
 * EncryptedIdentity Test Suite
 *
 * This test suite demonstrates:
 * - How to register encrypted identities with FHE
 * - Proper encryption binding and permission management
 * - FHE operations on encrypted attributes
 * - Common pitfalls in identity management
 */

describe("EncryptedIdentity", function () {
  let contract: EncryptedIdentity;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    // Check if we're in mock FHEVM environment
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected. Please run with FHEVM mock.");
    }

    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    // Deploy fresh contract instance
    const EncryptedIdentityFactory = await hre.ethers.getContractFactory("EncryptedIdentity");
    contract = await EncryptedIdentityFactory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Identity Registration", function () {
    it("✓ Should successfully register a new identity with encrypted age", async function () {
      const handle = hre.ethers.id("anonymous_user_001");
      const signer = signers[1];

      // Create encrypted input
      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(25); // Age = 25
      const encrypted = await input.encrypt();

      // Register identity
      const tx = await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "IdentityCreated").withArgs(signer.address, handle);

      // Verify registration
      expect(await contract.isRegistered(signer.address)).to.be.true;
      expect(await contract.getTotalUsers()).to.equal(1);
    });

    it("✓ Should encrypt age attribute correctly", async function () {
      const handle = hre.ethers.id("user_with_age");
      const signer = signers[1];
      const testAge = 42;

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(testAge);
      const encrypted = await input.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Get encrypted age
      const encryptedAge = await contract.getEncryptedAge(signer.address);

      // Decrypt and verify
      const decrypted = await hre.fhevm.userDecryptEuint32(contractAddress, encryptedAge, signer);
      expect(decrypted).to.equal(testAge);
    });

    it("✗ Should reject duplicate registration", async function () {
      const handle = hre.ethers.id("duplicate_user");
      const signer = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(30);
      const encrypted = await input.encrypt();

      // Register once
      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Try to register again
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input2.add32(31);
      const encrypted2 = await input2.encrypt();

      await expect(
        contract.connect(signer).registerIdentity(
          handle,
          encrypted2.handles[0],
          encrypted2.inputProof
        )
      ).to.be.revertedWith("EncryptedIdentity: Already registered");
    });

    it("✗ Should reject invalid anonymous handle", async function () {
      const signer = signers[1];
      const invalidHandle = hre.ethers.zeroPadValue("0x00", 32);

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(25);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(signer).registerIdentity(
          invalidHandle,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("EncryptedIdentity: Invalid handle");
    });
  });

  describe("Age Updates", function () {
    it("✓ Should successfully update encrypted age", async function () {
      const handle = hre.ethers.id("age_update_user");
      const signer = signers[1];
      const initialAge = 20;
      const newAge = 21;

      // Register
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input1.add32(initialAge);
      const encrypted1 = await input1.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Update age
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input2.add32(newAge);
      const encrypted2 = await input2.encrypt();

      const tx = await contract.connect(signer).updateAge(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      await expect(tx).to.emit(contract, "AgeUpdated").withArgs(signer.address);

      // Verify new age
      const encryptedAge = await contract.getEncryptedAge(signer.address);
      const decrypted = await hre.fhevm.userDecryptEuint32(contractAddress, encryptedAge, signer);
      expect(decrypted).to.equal(newAge);
    });

    it("✗ Should reject age update from unregistered user", async function () {
      const signer = signers[2];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(30);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(signer).updateAge(encrypted.handles[0], encrypted.inputProof)
      ).to.be.revertedWith("EncryptedIdentity: Not registered");
    });
  });

  describe("Reputation System", function () {
    it("✓ Should update encrypted reputation score", async function () {
      const handle = hre.ethers.id("reputation_user");
      const signer = signers[1];

      // Register
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input1.add32(25);
      const encrypted1 = await input1.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Update reputation
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input2.add64(100); // Reputation increase
      const encrypted2 = await input2.encrypt();

      const tx = await contract.connect(signer).updateReputation(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      await expect(tx).to.emit(contract, "ReputationUpdated").withArgs(signer.address);
    });

    it("✓ Should encrypt and decrypt reputation correctly", async function () {
      const handle = hre.ethers.id("rep_decrypt_user");
      const signer = signers[1];

      // Register
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input1.add32(25);
      const encrypted1 = await input1.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Update reputation with specific value
      const testReputation = 500;
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input2.add64(testReputation);
      const encrypted2 = await input2.encrypt();

      await contract.connect(signer).updateReputation(
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      // Decrypt and verify
      const encryptedRep = await contract.getEncryptedReputation(signer.address);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedRep, signer);
      expect(decrypted).to.equal(testReputation);
    });
  });

  describe("Age Comparison", function () {
    it("✓ Should compare encrypted ages correctly", async function () {
      const signer1 = signers[1];
      const signer2 = signers[2];

      // Register user 1 with age 25
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, signer1.address);
      input1.add32(25);
      const encrypted1 = await input1.encrypt();

      await contract.connect(signer1).registerIdentity(
        hre.ethers.id("user_25"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Register user 2 with age 30
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signer2.address);
      input2.add32(30);
      const encrypted2 = await input2.encrypt();

      await contract.connect(signer2).registerIdentity(
        hre.ethers.id("user_30"),
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      // Compare ages (user2 > user1 should be true)
      const result = await contract.compareAges(signer2.address, signer1.address);

      // Decrypt result
      const decrypted = await hre.fhevm.userDecryptEbool(contractAddress, result, signer1);
      expect(decrypted).to.be.true;
    });
  });

  describe("Public Information", function () {
    it("✓ Should return public identity information", async function () {
      const handle = hre.ethers.id("public_info_user");
      const signer = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(28);
      const encrypted = await input.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const [returnedHandle, isActive, registrationTime] =
        await contract.getPublicIdentity(signer.address);

      expect(returnedHandle).to.equal(handle);
      expect(isActive).to.be.true;
      expect(registrationTime).to.be.gt(0);
    });

    it("✓ Should check if identity is active", async function () {
      const handle = hre.ethers.id("active_user");
      const signer = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(25);
      const encrypted = await input.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      expect(await contract.isIdentityActive(signer.address)).to.be.true;
    });
  });

  describe("Identity Deactivation", function () {
    it("✓ Should deactivate identity", async function () {
      const handle = hre.ethers.id("deactivate_user");
      const signer = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(25);
      const encrypted = await input.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await contract.connect(signer).deactivateIdentity();

      expect(await contract.isIdentityActive(signer.address)).to.be.false;
    });

    it("✓ Owner can emergency deactivate", async function () {
      const handle = hre.ethers.id("emergency_user");
      const signer = signers[1];
      const owner = signers[0];

      const input = hre.fhevm.createEncryptedInput(contractAddress, signer.address);
      input.add32(25);
      const encrypted = await input.encrypt();

      await contract.connect(signer).registerIdentity(
        handle,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await contract.connect(owner).emergencyDeactivateIdentity(signer.address);

      expect(await contract.isIdentityActive(signer.address)).to.be.false;
    });
  });

  describe("Total User Count", function () {
    it("✓ Should track total registered users", async function () {
      const owner = signers[0];
      expect(await contract.getTotalUsers()).to.equal(0);

      // Register first user
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, signers[1].address);
      input1.add32(25);
      const encrypted1 = await input1.encrypt();

      await contract.connect(signers[1]).registerIdentity(
        hre.ethers.id("user1"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      expect(await contract.getTotalUsers()).to.equal(1);

      // Register second user
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, signers[2].address);
      input2.add32(30);
      const encrypted2 = await input2.encrypt();

      await contract.connect(signers[2]).registerIdentity(
        hre.ethers.id("user2"),
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      expect(await contract.getTotalUsers()).to.equal(2);
    });
  });
});
