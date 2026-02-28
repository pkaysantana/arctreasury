// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ArcTreasury
 * @dev Enterprise-grade programmable USDC treasury for the Arc Layer-1 blockchain.
 * Implements policy-based payouts and automated fund distribution.
 */
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract ArcTreasury {
    struct Policy {
        address[] recipients;
        uint256[] percentages;
        uint256 lastPayout;
        uint256 payoutInterval;
        bool paused;
    }

    address public admin;
    IERC20 public usdc;

    uint256 public nextPolicyId;
    mapping(uint256 => Policy) public policies;
    mapping(address => uint256) public usdcBalances; // Internal tracking if needed

    event Deposited(address indexed user, uint256 amount);
    event PolicyCreated(uint256 indexed policyId, address[] recipients, uint256[] percentages, uint256 interval);
    event PayoutExecuted(uint256 indexed policyId, uint256 totalAmount);
    event PolicyStatusChanged(uint256 indexed policyId, bool paused);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    constructor(address _usdc) {
        admin = msg.sender;
        usdc = IERC20(_usdc);
    }

    /**
     * @dev Deposit USDC into the treasury. Requires prior approval.
     */
    function deposit(uint256 amount) external onlyAdmin {
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit Deposited(msg.sender, amount);
    }

    /**
     * @dev Create a new payout policy.
     */
    function createPolicy(
        address[] calldata _recipients,
        uint256[] calldata _percentages,
        uint256 _interval
    ) external onlyAdmin {
        require(_recipients.length == _percentages.length, "Mismatched inputs");
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < _percentages.length; i++) {
            totalPercentage += _percentages[i];
        }
        require(totalPercentage == 100, "Total must be 100%");

        policies[nextPolicyId] = Policy({
            recipients: _recipients,
            percentages: _percentages,
            lastPayout: block.timestamp,
            payoutInterval: _interval,
            paused: false
        });

        emit PolicyCreated(nextPolicyId, _recipients, _percentages, _interval);
        nextPolicyId++;
    }

    /**
     * @dev Execute a payout policy based on defined intervals.
     */
    function executePayout(uint256 _policyId, uint256 totalPayoutAmount) external {
        Policy storage policy = policies[_policyId];
        require(!policy.paused, "Policy is paused");
        require(block.timestamp >= policy.lastPayout + policy.payoutInterval, "Too early for payout");
        require(usdc.balanceOf(address(this)) >= totalPayoutAmount, "Insufficient treasury balance");

        policy.lastPayout = block.timestamp;

        for (uint256 i = 0; i < policy.recipients.length; i++) {
            uint256 recipientAmount = (totalPayoutAmount * policy.percentages[i]) / 100;
            if (recipientAmount > 0) {
                require(usdc.transfer(policy.recipients[i], recipientAmount), "Transfer failed to recipient");
            }
        }

        emit PayoutExecuted(_policyId, totalPayoutAmount);
    }

    /**
     * @dev Pause or resume a policy (used for disputes).
     */
    function pausePolicy(uint256 _policyId) external onlyAdmin {
        policies[_policyId].paused = !policies[_policyId].paused;
        emit PolicyStatusChanged(_policyId, policies[_policyId].paused);
    }

    /**
     * @dev Raise a dispute, which pauses the policy.
     */
    function raiseDispute(uint256 _policyId) external {
        // In a real scenario, this might have more logic.
        // For the hackathon, it simply pauses the policy.
        policies[_policyId].paused = true;
        emit PolicyStatusChanged(_policyId, true);
    }

    /**
     * @dev Update admin.
     */
    function transferOwnership(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }

    /**
     * @dev Withdraw funds (emergency or admin rebalance).
     */
    function withdraw(uint256 amount) external onlyAdmin {
        require(usdc.transfer(admin, amount), "Withdraw failed");
    }
}
