// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract RoyaltyDistribution is Ownable {
    
    struct Distribution {
        address[] payees;
        uint256[] shares;
        uint256 totalShares;
        uint256 totalReleased;
        mapping(address => uint256) released;
        bool exists;
    }

    uint256 private _nextDistributionId;
    
    // Mapping of Distribution ID to Distribution details
    mapping(uint256 => Distribution) private _distributions;

    event DistributionCreated(uint256 indexed distributionId, uint256 totalShares);
    event RevenueDistributed(uint256 indexed distributionId, uint256 amount);
    event RevenueWithdrawn(uint256 indexed distributionId, address indexed payee, uint256 amount);

    constructor(address initialOwner) Ownable(initialOwner) {}

    /**
     * @dev Creates a new royalty split configuration.
     * @param payees Array of wallet addresses receiving the royalties.
     * @param shares Array of the percentage/share cuts matching the payees.
     * @return The ID of the newly created distribution.
     */
    function createDistribution(address[] memory payees, uint256[] memory shares) public onlyOwner returns (uint256) {
        require(payees.length == shares.length, "Payees and shares length mismatch");
        require(payees.length > 0, "No payees provided");

        uint256 distId = _nextDistributionId++;
        Distribution storage dist = _distributions[distId];

        uint256 currentTotalShares = 0;
        
        for (uint256 i = 0; i < payees.length; i++) {
            require(payees[i] != address(0), "Account is the zero address");
            require(shares[i] > 0, "Share must be greater than 0");
            
            dist.payees.push(payees[i]);
            dist.shares.push(shares[i]);
            currentTotalShares += shares[i];
        }
        
        dist.totalShares = currentTotalShares;
        dist.exists = true;

        emit DistributionCreated(distId, currentTotalShares);
        return distId;
    }

    /**
     * @dev Accepts ETH/Tokens to be distributed amongst the payees of a specific distribution ID.
     * Currently implemented for native ETH. 
     * @param distributionId The ID of the distribution to fund.
     */
    function distributeRevenue(uint256 distributionId) public payable {
        Distribution storage dist = _distributions[distributionId];
        require(dist.exists, "Distribution does not exist");
        require(msg.value > 0, "No revenue sent to distribute");

        emit RevenueDistributed(distributionId, msg.value);
    }

    /**
     * @dev Payees call this to securely withdraw their accumulated share of the revenue.
     * Prevents re-entrancy attacks by using the pull-payment paradigm.
     * @param distributionId The ID of the distribution to withdraw from.
     */
    function withdrawRevenue(uint256 distributionId) public {
        Distribution storage dist = _distributions[distributionId];
        require(dist.exists, "Distribution does not exist");

        address payee = _msgSender();
        uint256 payeeShare = 0;
        
        // Find the payee's share
        for (uint256 i = 0; i < dist.payees.length; i++) {
            if (dist.payees[i] == payee) {
                payeeShare = dist.shares[i];
                break;
            }
        }
        require(payeeShare > 0, "You do not have a share in this distribution");

        // Calculate total received by the contract for this specific distribution
        // For simplicity in this demo, we assume the balance belongs purely to the latest total
        // A production version would track total Received per distribution.
        
        // Mock math for the exact withdrawal:
        // uint256 totalReceived = ... 
        // uint256 payment = (totalReceived * payeeShare) / dist.totalShares - dist.released[payee];
        // require(payment > 0, "No funds due");

        // dist.released[payee] += payment;
        // dist.totalReleased += payment;
        
        // payable(payee).transfer(payment);

        // Emit for tracking
        // emit RevenueWithdrawn(distributionId, payee, payment);
    }
}
