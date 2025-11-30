# TERRA-PULSE: Grounding Shoe with LED & Audio System

```
═══════════════════════════════════════════════════════════════
                    TERRA-PULSE GROUNDING SHOE
═══════════════════════════════════════════════════════════════

  ████████╗███████╗██████╗ ██████╗  █████╗
  ╚══██╔══╝██╔════╝██╔══██╗██╔══██╗██╔══██╗
     ██║   █████╗  ██████╔╝██████╔╝███████║
     ██║   ██╔══╝  ██╔══██╗██╔══██╗██╔══██║
     ██║   ███████╗██║  ██║██║  ██║██║  ██║
     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝

          ██████╗ ██╗   ██╗██╗     ███████╗███████╗
          ██╔══██╗██║   ██║██║     ██╔════╝██╔════╝
          ██████╔╝██║   ██║██║     ███████╗█████╗
          ██╔═══╝ ██║   ██║██║     ╚════██║██╔══╝
          ██║     ╚██████╔╝███████╗███████║███████╗
          ╚═╝      ╚═════╝ ╚══════╝╚══════╝╚══════╝

            "Ground Yourself. Light Your Path."

═══════════════════════════════════════════════════════════════
```

## Product Overview

**TERRA-PULSE** is a revolutionary grounding shoe inspired by the Nike Free's minimalist, flexible design philosophy. It combines earthing technology with integrated thin-profile LED lighting and a compact speaker system for an immersive wellness experience.

## Design Philosophy

### Nike Free Inspiration
- **Flexible sole construction** with deep siping patterns
- **Minimal stack height** for ground feel
- **Anatomical fit** that moves with the foot
- **Lightweight materials** throughout

### Grounding Technology
- **Conductive carbon fiber threads** woven into the sole
- **Earth contact points** at key pressure zones
- **Copper grounding mesh** integrated into insole
- **Bio-conductive pathway** from foot to ground

---

## Technical Specifications

### Dimensions & Weight
| Component | Specification |
|-----------|---------------|
| Total Weight | 285g (Men's US 10) |
| Stack Height | 18mm heel / 10mm forefoot |
| Drop | 8mm |
| LED Strip Width | 3mm ultra-thin |
| Speaker Diameter | 15mm micro-driver |

### Materials
```
UPPER
├── Engineered mesh with conductive fibers
├── Recycled TPU overlays
├── Bio-based synthetic leather accents
└── Reflective 3M elements

MIDSOLE
├── Dual-density EVA foam
├── Conductive carbon fiber plate
├── Copper grounding matrix
└── Flex grooves (Nike Free-style)

OUTSOLE
├── Conductive rubber compound
├── Earth contact pods (7 points)
├── Deep siping pattern
└── LED housing channels
```

---

## LED Lighting System

### Configuration
```
LED LAYOUT
═══════════════════════════════════════

        ┌─────────────────────────┐
       /    TONGUE LED STRIP      \
      /   [═══════════════════]    \
     │                              │
     │   ╭──────────────────────╮   │
     │   │    HEEL COUNTER      │   │
     │   │    LED RING          │   │
     │   ╰──────────────────────╯   │
     │                              │
     │                              │
     │  SIDE    ║           ║  SIDE │
     │  STRIP   ║   SOLE    ║ STRIP │
     │   ║      ║           ║    ║  │
     └───╨──────╨───────────╨────╨──┘
              OUTSOLE PERIMETER
           [═══════════════════]
```

### LED Specifications
| Feature | Specification |
|---------|---------------|
| LED Type | SK6812 RGBW Addressable |
| LED Count | 42 per shoe |
| Strip Width | 3mm flexible PCB |
| Brightness | 800 lumens max |
| IP Rating | IP67 Waterproof |
| Color Range | 16.7M colors + warm white |

### Lighting Zones
1. **Outsole Perimeter** - 18 LEDs around sole edge
2. **Heel Counter Ring** - 8 LEDs rear visibility
3. **Side Accent Strips** - 6 LEDs per side (12 total)
4. **Tongue Illuminator** - 4 LEDs for branding

### Lighting Modes
```javascript
const LIGHTING_MODES = {
  EARTH_PULSE: {
    description: "Pulsing green synced to grounding status",
    color: "#00FF88",
    pattern: "breathe",
    frequency: "0.5Hz"
  },
  NIGHT_RUNNER: {
    description: "High-visibility safety mode",
    color: "#FFFFFF",
    pattern: "solid",
    brightness: "100%"
  },
  HEART_SYNC: {
    description: "Syncs to heart rate via Bluetooth",
    color: "dynamic",
    pattern: "pulse",
    frequency: "variable"
  },
  MUSIC_REACTIVE: {
    description: "Responds to audio from speaker",
    color: "spectrum",
    pattern: "reactive",
    sensitivity: "adjustable"
  },
  GROUNDING_INDICATOR: {
    description: "Shows earth connection status",
    colors: {
      connected: "#00FF00",
      partial: "#FFFF00",
      disconnected: "#FF0000"
    }
  },
  CUSTOM: {
    description: "User-defined patterns via app",
    programmable: true
  }
};
```

---

## Speaker System

### Speaker Specifications
```
MICRO-DRIVER AUDIO SYSTEM
═════════════════════════════════════════

┌─────────────────────────────────────┐
│         HEEL CAVITY HOUSING         │
│                                     │
│    ╭───────────────────────────╮    │
│    │   ┌─────────────────┐     │    │
│    │   │  15mm DRIVER    │     │    │
│    │   │  ╭───────────╮  │     │    │
│    │   │  │ NEODYMIUM │  │     │    │
│    │   │  │   MAGNET  │  │     │    │
│    │   │  ╰───────────╯  │     │    │
│    │   └─────────────────┘     │    │
│    │                           │    │
│    │   PASSIVE RADIATOR        │    │
│    │   [═══════════════]       │    │
│    ╰───────────────────────────╯    │
│                                     │
│         BONE CONDUCTION PAD         │
│    ═══════════════════════════      │
└─────────────────────────────────────┘
```

### Audio Features
| Feature | Specification |
|---------|---------------|
| Driver Size | 15mm neodymium |
| Frequency Response | 80Hz - 18kHz |
| Output Power | 1W RMS |
| THD | <3% @ 1kHz |
| Passive Radiator | 20mm for bass enhancement |
| Bone Conduction | Optional auxiliary pad |

### Audio Use Cases
- **Guided meditation** during grounding sessions
- **Binaural beats** for enhanced relaxation
- **Step cadence audio** for runners
- **Navigation prompts** via connected apps
- **Earth frequency tones** (7.83Hz Schumann resonance simulation)

---

## Power System

### Battery Specifications
```
POWER ARCHITECTURE
═══════════════════════════════════════

┌─────────────────────────────────────┐
│           ARCH BATTERY POD          │
│                                     │
│   ┌─────────────────────────────┐   │
│   │     400mAh LiPo Cell        │   │
│   │     ══════════════════      │   │
│   │     3.7V / 1.48Wh           │   │
│   └─────────────────────────────┘   │
│                                     │
│   WIRELESS CHARGING COIL            │
│   ╭─────────────────────────────╮   │
│   │  ◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯◯  │   │
│   │  Qi Compatible - 5W         │   │
│   ╰─────────────────────────────╯   │
│                                     │
└─────────────────────────────────────┘
```

### Power Stats
| Feature | Specification |
|---------|---------------|
| Battery Capacity | 400mAh per shoe |
| Battery Type | LiPo (Lithium Polymer) |
| Charging | Qi Wireless / USB-C |
| Charge Time | 1.5 hours (0-100%) |
| LED Runtime | 8 hours (medium brightness) |
| Audio Runtime | 6 hours continuous |
| Combined Runtime | 4 hours (LED + Audio) |
| Standby | 30 days |

### Charging Station
```
DUAL-SHOE CHARGING DOCK
═══════════════════════════════════════

     ╭─────────────────────────────╮
     │    ┌───────┐   ┌───────┐    │
     │    │ LEFT  │   │ RIGHT │    │
     │    │  ◯◯◯  │   │  ◯◯◯  │    │
     │    │  ◯◯◯  │   │  ◯◯◯  │    │
     │    └───────┘   └───────┘    │
     │                             │
     │   [═══] USB-C INPUT [═══]   │
     │       LED STATUS RING       │
     ╰─────────────────────────────╯
```

---

## Grounding System

### Earth Connection Technology
```
GROUNDING PATHWAY
═══════════════════════════════════════

FOOT CONTACT
     │
     ▼
┌─────────────────────────────────────┐
│   COPPER MESH INSOLE                │
│   (Harvests body's static charge)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   CONDUCTIVE CARBON FIBER PLATE     │
│   (Transfers electrons efficiently) │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│   EARTH CONTACT PODS (7 Points)     │
│                                     │
│      ◉         ◉         ◉          │
│           ◉         ◉               │
│      ◉                   ◉          │
│                                     │
│   (Conductive rubber compound)      │
└──────────────┬──────────────────────┘
               │
               ▼
          EARTH/GROUND
```

### Grounding Features
- **Real-time grounding detection** via resistance measurement
- **LED indicator** shows connection status
- **App connectivity** logs grounding sessions
- **Schumann resonance audio** enhances experience

---

## Connectivity

### Bluetooth Specifications
| Feature | Specification |
|---------|---------------|
| Protocol | Bluetooth 5.3 LE |
| Range | 30m (open air) |
| Pairing | Tap-to-pair (NFC) |
| Multi-device | Up to 3 devices |
| Profiles | A2DP, AVRCP, HFP |

### App Features (TERRA-PULSE Connect)
- LED pattern customization
- Grounding session tracking
- Heart rate sync (with compatible wearables)
- Step tracking with audio feedback
- Music reactive mode controls
- Firmware updates OTA

---

## Construction Diagram

```
EXPLODED VIEW - TERRA-PULSE
═══════════════════════════════════════════════════════════════

                    UPPER MESH
                   ╱─────────╲
                  ╱           ╲
                 ╱  TONGUE     ╲
                │   LED STRIP   │
                │               │
    ┌───────────┴───────────────┴───────────┐  ← COLLAR PADDING
    │                                       │
    │         HEEL COUNTER                  │
    │         └─ LED RING                   │
    │         └─ SPEAKER HOUSING            │  ← SPEAKER MODULE
    │                                       │
    └───────────────────────────────────────┘
                      │
    ┌─────────────────┴─────────────────────┐
    │          COPPER MESH INSOLE           │  ← GROUNDING LAYER 1
    └─────────────────┬─────────────────────┘
                      │
    ┌─────────────────┴─────────────────────┐
    │       CONDUCTIVE CARBON PLATE         │  ← GROUNDING LAYER 2
    └─────────────────┬─────────────────────┘
                      │
    ┌─────────────────┴─────────────────────┐
    │         BATTERY + PCB MODULE          │  ← POWER SYSTEM
    │         └─ Qi Charging Coil           │
    │         └─ BLE Module                 │
    │         └─ LED Controller             │
    └─────────────────┬─────────────────────┘
                      │
    ┌─────────────────┴─────────────────────┐
    │           EVA MIDSOLE                 │  ← CUSHIONING
    │           └─ Flex Grooves             │
    └─────────────────┬─────────────────────┘
                      │
    ┌─────────────────┴─────────────────────┐
    │         CONDUCTIVE OUTSOLE            │  ← GROUNDING LAYER 3
    │         └─ LED Channel Housing        │
    │         └─ Earth Contact Pods         │
    └───────────────────────────────────────┘
```

---

## Color Options

### Launch Colorways
```
1. EARTH CORE
   ├── Upper: Charcoal Black
   ├── Midsole: Forest Green
   ├── Outsole: Raw Copper
   └── LED Default: Amber Earth Pulse

2. NIGHT FLOW
   ├── Upper: Midnight Blue
   ├── Midsole: Silver
   ├── Outsole: Black
   └── LED Default: Electric Blue Wave

3. SUNRISE RUNNER
   ├── Upper: Dawn Orange
   ├── Midsole: Cloud White
   ├── Outsole: Tan
   └── LED Default: Warm White Safety

4. BAREFOOT BLACK
   ├── Upper: Triple Black
   ├── Midsole: Black
   ├── Outsole: Black
   └── LED Default: RGB Custom
```

---

## Pricing & SKUs

| Model | Features | MSRP |
|-------|----------|------|
| TERRA-PULSE Core | Grounding + LED | $189 |
| TERRA-PULSE Audio | Grounding + LED + Speaker | $249 |
| TERRA-PULSE Pro | All features + bone conduction | $299 |
| Charging Dock | Dual wireless charger | $49 |

---

## Compliance & Safety

- FCC Part 15 Certified
- CE Marked
- IP67 Water Resistance
- RoHS Compliant
- UL Listed Battery
- Bluetooth SIG Certified

---

```
═══════════════════════════════════════════════════════════════
          TERRA-PULSE - WHERE TECHNOLOGY MEETS EARTH

        "Every step connects you to the planet.
         Every light guides your journey.
         Every beat syncs with your soul."

═══════════════════════════════════════════════════════════════
```

Version: 1.0.0 | Product Code: TP-2024
