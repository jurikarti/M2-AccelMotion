import { MACBOOK_CONFIG, state, elements } from './config.js';

export function setupAudio() {
    elements.audioUpload.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            state.impactAudio = new Audio(url);
            elements.audioStatus.style.display = 'block';
        }
    };

    elements.hitThresholdInput.oninput = (e) => {
        const val = parseFloat(e.target.value);
        MACBOOK_CONFIG.hitThreshold = val;
        elements.valThreshold.innerText = val.toFixed(2) + 'G';
    };

    elements.hitAxisSelect.onchange = (e) => {
        MACBOOK_CONFIG.hitAxis = e.target.value;
    };
}

export function detectImpact(s) {
    let gForce = 0;
    if (MACBOOK_CONFIG.hitAxis === 'mag') {
        const magnitude = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
        gForce = Math.abs(magnitude - 1.0);
    } else {
        gForce = Math.abs(s[MACBOOK_CONFIG.hitAxis]);
    }

    const now = Date.now();
    if (gForce > MACBOOK_CONFIG.hitThreshold && (now - state.lastHitTime) > MACBOOK_CONFIG.hitCooldown) {
        if (state.impactAudio) {
            state.impactAudio.currentTime = 0;
            state.impactAudio.play();
        }
        state.lastHitTime = now;
        triggerVisualFeedback();
    }
}

function triggerVisualFeedback() {
    elements.macbook.style.transition = 'none';
    elements.macbook.style.filter = 'brightness(2) contrast(1.2)';
    setTimeout(() => {
        elements.macbook.style.transition = 'transform 0.05s linear';
        elements.macbook.style.filter = '';
    }, 100);
}
