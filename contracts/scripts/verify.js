/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    0RB SYSTEM - CONTRACT VERIFICATION                     ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const network = hre.network.name;
  console.log(`\n⟡ Verifying contracts on ${network}...\n`);

  // Load deployment info
  const deploymentPath = path.join(__dirname, `../deployments/${network}-latest.json`);

  if (!fs.existsSync(deploymentPath)) {
    console.error(`No deployment found for ${network}`);
    console.error("Run 'npx hardhat run scripts/deploy.js --network " + network + "' first");
    process.exit(1);
  }

  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  const [deployer] = await hre.ethers.getSigners();

  // Verify ORBToken
  console.log("⟡ Verifying ORBToken...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.orbToken,
      constructorArguments: [
        deployer.address,
        deployer.address,
        deployer.address
      ]
    });
    console.log("  ✓ ORBToken verified");
  } catch (e) {
    console.log("  ⚠ ORBToken verification:", e.message);
  }

  // Verify AgentNFT
  console.log("⟡ Verifying AgentNFT...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.agentNFT,
      constructorArguments: []
    });
    console.log("  ✓ AgentNFT verified");
  } catch (e) {
    console.log("  ⚠ AgentNFT verification:", e.message);
  }

  // Verify ORBStaking
  console.log("⟡ Verifying ORBStaking...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.staking,
      constructorArguments: [deployment.contracts.orbToken]
    });
    console.log("  ✓ ORBStaking verified");
  } catch (e) {
    console.log("  ⚠ ORBStaking verification:", e.message);
  }

  // Verify AgentMarketplace
  console.log("⟡ Verifying AgentMarketplace...");
  try {
    await hre.run("verify:verify", {
      address: deployment.contracts.marketplace,
      constructorArguments: [
        deployment.contracts.orbToken,
        deployment.contracts.agentNFT
      ]
    });
    console.log("  ✓ AgentMarketplace verified");
  } catch (e) {
    console.log("  ⚠ AgentMarketplace verification:", e.message);
  }

  console.log("\n⟡ Verification complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
