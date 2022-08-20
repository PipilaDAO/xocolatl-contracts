// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "./IOracle.sol";

interface IHouseOfReserve is IOracle {

    struct Factor{
        uint numerator;
        uint denominator;
    }

    /**
     * @dev Returns the reserveAsset of this HouseOfReserve.
     */
    function reserveAsset() external view returns(address);

    /**
     * @dev Returns the backedAsset of this HouseOfReserve.
     */
    function backedAsset() external view returns(address);

    /**
     * @dev Returns the reserveTokenID (used in {AssetsAccountant}) in HouseOfReserve.
     */
    function reserveTokenID() external view returns(uint);

    /**
    * @dev Returns the type of House Contract.
    */
    function HOUSE_TYPE() external returns(bytes32);

    /**
     * @dev Returns the collateralizationRatio of a HouseOfReserve.
     */
    function collateralRatio() external view returns(Factor memory);

    /**
     * @dev Returns the latest price according to activeOracle
     */
    function getLatestPrice() external view returns(uint256 price);

    /**
     * @dev Deposit reserves in this contract on behalf caller.
     */
    function deposit(uint256 amount) external;

    /**
     * @dev Withdraw reserves in this contract on behalf caller.
     */
    function withdraw(uint256 amount) external;
}