pragma solidity =0.5.16;

import './interfaces/IBitDexFactory.sol';
import './BitDexPair.sol';

contract BitDexFactory is IBitDexFactory {
    /// @dev added to supply a value to modify the init code hash from the default Uniswap V2 value
    bytes32 public constant INIT_CODE_HASH = keccak256(abi.encodePacked(type(BitDexPair).creationCode));

    address public feeTo;
    address public feeToSetter;

    //blast
    address public blastAddress;
    address public blastPointsAddress;
    address public wethAddress;
    address public pointsOperatorAddress;
    address public feeManager;

    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event PairCreated(address indexed token0, address indexed token1, address pair, uint);

    constructor(address _feeToSetter, address _feeManager, address _blast, address _blastPoints, address _weth, address _pointsOperator) public {
        require(_feeToSetter != address(0), 'BitDex: INVALID_FEE_TO_SETTER');
        require(_feeManager != address(0), 'BitDex: INVALID_FEE_MANAGER');
        require(_blast != address(0), 'BitDex: INVALID_BLAST');
        require(_blastPoints != address(0), 'BitDex: INVALID_BLAST_POINTS');
        require(_weth != address(0), 'BitDex: INVALID_WETH');
        require(_pointsOperator != address(0), 'BitDex: INVALID_POINTS_OPERATOR');
        feeToSetter = _feeToSetter;
        feeManager = _feeManager;
        blastAddress = _blast;
        blastPointsAddress = _blastPoints;
        wethAddress = _weth;
        pointsOperatorAddress = _pointsOperator;
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
        require(_feeTo != address(0), 'BitDex: INVALID_FEE_TO');
        feeTo = _feeTo;
    }

    function setFeeToSetter(address _feeToSetter) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        require(_feeToSetter != address(0), 'BitDex: INVALID_FEE_TO_SETTER');
        feeToSetter = _feeToSetter;
    }

    function setFeeManager(address _feeManager) external {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        require(_feeManager != address(0), 'BitDex: INVALID_FEE_MANAGER');
        feeManager = _feeManager;
    }

    function claimAtBips(address _pairAddress, uint256 _bips) external returns (bool, bool) {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        (bool claimWethYieldSuccess, bool claimGasSuccess) = BitDexPair(_pairAddress).claimAtBips(_bips);
        return (claimWethYieldSuccess, claimGasSuccess);
    }

    function claimAllPairsAtBips(uint256 _bips) external returns (bool[] memory, bool[] memory) {
        require(msg.sender == feeToSetter || msg.sender == feeManager, 'BitDex: FORBIDDEN');
        bool[] memory claimYieldResults = new bool[](allPairs.length);
        bool[] memory claimGasResults = new bool[](allPairs.length);
        for (uint256 i = 0; i < allPairs.length; i++) {
            (bool claimWethYieldSuccess, bool claimGasSuccess) = BitDexPair(allPairs[i]).claimAtBips(_bips);
            claimYieldResults[i] = claimWethYieldSuccess;
            claimGasResults[i] = claimGasSuccess;
        }
        return (claimYieldResults, claimGasResults);
    }
}
