// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool, externalEbool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title ConfidentialMarketplace
 * @dev A privacy-preserving marketplace with encrypted prices and transactions
 * @notice This contract demonstrates FHE-based confidential asset trading
 */
contract ConfidentialMarketplace is ZamaEthereumConfig {

    // Virtual asset listing structure
    struct AssetListing {
        bytes32 assetId;
        address seller;
        euint64 encryptedPrice;
        bool isActive;
        uint256 createdAt;
        uint256 soldCount;
    }

    // Purchase offer structure
    struct PurchaseOffer {
        uint256 listingId;
        address buyer;
        euint64 encryptedBidAmount;
        bool isAccepted;
        uint256 timestamp;
    }

    // State variables
    mapping(uint256 => AssetListing) public listings;
    mapping(uint256 => PurchaseOffer[]) public offers;
    mapping(address => euint64) public encryptedBalance;
    uint256 public listingCount;
    address public owner;

    // Events
    event AssetListed(uint256 indexed listingId, address indexed seller);
    event OfferMade(uint256 indexed listingId, uint256 offerIndex, address indexed buyer);
    event OfferAccepted(uint256 indexed listingId, uint256 offerIndex);
    event AssetTransferred(uint256 indexed listingId, address indexed seller, address indexed buyer);
    event BalanceUpdated(address indexed user);

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev List a virtual asset with encrypted price
     * @param _assetId Unique asset identifier
     * @param _encryptedPrice Encrypted asset price
     * @param _priceProof Proof for price encryption
     */
    function listAsset(
        bytes32 _assetId,
        externalEuint64 _encryptedPrice,
        bytes calldata _priceProof
    ) external {
        require(_assetId != bytes32(0), "ConfidentialMarketplace: Invalid asset ID");

        // Convert external encrypted price
        euint64 price = FHE.fromExternal(_encryptedPrice, _priceProof);

        // Create listing with encrypted price
        AssetListing storage listing = listings[listingCount];
        listing.assetId = _assetId;
        listing.seller = msg.sender;
        listing.encryptedPrice = price;
        listing.isActive = true;
        listing.createdAt = block.timestamp;
        listing.soldCount = 0;

        // Grant permissions
        FHE.allowThis(price);
        FHE.allow(price, msg.sender);

        emit AssetListed(listingCount, msg.sender);
        listingCount++;
    }

    /**
     * @dev Make a purchase offer with encrypted bid amount
     * @param _listingId ID of the asset listing
     * @param _encryptedBidAmount Encrypted bid amount
     * @param _bidProof Proof for bid encryption
     */
    function makePurchaseOffer(
        uint256 _listingId,
        externalEuint64 _encryptedBidAmount,
        bytes calldata _bidProof
    ) external {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        require(listings[_listingId].isActive, "ConfidentialMarketplace: Listing inactive");
        require(listings[_listingId].seller != msg.sender, "ConfidentialMarketplace: Cannot bid on own asset");

        // Convert external encrypted bid
        euint64 bidAmount = FHE.fromExternal(_encryptedBidAmount, _bidProof);

        // Record offer
        PurchaseOffer memory offer = PurchaseOffer({
            listingId: _listingId,
            buyer: msg.sender,
            encryptedBidAmount: bidAmount,
            isAccepted: false,
            timestamp: block.timestamp
        });

        offers[_listingId].push(offer);
        uint256 offerIndex = offers[_listingId].length - 1;

        FHE.allowThis(bidAmount);
        FHE.allow(bidAmount, listings[_listingId].seller);
        FHE.allow(bidAmount, msg.sender);

        emit OfferMade(_listingId, offerIndex, msg.sender);
    }

    /**
     * @dev Accept a purchase offer (seller only)
     * @param _listingId ID of the asset listing
     * @param _offerIndex Index of the offer to accept
     */
    function acceptOffer(uint256 _listingId, uint256 _offerIndex) external {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        require(msg.sender == listings[_listingId].seller, "ConfidentialMarketplace: Only seller can accept");
        require(_offerIndex < offers[_listingId].length, "ConfidentialMarketplace: Invalid offer");

        PurchaseOffer storage offer = offers[_listingId][_offerIndex];
        require(!offer.isAccepted, "ConfidentialMarketplace: Offer already accepted");

        // Mark offer as accepted
        offer.isAccepted = true;

        // Update balances with encrypted arithmetic
        AssetListing storage listing = listings[_listingId];
        listing.isActive = false;
        listing.soldCount++;

        // Update encrypted balances (price transfer)
        euint64 salePrice = listing.encryptedPrice;
        encryptedBalance[msg.sender] = FHE.add(encryptedBalance[msg.sender], salePrice);
        encryptedBalance[offer.buyer] = FHE.sub(encryptedBalance[offer.buyer], salePrice);

        // Grant permissions for updated balances
        FHE.allowThis(encryptedBalance[msg.sender]);
        FHE.allow(encryptedBalance[msg.sender], msg.sender);

        FHE.allowThis(encryptedBalance[offer.buyer]);
        FHE.allow(encryptedBalance[offer.buyer], offer.buyer);

        emit OfferAccepted(_listingId, _offerIndex);
        emit AssetTransferred(_listingId, msg.sender, offer.buyer);
        emit BalanceUpdated(msg.sender);
        emit BalanceUpdated(offer.buyer);
    }

    /**
     * @dev Get encrypted price of a listing (only seller and pending buyers can view)
     */
    function getEncryptedPrice(uint256 _listingId) external view returns (euint64) {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        return listings[_listingId].encryptedPrice;
    }

    /**
     * @dev Get encrypted balance of a user
     */
    function getEncryptedBalance(address _user) external view returns (euint64) {
        return encryptedBalance[_user];
    }

    /**
     * @dev Get number of offers for a listing
     */
    function getOfferCount(uint256 _listingId) external view returns (uint256) {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        return offers[_listingId].length;
    }

    /**
     * @dev Check if prices are equal (encrypted comparison)
     */
    function arePricesEqual(uint256 _listingId1, uint256 _listingId2) external returns (ebool) {
        require(_listingId1 < listingCount && _listingId2 < listingCount, "ConfidentialMarketplace: Invalid listing");

        euint64 price1 = listings[_listingId1].encryptedPrice;
        euint64 price2 = listings[_listingId2].encryptedPrice;

        ebool result = FHE.eq(price1, price2);

        FHE.allowThis(result);
        return result;
    }

    /**
     * @dev Deactivate a listing (seller only)
     */
    function deactivateListing(uint256 _listingId) external {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        require(msg.sender == listings[_listingId].seller, "ConfidentialMarketplace: Only seller can deactivate");
        listings[_listingId].isActive = false;
    }

    /**
     * @dev Get listing information (public data only)
     */
    function getListingInfo(uint256 _listingId) external view returns (
        bytes32 assetId,
        address seller,
        bool isActive,
        uint256 createdAt,
        uint256 soldCount
    ) {
        require(_listingId < listingCount, "ConfidentialMarketplace: Invalid listing");
        AssetListing storage listing = listings[_listingId];
        return (listing.assetId, listing.seller, listing.isActive, listing.createdAt, listing.soldCount);
    }
}
