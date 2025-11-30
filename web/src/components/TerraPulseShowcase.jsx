/**
 * TERRA-PULSE Grounding Shoe Showcase Component
 * Interactive product display with LED and audio visualizations
 */

import React, { useState, useEffect, useRef } from 'react';

// Shoe SVG Component with animated LEDs
const ShoeVisualization = ({ ledColor, ledMode, isGrounded, groundingQuality }) => {
  const [ledOpacity, setLedOpacity] = useState(1);
  const [hue, setHue] = useState(0);

  useEffect(() => {
    let interval;

    if (ledMode === 'pulse') {
      interval = setInterval(() => {
        setLedOpacity(prev => {
          const next = prev + 0.05;
          return next > 1 ? 0 : next;
        });
      }, 50);
    } else if (ledMode === 'rainbow') {
      interval = setInterval(() => {
        setHue(prev => (prev + 2) % 360);
      }, 30);
    } else {
      setLedOpacity(1);
    }

    return () => clearInterval(interval);
  }, [ledMode]);

  const currentColor = ledMode === 'rainbow'
    ? `hsl(${hue}, 100%, 50%)`
    : ledColor;

  const groundingColor = isGrounded
    ? groundingQuality === 'excellent' ? '#00FF88' : '#FFFF00'
    : '#FF4444';

  return (
    <svg viewBox="0 0 400 300" className="w-full max-w-md mx-auto">
      {/* Shoe Outline */}
      <defs>
        <linearGradient id="shoeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a2a2a" />
          <stop offset="100%" stopColor="#1a1a1a" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id="strongGlow">
          <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Main shoe body */}
      <path
        d="M50 200 Q30 180 40 150 Q50 100 100 80 L280 60 Q340 55 360 80 Q380 110 370 150 L365 200 Q360 220 340 230 L80 240 Q55 235 50 200"
        fill="url(#shoeGradient)"
        stroke="#444"
        strokeWidth="2"
      />

      {/* Sole */}
      <path
        d="M50 200 Q55 235 80 240 L340 230 Q360 220 365 200 L370 205 Q365 235 340 245 L75 255 Q45 250 40 215 Z"
        fill="#1a1a1a"
        stroke="#333"
        strokeWidth="1"
      />

      {/* Outsole Perimeter LEDs */}
      <path
        d="M55 205 Q50 230 75 245 L335 235 Q355 225 360 205"
        fill="none"
        stroke={currentColor}
        strokeWidth="4"
        strokeLinecap="round"
        opacity={ledOpacity}
        filter="url(#strongGlow)"
        className="transition-all duration-100"
      />

      {/* Side LED Strip - Left */}
      <line
        x1="60" y1="170" x2="80" y2="190"
        stroke={currentColor}
        strokeWidth="3"
        opacity={ledOpacity}
        filter="url(#glow)"
        strokeLinecap="round"
      />
      <line
        x1="65" y1="155" x2="85" y2="175"
        stroke={currentColor}
        strokeWidth="3"
        opacity={ledOpacity * 0.8}
        filter="url(#glow)"
        strokeLinecap="round"
      />

      {/* Side LED Strip - Right */}
      <line
        x1="350" y1="150" x2="360" y2="180"
        stroke={currentColor}
        strokeWidth="3"
        opacity={ledOpacity}
        filter="url(#glow)"
        strokeLinecap="round"
      />
      <line
        x1="345" y1="135" x2="355" y2="165"
        stroke={currentColor}
        strokeWidth="3"
        opacity={ledOpacity * 0.8}
        filter="url(#glow)"
        strokeLinecap="round"
      />

      {/* Heel Counter LED Ring */}
      <ellipse
        cx="340" cy="120"
        rx="25" ry="35"
        fill="none"
        stroke={currentColor}
        strokeWidth="3"
        opacity={ledOpacity}
        filter="url(#glow)"
      />

      {/* Tongue LED Strip */}
      <line
        x1="140" y1="75" x2="200" y2="65"
        stroke={currentColor}
        strokeWidth="4"
        opacity={ledOpacity}
        filter="url(#glow)"
        strokeLinecap="round"
      />

      {/* Grounding Contact Points */}
      {[
        [90, 248], [130, 250], [170, 250], [220, 248],
        [270, 245], [310, 242], [340, 238]
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x} cy={y}
          r="5"
          fill={groundingColor}
          opacity={isGrounded ? 1 : 0.3}
          filter="url(#glow)"
          className="transition-all duration-300"
        />
      ))}

      {/* Speaker Icon in Heel */}
      <circle cx="340" cy="180" r="12" fill="#333" stroke="#444" strokeWidth="1"/>
      <circle cx="340" cy="180" r="6" fill="#222"/>
      <circle cx="340" cy="180" r="2" fill="#555"/>

      {/* Nike Free-style Flex Grooves */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
        <line
          key={i}
          x1={80 + i * 35}
          y1={230}
          x2={85 + i * 35}
          y2={245}
          stroke="#333"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {/* Brand Text */}
      <text x="180" y="130" fill="#666" fontSize="12" fontFamily="monospace" fontWeight="bold">
        TERRA-PULSE
      </text>

      {/* Grounding Status Indicator */}
      <g transform="translate(30, 40)">
        <circle cx="10" cy="10" r="8" fill={groundingColor} filter="url(#glow)" opacity={isGrounded ? 1 : 0.5}/>
        <text x="25" y="15" fill="#888" fontSize="10" fontFamily="monospace">
          {isGrounded ? 'GROUNDED' : 'SEEKING GROUND'}
        </text>
      </g>
    </svg>
  );
};

// Audio Visualizer Component
const AudioVisualizer = ({ isPlaying, preset }) => {
  const [bars, setBars] = useState(Array(16).fill(0));

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(16).fill(0));
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 100));
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div className="flex items-end justify-center h-20 gap-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-2 bg-gradient-to-t from-green-500 to-cyan-400 rounded-t transition-all duration-100"
          style={{ height: `${isPlaying ? height : 0}%` }}
        />
      ))}
    </div>
  );
};

// Main Showcase Component
const TerraPulseShowcase = () => {
  const [selectedModel, setSelectedModel] = useState('PRO');
  const [ledMode, setLedMode] = useState('pulse');
  const [ledColor, setLedColor] = useState('#00FF88');
  const [isGrounded, setIsGrounded] = useState(true);
  const [groundingQuality, setGroundingQuality] = useState('excellent');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioPreset, setAudioPreset] = useState('schumann');
  const [volume, setVolume] = useState(50);
  const [brightness, setBrightness] = useState(80);
  const [activeTab, setActiveTab] = useState('overview');
  const [groundingTime, setGroundingTime] = useState(0);

  // Simulate grounding time counter
  useEffect(() => {
    if (isGrounded) {
      const interval = setInterval(() => {
        setGroundingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isGrounded]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const models = {
    CORE: { name: 'TERRA-PULSE Core', price: 189, features: ['LED System', 'Grounding'] },
    AUDIO: { name: 'TERRA-PULSE Audio', price: 249, features: ['LED System', 'Grounding', 'Speaker'] },
    PRO: { name: 'TERRA-PULSE Pro', price: 299, features: ['LED System', 'Grounding', 'Speaker', 'Bone Conduction'] }
  };

  const colorPresets = [
    { name: 'Earth', color: '#00FF88' },
    { name: 'Ocean', color: '#00BFFF' },
    { name: 'Sunset', color: '#FF6B35' },
    { name: 'Purple', color: '#9B59B6' },
    { name: 'White', color: '#FFFFFF' },
    { name: 'Red', color: '#FF4444' }
  ];

  const audioPresets = [
    { id: 'schumann', name: 'Schumann Resonance', desc: '7.83Hz Earth Frequency' },
    { id: 'alpha', name: 'Alpha Waves', desc: 'Relaxation (8-12Hz)' },
    { id: 'theta', name: 'Theta Waves', desc: 'Deep Meditation (4-8Hz)' },
    { id: 'nature', name: 'Forest Floor', desc: 'Natural Earth Sounds' },
    { id: 'cadence', name: 'Running Beat', desc: '170 BPM Metronome' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-green-400 via-cyan-400 to-green-400 bg-clip-text text-transparent mb-2">
          TERRA-PULSE
        </h1>
        <p className="text-xl text-gray-400">Ground Yourself. Light Your Path.</p>
        <p className="text-sm text-gray-500 mt-2">Inspired by Nike Free | Grounding + LED + Audio</p>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Left Column - Shoe Visualization */}
        <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
          <ShoeVisualization
            ledColor={ledColor}
            ledMode={ledMode}
            isGrounded={isGrounded}
            groundingQuality={groundingQuality}
          />

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{formatTime(groundingTime)}</div>
              <div className="text-xs text-gray-500">Grounding Time</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-cyan-400">42</div>
              <div className="text-xs text-gray-500">Active LEDs</div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">98%</div>
              <div className="text-xs text-gray-500">Battery</div>
            </div>
          </div>

          {/* Audio Visualizer */}
          {selectedModel !== 'CORE' && (
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Audio Output</span>
                <span className="text-xs text-gray-500">{audioPresets.find(p => p.id === audioPreset)?.name}</span>
              </div>
              <AudioVisualizer isPlaying={isPlaying} preset={audioPreset} />
            </div>
          )}
        </div>

        {/* Right Column - Controls */}
        <div className="space-y-6">

          {/* Model Selector */}
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Select Model</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.entries(models).map(([key, model]) => (
                <button
                  key={key}
                  onClick={() => setSelectedModel(key)}
                  className={`p-4 rounded-xl transition-all ${
                    selectedModel === key
                      ? 'bg-gradient-to-br from-green-500/20 to-cyan-500/20 border-2 border-green-400'
                      : 'bg-gray-900/50 border border-gray-700 hover:border-gray-500'
                  }`}
                >
                  <div className="text-sm font-semibold">{key}</div>
                  <div className="text-2xl font-bold text-green-400">${model.price}</div>
                  <div className="text-xs text-gray-500 mt-1">{model.features.length} features</div>
                </button>
              ))}
            </div>
          </div>

          {/* LED Controls */}
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">LED Control</h3>

            {/* LED Mode */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Lighting Mode</label>
              <div className="grid grid-cols-4 gap-2">
                {['solid', 'pulse', 'rainbow', 'off'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setLedMode(mode)}
                    className={`py-2 px-3 rounded-lg text-sm capitalize transition-all ${
                      ledMode === mode
                        ? 'bg-green-500/20 text-green-400 border border-green-400'
                        : 'bg-gray-900/50 text-gray-400 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets */}
            <div className="mb-4">
              <label className="text-sm text-gray-400 mb-2 block">Color</label>
              <div className="flex gap-2">
                {colorPresets.map(preset => (
                  <button
                    key={preset.name}
                    onClick={() => setLedColor(preset.color)}
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      ledColor === preset.color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                  />
                ))}
              </div>
            </div>

            {/* Brightness Slider */}
            <div>
              <label className="text-sm text-gray-400 mb-2 block">Brightness: {brightness}%</label>
              <input
                type="range"
                min="0"
                max="100"
                value={brightness}
                onChange={(e) => setBrightness(e.target.value)}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>

          {/* Audio Controls (Audio/Pro models only) */}
          {selectedModel !== 'CORE' && (
            <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
              <h3 className="text-lg font-semibold mb-4">Audio System</h3>

              {/* Play/Pause */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`w-full py-3 rounded-xl mb-4 font-semibold transition-all ${
                  isPlaying
                    ? 'bg-red-500/20 text-red-400 border border-red-400'
                    : 'bg-green-500/20 text-green-400 border border-green-400'
                }`}
              >
                {isPlaying ? 'Stop Audio' : 'Play Audio'}
              </button>

              {/* Audio Presets */}
              <div className="space-y-2 mb-4">
                {audioPresets.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => setAudioPreset(preset.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      audioPreset === preset.id
                        ? 'bg-cyan-500/20 border border-cyan-400'
                        : 'bg-gray-900/50 border border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.desc}</div>
                  </button>
                ))}
              </div>

              {/* Volume */}
              <div>
                <label className="text-sm text-gray-400 mb-2 block">Volume: {volume}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Grounding Toggle */}
          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <h3 className="text-lg font-semibold mb-4">Grounding Simulation</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Earth Connection</div>
                <div className="text-sm text-gray-500">Simulate grounding status</div>
              </div>
              <button
                onClick={() => {
                  setIsGrounded(!isGrounded);
                  if (!isGrounded) setGroundingTime(0);
                }}
                className={`w-16 h-8 rounded-full transition-all ${
                  isGrounded ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <div className={`w-6 h-6 bg-white rounded-full transition-all ${
                  isGrounded ? 'translate-x-9' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto mt-12">
        <h2 className="text-3xl font-bold text-center mb-8">Technical Specifications</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-xl font-semibold mb-2">LED System</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>42 SK6812 RGBW LEDs</li>
              <li>3mm ultra-thin flexible PCB</li>
              <li>5 lighting zones</li>
              <li>800 lumens max brightness</li>
              <li>IP67 waterproof</li>
              <li>Music reactive mode</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-3">🔊</div>
            <h3 className="text-xl font-semibold mb-2">Speaker System</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>15mm neodymium driver</li>
              <li>20mm passive radiator</li>
              <li>80Hz - 18kHz response</li>
              <li>Bone conduction option</li>
              <li>Schumann resonance audio</li>
              <li>Binaural beat generation</li>
            </ul>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-6 backdrop-blur-sm border border-gray-700">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="text-xl font-semibold mb-2">Grounding Tech</h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>7 conductive contact points</li>
              <li>Copper mesh insole</li>
              <li>Carbon fiber conductive plate</li>
              <li>Real-time status detection</li>
              <li>Session tracking via app</li>
              <li>Nike Free-inspired flex sole</li>
            </ul>
          </div>

        </div>
      </div>

      {/* CTA */}
      <div className="max-w-2xl mx-auto mt-12 text-center">
        <div className="bg-gradient-to-r from-green-500/20 via-cyan-500/20 to-green-500/20 rounded-2xl p-8 border border-green-400/30">
          <h3 className="text-2xl font-bold mb-2">Ready to Ground Yourself?</h3>
          <p className="text-gray-400 mb-6">Experience the future of wellness footwear</p>
          <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-cyan-500 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity">
            Pre-Order Now - Starting at $189
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center mt-12 text-gray-500 text-sm">
        <p>TERRA-PULSE | Part of the 0RB SYSTEM</p>
        <p className="mt-1">Ground Yourself. Light Your Path.</p>
      </div>
    </div>
  );
};

export default TerraPulseShowcase;
