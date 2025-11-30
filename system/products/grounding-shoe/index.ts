/**
 * TERRA-PULSE Grounding Shoe System
 * Main entry point for all shoe modules
 */

// LED System
export {
  TerraPulseLEDController,
  ledController,
  LED_CONFIG,
  COLORS,
  LightingMode,
  GroundingStatus as LEDGroundingStatus,
  type RGBWColor,
  type LEDState
} from './led-controller';

// Speaker System
export {
  TerraPulseSpeaker,
  speakerSystem,
  SPEAKER_CONFIG,
  AUDIO_PRESETS,
  EQ_PRESETS,
  type AudioState,
  type AudioEvent,
  type AudioEventType
} from './speaker-system';

// Grounding Sensor
export {
  GroundingSensor,
  groundingSensor,
  GROUNDING_CONFIG,
  GroundingQuality,
  type GroundingStatus,
  type GroundingSession
} from './grounding-sensor';

// Main Controller
export {
  TerraPulseController,
  DEVICE_CONFIG,
  ShoePosition,
  ShoeMode,
  createTerraPulse,
  createTerraPulsePair,
  type DeviceState
} from './terra-pulse-controller';

// Product Info
export const PRODUCT_INFO = {
  name: 'TERRA-PULSE',
  tagline: 'Ground Yourself. Light Your Path.',
  description: 'Revolutionary grounding shoe with integrated LED lighting and speaker system',
  inspired_by: 'Nike Free',
  features: [
    'Conductive grounding technology with 7 earth contact points',
    '42 addressable RGBW LEDs across 5 zones',
    '15mm neodymium speaker with passive radiator',
    'Optional bone conduction audio',
    'Bluetooth 5.3 connectivity',
    'Qi wireless charging',
    '400mAh battery with 8-hour LED runtime',
    'Real-time grounding status feedback',
    'Heart rate sync lighting mode',
    'Music reactive LED patterns',
    'Schumann resonance audio for enhanced grounding',
    'Binaural beats for meditation',
    'Step cadence audio for runners'
  ],
  models: [
    { name: 'TERRA-PULSE Core', features: 'Grounding + LED', price: 189 },
    { name: 'TERRA-PULSE Audio', features: 'Grounding + LED + Speaker', price: 249 },
    { name: 'TERRA-PULSE Pro', features: 'All features + Bone Conduction', price: 299 }
  ],
  colorways: [
    'Earth Core (Charcoal/Forest Green/Copper)',
    'Night Flow (Midnight Blue/Silver/Black)',
    'Sunrise Runner (Dawn Orange/Cloud White/Tan)',
    'Barefoot Black (Triple Black)'
  ]
};

/**
 * Quick start example
 */
export async function quickStart() {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║               TERRA-PULSE GROUNDING SHOE                       ║
║                                                                 ║
║   "Ground Yourself. Light Your Path."                          ║
║                                                                 ║
║   Features:                                                     ║
║   • 7-Point Grounding System                                   ║
║   • 42 RGBW Addressable LEDs                                   ║
║   • 15mm Neodymium Speaker                                     ║
║   • Bone Conduction Audio (Pro)                                ║
║   • Bluetooth 5.3 + Qi Wireless Charging                       ║
║                                                                 ║
║   Inspired by Nike Free's flexible, minimalist design          ║
║                                                                 ║
╚═══════════════════════════════════════════════════════════════╝
  `);

  const { left, right } = createTerraPulsePair('PRO');

  console.log('Initializing left shoe...');
  await left.initialize();

  console.log('Initializing right shoe...');
  await right.initialize();

  return { left, right };
}
