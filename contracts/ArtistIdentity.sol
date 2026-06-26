// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ArtistIdentity is Ownable {
    
    struct ArtistProfile {
        bool isVerified;
        uint256 reputationScore;
        bool exists;
    }

    // Mapping from an artist's wallet address to their profile
    mapping(address => ArtistProfile) private _artists;

    // Events to log changes on the blockchain
    event ArtistVerified(address indexed artistAddress);
    event ReputationUpdated(address indexed artistAddress, uint256 newScore);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Initialize an artist if they don't exist yet. Internal helper.
     */
    function _initializeArtist(address artistAddress) internal {
        if (!_artists[artistAddress].exists) {
            _artists[artistAddress] = ArtistProfile({
                isVerified: false,
                reputationScore: 0,
                exists: true
            });
        }
    }

    /**
     * @dev Verifies an artist. Only the platform Owner (Admin) can call this.
     * @param artistAddress The wallet address of the artist to verify.
     */
    function verifyArtist(address artistAddress) public onlyOwner {
        _initializeArtist(artistAddress);
        
        require(!_artists[artistAddress].isVerified, "Artist is already verified");
        
        _artists[artistAddress].isVerified = true;
        
        emit ArtistVerified(artistAddress);
    }

    /**
     * @dev Updates the reputation score of an artist based on their platform activity.
     * Only the platform Owner (Admin) or authorized smart contracts can call this.
     * @param artistAddress The wallet address of the artist.
     * @param newScore The newly calculated reputation score.
     */
    function updateReputation(address artistAddress, uint256 newScore) public onlyOwner {
        _initializeArtist(artistAddress);
        
        _artists[artistAddress].reputationScore = newScore;
        
        emit ReputationUpdated(artistAddress, newScore);
    }

    /**
     * @dev Retrieves the current verification status and reputation score of an artist.
     * @param artistAddress The wallet address of the artist.
     * @return isVerified Boolean indicating if the artist is verified.
     * @return reputationScore The current reputation score.
     */
    function getArtistStatus(address artistAddress) public view returns (bool isVerified, uint256 reputationScore) {
        ArtistProfile memory profile = _artists[artistAddress];
        return (profile.isVerified, profile.reputationScore);
    }
}
