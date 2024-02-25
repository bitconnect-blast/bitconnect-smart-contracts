// SPDX-License-Identifier: MIT
/**
TEXTART
*/
pragma solidity ^0.8.19;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/security/Pausable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import { IBlast } from "../../../contractsShared/blast/IBlast.sol";
import { IBlastPoints } from "../../../contractsShared/blast/IBlastPoints.sol";
/**
    @title  The Scammers
 */

contract TheScammers is ERC721, Ownable {
    using Strings for uint256;

    IBlast public immutable BLAST;
    address public feeManager;
    address public paymentSplitterAddress;
    
    bool public publicMintIsOpen = false;
    bool public whitelistMintIsOpen = false;
    bool public revealed = false;

    bytes32 public whitelistRoot;

    string private baseURI;
    string private unrevealedBaseURI; 

    uint256 public amountMinted = 0; //doubles as ID number of each token
    uint256 public totalSupply = 2000; 
    uint256 public publicMintPrice = 0.06 ether;
    uint256 public whitelistMintPrice = 0.06 ether;
    uint256 public mintLimitPerWalletPublic = 2;
    uint256 public mintLimitPerWalletWhitelist = 1;

    mapping (address => uint256) public mintedByAddressPublic;
    mapping (address => uint256) public mintedByAddressWhitelist;

    error CantMintZero();
    error MaxSupplyReached();
    error MaxSupplyWillBeReached();
    error ForwardFailed();
    error QueryForNonexistentToken();
    error InsufficientFunds();
    error PublicConditionsNotMet();
    error MintIsClosed();
    error MathError();
    error NotOnWhitelist();

    constructor(string memory _unrevealedURI, string memory _revealedBaseURI, address _feeManager, address _blast, address _blastPoints, address _pointsOperator) ERC721("The Scammers", "SCAM") {
        setUnrevealedBaseURI(_unrevealedURI);
        setBaseURI(_revealedBaseURI);
        ++amountMinted;
        _safeMint(msg.sender, amountMinted);

        feeManager = _feeManager;
        
        BLAST = IBlast(_blast);
        IBlast(_blast).configureClaimableGas();
        IBlastPoints(_blastPoints).configurePointsOperator(_pointsOperator);
    }

    receive() external payable {} //msg.data must be empty
    fallback() external payable {} //when msg.data is not empty

    //=========================================================================
    // MINTING
    //=========================================================================

    
    /// @notice Checks if the amount to be minted is valid
    modifier supplyChecks(uint256 _amount){
        if(_amount == 0) { revert CantMintZero(); }
        if(amountMinted >= totalSupply) { revert MaxSupplyReached(); }
        if(amountMinted + _amount > totalSupply) { revert MaxSupplyWillBeReached(); }
        _;
    }


    /// @notice Mints a token to the sender when public minting is open
    function mintPublic(uint256 _amount) external payable supplyChecks(_amount) {
        address sender = msg.sender;

        if(!publicMintIsOpen && sender != owner()) { revert MintIsClosed(); }
        if(msg.value < publicMintPrice * _amount) { revert InsufficientFunds(); }
        if(mintedByAddressPublic[sender] + _amount > mintLimitPerWalletPublic) { revert PublicConditionsNotMet(); }
        
        mintedByAddressPublic[sender] += _amount;
        
        for(uint256 i = 0; i < _amount; ++i){
            ++amountMinted;
            _safeMint(sender,  amountMinted);
        }
    }

    /// @notice Mints a token to the sender when whitelist minting is open, uses merkle proof. limited to one mint per wallet.
    function mintWhitelist(bytes32[] memory _proof, bytes32 _leaf) external payable supplyChecks(1) {
        address sender = msg.sender;
        if(!whitelistMintIsOpen && sender != owner()) { revert MintIsClosed(); }
        if(!isValidMerkle(_proof, _leaf, sender)) { revert NotOnWhitelist(); }
        if(msg.value < whitelistMintPrice) { revert InsufficientFunds(); }
        if(mintedByAddressWhitelist[sender] >= mintLimitPerWalletWhitelist) { revert PublicConditionsNotMet(); }
        
        ++mintedByAddressWhitelist[sender];
        ++amountMinted;
        _safeMint(sender, amountMinted);    
    }


    /// @notice Verifies merkle proof with OZ library
    function isValidMerkle(bytes32[] memory _proof, bytes32 _leaf, address _mintingAddress) private view returns (bool) {
        bytes32 checcak = keccak256(abi.encodePacked(_mintingAddress));
        if (_leaf == checcak ) {
            return MerkleProof.verify(_proof, whitelistRoot, _leaf);
        } else {
            return false;
        }
    }

    //=========================================================================
    // SETTERS
    //=========================================================================

    function setWhitelistRoot(bytes32 _whitelistRoot) external onlyOwner {
        whitelistRoot = _whitelistRoot;
    }
    
    function setPublicMintIsOpen(bool _publicMintIsOpen) external onlyOwner {
        publicMintIsOpen = _publicMintIsOpen;
    }

    function setWhitelistMintIsOpen(bool _whitelistMintIsOpen) external onlyOwner {
        whitelistMintIsOpen = _whitelistMintIsOpen;
    }
    
    function setPaymentSplitterAddress(address payable _paymentSplitterAddress) external onlyOwner {
        require(_paymentSplitterAddress != address(0));
        paymentSplitterAddress = payable(_paymentSplitterAddress);
    }

    function reveal() external onlyOwner {
        revealed = true;
    }

    function setUnrevealedBaseURI(string memory _uri) public onlyOwner {
        unrevealedBaseURI = _uri;
    }

    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }

    function setPublicMintPrice(uint256 _publicMintPrice) external onlyOwner {
        publicMintPrice = _publicMintPrice;
    }

    function setWhitelistMintPrice(uint256 _whitelistMintPrice) external onlyOwner {
        whitelistMintPrice = _whitelistMintPrice;
    }

    function setWhitelistMintsPerWallet(uint256 _mintLimitPerWalletWhitelist) external onlyOwner {
        mintLimitPerWalletWhitelist = _mintLimitPerWalletWhitelist;
    }

    function setPublicMintsPerWallet(uint256 _mintLimitPerWalletPublic) external onlyOwner {
        mintLimitPerWalletPublic = _mintLimitPerWalletPublic;
    }

    //=========================================================================
    // GETTERS
    //=========================================================================

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        if( !_exists(tokenId) ) { revert QueryForNonexistentToken(); }
        if(revealed){
            return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString(), ".json")) : "";
        } else {
            return bytes(unrevealedBaseURI).length > 0 ? string(abi.encodePacked(unrevealedBaseURI, tokenId.toString(), ".json")) : "";
        }
    }

    function uri(uint256 tokenId) external view returns (string memory) {
        return tokenURI(tokenId);
    }

    function getTotalMintedSoFar() external view returns (uint256) {
        return amountMinted;
    }

    //=========================================================================
    // WITHDRAWALS
    //=========================================================================

    function withdrawERC20FromContract(address _to, address _token) external onlyOwner {
        bool os = IERC20(_token).transfer(_to, IERC20(_token).balanceOf(address(this)));
        if(!os){ revert ForwardFailed(); }
    }

    function withdrawEthFromContract() external onlyOwner  {
        require(paymentSplitterAddress != address(0), "Payment splitter address not set");
        (bool os, ) = payable(paymentSplitterAddress).call{ value: address(this).balance }('');
        if(!os){ revert ForwardFailed(); }
    }
}




