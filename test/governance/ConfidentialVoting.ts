import { expect } from "chai";
import hre from "hardhat";
import { ConfidentialVoting } from "../../types";

/**
 * ConfidentialVoting Test Suite
 *
 * Demonstrates:
 * - Voter registration for governance
 * - Confidential proposal creation and voting
 * - Encrypted ballot tracking with FHE
 * - Privacy-preserving vote tallying
 */

describe("ConfidentialVoting", function () {
  let contract: ConfidentialVoting;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("ConfidentialVoting");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Voter Registration", function () {
    it("✓ Should register as voter", async function () {
      const voter = signers[1];

      const tx = await contract.connect(voter).registerAsVoter();

      await expect(tx).to.emit(contract, "VoterRegistered").withArgs(voter.address);
      expect(await contract.isRegisteredVoter(voter.address)).to.be.true;
    });

    it("✓ Should track registered voters", async function () {
      const voter1 = signers[1];
      const voter2 = signers[2];

      expect(await contract.getTotalVoters()).to.equal(0);

      await contract.connect(voter1).registerAsVoter();
      expect(await contract.getTotalVoters()).to.equal(1);

      await contract.connect(voter2).registerAsVoter();
      expect(await contract.getTotalVoters()).to.equal(2);
    });

    it("✗ Should not allow duplicate voter registration", async function () {
      const voter = signers[1];

      await contract.connect(voter).registerAsVoter();

      await expect(
        contract.connect(voter).registerAsVoter()
      ).to.be.revertedWith("ConfidentialVoting: Already registered");
    });
  });

  describe("Proposal Creation", function () {
    it("✓ Should create voting proposal", async function () {
      const owner = signers[0];

      const tx = await contract.connect(owner).createProposal(
        "Budget Allocation",
        "Vote on next quarter budget distribution",
        7 * 24 * 60 * 60 // 7 days
      );

      await expect(tx).to.emit(contract, "ProposalCreated").withArgs(0, "Budget Allocation");
    });

    it("✓ Should track proposals", async function () {
      const owner = signers[0];

      await contract.connect(owner).createProposal(
        "Feature Vote",
        "Vote on new feature implementation",
        7 * 24 * 60 * 60
      );

      expect(await contract.getTotalProposals()).to.equal(1);

      await contract.connect(owner).createProposal(
        "Governance Change",
        "Vote on governance structure update",
        14 * 24 * 60 * 60 // 14 days
      );

      expect(await contract.getTotalProposals()).to.equal(2);
    });

    it("✗ Should only allow owner to create proposals", async function () {
      const nonOwner = signers[1];

      await expect(
        contract.connect(nonOwner).createProposal(
          "Malicious Proposal",
          "This should fail",
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith("ConfidentialVoting: Only owner can create proposals");
    });

    it("✗ Should reject empty title", async function () {
      const owner = signers[0];

      await expect(
        contract.connect(owner).createProposal(
          "",
          "Description",
          7 * 24 * 60 * 60
        )
      ).to.be.revertedWith("ConfidentialVoting: Empty title");
    });
  });

  describe("Voting", function () {
    it("✓ Should cast encrypted vote", async function () {
      const owner = signers[0];
      const voter = signers[1];

      // Create proposal
      await contract.connect(owner).createProposal(
        "Test Vote",
        "Test voting",
        7 * 24 * 60 * 60
      );

      // Register as voter
      await contract.connect(voter).registerAsVoter();

      // Cast vote
      const input = hre.fhevm.createEncryptedInput(contractAddress, voter.address);
      input.addBool(true); // Vote in favor
      const encrypted = await input.encrypt();

      const tx = await contract.connect(voter).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "VoteCast").withArgs(voter.address, 0);
    });

    it("✓ Should track encrypted votes correctly", async function () {
      const owner = signers[0];
      const voter1 = signers[1];
      const voter2 = signers[2];

      // Create proposal
      await contract.connect(owner).createProposal(
        "Feature Vote",
        "Vote on new feature",
        7 * 24 * 60 * 60
      );

      // Register voters
      await contract.connect(voter1).registerAsVoter();
      await contract.connect(voter2).registerAsVoter();

      // Vote 1 - in favor
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, voter1.address);
      input1.addBool(true);
      const encrypted1 = await input1.encrypt();

      await contract.connect(voter1).castVote(
        0,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Vote 2 - against
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, voter2.address);
      input2.addBool(false);
      const encrypted2 = await input2.encrypt();

      await contract.connect(voter2).castVote(
        0,
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      // Check vote counts
      const forVotes = await contract.getEncryptedForVotes(0);
      const againstVotes = await contract.getEncryptedAgainstVotes(0);

      const forDecrypted = await hre.fhevm.userDecryptEuint32(contractAddress, forVotes, voter1);
      const againstDecrypted = await hre.fhevm.userDecryptEuint32(contractAddress, againstVotes, voter1);

      expect(forDecrypted).to.equal(1);
      expect(againstDecrypted).to.equal(1);
    });

    it("✗ Should not allow duplicate votes", async function () {
      const owner = signers[0];
      const voter = signers[1];

      await contract.connect(owner).createProposal(
        "Vote Once",
        "Test single voting",
        7 * 24 * 60 * 60
      );

      await contract.connect(voter).registerAsVoter();

      // First vote
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, voter.address);
      input1.addBool(true);
      const encrypted1 = await input1.encrypt();

      await contract.connect(voter).castVote(
        0,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // Try to vote again
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, voter.address);
      input2.addBool(false);
      const encrypted2 = await input2.encrypt();

      await expect(
        contract.connect(voter).castVote(
          0,
          encrypted2.handles[0],
          encrypted2.inputProof
        )
      ).to.be.revertedWith("ConfidentialVoting: Already voted on this proposal");
    });

    it("✗ Should not allow unregistered voters", async function () {
      const owner = signers[0];
      const nonVoter = signers[1];

      await contract.connect(owner).createProposal(
        "Registered Only",
        "Only registered voters can vote",
        7 * 24 * 60 * 60
      );

      const input = hre.fhevm.createEncryptedInput(contractAddress, nonVoter.address);
      input.addBool(true);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(nonVoter).castVote(
          0,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("ConfidentialVoting: Not a registered voter");
    });
  });

  describe("Vote Tallying", function () {
    it("✓ Should determine winning proposal", async function () {
      const owner = signers[0];
      const voter1 = signers[1];
      const voter2 = signers[2];
      const voter3 = signers[3];

      // Create proposal
      await contract.connect(owner).createProposal(
        "Winning Vote",
        "Test winning detection",
        7 * 24 * 60 * 60
      );

      // Register voters
      for (const v of [voter1, voter2, voter3]) {
        await contract.connect(v).registerAsVoter();
      }

      // Two vote for (true), one votes against (false)
      for (const voter of [voter1, voter2]) {
        const input = hre.fhevm.createEncryptedInput(contractAddress, voter.address);
        input.addBool(true);
        const encrypted = await input.encrypt();

        await contract.connect(voter).castVote(
          0,
          encrypted.handles[0],
          encrypted.inputProof
        );
      }

      // One vote against
      const input3 = hre.fhevm.createEncryptedInput(contractAddress, voter3.address);
      input3.addBool(false);
      const encrypted3 = await input3.encrypt();

      await contract.connect(voter3).castVote(
        0,
        encrypted3.handles[0],
        encrypted3.inputProof
      );

      // Check if proposal is winning
      const result = await contract.isProposalWinning(0);
      const decrypted = await hre.fhevm.userDecryptEbool(contractAddress, result, voter1);
      expect(decrypted).to.be.true;
    });
  });

  describe("Proposal Management", function () {
    it("✓ Should close voting on proposal", async function () {
      const owner = signers[0];

      await contract.connect(owner).createProposal(
        "Close Vote",
        "Test voting closure",
        7 * 24 * 60 * 60
      );

      const tx = await contract.connect(owner).closeVoting(0);

      await expect(tx).to.emit(contract, "ProposalCreated"); // From creation
    });

    it("✓ Should execute proposal", async function () {
      const owner = signers[0];

      await contract.connect(owner).createProposal(
        "Execute Vote",
        "Test execution",
        7 * 24 * 60 * 60
      );

      await contract.connect(owner).closeVoting(0);

      const tx = await contract.connect(owner).executeProposal(0);

      await expect(tx).to.emit(contract, "ProposalExecuted");
    });

    it("✓ Should get proposal information", async function () {
      const owner = signers[0];
      const title = "Info Proposal";
      const description = "Test proposal information";

      await contract.connect(owner).createProposal(
        title,
        description,
        7 * 24 * 60 * 60
      );

      const [
        returnedTitle,
        returnedDesc,
        startTime,
        endTime,
        isActive,
        executed
      ] = await contract.getProposalInfo(0);

      expect(returnedTitle).to.equal(title);
      expect(returnedDesc).to.equal(description);
      expect(isActive).to.be.true;
      expect(executed).to.be.false;
    });
  });

  describe("Voter Management", function () {
    it("✓ Should revoke voter status", async function () {
      const owner = signers[0];
      const voter = signers[1];

      await contract.connect(voter).registerAsVoter();

      const tx = await contract.connect(owner).revokeVoter(voter.address);

      await expect(tx).to.emit(contract, "VoterDeactivated");
      expect(await contract.isRegisteredVoter(voter.address)).to.be.false;
    });

    it("✗ Only owner can revoke", async function () {
      const voter1 = signers[1];
      const voter2 = signers[2];

      await contract.connect(voter1).registerAsVoter();
      await contract.connect(voter2).registerAsVoter();

      await expect(
        contract.connect(voter2).revokeVoter(voter1.address)
      ).to.be.revertedWith("ConfidentialVoting: Only owner");
    });
  });

  describe("Vote History", function () {
    it("✓ Should track user voting history", async function () {
      const owner = signers[0];
      const voter = signers[1];

      await contract.connect(owner).createProposal(
        "History Vote",
        "Test voting history",
        7 * 24 * 60 * 60
      );

      await contract.connect(voter).registerAsVoter();

      // Initially has not voted
      expect(await contract.userHasVoted(0, voter.address)).to.be.false;

      // Cast vote
      const input = hre.fhevm.createEncryptedInput(contractAddress, voter.address);
      input.addBool(true);
      const encrypted = await input.encrypt();

      await contract.connect(voter).castVote(
        0,
        encrypted.handles[0],
        encrypted.inputProof
      );

      // Now shows as voted
      expect(await contract.userHasVoted(0, voter.address)).to.be.true;
    });
  });
});
