pragma solidity =0.5.16;

import './interfaces/IBitDexFactory.sol';
import './BitDexPair.sol';

contract BitDexFactory is IBitDexFactory {
    /// @dev added to supply a value to modify the init code hash from the default Uniswap V2 value
    bytes32 public constant INIT_CODE_HASH = keccak256(abi.encodePacked(type(BitDexPair).creationCode));

    address public feeTo;
    address public feeToSetter;

    //blast
    address public gasFeeTo;
    address public feeManager;
    uint256 public minClaimRateBips;
    uint256 public intervalToTransferToFeeManager;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter, address _feeManager, uint256 _minClaimRateBips, uint256 _intervalToTransferToFeeManager) public {
        feeToSetter = _feeToSetter;
        feeManager = _feeManager;
        minClaimRateBips = _minClaimRateBips;
        intervalToTransferToFeeManager = _intervalToTransferToFeeManager;
    }

    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, 'BitDex: IDENTICAL_ADDRESSES');
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), 'BitDex: ZERO_ADDRESS');
        require(getPair[token0][token1] == address(0), 'BitDex: PAIR_EXISTS'); // single check is sufficient
        bytes memory bytecode = type(BitDexPair).creationCode;
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        assembly {
            pair := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        IBitDexPair(pair).initialize(token0, token1);
        getPair[token0][token1] = pair;
        getPair[token1][token0] = pair; // populate mapping in the reverse direction
        allPairs.push(pair);
        emit PairCreated(token0, token1, pair, allPairs.length);
    }

    function setFeeTo(address _feeTo) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        feeToSetter = _feeToSetter;
    }

    function setGasFeeTo(address _gasFeeTo) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        gasFeeTo = _gasFeeTo;
    }

    function setFeeManager(address _feeManager) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        feeManager = _feeManager;
    }

    function setMinClaimRateBips(uint256 _minClaimRateBips) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        minClaimRateBips = _minClaimRateBips;
    }

    function setIntervalToTransferToFeeManager(uint256 _intervalToTransferToFeeManager) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        intervalToTransferToFeeManager = _intervalToTransferToFeeManager;
    }

    function claimAtBips(address _pairAddress, uint256 _bips) external returns (bool, bool) {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        (bool claimWethYieldSuccess, bool claimGasSuccess) = BitDexPair(_pairAddress).claimAtBips(_bips);
        return (claimWethYieldSuccess, claimGasSuccess);
    }
}