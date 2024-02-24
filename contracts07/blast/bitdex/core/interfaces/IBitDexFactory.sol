pragma solidity >=0.5.0;

interface IBitDexFactory {
    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    function feeTo() external view returns (address);
    function feeToSetter() external view returns (address);

    function getPair(address tokenA, address tokenB) external view returns (address pair);
    function allPairs(uint) external view returns (address pair);
    function allPairsLength() external view returns (uint);

    function createPair(address tokenA, address tokenB) external returns (address pair);

    function setFeeTo(address) external;
    function setFeeToSetter(address) external;

    function gasFeeTo() external view returns (address);
    function feeManager() external view returns (address);
    function minClaimRateBips() external view returns (uint256);
    function intervalToTransferToFeeManager() external view returns (uint256);

    function autoCollectFees() external view returns (bool);
}
