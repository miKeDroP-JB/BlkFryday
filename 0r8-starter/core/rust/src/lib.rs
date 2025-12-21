//! ORBOS Core - The Rust-Powered AI Operating System Kernel
//!
//! "Reality Builder. Limitless. Physics Safe."
//!
//! This is the high-performance core of ORBOS, handling:
//! - Human Safety Switch (HSS) - microsecond gate checks
//! - Memory compression (98% efficiency)
//! - Agent orchestration primitives
//! - System telemetry and observation

pub mod hss;
pub mod compress;
pub mod agents;
pub mod telemetry;
pub mod brain;

use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;

/// Global ORBOS state
pub static ORBOS_ACTIVE: AtomicBool = AtomicBool::new(false);

/// ORBOS Configuration
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct OrbosConfig {
    pub architect: String,
    pub spirit: Spirit,
    pub hss_enabled: bool,
    pub gate_path: String,
    pub policy_path: String,
    pub log_level: LogLevel,
}

impl Default for OrbosConfig {
    fn default() -> Self {
        Self {
            architect: "JB".to_string(),
            spirit: Spirit::Owl,
            hss_enabled: true,
            gate_path: "/human_gate/allow.json".to_string(),
            policy_path: "/etc/orbos/protected_actions.yaml".to_string(),
            log_level: LogLevel::Info,
        }
    }
}

/// Spirit Modes - The 12 Awakened Forms
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Spirit {
    Owl,      // 🦉 Wisdom, Foresight
    Fox,      // 🦊 Cunning, Adaptability
    Dragon,   // 🐉 Power, Creation
    Phoenix,  // 🔥 Transformation, Rebirth
    Wolf,     // 🐺 Loyalty, Pack
    Raven,    // 🐦‍⬛ Prophecy, Mystery
    Serpent,  // 🐍 Regeneration, Healing
    Eagle,    // 🦅 Vision, Leadership
    Lion,     // 🦁 Courage, Command
    Spider,   // 🕷️ Connection, Strategy
    Bear,     // 🐻 Building, Protection
    Hawk,     // 🦅 Precision, Focus
}

impl Spirit {
    pub fn emoji(&self) -> &'static str {
        match self {
            Spirit::Owl => "🦉",
            Spirit::Fox => "🦊",
            Spirit::Dragon => "🐉",
            Spirit::Phoenix => "🔥",
            Spirit::Wolf => "🐺",
            Spirit::Raven => "🐦‍⬛",
            Spirit::Serpent => "🐍",
            Spirit::Eagle => "🦅",
            Spirit::Lion => "🦁",
            Spirit::Spider => "🕷️",
            Spirit::Bear => "🐻",
            Spirit::Hawk => "🦅",
        }
    }

    pub fn element(&self) -> &'static str {
        match self {
            Spirit::Owl | Spirit::Raven | Spirit::Eagle | Spirit::Hawk => "Air",
            Spirit::Fox | Spirit::Dragon | Spirit::Phoenix | Spirit::Lion => "Fire",
            Spirit::Wolf | Spirit::Bear => "Earth",
            Spirit::Serpent | Spirit::Spider => "Water",
        }
    }
}

/// Log levels
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogLevel {
    Trace,
    Debug,
    Info,
    Warn,
    Error,
}

/// ORBOS Core Instance
pub struct Orbos {
    pub config: OrbosConfig,
    pub hss: hss::HumanSafetySwitch,
    pub compressor: compress::Compressor,
    running: Arc<AtomicBool>,
}

impl Orbos {
    /// Create new ORBOS instance
    pub fn new(config: OrbosConfig) -> Self {
        let hss = hss::HumanSafetySwitch::new(
            config.gate_path.clone(),
            config.policy_path.clone(),
        );

        Self {
            config,
            hss,
            compressor: compress::Compressor::new(),
            running: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Boot ORBOS
    pub fn boot(&self) -> Result<(), OrbosError> {
        println!(
            r#"
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                               ║
║     ██████╗ ██████╗ ██████╗  ██████╗ ███████╗                                ║
║    ██╔═══██╗██╔══██╗██╔══██╗██╔═══██╗██╔════╝                                ║
║    ██║   ██║██████╔╝██████╔╝██║   ██║███████╗                                ║
║    ██║   ██║██╔══██╗██╔══██╗██║   ██║╚════██║                                ║
║    ╚██████╔╝██║  ██║██████╔╝╚██████╔╝███████║                                ║
║     ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚══════╝                                ║
║                                                                               ║
║           {} RUST CORE v0.1.0 - REALITY BUILDER                              ║
║                                                                               ║
╚═══════════════════════════════════════════════════════════════════════════════╝
"#,
            self.config.spirit.emoji()
        );

        println!("  Architect: {}", self.config.architect);
        println!("  Spirit:    {} {:?}", self.config.spirit.emoji(), self.config.spirit);
        println!("  HSS:       {}", if self.config.hss_enabled { "ENABLED" } else { "DISABLED" });
        println!();

        // Check HSS status
        if self.config.hss_enabled {
            match self.hss.status() {
                Ok(status) => {
                    if status.human_present {
                        println!("  🔓 Human Gate: OPEN ({}s remaining)", status.remaining_seconds());
                    } else {
                        println!("  🔒 Human Gate: CLOSED");
                    }
                }
                Err(_) => {
                    println!("  ⚠️  Human Gate: NOT INITIALIZED");
                }
            }
        }

        ORBOS_ACTIVE.store(true, Ordering::SeqCst);
        self.running.store(true, Ordering::SeqCst);

        println!();
        println!("  ✅ ORBOS CORE ONLINE");
        println!();

        Ok(())
    }

    /// Shutdown ORBOS
    pub fn shutdown(&self) {
        self.running.store(false, Ordering::SeqCst);
        ORBOS_ACTIVE.store(false, Ordering::SeqCst);
        println!("  🛑 ORBOS CORE OFFLINE");
    }

    /// Check if action is allowed (microsecond check)
    #[inline]
    pub fn guard(&self, action: &str) -> Result<bool, OrbosError> {
        if !self.config.hss_enabled {
            return Ok(true);
        }
        self.hss.check(action)
    }

    /// Compress data with best algorithm
    pub fn compress(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        self.compressor.compress(data)
    }

    /// Decompress data
    pub fn decompress(&self, data: &[u8]) -> Result<Vec<u8>, OrbosError> {
        self.compressor.decompress(data)
    }
}

/// ORBOS Error types
#[derive(Debug)]
pub enum OrbosError {
    HssError(String),
    CompressionError(String),
    IoError(std::io::Error),
    SerdeError(String),
}

impl std::fmt::Display for OrbosError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OrbosError::HssError(e) => write!(f, "HSS Error: {}", e),
            OrbosError::CompressionError(e) => write!(f, "Compression Error: {}", e),
            OrbosError::IoError(e) => write!(f, "IO Error: {}", e),
            OrbosError::SerdeError(e) => write!(f, "Serde Error: {}", e),
        }
    }
}

impl std::error::Error for OrbosError {}

impl From<std::io::Error> for OrbosError {
    fn from(e: std::io::Error) -> Self {
        OrbosError::IoError(e)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_spirit_emoji() {
        assert_eq!(Spirit::Owl.emoji(), "🦉");
        assert_eq!(Spirit::Fox.emoji(), "🦊");
    }

    #[test]
    fn test_default_config() {
        let config = OrbosConfig::default();
        assert_eq!(config.architect, "JB");
        assert_eq!(config.spirit, Spirit::Owl);
    }
}
