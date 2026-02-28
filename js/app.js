import { elements, state } from './config.js';
import { setupAudio, detectImpact } from './audio.js';
import { updateVisuals, handleTapEvent } from './visuals.js';
import { resizeCanvas, drawChart } from './chart.js';

function switchPage(id, btn) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    btn.classList.add('active');
    if (id === 'dash') resizeCanvas();
}

// Event SSE Connection
function connect() {
    const es = new EventSource('/events');

    es.onopen = () => {
        elements.statusDot.classList.add('connected');
        elements.statusText.innerText = 'ONLINE';
    };

    es.onmessage = (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === 'data') {
            const s = msg.data;

            // 1. Update text metrics
            document.getElementById('val-x').innerText = s.x.toFixed(2);
            document.getElementById('val-y').innerText = s.y.toFixed(2);
            document.getElementById('val-z').innerText = s.z.toFixed(2);

            // 2. Update gauges
            document.getElementById('gauge-x').style.width = Math.min(100, (s.x + 2) * 25) + '%';
            document.getElementById('gauge-y').style.width = Math.min(100, (s.y + 2) * 25) + '%';
            document.getElementById('gauge-z').style.width = Math.min(100, (s.z + 2) * 25) + '%';

            // 3. Process modules
            updateVisuals(s);
            detectImpact(s);

            // 4. Update history for chart
            state.dataHistory.push(s);
            if (state.dataHistory.length > 1000) state.dataHistory.shift();

        } else if (msg.type === 'tap') {
            handleTapEvent(msg.data);
        }
    };

    es.onerror = () => {
        elements.statusDot.classList.remove('connected');
        elements.statusText.innerText = 'RECONNECTING...';
        setTimeout(connect, 1000);
        es.close();
    };
}

// Initialize
function init() {
    // Nav Click Handlers
    document.getElementById('nav-dash').onclick = (e) => switchPage('dash', e.target);
    document.getElementById('nav-tap').onclick = (e) => switchPage('tap', e.target);
    document.getElementById('nav-level').onclick = (e) => switchPage('level', e.target);
    document.getElementById('nav-sounds').onclick = (e) => switchPage('sounds', e.target);

    window.onresize = resizeCanvas;

    setupAudio();
    resizeCanvas();
    drawChart();
    connect();
}

document.addEventListener('DOMContentLoaded', init);
