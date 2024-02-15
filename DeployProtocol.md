# Bitconnect Ecosystem Deploy Protocol

## Deploy and Verify (constructor arguments) {other secondary calls/arguments}:

1. Fee Manager
2. BitDex Factory (deployer, feeManager, minClaimRateBips, intervalToTransferToFeeManager)
3. Bitconnect Token (name, symbol, feeManager, bitdexRouterAddress, feeManager, minClaimRateBips, bitdexFeeTo) {addLiquidityAndStartTrading(lpEthAmount)}
4. BitVest (bitTokenAddress, vestedTokenTotalAmount, vestingStartTime, feeManager, minClaimRateBips, gasFeeTo)
5. BitVault (bitTokenAddress, feeManager, minClaimRateBips, gasFeeTo)
6. BitLock (feeManager, minClaimRateBips, gasFeeTo)
7. BitSend (feeManager, minClaimRateBips, gasFeeTo)
8. BitMiner (?)

## Set:
1. On BitDex, Bitconnect Token, BitVest, BitVault, BitLock, and BitSend, set the address of BitMiner as `gasFeeTo` so that auto fee-claims will head to the Miner contract

## To be addressed:
1. Current state: setting tax for Bitconnect token after deployment rather than waiting for tax to settle before deploying the rest of the ecosystem.
2. All auto-collected fees go to one of the gasFeeTo address or the feeManager, there is no other address to which fees get diverted
