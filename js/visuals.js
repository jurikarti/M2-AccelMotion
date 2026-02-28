import { MACBOOK_CONFIG, state, elements } from './config.js';

export function updateVisuals(s) {
    // 1. MacBook 3D Rotation
    // Use Math.abs(s.z) to minimize sudden 180-degree jumps at zero-crossings
    let targetPitch = Math.atan2(-s.y, Math.abs(s.z)) * (180 / Math.PI);
    let targetRoll = Math.atan2(s.x, Math.abs(s.z)) * (180 / Math.PI);

    if (MACBOOK_CONFIG.invertX) targetPitch *= -1;
    if (MACBOOK_CONFIG.invertY) targetRoll *= -1;

    state.currentRotation.x += (targetPitch - state.currentRotation.x) * MACBOOK_CONFIG.lerpFactor;
    state.currentRotation.y += (targetRoll - state.currentRotation.y) * MACBOOK_CONFIG.lerpFactor;

    const finalX = MACBOOK_CONFIG.baseTiltX + (state.currentRotation.x * MACBOOK_CONFIG.sensitivity);
    const finalY = MACBOOK_CONFIG.baseTiltY + (state.currentRotation.y * MACBOOK_CONFIG.sensitivity);

    elements.macbook.style.transform = `rotateX(${finalX}deg) rotateY(${finalY}deg)`;

    // 2. Spirit Level Bubble
    const levelRange = 120;
    elements.bubble.style.transform = `translate(${s.x * levelRange}px, ${s.y * levelRange}px)`;
    document.getElementById('level-vals').innerText = `X: ${s.x.toFixed(3)} | Y: ${s.y.toFixed(3)}`;

    // 3. Background Orbs (Liquid Parallax)
    const bgX = state.currentRotation.y * (MACBOOK_CONFIG.bgSensitivity / 90);
    const bgY = state.currentRotation.x * (MACBOOK_CONFIG.bgSensitivity / 90);

    elements.orb1.style.transform = `translate(${-bgX}px, ${-bgY}px)`;
    elements.orb2.style.transform = `translate(${bgX * 1.5}px, ${bgY * 1.5}px)`;
    elements.orb3.style.transform = `translate(${-bgX * 0.8}px, ${-bgY * 0.8}px)`;
}

export function handleTapEvent(t) {
    elements.tapText.innerText = t.text;
    const cls = t.text === 'YES' ? 'active-yes' : 'active-no';
    elements.tapText.classList.add(cls);
    setTimeout(() => {
        elements.tapText.classList.remove(cls);
        elements.tapText.innerText = 'WAITING';
    }, 1500);
}
