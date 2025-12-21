//! ORBOS Agent Primitives
//!
//! Core agent structures and traits for the swarm.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Agent ID
pub type AgentId = String;

/// Agent status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentStatus {
    Idle,
    Working,
    Blocked,
    Complete,
    Error,
}

/// Agent capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    pub name: String,
    pub level: u8, // 0-100
    pub description: String,
}

/// Agent definition
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Agent {
    pub id: AgentId,
    pub name: String,
    pub pantheon: String, // Zeus, Athena, etc.
    pub status: AgentStatus,
    pub capabilities: Vec<Capability>,
    pub reputation: f64, // 0.0-1.0
    pub tasks_completed: u64,
    pub success_rate: f64,
}

impl Agent {
    /// Create new agent
    pub fn new(id: impl Into<String>, name: impl Into<String>, pantheon: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            name: name.into(),
            pantheon: pantheon.into(),
            status: AgentStatus::Idle,
            capabilities: Vec::new(),
            reputation: 0.5,
            tasks_completed: 0,
            success_rate: 0.0,
        }
    }

    /// Add capability
    pub fn with_capability(mut self, name: impl Into<String>, level: u8) -> Self {
        self.capabilities.push(Capability {
            name: name.into(),
            level,
            description: String::new(),
        });
        self
    }

    /// Check if agent can perform action
    pub fn can_perform(&self, action: &str) -> bool {
        self.capabilities.iter().any(|c| c.name == action && c.level > 0)
    }

    /// Update success rate after task
    pub fn record_task(&mut self, success: bool) {
        self.tasks_completed += 1;
        let success_count = (self.success_rate * (self.tasks_completed - 1) as f64)
            + if success { 1.0 } else { 0.0 };
        self.success_rate = success_count / self.tasks_completed as f64;

        // Update reputation
        if success {
            self.reputation = (self.reputation + 0.01).min(1.0);
        } else {
            self.reputation = (self.reputation - 0.02).max(0.0);
        }
    }
}

/// Task for agents
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: String,
    pub description: String,
    pub required_capability: String,
    pub priority: u8,
    pub protected: bool, // Requires HSS gate
}

/// Agent swarm
pub struct Swarm {
    pub agents: HashMap<AgentId, Agent>,
    pub pending_tasks: Vec<Task>,
}

impl Swarm {
    pub fn new() -> Self {
        Self {
            agents: HashMap::new(),
            pending_tasks: Vec::new(),
        }
    }

    /// Add agent to swarm
    pub fn add(&mut self, agent: Agent) {
        self.agents.insert(agent.id.clone(), agent);
    }

    /// Find best agent for task
    pub fn find_agent(&self, capability: &str) -> Option<&Agent> {
        self.agents
            .values()
            .filter(|a| a.can_perform(capability) && a.status == AgentStatus::Idle)
            .max_by(|a, b| a.reputation.partial_cmp(&b.reputation).unwrap())
    }

    /// Queue task
    pub fn queue(&mut self, task: Task) {
        self.pending_tasks.push(task);
        self.pending_tasks.sort_by(|a, b| b.priority.cmp(&a.priority));
    }
}

impl Default for Swarm {
    fn default() -> Self {
        Self::new()
    }
}

/// The Pantheon - predefined agent archetypes
pub fn create_pantheon() -> Vec<Agent> {
    vec![
        Agent::new("orb_brain", "OrbBrain", "Zeus")
            .with_capability("orchestrate", 100)
            .with_capability("dispatch", 100),
        Agent::new("sentinel", "Sentinel", "Athena")
            .with_capability("security", 95)
            .with_capability("scan", 90),
        Agent::new("apollo", "Apollo", "Apollo")
            .with_capability("freelance", 85)
            .with_capability("automation", 80),
        Agent::new("mercury", "Mercury", "Hermes")
            .with_capability("outreach", 90)
            .with_capability("pitch", 85),
        Agent::new("athena", "Athena", "Athena")
            .with_capability("content", 95)
            .with_capability("wisdom", 90),
        Agent::new("ares", "Ares", "Ares")
            .with_capability("bugbounty", 80)
            .with_capability("attack", 75),
        Agent::new("hermes", "Hermes", "Hermes")
            .with_capability("messaging", 85)
            .with_capability("delivery", 90),
        Agent::new("hephaestus", "Hephaestus", "Hephaestus")
            .with_capability("build", 95)
            .with_capability("forge", 90),
        Agent::new("artemis", "Artemis", "Artemis")
            .with_capability("compliance", 85)
            .with_capability("hunt", 80),
    ]
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_agent_reputation() {
        let mut agent = Agent::new("test", "Test", "Zeus");
        assert_eq!(agent.reputation, 0.5);

        agent.record_task(true);
        assert!(agent.reputation > 0.5);

        agent.record_task(false);
        assert!(agent.reputation < 0.51);
    }

    #[test]
    fn test_swarm_find_agent() {
        let mut swarm = Swarm::new();
        swarm.add(Agent::new("a1", "A1", "Zeus").with_capability("build", 80));
        swarm.add(Agent::new("a2", "A2", "Zeus").with_capability("build", 90));

        let best = swarm.find_agent("build");
        assert!(best.is_some());
    }
}
