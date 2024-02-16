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

## Set ([x] Implemented, [ ] Not Implemented, but needs to be):
1. On BitDex, Bitconnect Token, BitVest, BitVault, BitLock, and BitSend, set the address of BitMiner as `gasFeeTo` so that auto fee-claims will head to the Miner contract
2. [ ] On Bitconnect Token, be sure the BitVest, BitVault, BitLock, and BitSend are not subject to transaction or balance limits.

## To be addressed:
1. Current state: setting tax for Bitconnect token after deployment rather than waiting for tax to settle before deploying the rest of the ecosystem.
2. All auto-collected fees go to one of the gasFeeTo address or the feeManager, there is no other address to which fees get diverted

## Notes on deploys in "testing.json":

1. FeeManager
    1. Set BitSend when available
2. Bitconnect Token
    1. Must permit relevant addresses to be exempt from limits: BitDex (already incorporated), BitVest, BitVault, BitLock, and BitSend
    2. Consider how to adjust limits, I think manually is better here
3. BitSend
    1. 
4. BitVest
    1. 
5. BitVault
    1. Token-seconds does stop upon removing all tokens,
    2. Admin can add token authorization and multiplier add per day
    3. Tokens can be fully removed after deposit
6. BitLock
    1. Able to withdraw my lock after 1 minute
    2. Not able to withdraw an already-withdrawn lock
7. General
    1. Need to create all-in-one deploy script, with contingencies, or way to set .env vars after every deploy to avoid human error in deploys
    2. I think the initial calls when the blast fee claims would revert are a bit more costly in terms of gas estimate, so we could front this? 
        1. Idk, in script the gas cost was high to approve the vesting contract as a BIT spender, but when calling through blastscan, cost was low. Maybe no problem...anyways, this function does not claim blast fees...
    3. Be sure to include all set variables (feeManager, gasFeeTo, etc.) in each contract that uses them

## Links from testing.json deploy addresses
Fee Manager: https://testnet.blastscan.io/address/0x348Be2AadDA55C125A50eE329b118CE5538546Ab
BitDex Factory: https://testnet.blastscan.io/address/0xD222cb17af8f6536466b0D031b675bf47B9E53c2
BitDex Router: https://testnet.blastscan.io/address/0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756
Bitconnect Token: https://testnet.blastscan.io/address/0x504Bf0Ba6B63fDef91eE61f8b9EaD4741f6F437e
BitVest: https://testnet.blastscan.io/address/0xDa7983D0d57C09A6B81460f1C4716C0666326c3a
BitVault: https://testnet.blastscan.io/address/0x4B0B5308CD3B4eFA64740db3aa6D54D8135dEb83
BitLock: https://testnet.blastscan.io/address/0xfF0F72894d5Ad3E6051765cDe810c18A656947f6
BitSend: https://testnet.blastscan.io/address/0xF7328f471d4F60161a1f7099c11E1C21d36D7321



