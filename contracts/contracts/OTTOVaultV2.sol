// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

interface ICircleGateway {
    function burnAndMint(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient) external;
}

/**
 * @title OTTOVaultV2
 * @dev The core treasury vault for the OTTO DAC framework. 
 * Implements strict EVM-level constraints on AI Agent spending and 
 * provides Synthetix-style O(1) gas revenue distribution for shareholders.
 */
contract OTTOVaultV2 is AccessControl, Pausable {
    bytes32 public constant CEO_ROLE = keccak256("CEO_ROLE");
    bytes32 public constant AGENT_ROLE = keccak256("AGENT_ROLE");

    IERC20 public immutable usdc;
    address public shareToken;
    ICircleGateway public circleGateway;
    
    // ==========================================
    // AGENT GUARDRAILS
    // ==========================================
    uint256 public perTxLimit;
    uint256 public dailyLimit;
    uint256 public dailySpent;
    uint256 public lastResetTime;
    mapping(address => bool) public isWhitelisted;

    // ==========================================
    // REVENUE DISTRIBUTION STATE
    // ==========================================
    uint256 public totalShares;
    mapping(address => uint256) public shareBalances;
    
    uint256 public rewardPerShareStored;
    mapping(address => uint256) public userRewardPerSharePaid;
    mapping(address => uint256) public rewards;

    // ==========================================
    // EVENTS
    // ==========================================
    event Whitelisted(address indexed account, bool status);
    event LimitsUpdated(uint256 perTxLimit, uint256 dailyLimit);
    event AgentTransfer(address indexed to, uint256 amount);
    event RevenueDistributed(uint256 amount);
    event RewardClaimed(address indexed user, uint256 amount);
    event SharesRegistered(address indexed user, uint256 amount);
    event SharesUnregistered(address indexed user, uint256 amount);

    constructor(address _usdc, address _ceo, address _agent) {
        usdc = IERC20(_usdc);
        
        _grantRole(DEFAULT_ADMIN_ROLE, _ceo);
        _grantRole(CEO_ROLE, _ceo);
        _grantRole(AGENT_ROLE, _agent);
        
        // Defaults: 10 USDC per tx, 100 USDC daily
        perTxLimit = 10 * 10**6; 
        dailyLimit = 100 * 10**6; 
        lastResetTime = block.timestamp;
    }

    // ==========================================
    // CEO ACTIONS (Administration)
    // ==========================================

    function setWhitelist(address account, bool status) external onlyRole(CEO_ROLE) {
        isWhitelisted[account] = status;
        emit Whitelisted(account, status);
    }

    function setShareToken(address _shareToken) external onlyRole(CEO_ROLE) {
        shareToken = _shareToken;
    }

    function setCircleGateway(address _gateway) external onlyRole(CEO_ROLE) {
        circleGateway = ICircleGateway(_gateway);
    }

    function setLimits(uint256 _perTxLimit, uint256 _dailyLimit) external onlyRole(CEO_ROLE) {
        perTxLimit = _perTxLimit;
        dailyLimit = _dailyLimit;
        emit LimitsUpdated(_perTxLimit, _dailyLimit);
    }

    function pause() external onlyRole(CEO_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(CEO_ROLE) {
        _unpause();
    }

    // ==========================================
    // AGENT ACTIONS (Protected Execution)
    // ==========================================

    /**
     * @notice Executed by the AI Agent to pay vendors or transfer funds.
     * @dev Blocked by strict limits and whitelists at the EVM level.
     */
    function executeTransfer(address to, uint256 amount) external onlyRole(AGENT_ROLE) whenNotPaused {
        require(isWhitelisted[to], "OTTO: Recipient not whitelisted");
        require(amount <= perTxLimit, "OTTO: Exceeds per-tx limit");

        // Rolling 24-hour window reset
        if (block.timestamp >= lastResetTime + 1 days) {
            dailySpent = 0;
            lastResetTime = block.timestamp;
        }

        require(dailySpent + amount <= dailyLimit, "OTTO: Exceeds daily limit");

        dailySpent += amount;
        require(usdc.transfer(to, amount), "OTTO: Transfer failed");
        
        emit AgentTransfer(to, amount);
    }

    /**
     * @notice Executed by the AI Agent to move USDC across chains securely.
     */
    function executeCrossChain(uint256 amount, uint32 destinationDomain, bytes32 mintRecipient) external onlyRole(AGENT_ROLE) whenNotPaused {
        require(address(circleGateway) != address(0), "OTTO: Gateway not set");
        require(amount <= perTxLimit, "OTTO: Exceeds per-tx limit");

        if (block.timestamp >= lastResetTime + 1 days) {
            dailySpent = 0;
            lastResetTime = block.timestamp;
        }

        require(dailySpent + amount <= dailyLimit, "OTTO: Exceeds daily limit");
        dailySpent += amount;

        require(usdc.approve(address(circleGateway), amount), "OTTO: Approve failed");
        circleGateway.burnAndMint(amount, destinationDomain, mintRecipient);
        
        emit AgentTransfer(address(circleGateway), amount);
    }

    // ==========================================
    // O(1) REVENUE DISTRIBUTION (Synthetix Math)
    // ==========================================

    modifier updateReward(address account) {
        rewardPerShareStored = rewardPerShare();
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerSharePaid[account] = rewardPerShareStored;
        }
        _;
    }

    function rewardPerShare() public view returns (uint256) {
        return rewardPerShareStored;
    }

    function earned(address account) public view returns (uint256) {
        return (shareBalances[account] * (rewardPerShare() - userRewardPerSharePaid[account])) / 1e18 + rewards[account];
    }

    /**
     * @notice Distributes yield/revenue from investments back to shareholders in O(1) time.
     * @dev CEO deposits USDC, math tracks proportion per share.
     */
    function distribute(uint256 amount) external onlyRole(CEO_ROLE) updateReward(address(0)) {
        require(totalShares > 0, "OTTO: No active shares");
        // Ensure the CEO transfers the USDC they want to distribute into the vault
        require(usdc.transferFrom(msg.sender, address(this), amount), "OTTO: Deposit transfer failed");
        
        // Accumulate reward per share. Use 1e18 for precision math.
        rewardPerShareStored += (amount * 1e18) / totalShares;
        emit RevenueDistributed(amount);
    }

    /**
     * @notice Shareholders call this to claim their accumulated USDC revenue.
     */
    function claimRevenue() external updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            require(usdc.transfer(msg.sender, reward), "OTTO: Transfer failed");
            emit RewardClaimed(msg.sender, reward);
        }
    }

    /**
     * @notice Associates shares with this vault for revenue tracking.
     * @dev Called automatically by the OTTOShareToken when transfers occur.
     */
    function syncShares(address from, address to, uint256 amount) external {
        require(msg.sender == shareToken, "OTTO: Unauthorized");

        // Manually update rewards for both parties before changing balances
        rewardPerShareStored = rewardPerShare();
        
        if (from != address(0)) {
            rewards[from] = earned(from);
            userRewardPerSharePaid[from] = rewardPerShareStored;
            shareBalances[from] -= amount;
        } else {
            totalShares += amount;
        }

        if (to != address(0)) {
            rewards[to] = earned(to);
            userRewardPerSharePaid[to] = rewardPerShareStored;
            shareBalances[to] += amount;
        } else {
            totalShares -= amount;
        }

        if (from != address(0)) emit SharesUnregistered(from, amount);
        if (to != address(0)) emit SharesRegistered(to, amount);
    }
}
