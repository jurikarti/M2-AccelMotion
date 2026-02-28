import { elements, state } from './config.js';

const ctx = elements.canvas.getContext('2d');

export function resizeCanvas() {
    const rect = elements.canvas.parentElement.getBoundingClientRect();
    elements.canvas.width = rect.width * devicePixelRatio;
    elements.canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
}

export function drawChart() {
    const w = elements.canvas.width / devicePixelRatio;
    const h = elements.canvas.height / devicePixelRatio;
    ctx.clearRect(0, 0, w, h);

    const maxPoints = parseInt(elements.zoomH.value);
    if (state.dataHistory.length < 2) {
        requestAnimationFrame(drawChart);
        return;
    }

    const centerY = h / 2;
    const amp = (h / 4) * parseFloat(elements.zoomV.value);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(0, centerY); ctx.lineTo(w, centerY);
    ctx.stroke();

    const drawLine = (key, color) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        const visibleData = state.dataHistory.slice(-maxPoints);
        for (let i = 0; i < visibleData.length; i++) {
            const x = (i / (maxPoints - 1)) * w;
            const val = visibleData[i][key];
            const y = centerY - (val * amp);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
    };

    drawLine('x', '#ff4d4d');
    drawLine('y', '#4dff88');
    drawLine('z', '#4d94ff');

    requestAnimationFrame(drawChart);
}
