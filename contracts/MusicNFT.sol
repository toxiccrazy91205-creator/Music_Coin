// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MusicNFT is ERC721URIStorage, ERC2981, Ownable {
    
    uint256 private _nextTokenId;

    constructor(address initialOwner) ERC721("Music Coin NFT", "MCNFT") Ownable(initialOwner) {}

    /**
     * @dev Mints a new Music NFT.
     * @param to The address of the receiver.
     * @param tokenURI The metadata URI (IPFS link to song/image data).
     * @param feeNumerator The royalty percentage (e.g., 1000 = 10%).
     */
    function mintNFT(address to, string memory tokenURI, uint96 feeNumerator) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        
        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Set the royalty receiver to the minter (or any specific address) and set the percentage
        _setTokenRoyalty(tokenId, to, feeNumerator);

        return tokenId;
    }

    /**
     * @dev Transfers an NFT. (Standard ERC721 transfer alias for clarity)
     */
    function transferNFT(address from, address to, uint256 tokenId) public {
        // Uses the standard safeTransferFrom from ERC721
        safeTransferFrom(from, to, tokenId, "");
    }

    /**
     * @dev Sets or updates the royalty for a specific token. Only owner can adjust.
     */
    function setRoyalty(uint256 tokenId, address receiver, uint96 feeNumerator) public onlyOwner {
        _setTokenRoyalty(tokenId, receiver, feeNumerator);
    }

    /**
     * @dev Retrieves the metadata URI for a specific token.
     */
    function getMetadata(uint256 tokenId) public view returns (string memory) {
        return tokenURI(tokenId);
    }

    // --- Required Overrides for Solidity Multiple Inheritance ---

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
