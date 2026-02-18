//! ORB-BOOT - ORBOS Boot Sequence
//!
//! Fast boot into ORBOS with specified spirit mode.

use orbos_core::{Orbos, OrbosConfig, Spirit};
use std::env;

fn main() {
    let spirit = env::var("ORBOS_SPIRIT")
        .or_else(|_| env::var("ORB_SPIRIT"))
        .unwrap_or_else(|_| "owl".to_string());

    let spirit = match spirit.to_lowercase().as_str() {
        "owl" => Spirit::Owl,
        "fox" => Spirit::Fox,
        "dragon" => Spirit::Dragon,
        "phoenix" => Spirit::Phoenix,
        "wolf" => Spirit::Wolf,
        "raven" => Spirit::Raven,
        "serpent" => Spirit::Serpent,
        "eagle" => Spirit::Eagle,
        "lion" => Spirit::Lion,
        "spider" => Spirit::Spider,
        "bear" => Spirit::Bear,
        "hawk" => Spirit::Hawk,
        _ => Spirit::Owl,
    };

    let config = OrbosConfig {
        architect: "JB".to_string(),
        spirit,
        hss_enabled: true,
        ..Default::default()
    };

    let orbos = Orbos::new(config);

    if let Err(e) = orbos.boot() {
        eprintln!("❌ Boot failed: {}", e);
        std::process::exit(1);
    }

    // Keep running
    println!();
    println!("  Type 'exit' to shutdown or Ctrl+C");
    println!();

    let mut input = String::new();
    loop {
        input.clear();
        if std::io::stdin().read_line(&mut input).is_err() {
            break;
        }

        let cmd = input.trim();
        if cmd == "exit" || cmd == "quit" {
            break;
        }

        // Simple command handling
        match cmd {
            "status" => {
                match orbos.hss.status() {
                    Ok(state) => {
                        if state.is_valid() {
                            println!("  🔓 Gate: OPEN ({}s)", state.remaining_seconds());
                        } else {
                            println!("  🔒 Gate: CLOSED");
                        }
                    }
                    Err(_) => println!("  ⚠️  Gate: NOT CONFIGURED"),
                }
            }
            "spirit" => {
                println!("  {} {:?}", orbos.config.spirit.emoji(), orbos.config.spirit);
            }
            "help" => {
                println!("  Commands: status, spirit, help, exit");
            }
            "" => {}
            _ => {
                println!("  Unknown command: {}", cmd);
            }
        }
    }

    orbos.shutdown();
}
