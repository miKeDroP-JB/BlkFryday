//! Human Safety Switch (HSS) - Microsecond Gate Checks
//!
//! "Agents: full autonomy. Destructive power: gated. Enforcement: OS-level."

use crate::OrbosError;
use serde::{Deserialize, Serialize};
use std::fs;
use std::time::{SystemTime, UNIX_EPOCH};

/// Gate state from /human_gate/allow.json
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateState {
    pub human_present: bool,
    pub timestamp: Option<i64>,
    pub ttl_seconds: i64,
    pub session_id: Option<String>,
    pub allowed_actions: Vec<String>,
    #[serde(default)]
    pub reason: Option<String>,
}

impl GateState {
    /// Check if gate is currently valid
    pub fn is_valid(&self) -> bool {
        if !self.human_present {
            return false;
        }

        let Some(timestamp) = self.timestamp else {
            return false;
        };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        now < timestamp + self.ttl_seconds
    }

    /// Get remaining seconds
    pub fn remaining_seconds(&self) -> i64 {
        if !self.human_present {
            return 0;
        }

        let Some(timestamp) = self.timestamp else {
            return 0;
        };

        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        let expires = timestamp + self.ttl_seconds;
        (expires - now).max(0)
    }
}

/// Protected actions from /etc/orbos/protected_actions.yaml
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProtectedActions {
    pub requires_human: Vec<String>,
    #[serde(default)]
    pub auto_allow: Vec<String>,
}

/// Human Safety Switch
pub struct HumanSafetySwitch {
    gate_path: String,
    policy_path: String,
    /// Cached policy (loaded once)
    cached_policy: Option<ProtectedActions>,
}

impl HumanSafetySwitch {
    /// Create new HSS instance
    pub fn new(gate_path: String, policy_path: String) -> Self {
        Self {
            gate_path,
            policy_path,
            cached_policy: None,
        }
    }

    /// Load and cache policy
    fn load_policy(&mut self) -> Result<&ProtectedActions, OrbosError> {
        if self.cached_policy.is_none() {
            let content = fs::read_to_string(&self.policy_path)
                .map_err(|e| OrbosError::HssError(format!("Failed to read policy: {}", e)))?;

            let policy: ProtectedActions = serde_yaml::from_str(&content)
                .map_err(|e| OrbosError::HssError(format!("Failed to parse policy: {}", e)))?;

            self.cached_policy = Some(policy);
        }

        Ok(self.cached_policy.as_ref().unwrap())
    }

    /// Get current gate status
    pub fn status(&self) -> Result<GateState, OrbosError> {
        let content = fs::read_to_string(&self.gate_path)
            .map_err(|e| OrbosError::HssError(format!("Failed to read gate: {}", e)))?;

        serde_json::from_str(&content)
            .map_err(|e| OrbosError::HssError(format!("Failed to parse gate: {}", e)))
    }

    /// Check if action is allowed (FAST - microseconds)
    #[inline]
    pub fn check(&self, action: &str) -> Result<bool, OrbosError> {
        // Fast path: check if action needs human at all
        if !self.requires_human(action)? {
            return Ok(true);
        }

        // Check gate state
        let gate = self.status()?;

        if !gate.is_valid() {
            return Ok(false);
        }

        // Check if action is in allowed list (or ALL)
        if gate.allowed_actions.contains(&"ALL".to_string()) {
            return Ok(true);
        }

        Ok(gate.allowed_actions.contains(&action.to_string()))
    }

    /// Check if action requires human (cached check)
    fn requires_human(&self, action: &str) -> Result<bool, OrbosError> {
        // Read policy file (would be cached in production)
        let content = fs::read_to_string(&self.policy_path).unwrap_or_default();

        // Fast string check
        if content.contains(action) {
            // Check if in auto_allow section
            if let Some(auto_pos) = content.find("auto_allow:") {
                let auto_section = &content[auto_pos..];
                if auto_section.contains(action) {
                    return Ok(false);
                }
            }

            // Check if in requires_human section
            if let Some(req_pos) = content.find("requires_human:") {
                let req_section = &content[req_pos..];
                if req_section.contains(action) {
                    return Ok(true);
                }
            }
        }

        Ok(false)
    }

    /// Reload policy (clear cache)
    pub fn reload_policy(&mut self) {
        self.cached_policy = None;
    }
}

/// Quick check function for use in other modules
#[inline]
pub fn quick_check(action: &str) -> bool {
    let hss = HumanSafetySwitch::new(
        "/human_gate/allow.json".to_string(),
        "/etc/orbos/protected_actions.yaml".to_string(),
    );

    hss.check(action).unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_gate_state_validity() {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        // Valid gate
        let gate = GateState {
            human_present: true,
            timestamp: Some(now),
            ttl_seconds: 300,
            session_id: Some("test".to_string()),
            allowed_actions: vec!["ALL".to_string()],
            reason: None,
        };
        assert!(gate.is_valid());

        // Expired gate
        let expired = GateState {
            human_present: true,
            timestamp: Some(now - 1000),
            ttl_seconds: 300,
            session_id: Some("test".to_string()),
            allowed_actions: vec!["ALL".to_string()],
            reason: None,
        };
        assert!(!expired.is_valid());

        // Closed gate
        let closed = GateState {
            human_present: false,
            timestamp: None,
            ttl_seconds: 0,
            session_id: None,
            allowed_actions: vec![],
            reason: None,
        };
        assert!(!closed.is_valid());
    }
}
