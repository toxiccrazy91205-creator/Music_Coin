// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract FanToken is ERC20, Ownable {
    
    // Staking tracking
    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public stakingTimestamp;
    mapping(address => uint256) public rewardBalance;

    // Staking reward rate: 1 token per 1000 staked per day (example)
    uint256 public constant REWARD_RATE = 1000; 
    uint256 public constant SECONDS_IN_DAY = 86400;

    constructor(address initialOwner) ERC20("Music Coin Fan Token", "MCFT") Ownable(initialOwner) {}

    /**
     * @dev Mint new Fan Tokens. Only owner (Admin) can mint.
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    /**
     * @dev Burn Fan Tokens from caller's account.
     */
    function burn(uint256 amount) public {
        _burn(_msgSender(), amount);
    }

    /**
     * @dev Stake tokens into the contract
     */
    function stake(uint256 amount) public {
        require(amount > 0, "Cannot stake 0");
        require(balanceOf(_msgSender()) >= amount, "Insufficient balance to stake");

        // Calculate and save pending rewards before adding new stake
        _updateRewards(_msgSender());

        _transfer(_msgSender(), address(this), amount);
        stakedBalance[_msgSender()] += amount;
        stakingTimestamp[_msgSender()] = block.timestamp;
    }

    /**
     * @dev Unstake tokens and withdraw them back to wallet
     */
    function unstake(uint256 amount) public {
        require(amount > 0, "Cannot unstake 0");
        require(stakedBalance[_msgSender()] >= amount, "Insufficient staked balance");

        // Calculate and save pending rewards before unstaking
        _updateRewards(_msgSender());

        stakedBalance[_msgSender()] -= amount;
        _transfer(address(this), _msgSender(), amount);
    }

    /**
     * @dev Claim accrued rewards
     */
    function claimRewards() public {
        _updateRewards(_msgSender());
        uint256 reward = rewardBalance[_msgSender()];
        require(reward > 0, "No rewards to claim");

        rewardBalance[_msgSender()] = 0;
        _mint(_msgSender(), reward);
    }

    /**
     * @dev Internal function to calculate and update accrued rewards
     */
    function _updateRewards(address account) internal {
        if (stakedBalance[account] > 0) {
            uint256 timeStaked = block.timestamp - stakingTimestamp[account];
            uint256 daysStaked = timeStaked / SECONDS_IN_DAY;
            
            if (daysStaked > 0) {
                uint256 reward = (stakedBalance[account] * daysStaked) / REWARD_RATE;
                rewardBalance[account] += reward;
                // Reset timestamp for remaining stake
                stakingTimestamp[account] = block.timestamp;
            }
        } else {
            stakingTimestamp[account] = block.timestamp;
        }
    }
}
