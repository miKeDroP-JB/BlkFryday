//! ORBOS CLI - The Reality Builder
//!
//! Main entry point for the ORBOS Rust core.

use clap::{Parser, Subcommand};
use orbos_core::{Orbos, OrbosConfig, Spirit};

#[derive(Parser)]
#[command(name = "orbos")]
#[command(author = "JB <architect@orbos.ai>")]
#[command(version = "0.1.0")]
#[command(about = "ORBOS - The AI Operating System", long_about = None)]
struct Cli {
    /// Spirit mode to boot with
    #[arg(short, long, default_value = "owl")]
    spirit: String,

    /// Disable HSS (not recommended)
    #[arg(long)]
    no_hss: bool,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Boot ORBOS
    Boot {
        /// Spirit mode
        #[arg(short, long)]
        spirit: Option<String>,
    },

    /// Check HSS gate status
    Status,

    /// Guard check for an action
    Guard {
        /// Action to check
        action: String,
    },

    /// Compress a file
    Compress {
        /// Input file
        input: String,
        /// Output file
        #[arg(short, long)]
        output: Option<String>,
    },

    /// Decompress a file
    Decompress {
        /// Input file
        input: String,
        /// Output file
        #[arg(short, long)]
        output: Option<String>,
    },

    /// Run diagnostics
    Diag,
}

fn parse_spirit(s: &str) -> Spirit {
    match s.to_lowercase().as_str() {
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
    }
}

fn main() {
    let cli = Cli::parse();

    let spirit = parse_spirit(&cli.spirit);

    let config = OrbosConfig {
        architect: "JB".to_string(),
        spirit,
        hss_enabled: !cli.no_hss,
        ..Default::default()
    };

    let orbos = Orbos::new(config);

    match cli.command {
        Some(Commands::Boot { spirit: sp }) => {
            let boot_spirit = sp.map(|s| parse_spirit(&s)).unwrap_or(spirit);
            let config = OrbosConfig {
                spirit: boot_spirit,
                hss_enabled: !cli.no_hss,
                ..Default::default()
            };
            let orbos = Orbos::new(config);

            if let Err(e) = orbos.boot() {
                eprintln!("Boot failed: {}", e);
                std::process::exit(1);
            }
        }

        Some(Commands::Status) => {
            match orbos.hss.status() {
                Ok(state) => {
                    if state.is_valid() {
                        println!("🔓 GATE OPEN");
                        println!("   Session:   {}", state.session_id.unwrap_or_default());
                        println!("   Remaining: {}s", state.remaining_seconds());
                        if let Some(reason) = state.reason {
                            println!("   Reason:    {}", reason);
                        }
                    } else {
                        println!("🔒 GATE CLOSED");
                    }
                }
                Err(e) => {
                    println!("⚠️  GATE ERROR: {}", e);
                    std::process::exit(1);
                }
            }
        }

        Some(Commands::Guard { action }) => {
            match orbos.guard(&action) {
                Ok(true) => {
                    println!("🔓 ALLOWED: {}", action);
                    std::process::exit(0);
                }
                Ok(false) => {
                    println!("🔒 DENIED: {}", action);
                    std::process::exit(13);
                }
                Err(e) => {
                    println!("⚠️  ERROR: {}", e);
                    std::process::exit(1);
                }
            }
        }

        Some(Commands::Compress { input, output }) => {
            let data = std::fs::read(&input).expect("Failed to read input file");
            let (compressed, stats) = orbos
                .compressor
                .compress_with_stats(&data)
                .expect("Compression failed");

            let out_path = output.unwrap_or_else(|| format!("{}.zst", input));
            std::fs::write(&out_path, &compressed).expect("Failed to write output");

            println!("✅ Compressed: {} -> {}", input, out_path);
            println!("   Original:   {} bytes", stats.original_size);
            println!("   Compressed: {} bytes", stats.compressed_size);
            println!("   Ratio:      {:.1}%", stats.percentage());
            println!("   Time:       {}μs", stats.time_us);
        }

        Some(Commands::Decompress { input, output }) => {
            let data = std::fs::read(&input).expect("Failed to read input file");
            let decompressed = orbos.decompress(&data).expect("Decompression failed");

            let out_path = output.unwrap_or_else(|| {
                input.strip_suffix(".zst").unwrap_or(&input).to_string() + ".out"
            });
            std::fs::write(&out_path, &decompressed).expect("Failed to write output");

            println!("✅ Decompressed: {} -> {}", input, out_path);
            println!("   Size: {} bytes", decompressed.len());
        }

        Some(Commands::Diag) => {
            println!("ORBOS Diagnostics");
            println!("=================");
            println!();
            println!("Spirit:  {} {:?}", orbos.config.spirit.emoji(), orbos.config.spirit);
            println!("Element: {}", orbos.config.spirit.element());
            println!("HSS:     {}", if orbos.config.hss_enabled { "enabled" } else { "disabled" });
            println!();

            // Test compression
            let test_data = vec![0u8; 10000];
            if let Ok((_, stats)) = orbos.compressor.compress_with_stats(&test_data) {
                println!("Compression test: {:.1}% ratio in {}μs", stats.percentage(), stats.time_us);
            }

            // Test HSS
            match orbos.hss.status() {
                Ok(state) => {
                    println!("HSS gate:        {}", if state.is_valid() { "OPEN" } else { "CLOSED" });
                }
                Err(_) => {
                    println!("HSS gate:        NOT CONFIGURED");
                }
            }
        }

        None => {
            // Default: boot
            if let Err(e) = orbos.boot() {
                eprintln!("Boot failed: {}", e);
                std::process::exit(1);
            }
        }
    }
}
