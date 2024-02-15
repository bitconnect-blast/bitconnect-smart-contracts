const hre = require("hardhat");

async function main(addresses, amounts, verify) {

  //get deployer address
  const [deployer] = await hre.ethers.getSigners();

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.connect(deployer).deploy(18);
  await mockERC20.deployed();

  //mint amounts to addresses
  for (let i = 0; i < addresses.length; i++) {
    await mockERC20.connect(deployer).mint(addresses[i], amounts[i]);
  }

  return mockERC20.address;
}

module.exports = {
  main
};