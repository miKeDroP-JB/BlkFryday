/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║   AFFILIATE HUB - Autonomous Income Machine                               ║
 * ║   "The swarm finds money while you sleep"                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';

// Deal categories with icons
const CATEGORIES = [
    { id: 'tech', name: 'Technology', icon: '💻', color: '#3498db' },
    { id: 'finance', name: 'Finance & Crypto', icon: '💰', color: '#f1c40f' },
    { id: 'saas', name: 'Software & Tools', icon: '🔧', color: '#9b59b6' },
    { id: 'education', name: 'Courses & Learning', icon: '📚', color: '#2ecc71' },
    { id: 'ecommerce', name: 'E-commerce', icon: '🛒', color: '#e74c3c' },
    { id: 'health', name: 'Health & Wellness', icon: '💪', color: '#1abc9c' },
    { id: 'hosting', name: 'Web Hosting', icon: '🌐', color: '#34495e' }
];

// Sample hot deals (in production, fetched from API)
const HOT_DEALS = [
    { id: 1, name: 'NordVPN', category: 'tech', commission: '40%', badge: '🔥 HOT', score: 95, cookie: '30 days', type: 'VPN Security' },
    { id: 2, name: 'HubSpot', category: 'saas', commission: '$250-$1000/sale', badge: '💎 PREMIUM', score: 92, cookie: '90 days', type: 'Marketing Platform' },
    { id: 3, name: 'Bluehost', category: 'hosting', commission: '$65-$130/sale', badge: '⭐ TOP', score: 90, cookie: '90 days', type: 'Web Hosting' },
    { id: 4, name: 'Coinbase', category: 'finance', commission: '50% for 3mo', badge: '💰 RECURRING', score: 88, cookie: '30 days', type: 'Crypto Exchange' },
    { id: 5, name: 'ConvertKit', category: 'saas', commission: '30% recurring', badge: '💎 RECURRING', score: 87, cookie: '60 days', type: 'Email Marketing' },
    { id: 6, name: 'Semrush', category: 'saas', commission: '$200/sale', badge: '🔥 HOT', score: 86, cookie: '120 days', type: 'SEO Tools' },
    { id: 7, name: 'Coursera', category: 'education', commission: '10-45%', badge: '📚 EDUCATION', score: 85, cookie: '30 days', type: 'Online Courses' },
    { id: 8, name: 'Shopify', category: 'ecommerce', commission: '$150/sale', badge: '⭐ TOP', score: 84, cookie: '30 days', type: 'E-commerce Platform' }
];

export default function AffiliatePage() {
    const [activeCategory, setActiveCategory] = useState('all');
    const [showSignup, setShowSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [registered, setRegistered] = useState(false);
    const [stats, setStats] = useState({
        totalDeals: 847,
        activeUsers: 2341,
        totalPaid: 127450,
        avgEarnings: 342
    });

    // Animate stats
    useEffect(() => {
        const interval = setInterval(() => {
            setStats(prev => ({
                ...prev,
                totalPaid: prev.totalPaid + Math.floor(Math.random() * 10),
                activeUsers: prev.activeUsers + (Math.random() > 0.7 ? 1 : 0)
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const filteredDeals = activeCategory === 'all'
        ? HOT_DEALS
        : HOT_DEALS.filter(d => d.category === activeCategory);

    const handleSignup = (e) => {
        e.preventDefault();
        if (email) {
            setRegistered(true);
            setShowSignup(false);
        }
    };

    return (
        <>
            <Head>
                <title>0RB Affiliate Hub | Autonomous Income Machine</title>
                <meta name="description" content="Join the swarm. Earn while you sleep. AI-powered affiliate marketing with 70% commission share." />
            </Head>

            <div className="affiliate-page">
                {/* Hero Section */}
                <section className="hero">
                    <div className="hero-bg" />
                    <div className="hero-content">
                        <div className="hero-badge">💰 AUTONOMOUS INCOME ENGINE</div>
                        <h1 className="hero-title">
                            The Swarm Finds Money<br />
                            <span className="gradient-text">While You Sleep</span>
                        </h1>
                        <p className="hero-subtitle">
                            AI-powered affiliate research finds the highest-paying programs.
                            Join the network. Keep <span className="highlight">70%</span> of everything you earn.
                        </p>
                        <div className="hero-cta">
                            <button className="btn-primary" onClick={() => setShowSignup(true)}>
                                Start Earning Now
                            </button>
                            <button className="btn-secondary" onClick={() => document.getElementById('deals').scrollIntoView({ behavior: 'smooth' })}>
                                View Deals
                            </button>
                        </div>
                        <div className="hero-stats">
                            <div className="stat">
                                <span className="stat-value">{stats.totalDeals}+</span>
                                <span className="stat-label">Active Deals</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{stats.activeUsers.toLocaleString()}</span>
                                <span className="stat-label">Active Users</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">${stats.totalPaid.toLocaleString()}</span>
                                <span className="stat-label">Total Paid Out</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">${stats.avgEarnings}</span>
                                <span className="stat-label">Avg Monthly</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="how-it-works">
                    <h2>How It Works</h2>
                    <div className="steps">
                        <div className="step">
                            <div className="step-icon">🤖</div>
                            <h3>AI Research</h3>
                            <p>Our swarm continuously scans 50+ affiliate networks to find the highest-paying programs</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-icon">🎯</div>
                            <h3>You Share</h3>
                            <p>Get your unique affiliate links. Share them anywhere - social, blogs, emails</p>
                        </div>
                        <div className="step-arrow">→</div>
                        <div className="step">
                            <div className="step-icon">💰</div>
                            <h3>We Pay</h3>
                            <p>When conversions happen, you keep 70%. We handle tracking, payments, everything</p>
                        </div>
                    </div>
                </section>

                {/* Revenue Split */}
                <section className="revenue-split">
                    <div className="split-card">
                        <h2>Transparent Revenue Split</h2>
                        <div className="split-visual">
                            <div className="split-bar">
                                <div className="user-share" style={{ width: '70%' }}>
                                    <span className="share-label">YOU: 70%</span>
                                </div>
                                <div className="platform-share" style={{ width: '30%' }}>
                                    <span className="share-label">Platform: 30%</span>
                                </div>
                            </div>
                        </div>
                        <p className="split-note">
                            No hidden fees. No minimums to start. $25 minimum payout threshold.
                        </p>
                    </div>
                </section>

                {/* Deals Section */}
                <section className="deals-section" id="deals">
                    <h2>🔥 Hot Deals Right Now</h2>
                    <p className="deals-subtitle">AI-curated highest-converting affiliate programs</p>

                    {/* Category Filter */}
                    <div className="category-filter">
                        <button
                            className={`cat-btn ${activeCategory === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveCategory('all')}
                        >
                            All Deals
                        </button>
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                className={`cat-btn ${activeCategory === cat.id ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat.id)}
                                style={{ '--cat-color': cat.color }}
                            >
                                {cat.icon} {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Deals Grid */}
                    <div className="deals-grid">
                        {filteredDeals.map(deal => (
                            <div key={deal.id} className="deal-card">
                                <div className="deal-header">
                                    <span className="deal-badge">{deal.badge}</span>
                                    <span className="deal-score">{deal.score}/100</span>
                                </div>
                                <h3 className="deal-name">{deal.name}</h3>
                                <p className="deal-type">{deal.type}</p>
                                <div className="deal-info">
                                    <div className="info-item">
                                        <span className="info-label">Commission</span>
                                        <span className="info-value commission">{deal.commission}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">Cookie</span>
                                        <span className="info-value">{deal.cookie}</span>
                                    </div>
                                </div>
                                <button className="deal-btn" onClick={() => setShowSignup(true)}>
                                    Get Link
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Why Join */}
                <section className="why-join">
                    <h2>Why Join The Swarm?</h2>
                    <div className="benefits-grid">
                        <div className="benefit">
                            <span className="benefit-icon">🤖</span>
                            <h3>AI-Powered Research</h3>
                            <p>Our agents continuously find the best programs so you don't have to</p>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">💎</span>
                            <h3>Recurring Commissions</h3>
                            <p>Focus on programs with lifetime recurring revenue</p>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">📊</span>
                            <h3>Real-Time Dashboard</h3>
                            <p>Track clicks, conversions, and earnings in real-time</p>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">🚀</span>
                            <h3>Instant Links</h3>
                            <p>Get affiliate links immediately - no waiting for approval</p>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">💰</span>
                            <h3>Weekly Payouts</h3>
                            <p>Get paid every week via PayPal, crypto, or bank transfer</p>
                        </div>
                        <div className="benefit">
                            <span className="benefit-icon">🎓</span>
                            <h3>Training Included</h3>
                            <p>Learn affiliate marketing strategies from top earners</p>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section className="final-cta">
                    <h2>Ready to Start Earning?</h2>
                    <p>Join thousands making passive income with the swarm</p>
                    <button className="btn-primary large" onClick={() => setShowSignup(true)}>
                        Join Free Today
                    </button>
                </section>

                {/* Signup Modal */}
                {showSignup && (
                    <div className="modal-overlay" onClick={() => setShowSignup(false)}>
                        <div className="modal" onClick={e => e.stopPropagation()}>
                            <button className="modal-close" onClick={() => setShowSignup(false)}>×</button>
                            <h2>Join The Swarm</h2>
                            <p>Start earning with AI-powered affiliate marketing</p>
                            <form onSubmit={handleSignup}>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn-primary">
                                    Get Started - It's Free
                                </button>
                            </form>
                            <p className="modal-note">
                                70% commission share. No fees. Cancel anytime.
                            </p>
                        </div>
                    </div>
                )}

                {/* Success Message */}
                {registered && (
                    <div className="toast">
                        ✓ Welcome to the swarm! Check your email for next steps.
                    </div>
                )}

                <style jsx>{`
                    .affiliate-page {
                        min-height: 100vh;
                        background: #0a0a0f;
                        color: #fff;
                        font-family: 'Rajdhani', sans-serif;
                    }

                    /* Hero */
                    .hero {
                        position: relative;
                        padding: 100px 20px;
                        text-align: center;
                        overflow: hidden;
                    }

                    .hero-bg {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: radial-gradient(ellipse at center, rgba(0, 255, 255, 0.1) 0%, transparent 70%);
                    }

                    .hero-content {
                        position: relative;
                        max-width: 900px;
                        margin: 0 auto;
                    }

                    .hero-badge {
                        display: inline-block;
                        background: rgba(0, 255, 255, 0.1);
                        border: 1px solid rgba(0, 255, 255, 0.3);
                        padding: 8px 20px;
                        border-radius: 50px;
                        font-size: 0.85rem;
                        letter-spacing: 0.1em;
                        margin-bottom: 30px;
                    }

                    .hero-title {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 3.5rem;
                        font-weight: 700;
                        line-height: 1.2;
                        margin-bottom: 20px;
                    }

                    .gradient-text {
                        background: linear-gradient(135deg, #00ffff, #2ecc71);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }

                    .hero-subtitle {
                        font-size: 1.3rem;
                        color: #888;
                        max-width: 600px;
                        margin: 0 auto 40px;
                        line-height: 1.6;
                    }

                    .highlight {
                        color: #2ecc71;
                        font-weight: 700;
                    }

                    .hero-cta {
                        display: flex;
                        gap: 20px;
                        justify-content: center;
                        margin-bottom: 60px;
                    }

                    .btn-primary {
                        background: linear-gradient(135deg, #00ffff, #2ecc71);
                        color: #000;
                        border: none;
                        padding: 16px 40px;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 1rem;
                        font-weight: 700;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }

                    .btn-primary:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 10px 40px rgba(0, 255, 255, 0.3);
                    }

                    .btn-primary.large {
                        padding: 20px 60px;
                        font-size: 1.2rem;
                    }

                    .btn-secondary {
                        background: transparent;
                        color: #00ffff;
                        border: 1px solid #00ffff;
                        padding: 16px 40px;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 1rem;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: all 0.3s;
                    }

                    .btn-secondary:hover {
                        background: rgba(0, 255, 255, 0.1);
                    }

                    .hero-stats {
                        display: flex;
                        justify-content: center;
                        gap: 60px;
                        flex-wrap: wrap;
                    }

                    .stat {
                        text-align: center;
                    }

                    .stat-value {
                        display: block;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 2rem;
                        font-weight: 700;
                        color: #00ffff;
                    }

                    .stat-label {
                        color: #666;
                        font-size: 0.9rem;
                    }

                    /* How It Works */
                    .how-it-works {
                        padding: 80px 20px;
                        background: #12121a;
                    }

                    .how-it-works h2 {
                        text-align: center;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 2rem;
                        margin-bottom: 60px;
                    }

                    .steps {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        gap: 40px;
                        max-width: 1000px;
                        margin: 0 auto;
                        flex-wrap: wrap;
                    }

                    .step {
                        text-align: center;
                        max-width: 250px;
                    }

                    .step-icon {
                        font-size: 3rem;
                        margin-bottom: 20px;
                    }

                    .step h3 {
                        font-family: 'Orbitron', sans-serif;
                        margin-bottom: 10px;
                    }

                    .step p {
                        color: #888;
                        font-size: 0.95rem;
                    }

                    .step-arrow {
                        font-size: 2rem;
                        color: #00ffff;
                    }

                    /* Revenue Split */
                    .revenue-split {
                        padding: 80px 20px;
                    }

                    .split-card {
                        max-width: 600px;
                        margin: 0 auto;
                        background: #12121a;
                        border: 1px solid #1a1a2e;
                        border-radius: 16px;
                        padding: 40px;
                        text-align: center;
                    }

                    .split-card h2 {
                        font-family: 'Orbitron', sans-serif;
                        margin-bottom: 30px;
                    }

                    .split-bar {
                        display: flex;
                        height: 60px;
                        border-radius: 8px;
                        overflow: hidden;
                        margin-bottom: 20px;
                    }

                    .user-share {
                        background: linear-gradient(135deg, #2ecc71, #27ae60);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .platform-share {
                        background: #1a1a2e;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .share-label {
                        font-family: 'Orbitron', sans-serif;
                        font-weight: 700;
                    }

                    .split-note {
                        color: #888;
                    }

                    /* Deals */
                    .deals-section {
                        padding: 80px 20px;
                    }

                    .deals-section h2 {
                        text-align: center;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 2rem;
                        margin-bottom: 10px;
                    }

                    .deals-subtitle {
                        text-align: center;
                        color: #888;
                        margin-bottom: 40px;
                    }

                    .category-filter {
                        display: flex;
                        justify-content: center;
                        gap: 10px;
                        flex-wrap: wrap;
                        margin-bottom: 40px;
                    }

                    .cat-btn {
                        background: #12121a;
                        border: 1px solid #1a1a2e;
                        color: #fff;
                        padding: 10px 20px;
                        border-radius: 50px;
                        cursor: pointer;
                        font-size: 0.9rem;
                        transition: all 0.2s;
                    }

                    .cat-btn:hover, .cat-btn.active {
                        border-color: var(--cat-color, #00ffff);
                        background: rgba(0, 255, 255, 0.1);
                    }

                    .deals-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                        gap: 24px;
                        max-width: 1200px;
                        margin: 0 auto;
                    }

                    .deal-card {
                        background: #12121a;
                        border: 1px solid #1a1a2e;
                        border-radius: 16px;
                        padding: 24px;
                        transition: all 0.3s;
                    }

                    .deal-card:hover {
                        border-color: #00ffff;
                        transform: translateY(-4px);
                    }

                    .deal-header {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 16px;
                    }

                    .deal-badge {
                        font-size: 0.8rem;
                        padding: 4px 10px;
                        background: rgba(255, 215, 0, 0.1);
                        border-radius: 4px;
                    }

                    .deal-score {
                        color: #2ecc71;
                        font-weight: 700;
                    }

                    .deal-name {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 1.3rem;
                        margin-bottom: 4px;
                    }

                    .deal-type {
                        color: #888;
                        font-size: 0.9rem;
                        margin-bottom: 20px;
                    }

                    .deal-info {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 20px;
                    }

                    .info-item {
                        flex: 1;
                    }

                    .info-label {
                        display: block;
                        color: #666;
                        font-size: 0.8rem;
                        margin-bottom: 4px;
                    }

                    .info-value {
                        font-weight: 600;
                    }

                    .info-value.commission {
                        color: #2ecc71;
                    }

                    .deal-btn {
                        width: 100%;
                        background: transparent;
                        border: 1px solid #00ffff;
                        color: #00ffff;
                        padding: 12px;
                        border-radius: 8px;
                        font-family: 'Orbitron', sans-serif;
                        cursor: pointer;
                        transition: all 0.2s;
                    }

                    .deal-btn:hover {
                        background: #00ffff;
                        color: #000;
                    }

                    /* Why Join */
                    .why-join {
                        padding: 80px 20px;
                        background: #12121a;
                    }

                    .why-join h2 {
                        text-align: center;
                        font-family: 'Orbitron', sans-serif;
                        font-size: 2rem;
                        margin-bottom: 60px;
                    }

                    .benefits-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 30px;
                        max-width: 1000px;
                        margin: 0 auto;
                    }

                    .benefit {
                        text-align: center;
                        padding: 30px;
                    }

                    .benefit-icon {
                        font-size: 2.5rem;
                        display: block;
                        margin-bottom: 16px;
                    }

                    .benefit h3 {
                        font-family: 'Orbitron', sans-serif;
                        margin-bottom: 10px;
                    }

                    .benefit p {
                        color: #888;
                    }

                    /* Final CTA */
                    .final-cta {
                        padding: 100px 20px;
                        text-align: center;
                    }

                    .final-cta h2 {
                        font-family: 'Orbitron', sans-serif;
                        font-size: 2.5rem;
                        margin-bottom: 16px;
                    }

                    .final-cta p {
                        color: #888;
                        margin-bottom: 40px;
                        font-size: 1.2rem;
                    }

                    /* Modal */
                    .modal-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.8);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }

                    .modal {
                        background: #12121a;
                        border: 1px solid #1a1a2e;
                        border-radius: 16px;
                        padding: 40px;
                        max-width: 400px;
                        width: 90%;
                        text-align: center;
                        position: relative;
                    }

                    .modal-close {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        background: none;
                        border: none;
                        color: #888;
                        font-size: 1.5rem;
                        cursor: pointer;
                    }

                    .modal h2 {
                        font-family: 'Orbitron', sans-serif;
                        margin-bottom: 10px;
                    }

                    .modal p {
                        color: #888;
                        margin-bottom: 30px;
                    }

                    .modal form {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }

                    .modal input {
                        background: #0a0a0f;
                        border: 1px solid #1a1a2e;
                        padding: 16px;
                        border-radius: 8px;
                        color: #fff;
                        font-size: 1rem;
                    }

                    .modal input:focus {
                        outline: none;
                        border-color: #00ffff;
                    }

                    .modal-note {
                        margin-top: 20px;
                        font-size: 0.85rem;
                    }

                    /* Toast */
                    .toast {
                        position: fixed;
                        bottom: 30px;
                        left: 50%;
                        transform: translateX(-50%);
                        background: #2ecc71;
                        color: #000;
                        padding: 16px 30px;
                        border-radius: 8px;
                        font-weight: 600;
                        animation: slideUp 0.3s ease;
                    }

                    @keyframes slideUp {
                        from {
                            transform: translateX(-50%) translateY(100px);
                            opacity: 0;
                        }
                        to {
                            transform: translateX(-50%) translateY(0);
                            opacity: 1;
                        }
                    }

                    @media (max-width: 768px) {
                        .hero-title {
                            font-size: 2rem;
                        }

                        .hero-stats {
                            gap: 30px;
                        }

                        .step-arrow {
                            display: none;
                        }
                    }
                `}</style>
            </div>
        </>
    );
}
