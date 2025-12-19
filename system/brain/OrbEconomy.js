/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║                   ORB ECONOMY - TOKENIZED INTELLIGENCE                        ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║                                                                              ║
 * ║  "Own the workforce of the future. Rent it out today."                       ║
 * ║                                                                              ║
 * ║  Features:                                                                   ║
 * ║  • $0RB Token Economy                                                        ║
 * ║  • Agent NFT Ownership                                                       ║
 * ║  • Rental Marketplace                                                        ║
 * ║  • Staking Tiers (Observer → Oracle)                                         ║
 * ║  • Revenue Sharing                                                           ║
 * ║                                                                              ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════════════════
// $0RB TOKEN CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const ORB_TOKEN = {
  name: '0RB Token',
  symbol: '$0RB',
  decimals: 18,
  totalSupply: 1_000_000_000, // 1 billion
  networks: ['ethereum', 'polygon', 'base', 'solana'],
  distribution: {
    community: 0.40,      // 400M - Airdrops, rewards, staking
    development: 0.20,    // 200M - Team and development
    treasury: 0.20,       // 200M - DAO treasury
    liquidity: 0.10,      // 100M - DEX liquidity
    marketing: 0.10       // 100M - Marketing and partnerships
  }
};

// ═══════════════════════════════════════════════════════════════
// STAKING TIERS - Power Levels
// ═══════════════════════════════════════════════════════════════

const STAKING_TIERS = {
  OBSERVER: {
    name: 'Observer',
    symbol: '👁️',
    minStake: 1_000,
    benefits: ['Basic agent access', 'Standard rental rates', 'Community forum'],
    feeDiscount: 0,
    earningsBoost: 0,
    color: '#95a5a6'
  },
  AWAKENED: {
    name: 'Awakened',
    symbol: '✨',
    minStake: 10_000,
    benefits: ['Priority rentals', '10% fee discount', 'Early access', 'Discord channel'],
    feeDiscount: 0.10,
    earningsBoost: 0.05,
    color: '#3498db'
  },
  ARCHITECT: {
    name: 'Architect',
    symbol: '🏛️',
    minStake: 100_000,
    benefits: ['Agent minting', '25% fee discount', 'Custom training', 'Beta access'],
    feeDiscount: 0.25,
    earningsBoost: 0.15,
    color: '#9b59b6'
  },
  ORACLE: {
    name: 'Oracle',
    symbol: '🔮',
    minStake: 1_000_000,
    benefits: ['Governance voting', 'Revenue share', '50% fee discount', 'Advisory board'],
    feeDiscount: 0.50,
    earningsBoost: 0.30,
    color: '#f1c40f'
  }
};

// ═══════════════════════════════════════════════════════════════
// AGENT RENTAL RATES (per hour in $0RB)
// ═══════════════════════════════════════════════════════════════

const AGENT_RENTAL_RATES = {
  APOLLO: { base: 100, premium: 150, description: 'Vision & Strategy' },
  ATHENA: { base: 100, premium: 150, description: 'Wisdom & Analysis' },
  HERMES: { base: 80, premium: 120, description: 'Communication & Speed' },
  ARES: { base: 90, premium: 135, description: 'Execution & Force' },
  HEPHAESTUS: { base: 110, premium: 165, description: 'Creation & Craft' },
  ARTEMIS: { base: 100, premium: 150, description: 'Precision & Targeting' },
  MERCURY: { base: 95, premium: 140, description: 'Speed & Commerce' },
  // Swarm packages
  LAUNCH_SQUAD: { base: 400, premium: 600, description: '5 agents for launch' },
  PANTHEON_UNITED: { base: 600, premium: 900, description: 'All 7 agents unified' },
  HIVEMIND: { base: 1000, premium: 1500, description: 'Full consciousness merge' }
};

// ═══════════════════════════════════════════════════════════════
// WALLET CLASS
// ═══════════════════════════════════════════════════════════════

class OrbWallet {
  constructor(userId) {
    this.id = `wallet-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.userId = userId;
    this.address = '0x' + crypto.randomBytes(20).toString('hex');
    this.balances = {
      ORB: 0,
      ETH: 0,
      USDC: 0
    };
    this.stakedAmount = 0;
    this.stakingTier = null;
    this.ownedAgents = [];
    this.rentedAgents = [];
    this.earnings = {
      total: 0,
      pending: 0,
      withdrawn: 0
    };
    this.rentalHistory = [];
    this.created = Date.now();
  }

  deposit(token, amount) {
    if (!this.balances.hasOwnProperty(token)) {
      throw new Error(`Unsupported token: ${token}`);
    }
    this.balances[token] += amount;
    return this.balances[token];
  }

  withdraw(token, amount) {
    if (this.balances[token] < amount) {
      throw new Error('Insufficient balance');
    }
    this.balances[token] -= amount;
    return this.balances[token];
  }

  stake(amount) {
    if (this.balances.ORB < amount) {
      throw new Error('Insufficient ORB balance');
    }
    this.balances.ORB -= amount;
    this.stakedAmount += amount;
    this.updateTier();
    return this.stakedAmount;
  }

  unstake(amount) {
    if (this.stakedAmount < amount) {
      throw new Error('Insufficient staked amount');
    }
    this.stakedAmount -= amount;
    this.balances.ORB += amount;
    this.updateTier();
    return this.stakedAmount;
  }

  updateTier() {
    const tiers = Object.entries(STAKING_TIERS).reverse();
    for (const [tierName, tier] of tiers) {
      if (this.stakedAmount >= tier.minStake) {
        this.stakingTier = tierName;
        return;
      }
    }
    this.stakingTier = null;
  }

  getTierInfo() {
    if (!this.stakingTier) return null;
    return STAKING_TIERS[this.stakingTier];
  }

  getStatus() {
    return {
      id: this.id,
      address: this.address,
      balances: this.balances,
      stakedAmount: this.stakedAmount,
      stakingTier: this.stakingTier,
      tierInfo: this.getTierInfo(),
      ownedAgents: this.ownedAgents.length,
      rentedAgents: this.rentedAgents.length,
      earnings: this.earnings
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// RENTAL CONTRACT
// ═══════════════════════════════════════════════════════════════

class RentalContract {
  constructor(listing, renterId, duration) {
    this.id = `contract-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    this.listingId = listing.id;
    this.agentId = listing.agentId;
    this.ownerId = listing.ownerId;
    this.renterId = renterId;
    this.duration = duration; // hours
    this.pricePerHour = listing.pricePerHour;
    this.totalPrice = listing.pricePerHour * duration;
    this.platformFee = this.totalPrice * 0.15; // 15% platform fee
    this.ownerEarnings = this.totalPrice * 0.85; // 85% to owner
    this.status = 'PENDING';
    this.created = Date.now();
    this.started = null;
    this.completed = null;
    this.escrow = {
      deposited: false,
      amount: this.totalPrice,
      released: false
    };
  }

  start() {
    this.started = Date.now();
    this.status = 'ACTIVE';
    return true;
  }

  complete(success = true) {
    this.completed = Date.now();
    this.status = success ? 'COMPLETED' : 'DISPUTED';
    return true;
  }

  release() {
    this.escrow.released = true;
    return {
      ownerPayout: this.ownerEarnings,
      platformFee: this.platformFee
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// ORB ECONOMY ENGINE
// ═══════════════════════════════════════════════════════════════

class OrbEconomy extends EventEmitter {
  constructor(config = {}) {
    super();
    this.token = ORB_TOKEN;
    this.tiers = STAKING_TIERS;
    this.rates = AGENT_RENTAL_RATES;
    this.wallets = new Map();
    this.walletsByUserId = new Map();  // Index for O(1) lookup by userId
    this.listings = new Map();
    this.contracts = new Map();
    this.stats = {
      totalVolume: 0,
      totalRentals: 0,
      activeRentals: 0,
      totalStaked: 0,
      platformEarnings: 0,
      agentsListed: 0
    };
    this.initialized = false;
  }

  /**
   * Initialize economy
   */
  async initialize() {
    console.log('[ORB ECONOMY] Initializing tokenized intelligence marketplace...');
    console.log(`[ORB ECONOMY] Token: ${this.token.symbol} (${this.token.totalSupply.toLocaleString()} supply)`);
    console.log(`[ORB ECONOMY] Networks: ${this.token.networks.join(', ')}`);
    console.log(`[ORB ECONOMY] Staking Tiers: ${Object.keys(this.tiers).join(', ')}`);

    this.initialized = true;
    this.emit('initialized');

    return true;
  }

  // ═══════════════════════════════════════════════════════════
  // WALLET OPERATIONS
  // ═══════════════════════════════════════════════════════════

  /**
   * Connect or create wallet - O(1) lookup via userId index
   */
  connectWallet(userId) {
    // O(1) lookup using index
    let wallet = this.walletsByUserId.get(userId);

    if (!wallet) {
      wallet = new OrbWallet(userId);
      this.wallets.set(wallet.id, wallet);
      this.walletsByUserId.set(userId, wallet);  // Index by userId
      console.log(`[ORB ECONOMY] Wallet connected: ${wallet.address.substring(0, 10)}...`);
      this.emit('wallet:connected', wallet);
    }

    return wallet;
  }

  /**
   * Get wallet
   */
  getWallet(walletId) {
    return this.wallets.get(walletId);
  }

  /**
   * Airdrop tokens (for testing/rewards)
   */
  airdrop(walletId, amount) {
    // Input validation
    if (!walletId || typeof walletId !== 'string') {
      throw new Error('walletId is required and must be a string');
    }
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      throw new Error('amount must be a positive finite number');
    }

    const wallet = this.wallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');

    wallet.deposit('ORB', amount);
    this.emit('airdrop', { walletId, amount });
    console.log(`[ORB ECONOMY] Airdropped ${amount} $ORB to ${wallet.address.substring(0, 10)}...`);

    return wallet.balances.ORB;
  }

  /**
   * Stake tokens
   */
  stake(walletId, amount) {
    // Input validation
    if (!walletId || typeof walletId !== 'string') {
      throw new Error('walletId is required and must be a string');
    }
    if (typeof amount !== 'number' || amount <= 0 || !Number.isFinite(amount)) {
      throw new Error('amount must be a positive finite number');
    }

    const wallet = this.wallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const oldTier = wallet.stakingTier;
    wallet.stake(amount);
    this.stats.totalStaked += amount;

    if (wallet.stakingTier !== oldTier) {
      console.log(`[ORB ECONOMY] 🎉 Tier upgrade: ${oldTier || 'None'} → ${wallet.stakingTier}`);
      this.emit('tier:upgrade', { walletId, oldTier, newTier: wallet.stakingTier });
    }

    return wallet.getStatus();
  }

  // ═══════════════════════════════════════════════════════════
  // AGENT MARKETPLACE
  // ═══════════════════════════════════════════════════════════

  /**
   * List agent for rental
   */
  listAgent(walletId, agentId, options = {}) {
    const wallet = this.wallets.get(walletId);
    if (!wallet) throw new Error('Wallet not found');

    const baseRate = this.rates[agentId]?.base || 100;
    const pricePerHour = options.pricePerHour || baseRate;

    const listing = {
      id: `listing-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
      agentId,
      ownerId: walletId,
      pricePerHour,
      minHours: options.minHours || 1,
      maxHours: options.maxHours || 24,
      status: 'ACTIVE',
      created: Date.now(),
      totalRentals: 0,
      totalEarnings: 0,
      rating: 5.0
    };

    this.listings.set(listing.id, listing);
    wallet.ownedAgents.push(agentId);
    this.stats.agentsListed++;

    console.log(`[ORB ECONOMY] Agent listed: ${agentId} @ ${pricePerHour} $ORB/hr`);
    this.emit('listing:created', listing);

    return listing;
  }

  /**
   * Get available listings
   */
  getListings(filters = {}) {
    let listings = Array.from(this.listings.values()).filter(l => l.status === 'ACTIVE');

    if (filters.agentId) {
      listings = listings.filter(l => l.agentId === filters.agentId);
    }

    if (filters.maxPrice) {
      listings = listings.filter(l => l.pricePerHour <= filters.maxPrice);
    }

    return listings;
  }

  /**
   * Rent an agent
   * Uses optimistic locking to prevent race conditions
   */
  async rentAgent(listingId, renterWalletId, duration) {
    const listing = this.listings.get(listingId);
    if (!listing) throw new Error('Listing not found');
    if (listing.status !== 'ACTIVE') throw new Error('Listing not available');

    // Optimistic lock - temporarily mark as renting to prevent double-booking
    const originalStatus = listing.status;
    listing.status = 'RENTING';

    try {
      const renterWallet = this.wallets.get(renterWalletId);
      if (!renterWallet) {
        listing.status = originalStatus;
        throw new Error('Renter wallet not found');
      }

      // Create contract
      const contract = new RentalContract(listing, renterWalletId, duration);

      // Apply tier discount
      const tierInfo = renterWallet.getTierInfo();
      if (tierInfo) {
        const discount = contract.totalPrice * tierInfo.feeDiscount;
        contract.totalPrice -= discount;
        contract.platformFee = contract.totalPrice * 0.15;
        contract.ownerEarnings = contract.totalPrice * 0.85;
      }

      // Check balance
      if (renterWallet.balances.ORB < contract.totalPrice) {
        listing.status = originalStatus;
        throw new Error('Insufficient ORB balance');
      }

      // Escrow payment
      renterWallet.withdraw('ORB', contract.totalPrice);
      contract.escrow.deposited = true;
      contract.start();

      this.contracts.set(contract.id, contract);
      renterWallet.rentedAgents.push(listing.agentId);
      this.stats.activeRentals++;
      this.stats.totalRentals++;

      // Restore listing to active after successful rental setup
      listing.status = 'ACTIVE';

      console.log(`[ORB ECONOMY] Rental started: ${listing.agentId} for ${duration}hr (${contract.totalPrice} $ORB)`);
      this.emit('rental:started', contract);

      return contract;
    } catch (err) {
      // Roll back status on any error
      listing.status = originalStatus;
      throw err;
    }
  }

  /**
   * Complete a rental
   */
  completeRental(contractId, success = true) {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error('Contract not found');

    contract.complete(success);
    const payout = contract.release();

    // Pay owner
    const ownerWallet = this.wallets.get(contract.ownerId);
    if (ownerWallet) {
      ownerWallet.deposit('ORB', payout.ownerPayout);
      ownerWallet.earnings.total += payout.ownerPayout;

      // Apply tier earnings boost
      const tierInfo = ownerWallet.getTierInfo();
      if (tierInfo) {
        const bonus = payout.ownerPayout * tierInfo.earningsBoost;
        ownerWallet.deposit('ORB', bonus);
        ownerWallet.earnings.total += bonus;
      }
    }

    // Update stats
    this.stats.totalVolume += contract.totalPrice;
    this.stats.platformEarnings += payout.platformFee;
    this.stats.activeRentals--;

    // Update listing stats
    const listing = this.listings.get(contract.listingId);
    if (listing) {
      listing.totalRentals++;
      listing.totalEarnings += payout.ownerPayout;
    }

    console.log(`[ORB ECONOMY] Rental completed: ${contract.agentId}`);
    this.emit('rental:completed', { contract, payout });

    return payout;
  }

  /**
   * Rent a swarm package
   */
  async rentSwarm(packageId, renterWalletId, duration) {
    const rate = this.rates[packageId];
    if (!rate) throw new Error(`Unknown swarm package: ${packageId}`);

    // Create a virtual listing for the package
    const listing = {
      id: `swarm-${packageId}-${Date.now()}`,
      agentId: packageId,
      ownerId: 'PLATFORM',
      pricePerHour: rate.base,
      status: 'ACTIVE'
    };

    const renterWallet = this.wallets.get(renterWalletId);
    if (!renterWallet) throw new Error('Renter wallet not found');

    const contract = new RentalContract(listing, renterWalletId, duration);

    if (renterWallet.balances.ORB < contract.totalPrice) {
      throw new Error('Insufficient ORB balance');
    }

    renterWallet.withdraw('ORB', contract.totalPrice);
    contract.start();
    this.contracts.set(contract.id, contract);

    console.log(`[ORB ECONOMY] Swarm package rented: ${packageId} for ${duration}hr`);
    this.emit('swarm:rented', { package: packageId, contract });

    return contract;
  }

  // ═══════════════════════════════════════════════════════════
  // STATS & INFO
  // ═══════════════════════════════════════════════════════════

  /**
   * Get marketplace stats
   */
  getMarketplaceStats() {
    return {
      ...this.stats,
      totalWallets: this.wallets.size,
      totalListings: this.listings.size,
      activeContracts: Array.from(this.contracts.values()).filter(c => c.status === 'ACTIVE').length
    };
  }

  /**
   * Get tier info
   */
  getTiers() {
    return this.tiers;
  }

  /**
   * Get rental rates
   */
  getRates() {
    return this.rates;
  }

  /**
   * Get status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      token: this.token,
      stats: this.getMarketplaceStats(),
      tiers: Object.keys(this.tiers).length,
      agentTypes: Object.keys(this.rates).length
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

module.exports = {
  OrbEconomy,
  OrbWallet,
  RentalContract,
  ORB_TOKEN,
  STAKING_TIERS,
  AGENT_RENTAL_RATES
};
