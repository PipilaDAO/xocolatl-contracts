const { ethers, upgrades } = require("hardhat");
const { ASSETS, UMA_CONTRACTS } = require("../../scripts/const");

const {
  syncTime
} = require("../utils.js");

const umaFixture = async () => {

  const AssetsAccountant = await ethers.getContractFactory("AssetsAccountant");
  const HouseOfCoin = await ethers.getContractFactory("HouseOfCoin");
  const HouseOfReserve = await ethers.getContractFactory("HouseOfReserve");
  const Xocolatl = await ethers.getContractFactory("Xocolatl");

  // 0.- Set-up weth
  const weth = await ethers.getContractAt("IERC20", ASSETS.polygon.weth.address);

  // 1.- Deploy all contracts
  let accountant = await AssetsAccountant.deploy();
  let coinhouse = await HouseOfCoin.deploy();
  let reservehouse = await HouseOfReserve.deploy();
  let xoc = await upgrades.deployProxy(Xocolatl, [], {
    kind: 'uups',
    unsafeAllow: [
      'delegatecall'
    ]
  });


  // 2.- Initialize house contracts and register with accountant
  await coinhouse.initialize(
    xoc.address,
    accountant.address
  );
  await reservehouse.initialize(
    weth.address,
    xoc.address,
    accountant.address,
    "MXN",
    "ETH",
    weth.address
  );
  await accountant.registerHouse(
    coinhouse.address,
    xoc.address
  );
  await accountant.registerHouse(
    reservehouse.address,
    weth.address
  );

  // 3.- Assign proper roles to coinhouse in fiat ERC20
  const minter = await xoc.MINTER_ROLE();
  const liquidator = await accountant.LIQUIDATOR_ROLE();
  await xoc.grantRole(minter, coinhouse.address);
  await accountant.grantRole(liquidator, coinhouse.address);

  // 4.- Wrap the contracts in redstone-evm-connector
  const w_reservehouse = WrapperBuilder.wrapLite(reservehouse).usingPriceFeed("redstone-stocks");
  const w_coinhouse = WrapperBuilder.wrapLite(coinhouse).usingPriceFeed("redstone-stocks");

  // 5.- Authorize Redstone Provider
  // You can check check evm addresses for providers at: https://api.redstone.finance/providers
  // 'redstone' main demo provider = 0x0C39486f770B26F5527BBBf942726537986Cd7eb; 
  // 'redstone-stocks' demo provider = 0x926E370fD53c23f8B71ad2B3217b227E41A92b12;
  // 'redstone-rapid' demo provider = 0xf786a909D559F5Dee2dc6706d8e5A81728a39aE9;
  const txrh = await reservehouse.authorizeSigner("0x926E370fD53c23f8B71ad2B3217b227E41A92b12");
  await txrh.wait();
  const txch = await coinhouse.authorizeSigner("0x926E370fD53c23f8B71ad2B3217b227E41A92b12");
  await txch.wait();

  // 6.- Assign deposit limit
  const depositLimitAmount = ethers.utils.parseEther("100");
  await reservehouse.setDepositLimit(depositLimitAmount);

  await syncTime();

  console.log("complete utils!");

  return {
    accountant,
    coinhouse,
    w_coinhouse,
    reservehouse,
    w_reservehouse,
    xoc,
    weth
  }
}

module.exports = {
  umaFixture
};