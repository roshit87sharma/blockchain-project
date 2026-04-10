async function main() {
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy();

  await escrow.waitForDeployment();  

  const address = await escrow.getAddress(); 

  console.log("Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});