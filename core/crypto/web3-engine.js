/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                                                                           ║
 * ║   ██╗    ██╗███████╗██████╗ ██████╗     ███████╗███╗   ██╗ ██████╗       ║
 * ║   ██║    ██║██╔════╝██╔══██╗╚════██╗    ██╔════╝████╗  ██║██╔════╝       ║
 * ║   ██║ █╗ ██║█████╗  ██████╔╝ █████╔╝    █████╗  ██╔██╗ ██║██║  ███╗      ║
 * ║   ██║███╗██║██╔══╝  ██╔══██╗ ╚═══██╗    ██╔══╝  ██║╚██╗██║██║   ██║      ║
 * ║   ╚███╔███╔╝███████╗██████╔╝██████╔╝    ███████╗██║ ╚████║╚██████╔╝      ║
 * ║    ╚══╝╚══╝ ╚══════╝╚═════╝ ╚═════╝     ╚══════╝╚═╝  ╚═══╝ ╚═════╝       ║
 * ║                                                                           ║
 * ║   REAL WEB3 INTEGRATION - NO MORE SIMULATION                              ║
 * ║   Connect. Trade. Earn. On-chain.                                         ║
 * ║                                                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');

// ═══════════════════════════════════════════════════════════════════════════
// NETWORK CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

const NETWORK_CONFIG = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpc: 'https://eth.llamarpc.com',
    explorer: 'https://etherscan.io',
    currency: 'ETH',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    currency: 'ETH',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  },
  baseSepolia: {
    chainId: 84532,
    name: 'Base Sepolia',
    rpc: 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    currency: 'ETH',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpc: 'https://polygon-rpc.com',
    explorer: 'https://polygonscan.com',
    currency: 'MATIC',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpc: 'https://arb1.arbitrum.io/rpc',
    explorer: 'https://arbiscan.io',
    currency: 'ETH',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  },
  localhost: {
    chainId: 31337,
    name: 'Localhost',
    rpc: 'http://127.0.0.1:8545',
    explorer: null,
    currency: 'ETH',
    contracts: {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT ABIs (Minimal for core functions)
// ═══════════════════════════════════════════════════════════════════════════

const CONTRACT_ABIS = {
  orbToken: [
    // ERC20 Standard
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address owner) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function transferFrom(address from, address to, uint256 amount) returns (bool)',
    // ORB Specific
    'function getTier(address account) view returns (uint8)',
    'function getTierName(address account) view returns (string)',
    'function getVestedAmount(address beneficiary) view returns (uint256)',
    'function claimVested()',
    // Events
    'event Transfer(address indexed from, address indexed to, uint256 value)',
    'event Approval(address indexed owner, address indexed spender, uint256 value)'
  ],

  agentNFT: [
    // ERC721 Standard
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function balanceOf(address owner) view returns (uint256)',
    'function ownerOf(uint256 tokenId) view returns (address)',
    'function tokenURI(uint256 tokenId) view returns (string)',
    'function approve(address to, uint256 tokenId)',
    'function getApproved(uint256 tokenId) view returns (address)',
    'function setApprovalForAll(address operator, bool approved)',
    'function isApprovedForAll(address owner, address operator) view returns (bool)',
    'function transferFrom(address from, address to, uint256 tokenId)',
    'function safeTransferFrom(address from, address to, uint256 tokenId)',
    // Agent Specific
    'function mintAgent(uint8 archetype) payable returns (uint256)',
    'function getAgent(uint256 tokenId) view returns (tuple(uint8 archetype, uint8 rarity, uint256 level, uint256 experience, uint256 tasksCompleted, uint256 reputation, uint256 createdAt, bool isActive, string customName))',
    'function getAgentsByOwner(address owner) view returns (uint256[])',
    'function mintPrices(uint8 archetype) view returns (uint256)',
    'function setCustomName(uint256 tokenId, string name)',
    // Events
    'event AgentMinted(uint256 indexed tokenId, address indexed owner, uint8 archetype, uint8 rarity)',
    'event AgentLevelUp(uint256 indexed tokenId, uint256 newLevel)',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
  ],

  staking: [
    'function stake(uint256 amount)',
    'function increaseStake(uint256 amount)',
    'function unstake()',
    'function claimRewards()',
    'function getStake(address user) view returns (uint256 amount, string tierName, uint256 apy, uint256 pendingRewards, uint256 unlockTime, uint256 boost)',
    'function getPendingRewards(address user) view returns (uint256)',
    'function getUserTier(address user) view returns (string)',
    'function getUserBoost(address user) view returns (uint256)',
    'function getUnlockTime(address user) view returns (uint256)',
    'function getAllTiers() view returns (tuple(string name, uint256 minStake, uint256 apy, uint256 lockDays, uint256 boost)[])',
    'function totalStaked() view returns (uint256)',
    // Events
    'event Staked(address indexed user, uint256 amount, uint256 tierIndex)',
    'event Unstaked(address indexed user, uint256 amount)',
    'event RewardsClaimed(address indexed user, uint256 amount)',
    'event TierUpgraded(address indexed user, uint256 newTierIndex)'
  ],

  marketplace: [
    // Listings
    'function listAgent(uint256 tokenId, uint256 price)',
    'function unlistAgent(uint256 tokenId)',
    'function buyAgent(uint256 tokenId)',
    'function listings(uint256 tokenId) view returns (address seller, uint256 tokenId, uint256 price, bool isActive, uint256 createdAt)',
    'function getActiveListings() view returns (uint256[])',
    // Rentals
    'function listForRent(uint256 tokenId, uint256 dailyRate)',
    'function rentAgent(uint256 tokenId, uint256 days_)',
    'function endRental(uint256 tokenId)',
    'function withdrawFromRental(uint256 tokenId)',
    'function rentals(uint256 tokenId) view returns (address owner, address renter, uint256 tokenId, uint256 dailyRate, uint256 startTime, uint256 endTime, uint256 deposit, bool isActive)',
    'function getActiveRentals() view returns (uint256[])',
    // Auctions
    'function createAuction(uint256 tokenId, uint256 startPrice, uint256 duration)',
    'function placeBid(uint256 tokenId, uint256 amount)',
    'function endAuction(uint256 tokenId)',
    'function auctions(uint256 tokenId) view returns (address seller, uint256 tokenId, uint256 startPrice, uint256 currentBid, address highestBidder, uint256 endTime, bool isActive)',
    'function getActiveAuctions() view returns (uint256[])',
    // Config
    'function platformFee() view returns (uint256)',
    // Events
    'event Listed(uint256 indexed tokenId, address indexed seller, uint256 price)',
    'event Sold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)',
    'event RentalCreated(uint256 indexed tokenId, address indexed owner, uint256 dailyRate)',
    'event RentalStarted(uint256 indexed tokenId, address indexed renter, uint256 endTime)',
    'event AuctionCreated(uint256 indexed tokenId, uint256 startPrice, uint256 endTime)',
    'event BidPlaced(uint256 indexed tokenId, address indexed bidder, uint256 amount)',
    'event AuctionEnded(uint256 indexed tokenId, address indexed winner, uint256 amount)'
  ]
};

// ═══════════════════════════════════════════════════════════════════════════
// WALLET CONNECTOR
// ═══════════════════════════════════════════════════════════════════════════

class WalletConnector extends EventEmitter {
  constructor(config = {}) {
    super();
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;
    this.ethers = null;
  }

  /**
   * Load ethers.js dynamically
   */
  async _loadEthers() {
    if (this.ethers) return this.ethers;

    try {
      // Try to load ethers
      this.ethers = require('ethers');
      return this.ethers;
    } catch (e) {
      console.warn('ethers.js not installed. Install with: npm install ethers');
      throw new Error('ethers.js is required for Web3 functionality');
    }
  }

  /**
   * Connect with private key (for server-side/automated operations)
   */
  async connectWithPrivateKey(privateKey, rpcUrl) {
    const ethers = await this._loadEthers();

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.signer = new ethers.Wallet(privateKey, this.provider);
    this.address = await this.signer.getAddress();

    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);
    this.isConnected = true;

    this.emit('connected', {
      address: this.address,
      chainId: this.chainId
    });

    console.log(`[WALLET] Connected: ${this.address} on chain ${this.chainId}`);

    return this;
  }

  /**
   * Connect with mnemonic
   */
  async connectWithMnemonic(mnemonic, rpcUrl, index = 0) {
    const ethers = await this._loadEthers();

    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${index}`);
    this.signer = wallet.connect(this.provider);
    this.address = await this.signer.getAddress();

    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);
    this.isConnected = true;

    this.emit('connected', {
      address: this.address,
      chainId: this.chainId
    });

    return this;
  }

  /**
   * Connect with RPC only (read-only mode)
   */
  async connectReadOnly(rpcUrl) {
    const ethers = await this._loadEthers();

    this.provider = new ethers.JsonRpcProvider(rpcUrl);

    const network = await this.provider.getNetwork();
    this.chainId = Number(network.chainId);
    this.isConnected = true;

    console.log(`[WALLET] Connected read-only to chain ${this.chainId}`);

    return this;
  }

  /**
   * Get current balance
   */
  async getBalance() {
    if (!this.provider) throw new Error('Not connected');

    const ethers = await this._loadEthers();

    if (this.address) {
      const balance = await this.provider.getBalance(this.address);
      return ethers.formatEther(balance);
    }

    return '0';
  }

  /**
   * Sign a message
   */
  async signMessage(message) {
    if (!this.signer) throw new Error('No signer available');
    return this.signer.signMessage(message);
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.provider = null;
    this.signer = null;
    this.address = null;
    this.chainId = null;
    this.isConnected = false;

    this.emit('disconnected');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTRACT MANAGER
// ═══════════════════════════════════════════════════════════════════════════

class ContractManager extends EventEmitter {
  constructor(wallet) {
    super();
    this.wallet = wallet;
    this.contracts = {};
    this.ethers = null;
  }

  async _loadEthers() {
    if (this.ethers) return this.ethers;
    this.ethers = require('ethers');
    return this.ethers;
  }

  /**
   * Load a contract instance
   */
  async loadContract(name, address, abi) {
    const ethers = await this._loadEthers();

    if (!this.wallet.provider) {
      throw new Error('Wallet not connected');
    }

    const signerOrProvider = this.wallet.signer || this.wallet.provider;
    const contract = new ethers.Contract(address, abi, signerOrProvider);

    this.contracts[name] = contract;
    return contract;
  }

  /**
   * Load all ORB contracts for a network
   */
  async loadAllContracts(networkConfig) {
    const { contracts } = networkConfig;

    if (contracts.orbToken) {
      await this.loadContract('orbToken', contracts.orbToken, CONTRACT_ABIS.orbToken);
    }

    if (contracts.agentNFT) {
      await this.loadContract('agentNFT', contracts.agentNFT, CONTRACT_ABIS.agentNFT);
    }

    if (contracts.staking) {
      await this.loadContract('staking', contracts.staking, CONTRACT_ABIS.staking);
    }

    if (contracts.marketplace) {
      await this.loadContract('marketplace', contracts.marketplace, CONTRACT_ABIS.marketplace);
    }

    console.log(`[CONTRACTS] Loaded ${Object.keys(this.contracts).length} contracts`);

    return this.contracts;
  }

  /**
   * Get contract instance
   */
  get(name) {
    return this.contracts[name];
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION MANAGER
// ═══════════════════════════════════════════════════════════════════════════

class TransactionManager extends EventEmitter {
  constructor(wallet) {
    super();
    this.wallet = wallet;
    this.pendingTxs = new Map();
    this.history = [];
  }

  /**
   * Send a transaction with retry logic
   */
  async sendTransaction(tx, options = {}) {
    const maxRetries = options.maxRetries || 3;
    const confirmations = options.confirmations || 1;

    let attempt = 0;
    let lastError;

    while (attempt < maxRetries) {
      try {
        attempt++;
        console.log(`[TX] Sending transaction (attempt ${attempt}/${maxRetries})...`);

        // Send the transaction
        const response = await tx;

        // Track pending
        this.pendingTxs.set(response.hash, {
          hash: response.hash,
          timestamp: Date.now(),
          status: 'pending'
        });

        this.emit('transaction:sent', { hash: response.hash });

        // Wait for confirmation
        console.log(`[TX] Waiting for ${confirmations} confirmation(s)...`);
        const receipt = await response.wait(confirmations);

        // Update tracking
        const txRecord = {
          hash: response.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          status: receipt.status === 1 ? 'confirmed' : 'failed',
          timestamp: Date.now()
        };

        this.pendingTxs.delete(response.hash);
        this.history.push(txRecord);

        this.emit('transaction:confirmed', txRecord);

        console.log(`[TX] Confirmed in block ${receipt.blockNumber}`);

        return receipt;

      } catch (error) {
        lastError = error;
        console.error(`[TX] Attempt ${attempt} failed:`, error.message);

        if (attempt < maxRetries) {
          // Exponential backoff
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[TX] Retrying in ${delay}ms...`);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(contract, method, args) {
    try {
      const estimate = await contract[method].estimateGas(...args);
      return estimate;
    } catch (error) {
      console.error('[TX] Gas estimation failed:', error.message);
      throw error;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ORB TOKEN WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

class ORBTokenWrapper {
  constructor(contract, txManager) {
    this.contract = contract;
    this.txManager = txManager;
    this.ethers = require('ethers');
  }

  async getInfo() {
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      this.contract.name(),
      this.contract.symbol(),
      this.contract.decimals(),
      this.contract.totalSupply()
    ]);

    return {
      name,
      symbol,
      decimals,
      totalSupply: this.ethers.formatUnits(totalSupply, decimals)
    };
  }

  async balanceOf(address) {
    const balance = await this.contract.balanceOf(address);
    return this.ethers.formatUnits(balance, 18);
  }

  async getTier(address) {
    return this.contract.getTierName(address);
  }

  async approve(spender, amount) {
    const amountWei = this.ethers.parseUnits(amount.toString(), 18);
    const tx = this.contract.approve(spender, amountWei);
    return this.txManager.sendTransaction(tx);
  }

  async transfer(to, amount) {
    const amountWei = this.ethers.parseUnits(amount.toString(), 18);
    const tx = this.contract.transfer(to, amountWei);
    return this.txManager.sendTransaction(tx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// AGENT NFT WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

class AgentNFTWrapper {
  constructor(contract, txManager) {
    this.contract = contract;
    this.txManager = txManager;
    this.ethers = require('ethers');
  }

  async getInfo() {
    const [name, symbol] = await Promise.all([
      this.contract.name(),
      this.contract.symbol()
    ]);
    return { name, symbol };
  }

  async getMintPrice(archetype) {
    const price = await this.contract.mintPrices(archetype);
    return this.ethers.formatEther(price);
  }

  async mint(archetype, options = {}) {
    const price = await this.contract.mintPrices(archetype);
    const tx = this.contract.mintAgent(archetype, { value: price });
    return this.txManager.sendTransaction(tx);
  }

  async getAgent(tokenId) {
    const agent = await this.contract.getAgent(tokenId);
    return {
      archetype: agent.archetype,
      rarity: agent.rarity,
      level: agent.level.toString(),
      experience: agent.experience.toString(),
      tasksCompleted: agent.tasksCompleted.toString(),
      reputation: agent.reputation.toString(),
      createdAt: new Date(Number(agent.createdAt) * 1000),
      isActive: agent.isActive,
      customName: agent.customName
    };
  }

  async getAgentsByOwner(address) {
    const tokenIds = await this.contract.getAgentsByOwner(address);
    return tokenIds.map(id => id.toString());
  }

  async setCustomName(tokenId, name) {
    const tx = this.contract.setCustomName(tokenId, name);
    return this.txManager.sendTransaction(tx);
  }

  async approve(to, tokenId) {
    const tx = this.contract.approve(to, tokenId);
    return this.txManager.sendTransaction(tx);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// STAKING WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

class StakingWrapper {
  constructor(contract, txManager) {
    this.contract = contract;
    this.txManager = txManager;
    this.ethers = require('ethers');
  }

  async getTiers() {
    const tiers = await this.contract.getAllTiers();
    return tiers.map(t => ({
      name: t.name,
      minStake: this.ethers.formatUnits(t.minStake, 18),
      apy: (Number(t.apy) / 100).toFixed(2) + '%',
      lockDays: Number(t.lockDays),
      boost: Number(t.boost) + '%'
    }));
  }

  async getStake(address) {
    const stake = await this.contract.getStake(address);
    return {
      amount: this.ethers.formatUnits(stake.amount, 18),
      tierName: stake.tierName,
      apy: (Number(stake.apy) / 100).toFixed(2) + '%',
      pendingRewards: this.ethers.formatUnits(stake.pendingRewards, 18),
      unlockTime: stake.unlockTime > 0 ? new Date(Number(stake.unlockTime) * 1000) : null,
      boost: Number(stake.boost) + '%'
    };
  }

  async stake(amount) {
    const amountWei = this.ethers.parseUnits(amount.toString(), 18);
    const tx = this.contract.stake(amountWei);
    return this.txManager.sendTransaction(tx);
  }

  async increaseStake(amount) {
    const amountWei = this.ethers.parseUnits(amount.toString(), 18);
    const tx = this.contract.increaseStake(amountWei);
    return this.txManager.sendTransaction(tx);
  }

  async unstake() {
    const tx = this.contract.unstake();
    return this.txManager.sendTransaction(tx);
  }

  async claimRewards() {
    const tx = this.contract.claimRewards();
    return this.txManager.sendTransaction(tx);
  }

  async getPendingRewards(address) {
    const rewards = await this.contract.getPendingRewards(address);
    return this.ethers.formatUnits(rewards, 18);
  }

  async getTotalStaked() {
    const total = await this.contract.totalStaked();
    return this.ethers.formatUnits(total, 18);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE WRAPPER
// ═══════════════════════════════════════════════════════════════════════════

class MarketplaceWrapper {
  constructor(contract, txManager) {
    this.contract = contract;
    this.txManager = txManager;
    this.ethers = require('ethers');
  }

  // === LISTINGS ===

  async listAgent(tokenId, price) {
    const priceWei = this.ethers.parseUnits(price.toString(), 18);
    const tx = this.contract.listAgent(tokenId, priceWei);
    return this.txManager.sendTransaction(tx);
  }

  async unlistAgent(tokenId) {
    const tx = this.contract.unlistAgent(tokenId);
    return this.txManager.sendTransaction(tx);
  }

  async buyAgent(tokenId) {
    const tx = this.contract.buyAgent(tokenId);
    return this.txManager.sendTransaction(tx);
  }

  async getListing(tokenId) {
    const listing = await this.contract.listings(tokenId);
    return {
      seller: listing.seller,
      tokenId: listing.tokenId.toString(),
      price: this.ethers.formatUnits(listing.price, 18),
      isActive: listing.isActive,
      createdAt: new Date(Number(listing.createdAt) * 1000)
    };
  }

  async getActiveListings() {
    const ids = await this.contract.getActiveListings();
    return ids.map(id => id.toString());
  }

  // === RENTALS ===

  async listForRent(tokenId, dailyRate) {
    const rateWei = this.ethers.parseUnits(dailyRate.toString(), 18);
    const tx = this.contract.listForRent(tokenId, rateWei);
    return this.txManager.sendTransaction(tx);
  }

  async rentAgent(tokenId, days) {
    const tx = this.contract.rentAgent(tokenId, days);
    return this.txManager.sendTransaction(tx);
  }

  async endRental(tokenId) {
    const tx = this.contract.endRental(tokenId);
    return this.txManager.sendTransaction(tx);
  }

  async getRental(tokenId) {
    const rental = await this.contract.rentals(tokenId);
    return {
      owner: rental.owner,
      renter: rental.renter,
      tokenId: rental.tokenId.toString(),
      dailyRate: this.ethers.formatUnits(rental.dailyRate, 18),
      startTime: rental.startTime > 0 ? new Date(Number(rental.startTime) * 1000) : null,
      endTime: rental.endTime > 0 ? new Date(Number(rental.endTime) * 1000) : null,
      deposit: this.ethers.formatUnits(rental.deposit, 18),
      isActive: rental.isActive
    };
  }

  async getActiveRentals() {
    const ids = await this.contract.getActiveRentals();
    return ids.map(id => id.toString());
  }

  // === AUCTIONS ===

  async createAuction(tokenId, startPrice, durationSeconds) {
    const priceWei = this.ethers.parseUnits(startPrice.toString(), 18);
    const tx = this.contract.createAuction(tokenId, priceWei, durationSeconds);
    return this.txManager.sendTransaction(tx);
  }

  async placeBid(tokenId, amount) {
    const amountWei = this.ethers.parseUnits(amount.toString(), 18);
    const tx = this.contract.placeBid(tokenId, amountWei);
    return this.txManager.sendTransaction(tx);
  }

  async endAuction(tokenId) {
    const tx = this.contract.endAuction(tokenId);
    return this.txManager.sendTransaction(tx);
  }

  async getAuction(tokenId) {
    const auction = await this.contract.auctions(tokenId);
    return {
      seller: auction.seller,
      tokenId: auction.tokenId.toString(),
      startPrice: this.ethers.formatUnits(auction.startPrice, 18),
      currentBid: this.ethers.formatUnits(auction.currentBid, 18),
      highestBidder: auction.highestBidder,
      endTime: new Date(Number(auction.endTime) * 1000),
      isActive: auction.isActive
    };
  }

  async getActiveAuctions() {
    const ids = await this.contract.getActiveAuctions();
    return ids.map(id => id.toString());
  }

  async getPlatformFee() {
    const fee = await this.contract.platformFee();
    return (Number(fee) / 100).toFixed(2) + '%';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// WEB3 ENGINE - THE MAIN ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════════════

class Web3Engine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      network: config.network || 'base',
      ...config
    };

    this.networkConfig = NETWORK_CONFIG[this.config.network];
    if (!this.networkConfig) {
      throw new Error(`Unknown network: ${this.config.network}`);
    }

    // Initialize components
    this.wallet = new WalletConnector();
    this.contractManager = new ContractManager(this.wallet);
    this.txManager = new TransactionManager(this.wallet);

    // Contract wrappers (initialized after contracts load)
    this.contracts = {
      orbToken: null,
      agentNFT: null,
      staking: null,
      marketplace: null
    };

    this.isConnected = false;
  }

  /**
   * Connect with private key
   */
  async connect(options = {}) {
    const { privateKey, mnemonic, readOnly } = options;
    const rpcUrl = options.rpcUrl || this.networkConfig.rpc;

    // Connect wallet
    if (privateKey) {
      await this.wallet.connectWithPrivateKey(privateKey, rpcUrl);
    } else if (mnemonic) {
      await this.wallet.connectWithMnemonic(mnemonic, rpcUrl);
    } else {
      await this.wallet.connectReadOnly(rpcUrl);
    }

    // Load contracts if addresses are configured
    if (Object.values(this.networkConfig.contracts).some(v => v)) {
      await this.contractManager.loadAllContracts(this.networkConfig);

      // Initialize wrappers
      if (this.contractManager.get('orbToken')) {
        this.contracts.orbToken = new ORBTokenWrapper(
          this.contractManager.get('orbToken'),
          this.txManager
        );
      }

      if (this.contractManager.get('agentNFT')) {
        this.contracts.agentNFT = new AgentNFTWrapper(
          this.contractManager.get('agentNFT'),
          this.txManager
        );
      }

      if (this.contractManager.get('staking')) {
        this.contracts.staking = new StakingWrapper(
          this.contractManager.get('staking'),
          this.txManager
        );
      }

      if (this.contractManager.get('marketplace')) {
        this.contracts.marketplace = new MarketplaceWrapper(
          this.contractManager.get('marketplace'),
          this.txManager
        );
      }
    }

    this.isConnected = true;

    this.emit('connected', {
      network: this.config.network,
      address: this.wallet.address,
      chainId: this.wallet.chainId
    });

    return this;
  }

  /**
   * Set contract addresses (for when contracts are deployed)
   */
  setContractAddresses(addresses) {
    this.networkConfig.contracts = {
      ...this.networkConfig.contracts,
      ...addresses
    };
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      connected: this.isConnected,
      network: this.config.network,
      chainId: this.wallet.chainId,
      address: this.wallet.address,
      contracts: {
        orbToken: !!this.contracts.orbToken,
        agentNFT: !!this.contracts.agentNFT,
        staking: !!this.contracts.staking,
        marketplace: !!this.contracts.marketplace
      }
    };
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.wallet.disconnect();
    this.isConnected = false;
    this.emit('disconnected');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  Web3Engine,
  WalletConnector,
  ContractManager,
  TransactionManager,
  ORBTokenWrapper,
  AgentNFTWrapper,
  StakingWrapper,
  MarketplaceWrapper,
  CONTRACT_ABIS,
  NETWORK_CONFIG
};
