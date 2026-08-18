import { color, withAlpha } from '../shared/drawing.js';

export function drawFilterGraph(canvas, cutoff = 0.5, shape = 0) {
    // shape: 0 = lowpass, 0.5 = bandpass, 1 = highpass
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;

    const clamp = (t) => Math.min(1, Math.max(0, t));
    const lerp = (a, b, t) => a + (b - a) * t;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mid = h * 0.5, top = h * 0.1, bot = h * 0.9;

    // gridlines
    ctx.strokeStyle = "grey";
    for (let i = 0; i < 6; i++) {
        const x = w * 0.05 + w * 0.9 * Math.pow(i / 6, 0.4);
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, bot);
        ctx.stroke();
    }

    const s = clamp(shape);

    function rayToBoxDistance(ox, oy, dx, dy, xmin, xmax, ymin, ymax) {
        let t = Infinity;
        if (dx > 0) t = Math.min(t, (xmax - ox) / dx);
        else if (dx < 0) t = Math.min(t, (xmin - ox) / dx);
        if (dy > 0) t = Math.min(t, (ymax - oy) / dy);
        else if (dy < 0) t = Math.min(t, (ymin - oy) / dy);
        return t;
    }

    const xmin = w * 0.05, xmax = w * 0.95;
    const ymin = top, ymax = bot;

    const middleHeightOffset = (0.5 - Math.abs(s - 0.5)) * h / 2;
    const middle = {
        x: w * 0.2 + w * 0.7 * cutoff,
        y: mid - middleHeightOffset,
    };

    const lpToBp = Math.min(s * 2, 1) + 1;
    const bpToHp = Math.max(s * 2, 1) - 1;

    const leftAngle = Math.PI + (Math.PI * 0.3 * (1 - lpToBp));
    const rightAngle = Math.PI - (Math.PI * 0.3 * (1 - bpToHp));

    const dxL = Math.cos(leftAngle), dyL = Math.sin(leftAngle);
    const leftRadius = rayToBoxDistance(middle.x, mid, dxL, dyL, xmin, xmax, ymin, ymax);
    const left = { x: middle.x + dxL * leftRadius, y: mid + dyL * leftRadius };

    const dxR = -Math.cos(rightAngle), dyR = Math.sin(rightAngle);
    const rightRadius = rayToBoxDistance(middle.x, mid, dxR, dyR, xmin, xmax, ymin, ymax);
    const right = { x: middle.x + dxR * rightRadius, y: mid + dyR * rightRadius };

    ctx.beginPath();
    ctx.moveTo(left.x, left.y);
    ctx.quadraticCurveTo(middle.x, middle.y, right.x, right.y);

    const c = lerp(color.orange, color.pink, s); // adjust if color isn't lerp-able directly
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.lineTo(right.x, bot);
    ctx.lineTo(left.x, bot);
    ctx.closePath();

    const grad = ctx.createRadialGradient(middle.x, middle.y, 0, middle.x, middle.y, w);
    grad.addColorStop(0, withAlpha(c, 0.5));
    grad.addColorStop(1, withAlpha(color.tan, 0));
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
}

export function drawModDisplay(canvas, rate = 1, amp = 1) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width/dpr, h = canvas.height / dpr;

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    ctx.beginPath()
    ctx.moveTo(w * 0.5, h * 0.05);
    ctx.lineTo(w * 0.5, h * 0.95);
    ctx.moveTo(w * 0.05, h * 0.5);
    ctx.lineTo(w * 0.95, h * 0.5);
    ctx.strokeStyle = color.grey;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round"
    ctx.stroke();

    ctx.beginPath()
    for(let i = 0; i < 128; i++){
        const xPos = w * 0.05 + (w * 0.9/128) * i;
        const angle = (Math.PI * 10 * rate / 128) * i;
        const yPos = h / 2 + Math.sin(angle) * h * 0.45 * amp;

        if (i === 0) { ctx.moveTo(xPos, yPos); }
        else { ctx.lineTo(xPos, yPos); }
    }

    const grad = ctx.createLinearGradient(0, h / 2 , w, h / 2);
    grad.addColorStop(0, withAlpha(color.pink, 1))
    grad.addColorStop(1, withAlpha(color.orange, 0.75))

    ctx.strokeStyle = grad;
    ctx.lineWidth = 1.5;
    ctx.lineCap = "round"
    ctx.stroke();

    ctx.restore();
}

export function drawSlider(ctx, w, h, val = 0, aux = {}) {

    const baseColor = color.pink;
    const numLines = 16;

    const activeGrad = ctx.createLinearGradient(w / 2, h, w / 2, h - h * val)
    activeGrad.addColorStop(0, withAlpha(color.pink, val * 0.8 + 0.2))
    activeGrad.addColorStop(0.8, withAlpha(color.orange, val * 0.2 + 0.8))
    activeGrad.addColorStop(1, color.tan)

    const inactiveGrad = ctx.createLinearGradient(w / 2, h - h * val, w / 2, 0)
    inactiveGrad.addColorStop(0, withAlpha(color.grey, 0.5))
    inactiveGrad.addColorStop(1, color.grey)

    const cx = w / 2
    const value = Math.floor(val * numLines);

    for (let i = 0; i <= numLines; i++) {
        const yPos = h - (h * 0.1 + (h * 0.8 / numLines) * i);
        const xExt = w * 0.45

        ctx.beginPath()
        ctx.moveTo(cx - xExt, yPos);
        ctx.lineTo(cx + xExt, yPos);
        ctx.strokeStyle = i > value ? inactiveGrad : i == value ? color.tan : activeGrad;
        ctx.lineWidth = i == value ? 2 : 1.5;
        ctx.lineCap = "round";
        ctx.stroke()
    }
}
