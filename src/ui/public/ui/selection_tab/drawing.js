import { color, lerpColor, withAlpha } from '../shared/drawing.js';

export function drawSelectReverb(ctx, w, h, val) {
    const cy = h / 2, iconSize = w * 0.9;

    const drawFreq = (freq, opacity) => {
        ctx.beginPath()
        ctx.moveTo(w * 0.05, h * 0.95);
        for (let i = 0; i <= 48; i++) {
            const xPos = w * 0.05 + (w * 0.9 / 48) * i;
            const amp = (h * 0.25 / freq)
            const yPos = cy + Math.sin((Math.PI * freq / 48) * i) * amp;

            ctx.lineTo(xPos, yPos)
        }
        ctx.lineTo(w * 0.95, h * 0.95);
        ctx.closePath()

        if (val) {
            const grad = ctx.createLinearGradient(w * 0.05, h / 2, w * 0.95, h / 2)
            grad.addColorStop(0, withAlpha(color.pink, opacity));
            grad.addColorStop(1, withAlpha(color.orange, opacity));
            ctx.fillStyle = grad;
        } else {
            ctx.fillStyle = withAlpha(color.grey, opacity);
        }

        ctx.lineWidth = 1.5;
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.fill()
    }

    drawFreq(6, 1)
    drawFreq(4, 0.875)
    drawFreq(2, 0.75)
}

export function drawSelectDelay(ctx, w, h, val) {
    const cx = w / 2, cy = h / 2;

    for (let i = 0; i < 4; i++) {
        const radius = (w * 0.45 / 4) * (i + 1)
        ctx.beginPath();

        ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 0.25, false);

        if (val) {
            const grad = ctx.createLinearGradient(w * 0.05, h / 2, w * 0.95, h / 2)
            grad.addColorStop(0, color.pink);
            grad.addColorStop(0.5, color.tan);
            grad.addColorStop(1, color.orange);
            ctx.strokeStyle = grad;
        } else {
            ctx.strokeStyle = color.grey;
        }

        ctx.lineWidth = 1.5;
        ctx.lineCap = "round"
        ctx.stroke()
    }
}

export function drawSelectIO(ctx, w, h, val = 0) {
    const cx = w / 2, cy = h / 2, iconSize = w * 0.8;
    const spacing = iconSize / 4;
    const totalSpan = spacing * 3; // 4 lines, 3 gaps between them
    const yStart = cy + totalSpan / 2; // topmost-value line, shifted down to center the group

    for (let i = 0; i < 4; i++) {
        const x = { start: w * 0.1, end: w * 0.9, fader: w * 0.25 + w * 0.15 * i };
        const y = yStart - spacing * i;

        ctx.beginPath();
        ctx.moveTo(x.start, y);
        ctx.lineTo(x.end, y);

        ctx.strokeStyle = !val ? color.lightgrey : color.grey;
        ctx.lineCap = "round";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const faderSize = w * 0.1;
        ctx.roundRect((x.start + (iconSize / 4) * i), y - faderSize / 2, faderSize * 2, faderSize, 4);
        ctx.fillStyle = !val ? lerpColor(color.pink, color.orange, 0.25 * i) : color.grey;
        ctx.fill();
    }
}
