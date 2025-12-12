/**
 * 0RB SYSTEM - Main Console
 * The primary interface to the simulation
 */

import { useState } from 'react';
import { useSystem } from '@/context/SystemContext';
import { useAgents, ARCHETYPES } from '@/context/AgentContext';
import { useCopa, VERTICALS } from '@/context/CopaContext';
import { useCrypto } from '@/context/CryptoContext';

// ═══════════════════════════════════════════════════════════════
// GAME LIBRARY
// ═══════════════════════════════════════════════════════════════

const GAMES = [
  { id: 'ARCHITECT', name: 'ARCHITECT', icon: '🏛️', tagline: 'Build worlds from thought', desc: 'Full AI website/app/brand generator', color: '#00ffff' },
  { id: 'ORACLE', name: 'ORACLE', icon: '🔮', tagline: 'See what others cannot', desc: 'The prediction/strategy engine', color: '#9b59b6' },
  { id: 'PANTHEON', name: 'PANTHEON', icon: '⚡', tagline: 'Command the gods', desc: 'Access to all 7 avatar agents', color: '#ffd700' },
  { id: 'FORGE', name: 'FORGE', icon: '🔥', tagline: 'Create from nothing', desc: 'Content/video/image creation suite', color: '#e74c3c' },
  { id: 'EMPIRE', name: 'EMPIRE', icon: '👑', tagline: 'Build your kingdom', desc: 'Business automation simulation', color: '#e67e22' },
  { id: 'ECHO', name: 'ECHO', icon: '🔊', tagline: 'Find your voice', desc: 'Voice cloning + agent builder', color: '#3498db' },
  { id: 'INFINITE', name: 'INFINITE', icon: '∞', tagline: 'Anything. Everything.', desc: 'The everything generator', color: '#1abc9c' }
];

// ═══════════════════════════════════════════════════════════════
// NAVIGATION ITEMS
// ═══════════════════════════════════════════════════════════════

const NAV_ITEMS = [
  { id: 'games', icon: '🎮', label: 'Games' },
  { id: 'agents', icon: '⚡', label: 'Agents' },
  { id: 'copa', icon: '🤝', label: 'Copa' },
  { id: 'crypto', icon: '💰', label: 'Crypto' },
  { id: 'community', icon: '💬', label: 'Community' },
  { id: 'settings', icon: '⚙️', label: 'Settings' }
];

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function MainConsole() {
  const [activeNav, setActiveNav] = useState('games');
  const { state: systemState, actions: systemActions } = useSystem();
  const { state: agentState, actions: agentActions } = useAgents();
  const { state: copaState, actions: copaActions } = useCopa();
  const { state: cryptoState, actions: cryptoActions } = useCrypto();

  const handlePlayGame = (game) => {
    console.log(`[ORB] Launching ${game.name}...`);
    systemActions.setActiveGame(game.id);
    systemActions.addNotification({
      type: 'info',
      title: `Launching ${game.name}`,
      message: game.desc
    });
  };

  const handleSummonAgent = (agentId) => {
    console.log(`[ORB] Summoning agent: ${agentId}`);
    agentActions.spawnAgent(agentId);
    systemActions.addNotification({
      type: 'success',
      title: 'Agent Summoned',
      message: `${agentId} is now active`
    });
  };

  const handleActivateCopa = (verticalId) => {
    console.log(`[ORB] Activating Copa: ${verticalId}`);
    copaActions.initCopa(verticalId);
    systemActions.addNotification({
      type: 'success',
      title: 'Copa Activated',
      message: `${verticalId} sidekick is ready`
    });
  };

  const renderContent = () => {
    switch (activeNav) {
      case 'games':
        return <GamesPanel onPlay={handlePlayGame} />;
      case 'agents':
        return <AgentsPanel agents={agentState} actions={{ ...agentActions, summon: handleSummonAgent }} />;
      case 'copa':
        return <CopaPanel copa={copaState} actions={{ ...copaActions, activate: handleActivateCopa }} />;
      case 'crypto':
        return <CryptoPanel crypto={cryptoState} actions={cryptoActions} />;
      case 'community':
        return <CommunityPanel />;
      case 'settings':
        return <SettingsPanel />;
      default:
        return <GamesPanel onPlay={handlePlayGame} />;
    }
  };

  return (
    <div className="console">
      {/* Header */}
      <header className="console-header">
        <div className="console-logo">
          <div className="console-logo-orb" />
          <span className="console-logo-text">0RB SYSTEM</span>
        </div>
        <div className="console-status">
          <span className="status-dot" />
          <span>SYSTEM ONLINE</span>
        </div>
      </header>

      {/* Main Layout */}
      <div className="console-body">
        {/* Sidebar */}
        <nav className="console-sidebar">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`nav-btn ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
              title={item.label}
            >
              <span className="nav-icon">{item.icon}</span>
            </button>
          ))}
        </nav>

        {/* Content Area */}
        <main className="console-content">
          {renderContent()}
        </main>
      </div>

      {/* Status Bar */}
      <footer className="console-footer">
        <div className="footer-left">
          <span className="footer-status">
            <span className="status-indicator online" />
            ALL SYSTEMS NOMINAL
          </span>
        </div>
        <div className="footer-center">
          <span>v1.0.0 THE_AWAKENING</span>
        </div>
        <div className="footer-right">
          <span>EVERYBODY EATS</span>
        </div>
      </footer>

      <style jsx>{`
        .console {
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          background: #0a0a0f;
          color: #fff;
          font-family: 'Rajdhani', sans-serif;
        }

        .console-header {
          height: 60px;
          background: #12121a;
          border-bottom: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }

        .console-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .console-logo-orb {
          width: 36px;
          height: 36px;
          background: radial-gradient(circle, #00ffff, #0a0a0f);
          border-radius: 50%;
          box-shadow: 0 0 20px #00ffff;
        }

        .console-logo-text {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.2em;
        }

        .console-status {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          color: #888;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          background: #2ecc71;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .console-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        .console-sidebar {
          width: 80px;
          background: #12121a;
          border-right: 1px solid #1a1a2e;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px 0;
          gap: 10px;
        }

        .nav-btn {
          width: 50px;
          height: 50px;
          background: transparent;
          border: 1px solid #1a1a2e;
          border-radius: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .nav-btn:hover, .nav-btn.active {
          background: #1a1a2e;
          border-color: #00ffff;
        }

        .nav-btn.active {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }

        .nav-icon {
          font-size: 1.5rem;
        }

        .console-content {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
        }

        .console-footer {
          height: 30px;
          background: #12121a;
          border-top: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 0.75rem;
          color: #666;
          font-family: 'Space Mono', monospace;
        }

        .footer-left, .footer-center, .footer-right {
          flex: 1;
        }

        .footer-center {
          text-align: center;
        }

        .footer-right {
          text-align: right;
          color: #00ffff;
        }

        .footer-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }

        .status-indicator.online {
          background: #2ecc71;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// PANELS
// ═══════════════════════════════════════════════════════════════

function GamesPanel({ onPlay }) {
  return (
    <div className="panel">
      <h2 className="panel-title">GAME LIBRARY</h2>
      <p className="panel-subtitle">It's not a game. It's THE game.</p>

      <div className="game-grid">
        {GAMES.map(game => (
          <div key={game.id} className="game-card" style={{ '--accent': game.color }}>
            <div className="game-icon">{game.icon}</div>
            <h3 className="game-name">{game.name}</h3>
            <p className="game-tagline">{game.tagline}</p>
            <p className="game-desc">{game.desc}</p>
            <button className="game-play-btn" onClick={() => onPlay(game)}>PLAY</button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #00ffff;
          margin-bottom: 30px;
        }

        .game-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .game-card {
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 16px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.3s;
          position: relative;
          overflow: hidden;
        }

        .game-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.3s;
        }

        .game-card:hover {
          border-color: var(--accent);
          transform: translateY(-4px);
          box-shadow: 0 10px 40px rgba(0, 255, 255, 0.1);
        }

        .game-card:hover::before {
          opacity: 1;
        }

        .game-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .game-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.4rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .game-tagline {
          color: var(--accent);
          font-size: 0.9rem;
          margin-bottom: 12px;
        }

        .game-desc {
          color: #888;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        .game-play-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .game-play-btn:hover {
          background: var(--accent);
          color: #0a0a0f;
        }
      `}</style>
    </div>
  );
}

function AgentsPanel({ agents, actions }) {
  return (
    <div className="panel">
      <h2 className="panel-title">THE PANTHEON</h2>
      <p className="panel-subtitle">Seven archetypes. Infinite possibilities.</p>

      <div className="agent-grid">
        {Object.values(ARCHETYPES).map(agent => (
          <div key={agent.id} className="agent-card" style={{ '--color': agent.color }}>
            <div className="agent-avatar">{agent.emoji}</div>
            <h3 className="agent-name">{agent.name}</h3>
            <p className="agent-title">{agent.title}</p>
            <p className="agent-domain">{agent.domain}</p>
            <button
              className="agent-summon-btn"
              onClick={() => actions.summon(agent.id)}
            >
              SUMMON
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #00ffff;
          margin-bottom: 30px;
        }

        .agent-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
        }

        .agent-card {
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          transition: all 0.3s;
        }

        .agent-card:hover {
          border-color: var(--color);
          box-shadow: 0 0 30px rgba(var(--color), 0.2);
        }

        .agent-avatar {
          width: 80px;
          height: 80px;
          margin: 0 auto 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 2px solid var(--color);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          box-shadow: 0 0 20px var(--color);
        }

        .agent-name {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.2rem;
          margin-bottom: 4px;
        }

        .agent-title {
          color: var(--color);
          font-size: 0.85rem;
          margin-bottom: 8px;
        }

        .agent-domain {
          color: #666;
          font-size: 0.8rem;
          margin-bottom: 16px;
        }

        .agent-summon-btn {
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px solid var(--color);
          color: var(--color);
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 8px;
        }

        .agent-summon-btn:hover {
          background: var(--color);
          color: #0a0a0f;
        }
      `}</style>
    </div>
  );
}

function CopaPanel({ copa, actions }) {
  return (
    <div className="panel">
      <h2 className="panel-title">COPA SIDEKICK</h2>
      <p className="panel-subtitle">AUGMENTATION {'>'} AUTOMATION</p>

      <div className="copa-grid">
        {Object.values(VERTICALS).map(vertical => (
          <div key={vertical.id} className="copa-card" style={{ '--color': vertical.color }}>
            <div className="copa-icon">{vertical.icon}</div>
            <h3 className="copa-name">{vertical.name}</h3>
            <div className="copa-pricing">
              <span className="price-badge">$9.99/mo</span>
              <span className="price-original">$29.99</span>
            </div>
            <button
              className="copa-activate-btn"
              onClick={() => actions.activate(vertical.id)}
            >
              ACTIVATE
            </button>
          </div>
        ))}
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #2ecc71;
          margin-bottom: 30px;
        }

        .copa-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
        }

        .copa-card {
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s;
        }

        .copa-card:hover {
          border-color: var(--color);
        }

        .copa-icon {
          font-size: 2rem;
          margin-bottom: 12px;
        }

        .copa-name {
          font-size: 1rem;
          margin-bottom: 12px;
        }

        .copa-pricing {
          margin-bottom: 16px;
        }

        .price-badge {
          background: #2ecc71;
          color: #000;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .price-original {
          color: #666;
          text-decoration: line-through;
          font-size: 0.8rem;
          margin-left: 8px;
        }

        .copa-activate-btn {
          width: 100%;
          padding: 10px;
          background: #2ecc71;
          border: none;
          color: #000;
          font-family: 'Orbitron', sans-serif;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 6px;
          font-weight: 700;
        }

        .copa-activate-btn:hover {
          background: #27ae60;
        }
      `}</style>
    </div>
  );
}

function CryptoPanel({ crypto, actions }) {
  return (
    <div className="panel">
      <h2 className="panel-title">$0RB ECONOMY</h2>
      <p className="panel-subtitle">The simulation has currency now.</p>

      <div className="crypto-stats">
        <div className="stat-card">
          <span className="stat-label">Balance</span>
          <span className="stat-value">{crypto.balances.ORB.toLocaleString()} $0RB</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Staked</span>
          <span className="stat-value">{crypto.stakedAmount.toLocaleString()} $0RB</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Tier</span>
          <span className="stat-value">{crypto.stakingTier || 'None'}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Earnings</span>
          <span className="stat-value">{crypto.earnings.total.toLocaleString()} $0RB</span>
        </div>
      </div>

      <div className="crypto-actions">
        <button className="crypto-btn" onClick={() => actions.connectWallet({ address: '0x...' })}>
          {crypto.connected ? 'CONNECTED' : 'CONNECT WALLET'}
        </button>
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #ffd700;
          margin-bottom: 30px;
        }

        .crypto-stats {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 12px;
          padding: 20px;
        }

        .stat-label {
          display: block;
          color: #666;
          font-size: 0.85rem;
          margin-bottom: 8px;
        }

        .stat-value {
          font-family: 'Orbitron', sans-serif;
          font-size: 1.5rem;
          color: #ffd700;
        }

        .crypto-actions {
          display: flex;
          gap: 16px;
        }

        .crypto-btn {
          padding: 16px 32px;
          background: linear-gradient(135deg, #ffd700, #e67e22);
          border: none;
          color: #000;
          font-family: 'Orbitron', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .crypto-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3);
        }
      `}</style>
    </div>
  );
}

function CommunityPanel() {
  return (
    <div className="panel">
      <h2 className="panel-title">COMMUNITY</h2>
      <p className="panel-subtitle">The simulation speaks.</p>

      <div className="community-placeholder">
        <span className="placeholder-icon">💬</span>
        <p>Forums coming soon...</p>
        <p className="placeholder-sub">Share discoveries. Build lore. Create together.</p>
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #00ffff;
          margin-bottom: 30px;
        }

        .community-placeholder {
          text-align: center;
          padding: 60px;
          background: #12121a;
          border: 1px solid #1a1a2e;
          border-radius: 16px;
        }

        .placeholder-icon {
          font-size: 4rem;
          display: block;
          margin-bottom: 20px;
        }

        .placeholder-sub {
          color: #666;
          margin-top: 10px;
        }
      `}</style>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="panel">
      <h2 className="panel-title">SETTINGS</h2>
      <p className="panel-subtitle">Configure your reality.</p>

      <div className="settings-grid">
        <div className="setting-item">
          <span className="setting-label">Theme</span>
          <select className="setting-select">
            <option>Dark (Default)</option>
            <option>Void</option>
            <option>Neon</option>
          </select>
        </div>
        <div className="setting-item">
          <span className="setting-label">Audio</span>
          <input type="range" className="setting-range" />
        </div>
        <div className="setting-item">
          <span className="setting-label">Notifications</span>
          <input type="checkbox" className="setting-checkbox" defaultChecked />
        </div>
      </div>

      <style jsx>{`
        .panel-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 2rem;
          margin-bottom: 8px;
          letter-spacing: 0.1em;
        }

        .panel-subtitle {
          color: #00ffff;
          margin-bottom: 30px;
        }

        .settings-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 400px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #12121a;
          padding: 16px 20px;
          border-radius: 8px;
          border: 1px solid #1a1a2e;
        }

        .setting-label {
          color: #fff;
        }

        .setting-select {
          background: #1a1a2e;
          border: 1px solid #333;
          color: #fff;
          padding: 8px 16px;
          border-radius: 4px;
        }

        .setting-range {
          width: 150px;
        }
      `}</style>
    </div>
  );
}
