'use client';

/**
 * ====================================================
 *  GAMIFICATION HUD - XP/Achievement Display
 * ====================================================
 *  Visual interface for the RealityGames system
 *  - XP bar with level progression
 *  - Achievement notifications
 *  - Quest tracker
 *  - Leaderboard panel
 * ====================================================
 */

import React, { useState, useEffect, useCallback } from 'react';

// Level title colors
const LEVEL_COLORS = {
  'Initiate': '#888888',
  'Apprentice': '#00ff88',
  'Journeyman': '#00ffff',
  'Adept': '#0088ff',
  'Expert': '#8844ff',
  'Master': '#ff44ff',
  'Grandmaster': '#ff8800',
  'Sage': '#ffcc00',
  'Oracle': '#ff00ff',
  'Ascended': '#00ffff',
  'Transcendent': '#ffffff',
  'Mythic': '#ff4444',
  'Legendary': '#ffd700',
  'Eternal': '#ff00ff',
  'GODMODE': '#00ffff'
};

// Achievement rarity colors
const RARITY_COLORS = {
  'COMMON': '#888888',
  'RARE': '#00aaff',
  'EPIC': '#aa00ff',
  'LEGENDARY': '#ff8800',
  'MYTHIC': '#ff00ff'
};

export default function GamificationHUD({
  userId = 'default',
  position = 'top-right',
  showXPBar = true,
  showAchievements = true,
  showQuests = true,
  compact = false,
  onAchievementClick,
  onQuestClick
}) {
  // State
  const [profile, setProfile] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [activeQuests, setActiveQuests] = useState([]);
  const [showAchievementPopup, setShowAchievementPopup] = useState(null);
  const [xpAnimation, setXpAnimation] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);

  // Fetch player profile
  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch(`/api/v11/game/profile?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        // Check for level up
        if (profile && data.data.level > profile.level) {
          triggerLevelUpAnimation(data.data);
        }

        setProfile(data.data);
      }
    } catch (err) {
      console.warn('[GamificationHUD] Profile fetch error:', err);
    }
  }, [userId, profile]);

  // Fetch achievements
  const fetchAchievements = useCallback(async () => {
    try {
      const response = await fetch(`/api/v11/game/achievements?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setRecentAchievements(data.data.slice(0, 5));
      }
    } catch (err) {
      console.warn('[GamificationHUD] Achievements fetch error:', err);
    }
  }, [userId]);

  // Fetch quests
  const fetchQuests = useCallback(async () => {
    try {
      const response = await fetch(`/api/v11/game/quests?userId=${userId}`);
      const data = await response.json();

      if (data.success) {
        setActiveQuests(data.data.active || []);
      }
    } catch (err) {
      console.warn('[GamificationHUD] Quests fetch error:', err);
    }
  }, [userId]);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await fetch('/api/v11/game/leaderboard?limit=5');
      const data = await response.json();

      if (data.success) {
        setLeaderboard(data.data);
      }
    } catch (err) {
      console.warn('[GamificationHUD] Leaderboard fetch error:', err);
    }
  }, []);

  // Initial fetch and polling
  useEffect(() => {
    fetchProfile();
    fetchAchievements();
    fetchQuests();
    fetchLeaderboard();

    const interval = setInterval(() => {
      fetchProfile();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchProfile, fetchAchievements, fetchQuests, fetchLeaderboard]);

  // Listen for achievement events
  useEffect(() => {
    const handleAchievement = (event) => {
      const achievement = event.detail;
      setShowAchievementPopup(achievement);
      setTimeout(() => setShowAchievementPopup(null), 5000);
      fetchAchievements();
    };

    window.addEventListener('achievement:unlocked', handleAchievement);
    return () => window.removeEventListener('achievement:unlocked', handleAchievement);
  }, [fetchAchievements]);

  // Listen for XP events
  useEffect(() => {
    const handleXP = (event) => {
      const { xpGained, leveledUp } = event.detail;
      setXpAnimation({ amount: xpGained, leveledUp });
      setTimeout(() => setXpAnimation(null), 2000);
      fetchProfile();
    };

    window.addEventListener('xp:awarded', handleXP);
    return () => window.removeEventListener('xp:awarded', handleXP);
  }, [fetchProfile]);

  // Level up animation
  const triggerLevelUpAnimation = (newProfile) => {
    // Could trigger confetti, sound, etc.
    console.log(`[GamificationHUD] LEVEL UP! Now ${newProfile.title} (Level ${newProfile.level})`);
  };

  // Position styles
  const positionStyles = {
    'top-right': { top: 20, right: 20 },
    'top-left': { top: 20, left: 20 },
    'bottom-right': { bottom: 20, right: 20 },
    'bottom-left': { bottom: 20, left: 20 }
  };

  if (!profile) {
    return (
      <div style={{ ...styles.container, ...positionStyles[position] }}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  const xpProgress = profile.xpToNextLevel > 0
    ? ((profile.xp % 1000) / (profile.xpToNextLevel + (profile.xp % 1000))) * 100
    : 100;

  return (
    <div style={{ ...styles.container, ...positionStyles[position], width: compact ? 200 : 280 }}>
      {/* XP Bar Section */}
      {showXPBar && (
        <div
          style={styles.xpSection}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div style={styles.levelBadge}>
            <span style={{
              ...styles.levelNumber,
              color: LEVEL_COLORS[profile.title] || '#00ffff'
            }}>
              {profile.level}
            </span>
            <span style={styles.levelTitle}>{profile.title}</span>
          </div>

          <div style={styles.xpBarContainer}>
            <div style={styles.xpBarBg}>
              <div
                style={{
                  ...styles.xpBarFill,
                  width: `${xpProgress}%`
                }}
              />
            </div>
            <div style={styles.xpText}>
              {profile.xp.toLocaleString()} XP
              {profile.xpToNextLevel > 0 && (
                <span style={styles.xpNext}>
                  {' '}/ {(profile.xp + profile.xpToNextLevel).toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* XP Gain Animation */}
          {xpAnimation && (
            <div style={styles.xpGainAnim}>
              +{xpAnimation.amount} XP
              {xpAnimation.leveledUp && <span style={styles.levelUpText}> LEVEL UP!</span>}
            </div>
          )}
        </div>
      )}

      {/* Expanded Stats */}
      {isExpanded && (
        <div style={styles.expandedSection}>
          <div style={styles.statsGrid}>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.stats?.tasksCompleted || 0}</span>
              <span style={styles.statLabel}>Tasks</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.achievements}</span>
              <span style={styles.statLabel}>Achievements</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statValue}>{profile.stats?.swarmsActivated || 0}</span>
              <span style={styles.statLabel}>Swarms</span>
            </div>
          </div>

          {/* Mini Leaderboard */}
          {leaderboard.length > 0 && (
            <div style={styles.miniLeaderboard}>
              <div style={styles.sectionTitle}>Top Players</div>
              {leaderboard.map((player, i) => (
                <div
                  key={player.userId}
                  style={{
                    ...styles.leaderboardItem,
                    background: player.userId === userId ? 'rgba(0,255,255,0.1)' : 'transparent'
                  }}
                >
                  <span style={styles.leaderRank}>#{i + 1}</span>
                  <span style={styles.leaderName}>{player.userId}</span>
                  <span style={styles.leaderXP}>{(player.xp / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recent Achievements */}
      {showAchievements && recentAchievements.length > 0 && !compact && (
        <div style={styles.achievementsSection}>
          <div style={styles.sectionTitle}>Recent Achievements</div>
          {recentAchievements.map(achievement => (
            <div
              key={achievement.id}
              style={{
                ...styles.achievementItem,
                borderColor: RARITY_COLORS[achievement.rarity] || '#888'
              }}
              onClick={() => onAchievementClick?.(achievement)}
            >
              <span style={styles.achievementIcon}>{achievement.icon}</span>
              <div style={styles.achievementInfo}>
                <span style={styles.achievementName}>{achievement.name}</span>
                <span style={styles.achievementXP}>+{achievement.xp} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Quests */}
      {showQuests && activeQuests.length > 0 && !compact && (
        <div style={styles.questsSection}>
          <div style={styles.sectionTitle}>Active Quests</div>
          {activeQuests.map(quest => (
            <div
              key={quest.id}
              style={styles.questItem}
              onClick={() => onQuestClick?.(quest)}
            >
              <span style={styles.questIcon}>{quest.icon}</span>
              <div style={styles.questInfo}>
                <span style={styles.questName}>{quest.name}</span>
                <div style={styles.questProgress}>
                  <div style={styles.questProgressBg}>
                    <div
                      style={{
                        ...styles.questProgressFill,
                        width: `${(quest.completedSteps / quest.totalSteps) * 100}%`
                      }}
                    />
                  </div>
                  <span style={styles.questProgressText}>
                    {quest.completedSteps}/{quest.totalSteps}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Achievement Popup */}
      {showAchievementPopup && (
        <div style={styles.achievementPopup}>
          <div style={styles.popupGlow} />
          <div style={styles.popupContent}>
            <span style={styles.popupIcon}>{showAchievementPopup.icon}</span>
            <div>
              <div style={styles.popupTitle}>Achievement Unlocked!</div>
              <div style={styles.popupName}>{showAchievementPopup.name}</div>
              <div style={styles.popupXP}>+{showAchievementPopup.xp} XP</div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes xpGain {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-20px); }
        }
        @keyframes popupSlide {
          0% { opacity: 0; transform: translateX(100px); }
          10% { opacity: 1; transform: translateX(0); }
          90% { opacity: 1; transform: translateX(0); }
          100% { opacity: 0; transform: translateX(100px); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Styles
const styles = {
  container: {
    position: 'fixed',
    zIndex: 100,
    fontFamily: "'Space Mono', monospace",
    color: '#00ffff'
  },
  loading: {
    padding: 16,
    background: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    fontSize: 12
  },
  xpSection: {
    background: 'rgba(0,0,0,0.85)',
    border: '1px solid rgba(0,255,255,0.3)',
    borderRadius: 8,
    padding: 12,
    cursor: 'pointer'
  },
  levelBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  levelNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    textShadow: '0 0 10px currentColor'
  },
  levelTitle: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(0,255,255,0.8)'
  },
  xpBarContainer: {
    position: 'relative'
  },
  xpBarBg: {
    height: 6,
    background: 'rgba(0,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden'
  },
  xpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00ffff, #0066ff)',
    borderRadius: 3,
    transition: 'width 0.5s ease-out'
  },
  xpText: {
    fontSize: 10,
    marginTop: 4,
    color: 'rgba(0,255,255,0.7)'
  },
  xpNext: {
    color: 'rgba(0,255,255,0.4)'
  },
  xpGainAnim: {
    position: 'absolute',
    top: -20,
    right: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#00ff88',
    animation: 'xpGain 2s forwards'
  },
  levelUpText: {
    color: '#ffd700',
    marginLeft: 8
  },
  expandedSection: {
    marginTop: 8,
    padding: 12,
    background: 'rgba(0,0,0,0.85)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 8
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    marginBottom: 12
  },
  statItem: {
    textAlign: 'center',
    padding: 8,
    background: 'rgba(0,255,255,0.05)',
    borderRadius: 4
  },
  statValue: {
    display: 'block',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00ffff'
  },
  statLabel: {
    fontSize: 9,
    color: 'rgba(0,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  miniLeaderboard: {
    marginTop: 8
  },
  sectionTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: 'rgba(0,255,255,0.5)',
    marginBottom: 8
  },
  leaderboardItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 8px',
    borderRadius: 4,
    marginBottom: 2,
    fontSize: 11
  },
  leaderRank: {
    width: 24,
    color: '#ffd700'
  },
  leaderName: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  leaderXP: {
    color: 'rgba(0,255,255,0.6)'
  },
  achievementsSection: {
    marginTop: 8,
    padding: 12,
    background: 'rgba(0,0,0,0.85)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 8
  },
  achievementItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderLeft: '3px solid',
    borderRadius: 4,
    marginBottom: 6,
    background: 'rgba(0,255,255,0.03)',
    cursor: 'pointer'
  },
  achievementIcon: {
    fontSize: 20
  },
  achievementInfo: {
    flex: 1
  },
  achievementName: {
    display: 'block',
    fontSize: 11,
    fontWeight: 'bold'
  },
  achievementXP: {
    fontSize: 9,
    color: '#00ff88'
  },
  questsSection: {
    marginTop: 8,
    padding: 12,
    background: 'rgba(0,0,0,0.85)',
    border: '1px solid rgba(0,255,255,0.2)',
    borderRadius: 8
  },
  questItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    marginBottom: 6,
    background: 'rgba(0,255,255,0.03)',
    borderRadius: 4,
    cursor: 'pointer'
  },
  questIcon: {
    fontSize: 18
  },
  questInfo: {
    flex: 1
  },
  questName: {
    display: 'block',
    fontSize: 11,
    marginBottom: 4
  },
  questProgress: {
    display: 'flex',
    alignItems: 'center',
    gap: 8
  },
  questProgressBg: {
    flex: 1,
    height: 4,
    background: 'rgba(0,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  questProgressFill: {
    height: '100%',
    background: '#00ff88',
    borderRadius: 2
  },
  questProgressText: {
    fontSize: 9,
    color: 'rgba(0,255,255,0.6)'
  },
  achievementPopup: {
    position: 'fixed',
    top: 100,
    right: 20,
    zIndex: 1000,
    animation: 'popupSlide 5s forwards'
  },
  popupGlow: {
    position: 'absolute',
    inset: -10,
    background: 'radial-gradient(circle, rgba(255,215,0,0.3) 0%, transparent 70%)',
    animation: 'glowPulse 1s infinite'
  },
  popupContent: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    background: 'linear-gradient(135deg, rgba(20,20,30,0.95), rgba(10,10,20,0.95))',
    border: '2px solid #ffd700',
    borderRadius: 12,
    boxShadow: '0 0 40px rgba(255,215,0,0.3)'
  },
  popupIcon: {
    fontSize: 40
  },
  popupTitle: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: '#ffd700',
    marginBottom: 4
  },
  popupName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  popupXP: {
    fontSize: 12,
    color: '#00ff88'
  }
};
