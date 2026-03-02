# ArcTreasuryRewards: Security Policy

## Architecture & Trust Model

**Modular Design**: This contract is the Distribution Module. It does not contain execution guardrails (velocity limits/whitelisting); those must be enforced by the parent Vault contract.

**CEO Root of Trust**: The `CEO_ROLE` is the ultimate authority. It can modify share allocations (`setShares`) and trigger distributions (`distribute`) at will. In production, this role must be held by a multi-sig or timelocked governor.

**No Token Recovery**: This contract intentionally lacks an `recoverERC20` function to minimize attack surface. Any non-USDC tokens sent to this address are permanently irretrievable by design.

## Accounting Invariants

**Monotonic CumulativePerShare**: The `cumulativePerShare` (CPS) is a monotonic non-decreasing global value. The system strictly reverts on any detected CPS regression.

**Precision and Dust**: The system utilizes a `PRECISION` factor ($10^{18}$). Any remainder from integer division is captured in `undistributedRemainder` and rolled into the next distribution.

**Settlement Integrity**: Total USDC distributed must always equal `totalClaimed` + `undistributedRemainder` + `currentLiabilities`.

## Known Limitations

**USDC Native Hooks**: The contract is subject to the standard Circle USDC blacklist and pause mechanisms.

**Fixed-Day Reset**: If used in conjunction with a Vault velocity limit, be aware of the 00:00 UTC "cliff" where limits reset.
