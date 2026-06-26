// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EventTicket is ERC721, Ownable {
    
    struct Event {
        string name;
        uint256 ticketPrice;
        uint256 maxCapacity;
        uint256 ticketsMinted;
        address organizer;
        bool isActive;
    }

    uint256 private _nextEventId;
    uint256 private _nextTokenId;

    // Mapping from event ID to Event details
    mapping(uint256 => Event) public events;
    
    // Mapping from token ID to its Event ID
    mapping(uint256 => uint256) public ticketToEvent;
    
    // Mapping from token ID to whether it has been used/scanned
    mapping(uint256 => bool) public isTicketUsed;

    constructor(address initialOwner) ERC721("Music Coin Ticket", "MCTIX") Ownable(initialOwner) {}

    /**
     * @dev Create a new Event.
     * @param name The name of the event.
     * @param ticketPrice The price per ticket in wei.
     * @param maxCapacity The maximum number of tickets available.
     */
    function createEvent(string memory name, uint256 ticketPrice, uint256 maxCapacity) public returns (uint256) {
        uint256 eventId = _nextEventId++;
        
        events[eventId] = Event({
            name: name,
            ticketPrice: ticketPrice,
            maxCapacity: maxCapacity,
            ticketsMinted: 0,
            organizer: _msgSender(),
            isActive: true
        });

        return eventId;
    }

    /**
     * @dev Mint an NFT Ticket for a specific event. User must send the exact ticket price.
     * @param eventId The ID of the event to buy a ticket for.
     */
    function mintTicket(uint256 eventId) public payable returns (uint256) {
        Event storage evt = events[eventId];
        require(evt.isActive, "Event is not active");
        require(evt.ticketsMinted < evt.maxCapacity, "Event is sold out");
        require(msg.value == evt.ticketPrice, "Incorrect ticket price sent");

        uint256 tokenId = _nextTokenId++;
        
        evt.ticketsMinted++;
        ticketToEvent[tokenId] = eventId;
        isTicketUsed[tokenId] = false;

        _mint(_msgSender(), tokenId);

        // Forward the payment to the organizer
        if (evt.ticketPrice > 0) {
            (bool success, ) = evt.organizer.call{value: msg.value}("");
            require(success, "Payment to organizer failed");
        }

        return tokenId;
    }

    /**
     * @dev Verify and scan a ticket at the door. Only the organizer can do this.
     * @param tokenId The ID of the ticket to verify.
     */
    function verifyTicket(uint256 tokenId) public {
        uint256 eventId = ticketToEvent[tokenId];
        Event memory evt = events[eventId];
        
        require(_ownerOf(tokenId) != address(0), "Ticket does not exist");
        require(evt.organizer == _msgSender() || owner() == _msgSender(), "Only Organizer or Admin can verify");
        require(!isTicketUsed[tokenId], "Ticket has already been used");

        isTicketUsed[tokenId] = true;
    }

    /**
     * @dev Transfers a Ticket NFT. (Standard ERC721 transfer alias for clarity)
     */
    function transferTicket(address from, address to, uint256 tokenId) public {
        // Prevent transferring of a used ticket
        require(!isTicketUsed[tokenId], "Cannot transfer a used ticket");
        
        // Uses the standard safeTransferFrom from ERC721
        safeTransferFrom(from, to, tokenId, "");
    }
}
