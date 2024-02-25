const hre = require("hardhat");

async function main() {
  //get deployer address
  const [deployer] = await hre.ethers.getSigners();
  const addresses = [deployer.address];
  const amounts = [hre.ethers.utils.parseEther("1000000")];

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockERC20 = await MockERC20.connect(deployer).deploy(18);
  await mockERC20.deployed();

  //mint amounts to addresses
  for (let i = 0; i < addresses.length; i++) {
    await mockERC20.connect(deployer).mint(addresses[i], amounts[i]);
  }
  //approve router
  const approveTxn = await mockERC20.connect(deployer).approve("0x2Ee143bfA8BE928613b5e8E669e7d4d084EFF756", hre.ethers.constants.MaxUint256);
  await approveTxn.wait();

  console.log("address: ", mockERC20.address)

  return mockERC20.address;
}

// module.exports = {
//   main
// };

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });