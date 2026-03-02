// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

interface IVault {
    function syncShares(address from, address to, uint256 amount) external;
}

/**
 * @title OTTOShareToken
 * @dev 10,000 fixed supply governance token for an OTTO DAC.
 * 1 token = 1 bp = 1 vote.
 * Syncs transfers with the OTTOVaultV2 for O(1) revenue distribution.
 */
contract OTTOShareToken is ERC20, ERC20Permit, ERC20Votes {
    IVault public vault;
    address public admin;

    constructor(string memory name, string memory symbol, address initialOwner)
        ERC20(name, symbol)
        ERC20Permit(name)
    {
        admin = initialOwner;
        _mint(initialOwner, 10000 * 10 ** decimals());
    }

    function setVault(address _vault) external {
        require(msg.sender == admin, "Only admin");
        vault = IVault(_vault);
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
    {
        if (address(vault) != address(0)) {
            vault.syncShares(from, to, value);
        }
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
