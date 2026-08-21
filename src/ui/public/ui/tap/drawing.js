import { color, lerpColor } from '../shared/drawing.js';

// reverb send
export function drawReverbSend(ctx, w, h, val = 0, hovered = false, aux = {}) {
    const { tapIndex = 0, state = true } = aux;

    const pink = hovered ? color.lighterpink : color.pink;
    const orange = hovered ? color.lighterorange : color.orange;
    const tan = hovered ? color.lightertan : color.tan;
    const grey = hovered ? color.lightergrey : color.grey;
    const lightgrey = hovered ? color.lighterlightgrey : color.lightgrey;

    const norm = Math.min(Math.max(tapIndex / 8, 0), 1);
    const baseColor = state ? lerpColor(pink, orange, norm) : grey;

    const resolution = 128;

    for (let index = 0; index < 8; index++) {
        const lineVal = Math.min(Math.max(val * 8 - index, 0), 1);
        const windowWidth = 16 * (8 - index * val);

        const barSpacing = w * 0.9 / 8;
        const barX = w * 0.05 + barSpacing * index;

        ctx.beginPath();

        for (let i = 0; i < resolution; i++) {
            const y = h * 0.05 + (h * 0.9 / resolution) * i;
            const p = i - (resolution - windowWidth);

            let k = 0;
            if (p >= 0 && p <= windowWidth) {
                k = 0.5 * (1 - Math.cos((Math.PI / windowWidth) * p)) * lineVal;
            }
            const x = barX + k * w * 0.0625;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }

        const grad1 = ctx.createRadialGradient(w * 0.05, h * 0.95, 0, w * 0.05, h * 0.95, w);

        grad1.addColorStop(0, lightgrey);
        grad1.addColorStop(1, 'white');


        ctx.lineTo(barX, h * 0.95);
        ctx.closePath();

        const grad = ctx.createRadialGradient(w * 0.05,
            h * 0.95 - h * 0.45 * val,
            0,
            w * 0.05,
            h * 0.95 - h * 0.45 * val,
            w * 0.05 + w * 0.9 * val);

        grad.addColorStop(0, lerpColor(state ? tan : lightgrey, baseColor, state ? 0 : 0.5));
        grad.addColorStop(0.15 + 0.25 * val, lerpColor(state ? tan : lightgrey, baseColor, 1));
        grad.addColorStop(1, grey);

        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = grad;
        ctx.stroke();
    }
}

export function drawTapState(ctx, w, h, val, hovered = false){

    const startAngle = Math.PI * 1.25;
    const endAngle = Math.PI * 1.75;

    ctx.strokeStyle = val == 1
        ? (hovered ? color.lighterlightgrey : color.lightgrey)
        : (hovered ? color.lightergrey : color.grey);
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";

    ctx.beginPath()
    ctx.arc(w/2, h/2, w * 0.25, startAngle, endAngle, true)
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(w / 2, h * 0.35)
    ctx.lineTo(w / 2, h * 0.45)
    ctx.stroke()
}

export function drawPitch(ctx, w, h, value = 0.5, hovered = false, aux = {}) {
    const { tapIndex = 0, state = true } = aux;

    const pink = hovered ? color.lighterpink : color.pink;
    const orange = hovered ? color.lighterorange : color.orange;
    const grey = hovered ? color.lightergrey : color.grey;
    const lightgrey = hovered ? color.lighterlightgrey : color.lightgrey;

    const norm = Math.min(Math.max(tapIndex / 8, 0), 1);
    const invValue = 0.05 + (1 - value) * 0.9;

    const numDots = 32;
    const windowSize = 12 + 12 * Math.min(Math.abs(value - 0.5) - 0.3, 0);
    let yScale = Math.min(invValue * 2 - 1, 1);
    yScale = yScale === 0 ? 0.02 : yScale;
    const peakIndex = invValue * numDots;
    const halfWindow = windowSize / 2;
    const RES = 60;

    const ampAt = (i) => {
        const dist = Math.abs(i - peakIndex);
        const t = Math.min(dist / halfWindow, 1);
        const falloff = 0.5 * (1 + Math.cos(Math.PI * t));
        return 1 + (h * 0.5 - 1) * falloff;
    };
    const xThetaAt = (i) => {
        const theta = Math.PI * (i / (numDots - 1));
        return { x: w / 2 + Math.cos(theta) * w * 0.45, theta };
    };

    const baseColor = state ? lerpColor(pink, orange, norm) : grey;
    const gradCenter = (1 - Math.cos(Math.PI * value)) * 0.5;
    const grad = ctx.createRadialGradient(w * gradCenter, h / 2, 0, w * gradCenter, h / 2, w / 2);

    grad.addColorStop(0, state ? lerpColor(lightgrey, baseColor, 0.5) : lerpColor(lightgrey, grey, 0.5));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, grey);

    ctx.beginPath();
    for (let i = 0; i < numDots; i++) {
        if (Math.abs(i - peakIndex) <= halfWindow) continue; // handled by the fill below
        const { x, theta } = xThetaAt(i);
        if (Math.sin(theta) <= 0) continue;
        const yOffset = ampAt(i);
        ctx.moveTo(x, h / 2 + yOffset * yScale);
        ctx.lineTo(x, h / 2);
    }
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = grad;
    ctx.stroke();

    const winStart = Math.max(peakIndex - halfWindow, 0);
    const winEnd = Math.min(peakIndex + halfWindow, numDots - 1);
    const pts = [];
    for (let s = 0; s <= RES; s++) {
        const i = winStart + (winEnd - winStart) * (s / RES);
        const { x, theta } = xThetaAt(i);
        if (Math.sin(theta) <= 0) continue;
        pts.push({ x, y: h / 2 + ampAt(i) * yScale });
    }
    if (pts.length > 1) {
        ctx.beginPath();
        ctx.moveTo(pts[0].x, h / 2);
        for (const p of pts) ctx.lineTo(p.x, p.y);
        ctx.lineTo(pts[pts.length - 1].x, h / 2);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.stroke()
    }
}
