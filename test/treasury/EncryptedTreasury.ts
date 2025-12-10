import { expect } from "chai";
import hre from "hardhat";
import { EncryptedTreasury } from "../../types";

/**
 * EncryptedTreasury Test Suite
 *
 * Demonstrates:
 * - Encrypted fund management with FHE
 * - Confidential deposits and withdrawals
 * - Private balance tracking across multiple funds
 * - Secure inter-fund transfers with hidden amounts
 */

describe("EncryptedTreasury", function () {
  let contract: EncryptedTreasury;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("EncryptedTreasury");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Custodian Management", function () {
    it("✓ Should add custodian", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      const tx = await contract.connect(owner).addCustodian(custodian.address);

      await expect(tx).to.emit(contract, "CustodianAdded").withArgs(custodian.address);
      expect(await contract.isCustodian(custodian.address)).to.be.true;
    });

    it("✓ Should remove custodian", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const tx = await contract.connect(owner).removeCustodian(custodian.address);

      await expect(tx).to.emit(contract, "CustodianRemoved");
      expect(await contract.isCustodian(custodian.address)).to.be.false;
    });

    it("✗ Only owner can manage custodians", async function () {
      const nonOwner = signers[1];
      const custodian = signers[2];

      await expect(
        contract.connect(nonOwner).addCustodian(custodian.address)
      ).to.be.revertedWith("EncryptedTreasury: Only owner");
    });

    it("✗ Should reject invalid custodian address", async function () {
      const owner = signers[0];

      await expect(
        contract.connect(owner).addCustodian(hre.ethers.ZeroAddress)
      ).to.be.revertedWith("EncryptedTreasury: Invalid address");
    });
  });

  describe("Fund Creation", function () {
    it("✓ Should create fund with encrypted balance", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add64(10000); // Initial balance
      const encrypted = await input.encrypt();

      const tx = await contract.connect(owner).createFund(
        "Main Treasury",
        custodian.address,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "FundCreated").withArgs(0, "Main Treasury", custodian.address);
    });

    it("✓ Should decrypt fund balance correctly", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const testBalance = 50000;
      const input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      input.add64(testBalance);
      const encrypted = await input.encrypt();

      await contract.connect(owner).createFund(
        "Testing Fund",
        custodian.address,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const encryptedBalance = await contract.getEncryptedBalance(0);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedBalance, owner);
      expect(decrypted).to.equal(testBalance);
    });

    it("✓ Should track total funds", async function () {
      const owner = signers[0];
      const custodian1 = signers[1];
      const custodian2 = signers[2];

      await contract.connect(owner).addCustodian(custodian1.address);
      await contract.connect(owner).addCustodian(custodian2.address);

      expect(await contract.getTotalFunds()).to.equal(0);

      const input1 = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      input1.add64(10000);
      const encrypted1 = await input1.encrypt();

      await contract.connect(owner).createFund(
        "Fund 1",
        custodian1.address,
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      expect(await contract.getTotalFunds()).to.equal(1);

      const input2 = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      input2.add64(20000);
      const encrypted2 = await input2.encrypt();

      await contract.connect(owner).createFund(
        "Fund 2",
        custodian2.address,
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      expect(await contract.getTotalFunds()).to.equal(2);
    });

    it("✗ Only owner can create funds", async function () {
      const nonOwner = signers[1];
      const custodian = signers[2];

      const input = hre.fhevm.createEncryptedInput(contractAddress, nonOwner.address);
      input.add64(5000);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(nonOwner).createFund(
          "Unauthorized Fund",
          custodian.address,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("EncryptedTreasury: Only owner");
    });
  });

  describe("Deposits", function () {
    it("✓ Should deposit encrypted funds", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      // Create fund
      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(1000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Deposit Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      // Make deposit
      const depositInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      depositInput.add64(500);
      const depositEncrypted = await depositInput.encrypt();

      const tx = await contract.connect(owner).depositFunds(
        0,
        depositEncrypted.handles[0],
        depositEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "DepositMade");
    });

    it("✓ Should update balance on deposit", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(1000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Deposit Test Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      const depositInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      depositInput.add64(500);
      const depositEncrypted = await depositInput.encrypt();

      await contract.connect(owner).depositFunds(
        0,
        depositEncrypted.handles[0],
        depositEncrypted.inputProof
      );

      const balance = await contract.getEncryptedBalance(0);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, balance, owner);
      expect(decrypted).to.equal(1500); // 1000 + 500
    });
  });

  describe("Withdrawals", function () {
    it("✓ Should withdraw encrypted funds", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(5000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Withdrawal Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      const withdrawInput = hre.fhevm.createEncryptedInput(contractAddress, custodian.address);
      withdrawInput.add64(1000);
      const withdrawEncrypted = await withdrawInput.encrypt();

      const tx = await contract.connect(custodian).withdrawFunds(
        0,
        withdrawEncrypted.handles[0],
        withdrawEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "WithdrawalMade");
    });

    it("✓ Should update balance on withdrawal", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(3000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Withdraw Test Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      const withdrawInput = hre.fhevm.createEncryptedInput(contractAddress, custodian.address);
      withdrawInput.add64(1000);
      const withdrawEncrypted = await withdrawInput.encrypt();

      await contract.connect(custodian).withdrawFunds(
        0,
        withdrawEncrypted.handles[0],
        withdrawEncrypted.inputProof
      );

      const balance = await contract.getEncryptedBalance(0);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, balance, owner);
      expect(decrypted).to.equal(2000); // 3000 - 1000
    });

    it("✗ Only custodian or owner can withdraw", async function () {
      const owner = signers[0];
      const custodian = signers[1];
      const nonAuthorized = signers[2];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(5000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Protected Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      const withdrawInput = hre.fhevm.createEncryptedInput(contractAddress, nonAuthorized.address);
      withdrawInput.add64(100);
      const withdrawEncrypted = await withdrawInput.encrypt();

      await expect(
        contract.connect(nonAuthorized).withdrawFunds(
          0,
          withdrawEncrypted.handles[0],
          withdrawEncrypted.inputProof
        )
      ).to.be.revertedWith("EncryptedTreasury: Insufficient permissions");
    });
  });

  describe("Fund Transfers", function () {
    it("✓ Should transfer encrypted funds between funds", async function () {
      const owner = signers[0];
      const custodian1 = signers[1];
      const custodian2 = signers[2];

      await contract.connect(owner).addCustodian(custodian1.address);
      await contract.connect(owner).addCustodian(custodian2.address);

      // Create two funds
      const fund1Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund1Input.add64(5000);
      const fund1Encrypted = await fund1Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund A",
        custodian1.address,
        fund1Encrypted.handles[0],
        fund1Encrypted.inputProof
      );

      const fund2Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund2Input.add64(2000);
      const fund2Encrypted = await fund2Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund B",
        custodian2.address,
        fund2Encrypted.handles[0],
        fund2Encrypted.inputProof
      );

      // Transfer between funds
      const transferInput = hre.fhevm.createEncryptedInput(contractAddress, custodian1.address);
      transferInput.add64(1000);
      const transferEncrypted = await transferInput.encrypt();

      const tx = await contract.connect(custodian1).transferBetweenFunds(
        0,
        1,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "FundTransferred");
    });

    it("✓ Should update balances on transfer", async function () {
      const owner = signers[0];
      const custodian1 = signers[1];
      const custodian2 = signers[2];

      await contract.connect(owner).addCustodian(custodian1.address);
      await contract.connect(owner).addCustodian(custodian2.address);

      // Create funds
      const fund1Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund1Input.add64(3000);
      const fund1Encrypted = await fund1Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund X",
        custodian1.address,
        fund1Encrypted.handles[0],
        fund1Encrypted.inputProof
      );

      const fund2Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund2Input.add64(1000);
      const fund2Encrypted = await fund2Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund Y",
        custodian2.address,
        fund2Encrypted.handles[0],
        fund2Encrypted.inputProof
      );

      // Transfer 500
      const transferInput = hre.fhevm.createEncryptedInput(contractAddress, custodian1.address);
      transferInput.add64(500);
      const transferEncrypted = await transferInput.encrypt();

      await contract.connect(custodian1).transferBetweenFunds(
        0,
        1,
        transferEncrypted.handles[0],
        transferEncrypted.inputProof
      );

      // Verify balances
      const balance1 = await contract.getEncryptedBalance(0);
      const balance2 = await contract.getEncryptedBalance(1);

      const decrypted1 = await hre.fhevm.userDecryptEuint64(contractAddress, balance1, owner);
      const decrypted2 = await hre.fhevm.userDecryptEuint64(contractAddress, balance2, owner);

      expect(decrypted1).to.equal(2500); // 3000 - 500
      expect(decrypted2).to.equal(1500); // 1000 + 500
    });
  });

  describe("Fund Management", function () {
    it("✓ Should deactivate fund", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(1000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Temp Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      await contract.connect(owner).deactivateFund(0);

      expect(await contract.isFundActive(0)).to.be.false;
    });

    it("✓ Should get fund information", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fundInput = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fundInput.add64(5000);
      const fundEncrypted = await fundInput.encrypt();

      await contract.connect(owner).createFund(
        "Info Fund",
        custodian.address,
        fundEncrypted.handles[0],
        fundEncrypted.inputProof
      );

      const [name, returnedCustodian, isActive, createdAt] =
        await contract.getFundInfo(0);

      expect(name).to.equal("Info Fund");
      expect(returnedCustodian).to.equal(custodian.address);
      expect(isActive).to.be.true;
      expect(createdAt).to.be.gt(0);
    });
  });

  describe("Total Treasury", function () {
    it("✓ Should track encrypted total treasury balance", async function () {
      const owner = signers[0];
      const custodian = signers[1];

      await contract.connect(owner).addCustodian(custodian.address);

      const fund1Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund1Input.add64(5000);
      const fund1Encrypted = await fund1Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund 1",
        custodian.address,
        fund1Encrypted.handles[0],
        fund1Encrypted.inputProof
      );

      const fund2Input = hre.fhevm.createEncryptedInput(contractAddress, owner.address);
      fund2Input.add64(3000);
      const fund2Encrypted = await fund2Input.encrypt();

      await contract.connect(owner).createFund(
        "Fund 2",
        custodian.address,
        fund2Encrypted.handles[0],
        fund2Encrypted.inputProof
      );

      const totalTreasury = await contract.getEncryptedTotalTreasury();
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, totalTreasury, owner);
      expect(decrypted).to.equal(8000); // 5000 + 3000
    });
  });
});
