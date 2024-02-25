# Bitconnect Ecosystem Deploy Protocol

## Deploy and Verify (constructor arguments) {other secondary calls/arguments}:

For mainnet deploys, check all contracts for Blast contract addresses, to confirm they are the mainnet versions and NOT the testnet.
i.e. on testnet BLAST might be 0x4300000000000000000000000000000000000002 but not so on mainnet.

1. FeeManager + DEX
2. $BIT, BitVest, BitSend, BitVault
3/4. BitMiner
4/3. The Scammers

Deploy Steps:
1. Set env variable USE_CONTRACTS_07="false", chunk=1
2. Copy over FeeManager address, USE_CONTRACTS_07="true" to chunk 2, chunk=2
3. Copy over FeeManager, Factory, Dex Init Code Hash, Router, and Multicall to chunk 3, set chunk=3

Test Condition Checklist:
1. BitConnect
    1. Tradeable, taxes and limits work
2. BitVest
    1. Users claim correct amount, can't claim more than either amount vested at time or total
3. BitVault
    1. Token-seconds correctly calculated
    2. user can deposit and withdraw freely, amounts are correct
    3. token-seconds doesn't overflow
4. BitLock
    1. Deposit freely, one lockID per deposit
    2. Cant withdrawn before lock period
    3. Can withdraw correct amount for that lock ID after lock period
5. BitSend
    1. Can disperse ETH
    2. Can disperse ERC20
6. BitDex
    1. Create Pair, Add Liquidity
    2. Remove liquidity
    3. Swap freely
7. FeeManager
    1. Receives Fees when Gas or Yield claims are made
    2. Can withdraw ETH, disperse it, can claim it's own yield fees
7. Gas Claims / Yield Claims
    1. BitConnect
    2. BitVest
    3. BitVault
    4. BitLock
    5. BitSend
    6. Router
    7. Pair
    8. FeeManager



