// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract ArcTreasuryRewards is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant CEO_ROLE = keccak256("CEO_ROLE");
    IERC20 public immutable USDC;
    uint256 public constant PRECISION = 1e18;

    uint256 public totalShares;
    mapping(address => uint256) public shares;

    uint256 public cumulativePerShare;
    mapping(address => uint256) public userPerSharePaid;
    mapping(address => uint256) public claimable;
    uint256 public undistributedRemainder;

    error CPSRegression();

    constructor(address _usdc, address _ceo) {
        require(_usdc != address(0), "Invalid USDC address");
        require(_ceo != address(0), "Invalid CEO address");
        USDC = IERC20(_usdc);
        _grantRole(DEFAULT_ADMIN_ROLE, _ceo);
        _grantRole(CEO_ROLE, _ceo);
    }

    /// @notice Helper to realize pending entitlements before changing a user's shares.
    /// @dev Must be called BEFORE modifying shares[user].
    function _updateUser(address user) internal {
        if (shares[user] > 0) {
            if (cumulativePerShare < userPerSharePaid[user]) revert CPSRegression();
            uint256 owed = (shares[user] * (cumulativePerShare - userPerSharePaid[user])) / PRECISION;
            if (owed > 0) {
                claimable[user] += owed;
            }
        }
        userPerSharePaid[user] = cumulativePerShare;
    }

    /// @notice Admin function to manually set a user's share allocation.
    function setShares(address user, uint256 newShares) external onlyRole(CEO_ROLE) {
        // Realize any pending rewards using the old share amount first
        _updateUser(user);
        
        uint256 oldShares = shares[user];
        shares[user] = newShares;
        
        // Update global shares correctly
        totalShares = totalShares - oldShares + newShares;
    }

    function distribute(uint256 amount) external onlyRole(CEO_ROLE) {
        require(totalShares > 0, "No shares exist");
        require(amount > 0, "Amount must be > 0");

        USDC.safeTransferFrom(msg.sender, address(this), amount);

        uint256 totalAvailable = amount + undistributedRemainder;
        uint256 addedPerShare = (totalAvailable * PRECISION) / totalShares;
        
        cumulativePerShare += addedPerShare;
        
        // Retain dust strictly caused by precision loss
        undistributedRemainder = totalAvailable - ((addedPerShare * totalShares) / PRECISION);
    }

    function claim() external nonReentrant {
        _updateUser(msg.sender);
        
        uint256 owed = claimable[msg.sender];
        require(owed > 0, "Nothing to claim");

        claimable[msg.sender] = 0;
        USDC.safeTransfer(msg.sender, owed);
    }
}
