import { expect } from "chai";
import hre from "hardhat";
import { ConfidentialMarketplace } from "../../types";

/**
 * ConfidentialMarketplace Test Suite
 *
 * Demonstrates:
 * - Private asset listing with encrypted prices
 * - Confidential bidding and offers
 * - FHE-based price comparison
 * - Encrypted balance tracking
 */

describe("ConfidentialMarketplace", function () {
  let contract: ConfidentialMarketplace;
  let signers: any;
  let contractAddress: string;

  before(async function () {
    if (!hre.fhevm.isMock) {
      throw new Error("FHEVM environment not detected.");
    }
    signers = await hre.ethers.getSigners();
  });

  beforeEach(async function () {
    const Factory = await hre.ethers.getContractFactory("ConfidentialMarketplace");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
    contractAddress = await contract.getAddress();
  });

  describe("Asset Listing", function () {
    it("✓ Should list asset with encrypted price", async function () {
      const seller = signers[1];
      const assetId = hre.ethers.id("virtual_land_001");
      const price = 1000;

      const input = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input.add64(price);
      const encrypted = await input.encrypt();

      const tx = await contract.connect(seller).listAsset(
        assetId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      await expect(tx).to.emit(contract, "AssetListed").withArgs(0, seller.address);
    });

    it("✓ Should retrieve encrypted price", async function () {
      const seller = signers[1];
      const assetId = hre.ethers.id("nft_item_001");
      const testPrice = 5000;

      const input = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input.add64(testPrice);
      const encrypted = await input.encrypt();

      await contract.connect(seller).listAsset(
        assetId,
        encrypted.handles[0],
        encrypted.inputProof
      );

      const encryptedPrice = await contract.getEncryptedPrice(0);
      const decrypted = await hre.fhevm.userDecryptEuint64(contractAddress, encryptedPrice, seller);
      expect(decrypted).to.equal(testPrice);
    });

    it("✗ Should reject invalid asset ID", async function () {
      const seller = signers[1];
      const invalidId = hre.ethers.zeroPadValue("0x00", 32);

      const input = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input.add64(1000);
      const encrypted = await input.encrypt();

      await expect(
        contract.connect(seller).listAsset(
          invalidId,
          encrypted.handles[0],
          encrypted.inputProof
        )
      ).to.be.revertedWith("ConfidentialMarketplace: Invalid asset ID");
    });
  });

  describe("Purchase Offers", function () {
    it("✓ Should make encrypted purchase offer", async function () {
      const seller = signers[1];
      const buyer = signers[2];

      // List asset
      const assetId = hre.ethers.id("asset_for_sale");
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(2000);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        assetId,
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      // Make offer
      const bidInput = hre.fhevm.createEncryptedInput(contractAddress, buyer.address);
      bidInput.add64(2000);
      const bidEncrypted = await bidInput.encrypt();

      const tx = await contract.connect(buyer).makePurchaseOffer(
        0,
        bidEncrypted.handles[0],
        bidEncrypted.inputProof
      );

      await expect(tx).to.emit(contract, "OfferMade");
    });

    it("✓ Should track multiple offers per listing", async function () {
      const seller = signers[1];
      const buyer1 = signers[2];
      const buyer2 = signers[3];

      // List asset
      const assetId = hre.ethers.id("popular_asset");
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(3000);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        assetId,
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      // First offer
      const bid1Input = hre.fhevm.createEncryptedInput(contractAddress, buyer1.address);
      bid1Input.add64(3000);
      const bid1Encrypted = await bid1Input.encrypt();

      await contract.connect(buyer1).makePurchaseOffer(
        0,
        bid1Encrypted.handles[0],
        bid1Encrypted.inputProof
      );

      // Second offer
      const bid2Input = hre.fhevm.createEncryptedInput(contractAddress, buyer2.address);
      bid2Input.add64(3500);
      const bid2Encrypted = await bid2Input.encrypt();

      await contract.connect(buyer2).makePurchaseOffer(
        0,
        bid2Encrypted.handles[0],
        bid2Encrypted.inputProof
      );

      const offerCount = await contract.getOfferCount(0);
      expect(offerCount).to.equal(2);
    });

    it("✗ Should not allow seller to bid on own asset", async function () {
      const seller = signers[1];

      // List asset
      const assetId = hre.ethers.id("seller_asset");
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(1500);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        assetId,
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      // Try to bid on own asset
      const bidInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      bidInput.add64(1500);
      const bidEncrypted = await bidInput.encrypt();

      await expect(
        contract.connect(seller).makePurchaseOffer(
          0,
          bidEncrypted.handles[0],
          bidEncrypted.inputProof
        )
      ).to.be.revertedWith("ConfidentialMarketplace: Cannot bid on own asset");
    });
  });

  describe("Offer Acceptance", function () {
    it("✓ Should accept purchase offer", async function () {
      const seller = signers[1];
      const buyer = signers[2];

      // List asset
      const assetId = hre.ethers.id("sale_asset");
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(2500);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        assetId,
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      // Make offer
      const bidInput = hre.fhevm.createEncryptedInput(contractAddress, buyer.address);
      bidInput.add64(2500);
      const bidEncrypted = await bidInput.encrypt();

      await contract.connect(buyer).makePurchaseOffer(
        0,
        bidEncrypted.handles[0],
        bidEncrypted.inputProof
      );

      // Accept offer
      const tx = await contract.connect(seller).acceptOffer(0, 0);

      await expect(tx).to.emit(contract, "OfferAccepted");
      await expect(tx).to.emit(contract, "AssetTransferred");
    });

    it("✓ Should only allow seller to accept offers", async function () {
      const seller = signers[1];
      const buyer = signers[2];

      // List and make offer
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(1000);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        hre.ethers.id("test_asset"),
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      const bidInput = hre.fhevm.createEncryptedInput(contractAddress, buyer.address);
      bidInput.add64(1000);
      const bidEncrypted = await bidInput.encrypt();

      await contract.connect(buyer).makePurchaseOffer(
        0,
        bidEncrypted.handles[0],
        bidEncrypted.inputProof
      );

      // Non-seller tries to accept
      const other = signers[3];
      await expect(
        contract.connect(other).acceptOffer(0, 0)
      ).to.be.revertedWith("ConfidentialMarketplace: Only seller can accept");
    });
  });

  describe("Price Comparison", function () {
    it("✓ Should compare encrypted prices", async function () {
      const seller = signers[1];

      // List first asset
      const input1 = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input1.add64(1000);
      const encrypted1 = await input1.encrypt();

      await contract.connect(seller).listAsset(
        hre.ethers.id("asset_1"),
        encrypted1.handles[0],
        encrypted1.inputProof
      );

      // List second asset
      const input2 = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input2.add64(1000);
      const encrypted2 = await input2.encrypt();

      await contract.connect(seller).listAsset(
        hre.ethers.id("asset_2"),
        encrypted2.handles[0],
        encrypted2.inputProof
      );

      // Compare prices (should be equal)
      const result = await contract.arePricesEqual(0, 1);
      const decrypted = await hre.fhevm.userDecryptEbool(contractAddress, result, seller);
      expect(decrypted).to.be.true;
    });
  });

  describe("Listing Deactivation", function () {
    it("✓ Should deactivate listing", async function () {
      const seller = signers[1];

      const input = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      input.add64(1500);
      const encrypted = await input.encrypt();

      await contract.connect(seller).listAsset(
        hre.ethers.id("deactivate_asset"),
        encrypted.handles[0],
        encrypted.inputProof
      );

      await contract.connect(seller).deactivateListing(0);

      const [, , isActive] = await contract.getListingInfo(0);
      expect(isActive).to.be.false;
    });

    it("✗ Should not allow inactive listing", async function () {
      const seller = signers[1];
      const buyer = signers[2];

      // List and deactivate
      const listInput = hre.fhevm.createEncryptedInput(contractAddress, seller.address);
      listInput.add64(2000);
      const listEncrypted = await listInput.encrypt();

      await contract.connect(seller).listAsset(
        hre.ethers.id("inactive_asset"),
        listEncrypted.handles[0],
        listEncrypted.inputProof
      );

      await contract.connect(seller).deactivateListing(0);

      // Try to bid on inactive listing
      const bidInput = hre.fhevm.createEncryptedInput(contractAddress, buyer.address);
      bidInput.add64(2000);
      const bidEncrypted = await bidInput.encrypt();

      await expect(
        contract.connect(buyer).makePurchaseOffer(
          0,
          bidEncrypted.handles[0],
          bidEncrypted.inputProof
        )
      ).to.be.revertedWith("ConfidentialMarketplace: Listing inactive");
    });
  });
});
