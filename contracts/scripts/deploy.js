/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    0RB SYSTEM - DEPLOYMENT SCRIPT                         ║
 * ║                                                                           ║
 * ║   Deploy the complete 0RB token economy:                                  ║
 * ║   1. ORBToken - The ERC-20 utility token                                  ║
 * ║   2. AgentNFT - The ERC-721 agent ownership                               ║
 * ║   3. ORBStaking - Staking for tier benefits                               ║
 * ║   4. AgentMarketplace - Buy, sell, rent, auction                          ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║          ⟡ 0RB SYSTEM - CONTRACT DEPLOYMENT ⟡              ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const [deployer] = await hre.ethers.getSigners();
  const network = hre.network.name;

  console.log(`Network: ${network}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address))} ETH\n`);

  // Deployment addresses
  const deployed = {};

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 1: Deploy ORBToken
  // ═══════════════════════════════════════════════════════════════════════

  console.log("⟡ Deploying ORBToken...");

  // For deployment, deployer is treasury, team wallet, and liquidity wallet
  // In production, use separate wallets
  const ORBToken = await hre.ethers.getContractFactory("ORBToken");
  const orbToken = await ORBToken.deploy(
    deployer.address, // treasury
    deployer.address, // team wallet
    deployer.address  // liquidity wallet
  );
  await orbToken.waitForDeployment();

  deployed.orbToken = await orbToken.getAddress();
  console.log(`  ✓ ORBToken deployed: ${deployed.orbToken}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 2: Deploy AgentNFT
  // ═══════════════════════════════════════════════════════════════════════

  console.log("⟡ Deploying AgentNFT...");

  const AgentNFT = await hre.ethers.getContractFactory("AgentNFT");
  const agentNFT = await AgentNFT.deploy();
  await agentNFT.waitForDeployment();

  deployed.agentNFT = await agentNFT.getAddress();
  console.log(`  ✓ AgentNFT deployed: ${deployed.agentNFT}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 3: Deploy ORBStaking
  // ═══════════════════════════════════════════════════════════════════════

  console.log("⟡ Deploying ORBStaking...");

  const ORBStaking = await hre.ethers.getContractFactory("ORBStaking");
  const orbStaking = await ORBStaking.deploy(deployed.orbToken);
  await orbStaking.waitForDeployment();

  deployed.staking = await orbStaking.getAddress();
  console.log(`  ✓ ORBStaking deployed: ${deployed.staking}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 4: Deploy AgentMarketplace
  // ═══════════════════════════════════════════════════════════════════════

  console.log("⟡ Deploying AgentMarketplace...");

  const AgentMarketplace = await hre.ethers.getContractFactory("AgentMarketplace");
  const marketplace = await AgentMarketplace.deploy(
    deployed.orbToken,
    deployed.agentNFT
  );
  await marketplace.waitForDeployment();

  deployed.marketplace = await marketplace.getAddress();
  console.log(`  ✓ AgentMarketplace deployed: ${deployed.marketplace}`);

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 5: Post-Deployment Configuration
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n⟡ Configuring contracts...");

  // Fund staking rewards pool (10M tokens)
  const stakingRewards = hre.ethers.parseUnits("10000000", 18);
  await orbToken.approve(deployed.staking, stakingRewards);
  await orbStaking.addRewardsToPool(stakingRewards);
  console.log("  ✓ Staking rewards pool funded");

  // ═══════════════════════════════════════════════════════════════════════
  // STEP 6: Save Deployment Info
  // ═══════════════════════════════════════════════════════════════════════

  const deploymentInfo = {
    network,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    contracts: deployed,
    urls: {
      orbToken: `https://${network === 'base' ? 'basescan.org' : 'etherscan.io'}/address/${deployed.orbToken}`,
      agentNFT: `https://${network === 'base' ? 'basescan.org' : 'etherscan.io'}/address/${deployed.agentNFT}`,
      staking: `https://${network === 'base' ? 'basescan.org' : 'etherscan.io'}/address/${deployed.staking}`,
      marketplace: `https://${network === 'base' ? 'basescan.org' : 'etherscan.io'}/address/${deployed.marketplace}`
    }
  };

  // Save to file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const filename = `${network}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Also save as latest
  fs.writeFileSync(
    path.join(deploymentsDir, `${network}-latest.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log(`\n  ✓ Deployment info saved to: deployments/${filename}`);

  // ═══════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║              ⟡ DEPLOYMENT COMPLETE ⟡                       ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log("\nDeployed Contracts:");
  console.log(`  ORBToken:          ${deployed.orbToken}`);
  console.log(`  AgentNFT:          ${deployed.agentNFT}`);
  console.log(`  ORBStaking:        ${deployed.staking}`);
  console.log(`  AgentMarketplace:  ${deployed.marketplace}`);
  console.log("\n");

  // Return for verification script
  return deployed;
}

// Run main and handle errors
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
