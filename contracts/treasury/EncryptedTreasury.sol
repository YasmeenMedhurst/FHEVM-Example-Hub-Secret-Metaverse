// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import {FHE, euint64, externalEuint64, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title EncryptedTreasury
 * @dev Confidential treasury management with encrypted balance tracking
 * @notice This contract demonstrates FHE-based treasury operations
 */
contract EncryptedTreasury is ZamaEthereumConfig {

    // Treasury fund structure
    struct Fund {
        string name;
        address custodian;
        euint64 encryptedBalance;
        bool isActive;
        uint256 createdAt;
    }

    // Transaction log entry structure
    struct TransactionLog {
        uint256 fundId;
        address initiator;
        euint64 encryptedAmount;
        string transactionType; // "deposit", "withdrawal", "transfer"
        uint256 timestamp;
    }

    // State variables
    mapping(uint256 => Fund) public funds;
    mapping(uint256 => TransactionLog[]) public fundTransactions;
    mapping(address => bool) public isCustodian;
    uint256 public fundCount;
    euint64 public encryptedTotalTreasury;
    address public owner;

    // Events
    event FundCreated(uint256 indexed fundId, string name, address indexed custodian);
    event DepositMade(uint256 indexed fundId, address indexed depositor);
    event WithdrawalMade(uint256 indexed fundId, address indexed withdrawer);
    event FundTransferred(uint256 indexed sourceFund, uint256 indexed destinationFund);
    event BalanceUpdated(uint256 indexed fundId);
    event CustodianAdded(address indexed custodian);
    event CustodianRemoved(address indexed custodian);

    constructor() {
        owner = msg.sender;
        encryptedTotalTreasury = FHE.asEuint64(0);
        FHE.allowThis(encryptedTotalTreasury);
    }

    /**
     * @dev Add a new custodian
     */
    function addCustodian(address _custodian) external {
        require(msg.sender == owner, "EncryptedTreasury: Only owner");
        require(_custodian != address(0), "EncryptedTreasury: Invalid address");
        isCustodian[_custodian] = true;
        emit CustodianAdded(_custodian);
    }

    /**
     * @dev Remove a custodian
     */
    function removeCustodian(address _custodian) external {
        require(msg.sender == owner, "EncryptedTreasury: Only owner");
        isCustodian[_custodian] = false;
        emit CustodianRemoved(_custodian);
    }

    /**
     * @dev Create a new fund with encrypted balance
     * @param _name Fund name
     * @param _custodian Fund custodian address
     * @param _initialBalance Encrypted initial balance
     * @param _balanceProof Proof for initial balance encryption
     */
    function createFund(
        string memory _name,
        address _custodian,
        externalEuint64 _initialBalance,
        bytes calldata _balanceProof
    ) external {
        require(msg.sender == owner, "EncryptedTreasury: Only owner");
        require(_custodian != address(0), "EncryptedTreasury: Invalid custodian");
        require(bytes(_name).length > 0, "EncryptedTreasury: Empty fund name");

        euint64 initialBalance = FHE.fromExternal(_initialBalance, _balanceProof);

        Fund storage fund = funds[fundCount];
        fund.name = _name;
        fund.custodian = _custodian;
        fund.encryptedBalance = initialBalance;
        fund.isActive = true;
        fund.createdAt = block.timestamp;

        // Grant permissions
        FHE.allowThis(fund.encryptedBalance);
        FHE.allow(fund.encryptedBalance, _custodian);
        FHE.allow(fund.encryptedBalance, owner);

        // Update total treasury
        encryptedTotalTreasury = FHE.add(encryptedTotalTreasury, initialBalance);
        FHE.allowThis(encryptedTotalTreasury);

        emit FundCreated(fundCount, _name, _custodian);
        fundCount++;
    }

    /**
     * @dev Deposit funds with encrypted amount
     * @param _fundId ID of the fund to deposit into
     * @param _encryptedAmount Encrypted deposit amount
     * @param _amountProof Proof for amount encryption
     */
    function depositFunds(
        uint256 _fundId,
        externalEuint64 _encryptedAmount,
        bytes calldata _amountProof
    ) external {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        require(funds[_fundId].isActive, "EncryptedTreasury: Fund not active");

        euint64 amount = FHE.fromExternal(_encryptedAmount, _amountProof);

        Fund storage fund = funds[_fundId];

        // Update encrypted balance
        fund.encryptedBalance = FHE.add(fund.encryptedBalance, amount);

        // Update total treasury
        encryptedTotalTreasury = FHE.add(encryptedTotalTreasury, amount);

        // Grant permissions
        FHE.allowThis(fund.encryptedBalance);
        FHE.allow(fund.encryptedBalance, fund.custodian);
        FHE.allow(fund.encryptedBalance, owner);
        FHE.allowThis(encryptedTotalTreasury);

        // Log transaction
        TransactionLog memory transaction = TransactionLog({
            fundId: _fundId,
            initiator: msg.sender,
            encryptedAmount: amount,
            transactionType: "deposit",
            timestamp: block.timestamp
        });
        fundTransactions[_fundId].push(transaction);

        emit DepositMade(_fundId, msg.sender);
        emit BalanceUpdated(_fundId);
    }

    /**
     * @dev Withdraw funds with encrypted amount (custodian only)
     * @param _fundId ID of the fund to withdraw from
     * @param _encryptedAmount Encrypted withdrawal amount
     * @param _amountProof Proof for amount encryption
     */
    function withdrawFunds(
        uint256 _fundId,
        externalEuint64 _encryptedAmount,
        bytes calldata _amountProof
    ) external {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        require(funds[_fundId].isActive, "EncryptedTreasury: Fund not active");
        require(msg.sender == funds[_fundId].custodian || msg.sender == owner, "EncryptedTreasury: Insufficient permissions");

        euint64 amount = FHE.fromExternal(_encryptedAmount, _amountProof);

        Fund storage fund = funds[_fundId];

        // Update encrypted balance
        fund.encryptedBalance = FHE.sub(fund.encryptedBalance, amount);

        // Update total treasury
        encryptedTotalTreasury = FHE.sub(encryptedTotalTreasury, amount);

        // Grant permissions
        FHE.allowThis(fund.encryptedBalance);
        FHE.allow(fund.encryptedBalance, fund.custodian);
        FHE.allow(fund.encryptedBalance, owner);
        FHE.allowThis(encryptedTotalTreasury);

        // Log transaction
        TransactionLog memory transaction = TransactionLog({
            fundId: _fundId,
            initiator: msg.sender,
            encryptedAmount: amount,
            transactionType: "withdrawal",
            timestamp: block.timestamp
        });
        fundTransactions[_fundId].push(transaction);

        emit WithdrawalMade(_fundId, msg.sender);
        emit BalanceUpdated(_fundId);
    }

    /**
     * @dev Transfer encrypted funds between funds
     * @param _sourceFundId Source fund ID
     * @param _destinationFundId Destination fund ID
     * @param _encryptedAmount Encrypted transfer amount
     * @param _amountProof Proof for amount encryption
     */
    function transferBetweenFunds(
        uint256 _sourceFundId,
        uint256 _destinationFundId,
        externalEuint64 _encryptedAmount,
        bytes calldata _amountProof
    ) external {
        require(_sourceFundId < fundCount && _destinationFundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        require(_sourceFundId != _destinationFundId, "EncryptedTreasury: Cannot transfer to same fund");
        require(funds[_sourceFundId].isActive && funds[_destinationFundId].isActive, "EncryptedTreasury: Fund not active");
        require(msg.sender == funds[_sourceFundId].custodian || msg.sender == owner, "EncryptedTreasury: Insufficient permissions");

        euint64 amount = FHE.fromExternal(_encryptedAmount, _amountProof);

        Fund storage sourceFund = funds[_sourceFundId];
        Fund storage destFund = funds[_destinationFundId];

        // Update encrypted balances using FHE operations
        sourceFund.encryptedBalance = FHE.sub(sourceFund.encryptedBalance, amount);
        destFund.encryptedBalance = FHE.add(destFund.encryptedBalance, amount);

        // Grant permissions
        FHE.allowThis(sourceFund.encryptedBalance);
        FHE.allow(sourceFund.encryptedBalance, sourceFund.custodian);
        FHE.allow(sourceFund.encryptedBalance, owner);

        FHE.allowThis(destFund.encryptedBalance);
        FHE.allow(destFund.encryptedBalance, destFund.custodian);
        FHE.allow(destFund.encryptedBalance, owner);

        // Log transactions
        TransactionLog memory sourceTransaction = TransactionLog({
            fundId: _sourceFundId,
            initiator: msg.sender,
            encryptedAmount: amount,
            transactionType: "transfer",
            timestamp: block.timestamp
        });
        fundTransactions[_sourceFundId].push(sourceTransaction);

        TransactionLog memory destTransaction = TransactionLog({
            fundId: _destinationFundId,
            initiator: msg.sender,
            encryptedAmount: amount,
            transactionType: "transfer",
            timestamp: block.timestamp
        });
        fundTransactions[_destinationFundId].push(destTransaction);

        emit FundTransferred(_sourceFundId, _destinationFundId);
        emit BalanceUpdated(_sourceFundId);
        emit BalanceUpdated(_destinationFundId);
    }

    /**
     * @dev Get encrypted fund balance
     */
    function getEncryptedBalance(uint256 _fundId) external view returns (euint64) {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        return funds[_fundId].encryptedBalance;
    }

    /**
     * @dev Get encrypted total treasury balance
     */
    function getEncryptedTotalTreasury() external view returns (euint64) {
        return encryptedTotalTreasury;
    }

    /**
     * @dev Get fund information (public data only)
     */
    function getFundInfo(uint256 _fundId) external view returns (
        string memory name,
        address custodian,
        bool isActive,
        uint256 createdAt
    ) {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        Fund storage fund = funds[_fundId];
        return (fund.name, fund.custodian, fund.isActive, fund.createdAt);
    }

    /**
     * @dev Get transaction count for a fund
     */
    function getTransactionCount(uint256 _fundId) external view returns (uint256) {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        return fundTransactions[_fundId].length;
    }

    /**
     * @dev Deactivate a fund
     */
    function deactivateFund(uint256 _fundId) external {
        require(msg.sender == owner, "EncryptedTreasury: Only owner");
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        funds[_fundId].isActive = false;
    }

    /**
     * @dev Get total number of funds
     */
    function getTotalFunds() external view returns (uint256) {
        return fundCount;
    }

    /**
     * @dev Check if fund is active
     */
    function isFundActive(uint256 _fundId) external view returns (bool) {
        require(_fundId < fundCount, "EncryptedTreasury: Invalid fund ID");
        return funds[_fundId].isActive;
    }
}
