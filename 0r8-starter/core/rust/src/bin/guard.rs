//! ORB-GUARD - Microsecond HSS check binary
//!
//! Usage: orb-guard <action>
//! Exit codes:
//!   0  = ALLOWED
//!   13 = DENIED (gate closed)
//!   14 = DENIED (gate expired)

use orbos_core::hss::HumanSafetySwitch;
use std::env;
use std::process::ExitCode;

fn main() -> ExitCode {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        eprintln!("Usage: orb-guard <action>");
        return ExitCode::from(2);
    }

    let action = &args[1];

    let hss = HumanSafetySwitch::new(
        "/human_gate/allow.json".to_string(),
        "/etc/orbos/protected_actions.yaml".to_string(),
    );

    match hss.check(action) {
        Ok(true) => {
            if let Ok(state) = hss.status() {
                println!(
                    "🔓 ALLOWED: {} (gate expires in {}s)",
                    action,
                    state.remaining_seconds()
                );
            } else {
                println!("🔓 ALLOWED: {}", action);
            }
            ExitCode::SUCCESS
        }
        Ok(false) => {
            // Determine specific denial reason
            match hss.status() {
                Ok(state) => {
                    if !state.human_present {
                        eprintln!("🔒 DENIED: human gate closed");
                        ExitCode::from(13)
                    } else if state.remaining_seconds() <= 0 {
                        eprintln!("🔒 DENIED: human gate expired");
                        ExitCode::from(14)
                    } else {
                        eprintln!("🔒 DENIED: action not in allowed list");
                        ExitCode::from(15)
                    }
                }
                Err(_) => {
                    eprintln!("🔒 DENIED: gate not initialized");
                    ExitCode::from(13)
                }
            }
        }
        Err(e) => {
            eprintln!("⚠️  ERROR: {}", e);
            ExitCode::from(1)
        }
    }
}
