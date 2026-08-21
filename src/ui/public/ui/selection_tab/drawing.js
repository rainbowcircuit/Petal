import { color, lerpColor, withAlpha } from '../shared/drawing.js';

export function drawSelectReverb(ctx, w, h, val, hovered = false) {
    const cy = h / 2, iconSize = w * 0.9;

    const pink = hovered ? color.lighterpink : color.pink;
    const orange = hovered ? color.lighterorange : color.orange;
    const grey = hovered ? color.lightergrey : color.grey;

    const lineCount = 3;

    for (let index = 0; index < lineCount; index++) {
        const freq = (index + 1) * 2;
        const yOffset = (h / 6) * (index - (lineCount - 1) / 2);
        const amp = h * 0.2 / freq;

        ctx.beginPath()
        for (let i = 0; i <= 48; i++) {
            const xPos = w * 0.05 + (w * 0.9 / 48) * i;
            const yPos = cy + yOffset + Math.sin(Math.PI / 2 + (Math.PI * freq / 48) * i) * amp;
            if (i === 0) { ctx.moveTo(xPos, yPos) }
            else { ctx.lineTo(xPos, yPos) }
        }

        if (val) {
            const grad = ctx.createLinearGradient(w * 0.05, h / 2, w * 0.95, h / 2)
            grad.addColorStop(0, withAlpha(pink, 1));
            grad.addColorStop(1, withAlpha(orange, 1));
            ctx.strokeStyle = grad;
        } else {
            ctx.strokeStyle = withAlpha(grey, 1);
        }

        ctx.lineWidth = 1.5;
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()
    }
}

export function drawSelectDelay(ctx, w, h, val, hovered = false) {
    const cx = w / 2, cy = h / 2;

    const pink = hovered ? color.lighterpink : color.pink;
    const tan = hovered ? color.lightertan : color.tan;
    const orange = hovered ? color.lighterorange : color.orange;
    const grey = hovered ? color.lightergrey : color.grey;

    for (let i = 0; i < 4; i++) {
        const radius = (w * 0.45 / 4) * (i + 1)
        ctx.beginPath();

        ctx.arc(cx, cy, radius, Math.PI * 0.75, Math.PI * 0.25, false);

        if (val) {
            const grad = ctx.createLinearGradient(w * 0.05, h / 2, w * 0.95, h / 2)
            grad.addColorStop(0, pink);
            grad.addColorStop(0.5, tan);
            grad.addColorStop(1, orange);
            ctx.strokeStyle = grad;
        } else {
            ctx.strokeStyle = grey;
        }

        ctx.lineWidth = 1.5;
        ctx.lineCap = "round"
        ctx.stroke()
    }
}

export function drawSelectIO(ctx, w, h, val = 0, hovered = false) {
    const cx = w / 2, cy = h / 2, iconSize = w * 0.8;
    const spacing = iconSize / 4;
    const totalSpan = spacing * 3; 
    const yStart = cy + totalSpan / 2; 

    const lightgrey = hovered ? color.lighterlightgrey : color.lightgrey;
    const grey = hovered ? color.lightergrey : color.grey;
    const pink = hovered ? color.lighterpink : color.pink;
    const orange = hovered ? color.lighterorange : color.orange;

    for (let i = 0; i < 4; i++) {
        const x = { start: w * 0.1, end: w * 0.9, fader: w * 0.25 + w * 0.15 * i };
        const y = yStart - spacing * i;

        ctx.beginPath();
        ctx.moveTo(x.start, y);
        ctx.lineTo(x.end, y);

        ctx.strokeStyle = withAlpha(val ? lightgrey : grey, 0.5);
        ctx.lineCap = "round";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const faderSize = w * 0.1;
        ctx.roundRect((x.start + (iconSize / 4) * i), y - faderSize / 2, faderSize * 2, faderSize, 1);
        ctx.fillStyle = val ? lerpColor(pink, orange, 0.25 * i) : grey;
        ctx.fill();
    }
}
