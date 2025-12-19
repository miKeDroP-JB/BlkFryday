/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    0RB SYSTEM - CONTRACT TESTS                            ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("0RB System", function () {
  let orbToken, agentNFT, staking, marketplace;
  let owner, treasury, user1, user2;

  beforeEach(async function () {
    [owner, treasury, user1, user2] = await ethers.getSigners();

    // Deploy ORBToken
    const ORBToken = await ethers.getContractFactory("ORBToken");
    orbToken = await ORBToken.deploy(treasury.address, owner.address, owner.address);

    // Deploy AgentNFT
    const AgentNFT = await ethers.getContractFactory("AgentNFT");
    agentNFT = await AgentNFT.deploy();

    // Deploy Staking
    const ORBStaking = await ethers.getContractFactory("ORBStaking");
    staking = await ORBStaking.deploy(await orbToken.getAddress());

    // Deploy Marketplace
    const AgentMarketplace = await ethers.getContractFactory("AgentMarketplace");
    marketplace = await AgentMarketplace.deploy(
      await orbToken.getAddress(),
      await agentNFT.getAddress()
    );
  });

  describe("ORBToken", function () {
    it("Should have correct name and symbol", async function () {
      expect(await orbToken.name()).to.equal("ORB Token");
      expect(await orbToken.symbol()).to.equal("0RB");
    });

    it("Should have correct total supply", async function () {
      const totalSupply = await orbToken.totalSupply();
      expect(totalSupply).to.equal(ethers.parseUnits("1000000000", 18));
    });

    it("Should allow transfers", async function () {
      const amount = ethers.parseUnits("1000", 18);
      await orbToken.transfer(user1.address, amount);
      expect(await orbToken.balanceOf(user1.address)).to.equal(amount);
    });

    it("Should return correct tier for balance", async function () {
      // Transfer enough for OBSERVER tier
      await orbToken.transfer(user1.address, ethers.parseUnits("1000", 18));
      expect(await orbToken.getTierName(user1.address)).to.equal("Observer");

      // Transfer enough for AWAKENED tier
      await orbToken.transfer(user2.address, ethers.parseUnits("10000", 18));
      expect(await orbToken.getTierName(user2.address)).to.equal("Awakened");
    });
  });

  describe("AgentNFT", function () {
    it("Should have correct name and symbol", async function () {
      expect(await agentNFT.name()).to.equal("0RB Agent");
      expect(await agentNFT.symbol()).to.equal("0RBAGENT");
    });

    it("Should mint agents with payment", async function () {
      const mintPrice = await agentNFT.mintPrices(0); // APOLLO
      await agentNFT.connect(user1).mintAgent(0, { value: mintPrice });

      expect(await agentNFT.balanceOf(user1.address)).to.equal(1);
    });

    it("Should assign random rarity on mint", async function () {
      const mintPrice = await agentNFT.mintPrices(0);
      await agentNFT.connect(user1).mintAgent(0, { value: mintPrice });

      const agent = await agentNFT.getAgent(0);
      expect(agent.rarity).to.be.lessThanOrEqual(5); // COMMON to MYTHIC
    });

    it("Should track agent stats", async function () {
      const mintPrice = await agentNFT.mintPrices(0);
      await agentNFT.connect(user1).mintAgent(0, { value: mintPrice });

      const agent = await agentNFT.getAgent(0);
      expect(agent.level).to.equal(1);
      expect(agent.experience).to.equal(0);
      expect(agent.tasksCompleted).to.equal(0);
    });
  });

  describe("ORBStaking", function () {
    beforeEach(async function () {
      // Transfer tokens to user1 for staking
      await orbToken.transfer(user1.address, ethers.parseUnits("100000", 18));
      await orbToken.connect(user1).approve(
        await staking.getAddress(),
        ethers.parseUnits("100000", 18)
      );

      // Fund rewards pool
      await orbToken.approve(await staking.getAddress(), ethers.parseUnits("1000000", 18));
      await staking.addRewardsToPool(ethers.parseUnits("1000000", 18));
    });

    it("Should allow staking", async function () {
      await staking.connect(user1).stake(ethers.parseUnits("10000", 18));

      const stake = await staking.stakes(user1.address);
      expect(stake.amount).to.equal(ethers.parseUnits("10000", 18));
    });

    it("Should assign correct tier", async function () {
      await staking.connect(user1).stake(ethers.parseUnits("10000", 18));
      expect(await staking.getUserTier(user1.address)).to.equal("Awakened");

      // Stake more to upgrade
      await staking.connect(user1).increaseStake(ethers.parseUnits("90000", 18));
      expect(await staking.getUserTier(user1.address)).to.equal("Architect");
    });

    it("Should accumulate rewards", async function () {
      await staking.connect(user1).stake(ethers.parseUnits("10000", 18));

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [86400 * 30]); // 30 days
      await ethers.provider.send("evm_mine");

      const pending = await staking.getPendingRewards(user1.address);
      expect(pending).to.be.gt(0);
    });
  });

  describe("AgentMarketplace", function () {
    beforeEach(async function () {
      // Mint an agent for user1
      const mintPrice = await agentNFT.mintPrices(0);
      await agentNFT.connect(user1).mintAgent(0, { value: mintPrice });

      // Approve marketplace
      await agentNFT.connect(user1).setApprovalForAll(await marketplace.getAddress(), true);

      // Give user2 tokens to buy
      await orbToken.transfer(user2.address, ethers.parseUnits("1000", 18));
      await orbToken.connect(user2).approve(
        await marketplace.getAddress(),
        ethers.parseUnits("1000", 18)
      );
    });

    it("Should list agents for sale", async function () {
      await marketplace.connect(user1).listAgent(0, ethers.parseUnits("100", 18));

      const listing = await marketplace.listings(0);
      expect(listing.isActive).to.be.true;
      expect(listing.seller).to.equal(user1.address);
    });

    it("Should allow buying listed agents", async function () {
      await marketplace.connect(user1).listAgent(0, ethers.parseUnits("100", 18));
      await marketplace.connect(user2).buyAgent(0);

      expect(await agentNFT.ownerOf(0)).to.equal(user2.address);
    });

    it("Should list agents for rent", async function () {
      await marketplace.connect(user1).listForRent(0, ethers.parseUnits("10", 18));

      const rental = await marketplace.rentals(0);
      expect(rental.isActive).to.be.true;
      expect(rental.owner).to.equal(user1.address);
    });

    it("Should create auctions", async function () {
      await marketplace.connect(user1).createAuction(
        0,
        ethers.parseUnits("50", 18),
        3600 // 1 hour
      );

      const auction = await marketplace.auctions(0);
      expect(auction.isActive).to.be.true;
      expect(auction.startPrice).to.equal(ethers.parseUnits("50", 18));
    });
  });
});
