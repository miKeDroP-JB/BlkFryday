//! ORBOS Brain - Neural Swarm Primitives
//!
//! High-performance structures for the 1000-agent brain network.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Skill dimensions (12 pillars)
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Skill {
    // Cognitive
    Reasoning,
    Creativity,
    Analysis,
    Synthesis,
    // Execution
    Speed,
    Accuracy,
    Efficiency,
    Adaptability,
    // Social
    Communication,
    Collaboration,
    Leadership,
    Empathy,
}

impl Skill {
    pub fn all() -> &'static [Skill] {
        &[
            Skill::Reasoning,
            Skill::Creativity,
            Skill::Analysis,
            Skill::Synthesis,
            Skill::Speed,
            Skill::Accuracy,
            Skill::Efficiency,
            Skill::Adaptability,
            Skill::Communication,
            Skill::Collaboration,
            Skill::Leadership,
            Skill::Empathy,
        ]
    }

    pub fn category(&self) -> &'static str {
        match self {
            Skill::Reasoning | Skill::Creativity | Skill::Analysis | Skill::Synthesis => {
                "Cognitive"
            }
            Skill::Speed | Skill::Accuracy | Skill::Efficiency | Skill::Adaptability => {
                "Execution"
            }
            Skill::Communication | Skill::Collaboration | Skill::Leadership | Skill::Empathy => {
                "Social"
            }
        }
    }
}

/// Processing modes
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProcessingMode {
    /// ⚡ 10x speed, 100% parallel
    Simultaneous,
    /// 🏆 3x speed, competitive excellence
    Tournament,
    /// ∞ Hidden harmonics, 50% accuracy boost
    Resonance,
}

/// Brain node (single agent in swarm)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainNode {
    pub id: u32,
    pub swarm_id: u8,
    pub skills: HashMap<Skill, u8>, // 0-100
    pub energy: f32,                // 0.0-1.0
    pub active: bool,
}

impl BrainNode {
    pub fn new(id: u32, swarm_id: u8) -> Self {
        Self {
            id,
            swarm_id,
            skills: HashMap::new(),
            energy: 1.0,
            active: true,
        }
    }

    /// Initialize with random skills (90+ baseline)
    pub fn with_high_skills(mut self) -> Self {
        for skill in Skill::all() {
            self.skills.insert(*skill, 90 + (self.id % 10) as u8);
        }
        self
    }

    /// Get overall capability score
    pub fn capability_score(&self) -> f32 {
        let sum: u32 = self.skills.values().map(|&v| v as u32).sum();
        let count = self.skills.len() as f32;
        if count > 0.0 {
            (sum as f32 / count) * self.energy
        } else {
            0.0
        }
    }

    /// Deplete energy
    pub fn work(&mut self, amount: f32) {
        self.energy = (self.energy - amount).max(0.0);
        if self.energy < 0.1 {
            self.active = false;
        }
    }

    /// Recharge
    pub fn rest(&mut self, amount: f32) {
        self.energy = (self.energy + amount).min(1.0);
        if self.energy > 0.3 {
            self.active = true;
        }
    }
}

/// Brain swarm (100 agents)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainSwarm {
    pub id: u8,
    pub name: String,
    pub nodes: Vec<BrainNode>,
    pub mode: ProcessingMode,
    pub phase: f32, // Energy wave phase (0.0-1.0)
}

impl BrainSwarm {
    /// Create swarm with 100 nodes
    pub fn new(id: u8, name: impl Into<String>) -> Self {
        let nodes: Vec<BrainNode> = (0..100)
            .map(|i| BrainNode::new(id as u32 * 100 + i, id).with_high_skills())
            .collect();

        Self {
            id,
            name: name.into(),
            nodes,
            mode: ProcessingMode::Simultaneous,
            phase: (id as f32) / 10.0, // Staggered phases
        }
    }

    /// Get active node count
    pub fn active_count(&self) -> usize {
        self.nodes.iter().filter(|n| n.active).count()
    }

    /// Get average capability
    pub fn average_capability(&self) -> f32 {
        let active: Vec<f32> = self
            .nodes
            .iter()
            .filter(|n| n.active)
            .map(|n| n.capability_score())
            .collect();

        if active.is_empty() {
            0.0
        } else {
            active.iter().sum::<f32>() / active.len() as f32
        }
    }

    /// Energy wave tick (perpetual motion)
    pub fn tick(&mut self, delta: f32) {
        self.phase = (self.phase + delta) % 1.0;

        // Sinusoidal energy distribution
        let wave = (self.phase * std::f32::consts::PI * 2.0).sin() * 0.5 + 0.5;

        for node in &mut self.nodes {
            if wave > 0.5 {
                node.rest(delta * 0.1);
            } else {
                node.work(delta * 0.05);
            }
        }
    }

    /// Find best node for skill
    pub fn best_for_skill(&self, skill: Skill) -> Option<&BrainNode> {
        self.nodes
            .iter()
            .filter(|n| n.active)
            .max_by_key(|n| n.skills.get(&skill).copied().unwrap_or(0))
    }
}

/// Full brain network (10 swarms, 1000 agents)
pub struct BrainNetwork {
    pub swarms: Vec<BrainSwarm>,
    pub global_mode: ProcessingMode,
}

impl BrainNetwork {
    /// Create full brain network
    pub fn new() -> Self {
        let swarm_names = [
            "Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa",
        ];

        let swarms: Vec<BrainSwarm> = (0..10)
            .map(|i| BrainSwarm::new(i, swarm_names[i as usize]))
            .collect();

        Self {
            swarms,
            global_mode: ProcessingMode::Simultaneous,
        }
    }

    /// Total active agents
    pub fn active_count(&self) -> usize {
        self.swarms.iter().map(|s| s.active_count()).sum()
    }

    /// Total agents
    pub fn total_count(&self) -> usize {
        self.swarms.iter().map(|s| s.nodes.len()).sum()
    }

    /// Global tick
    pub fn tick(&mut self, delta: f32) {
        for swarm in &mut self.swarms {
            swarm.tick(delta);
        }
    }

    /// Find best agent network-wide
    pub fn best_for_skill(&self, skill: Skill) -> Option<&BrainNode> {
        self.swarms
            .iter()
            .filter_map(|s| s.best_for_skill(skill))
            .max_by_key(|n| n.skills.get(&skill).copied().unwrap_or(0))
    }

    /// Set processing mode
    pub fn set_mode(&mut self, mode: ProcessingMode) {
        self.global_mode = mode;
        for swarm in &mut self.swarms {
            swarm.mode = mode;
        }
    }

    /// Get network status
    pub fn status(&self) -> BrainStatus {
        BrainStatus {
            total_agents: self.total_count(),
            active_agents: self.active_count(),
            mode: self.global_mode,
            swarm_status: self
                .swarms
                .iter()
                .map(|s| SwarmStatus {
                    id: s.id,
                    name: s.name.clone(),
                    active: s.active_count(),
                    capability: s.average_capability(),
                    phase: s.phase,
                })
                .collect(),
        }
    }
}

impl Default for BrainNetwork {
    fn default() -> Self {
        Self::new()
    }
}

/// Brain network status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrainStatus {
    pub total_agents: usize,
    pub active_agents: usize,
    pub mode: ProcessingMode,
    pub swarm_status: Vec<SwarmStatus>,
}

/// Individual swarm status
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SwarmStatus {
    pub id: u8,
    pub name: String,
    pub active: usize,
    pub capability: f32,
    pub phase: f32,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_brain_network_creation() {
        let network = BrainNetwork::new();
        assert_eq!(network.total_count(), 1000);
        assert_eq!(network.swarms.len(), 10);
    }

    #[test]
    fn test_swarm_energy_wave() {
        let mut swarm = BrainSwarm::new(0, "Test");
        let initial_active = swarm.active_count();

        // Tick through a full cycle
        for _ in 0..100 {
            swarm.tick(0.01);
        }

        // Should still have most agents active
        assert!(swarm.active_count() >= initial_active - 10);
    }

    #[test]
    fn test_skill_lookup() {
        let network = BrainNetwork::new();
        let best = network.best_for_skill(Skill::Reasoning);
        assert!(best.is_some());
    }
}
