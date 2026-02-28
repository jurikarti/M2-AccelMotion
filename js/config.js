// --- Global State & Configuration ---
export const MACBOOK_CONFIG = {
    baseTiltX: 80,      // Default vertical tilt
    baseTiltY: 0,       // Default horizontal tilt
    lerpFactor: 0.15,   // Smoothing (0.01 = slow, 1.0 = instant)
    sensitivity: 1.0,   // Motion sensitivity
    invertX: true,      // Invert vertical
    invertY: false,     // Invert horizontal
    bgSensitivity: 300, // Background motion range (px)
    hitAxis: 'x',       // x, y, z, or mag
    hitThreshold: 0.5,  // G-force threshold for impact sound
    hitCooldown: 300    // ms between sounds
};

export const state = {
    lastHitTime: 0,
    impactAudio: null,
    dataHistory: [],
    currentRotation: { x: 0, y: 0 }
};

// DOM Elements shortcut
export const elements = {
    macbook: document.getElementById('macbook'),
    tapText: document.getElementById('tap-text'),
    bubble: document.getElementById('bubble'),
    orb1: document.getElementById('orb-1'),
    orb2: document.getElementById('orb-2'),
    orb3: document.getElementById('orb-3'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    canvas: document.getElementById('chart'),
    zoomV: document.getElementById('zoom-v'),
    zoomH: document.getElementById('zoom-h'),
    audioUpload: document.getElementById('audio-upload'),
    audioStatus: document.getElementById('audio-status'),
    hitThresholdInput: document.getElementById('hit-threshold'),
    valThreshold: document.getElementById('val-threshold'),
    hitAxisSelect: document.getElementById('hit-axis')
};
