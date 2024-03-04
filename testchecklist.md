1. [ ] FeeManager can withdraw ETH
2. [ ] FeeManager can claim yield and gas
3. [ ] Pairs work given different WETH address
4. [ ] Router works, gas claims work
5. [ ] Vesting claims work for all with predicted math, sum of all < total in contract
6. [ ] Can deposit and withdraw freely from vault, tokens-seconds accumulate
7. [ ] audit changes (validating transfers, array length limits) work, reentrancy checks don't cause errors, safeTransfer works where transfer was replaced zero checks don't throw errors
8. [ ] Locks work for specified amount and time period