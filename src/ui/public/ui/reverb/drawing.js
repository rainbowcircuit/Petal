import { color, withAlpha, brighten } from '../shared/drawing.js';

// reverb size
export function drawReverbSize(ctx, w, h, val = 1, hovered = false, aux = {}) {
    const cx = w / 2;
    const cy = h / 2;
    const r = w * 0.35;

    const pink = hovered ? color.lighterpink : color.pink;
    const orange = hovered ? color.lighterorange : color.orange;
    const backFrame = hovered ? brighten("#333333") : "#333333";
    const sideFrame = hovered ? brighten("#666666") : "#666666";

    ctx.lineJoin = "round"
    ctx.lineWidth = 1.5;

    const grad = ctx.createLinearGradient(w * 0.05, h / 2, w * 0.95, h / 2)
    grad.addColorStop(0.35, pink);
    grad.addColorStop(0.75, withAlpha(orange, 0.5));

    ctx.fillStyle = grad
    // back frame
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const j = i * 2 + 1;
        const angle = Math.PI / 2 + (Math.PI * 2 / 6) * j;
        const xPos = cx + Math.cos(angle) * r;
        const yPos = cy + Math.sin(angle) * r;
        ctx.moveTo(cx, cy);
        ctx.lineTo(xPos, yPos);
    }
    ctx.strokeStyle = backFrame
    ctx.stroke();


    // side frame
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 6 + (Math.PI * 2 / 6) * i;
        const xPos = cx + Math.cos(angle) * r;
        const yPos = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
    }
    ctx.closePath();
    ctx.strokeStyle = sideFrame
    ctx.stroke();

    // inner fill
    ctx.beginPath();
    const innerR = r * 0.25 + r * val * 0.55;
    for (let i = 0; i < 6; i++) {
        const angle = Math.PI / 6 + (Math.PI * 2 / 6) * i;
        const xPos = cx + Math.cos(angle) * innerR;
        const yPos = cy + Math.sin(angle) * innerR;
        if (i === 0) ctx.moveTo(xPos, yPos);
        else ctx.lineTo(xPos, yPos);
    }
    ctx.closePath();
    ctx.fill();

    // front frame
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        const j = i * 2 + 1;
        const angle = Math.PI / 6 + (Math.PI * 2 / 6) * j;
        const xPos = cx + Math.cos(angle) * r;
        const yPos = cy + Math.sin(angle) * r;
        ctx.moveTo(cx, cy);
        ctx.lineTo(xPos, yPos);
    }
    ctx.lineJoin = "round"
    ctx.lineWidth = 1.5;

    ctx.stroke();
}

export function drawReverbTone(canvas, lp = 1, hp = 1) {
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;

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

    // filter response
    const drawFilterResponse = (edge, knee, floor, isHP = true) => {
        ctx.beginPath();
        ctx.moveTo(edge, mid);
        ctx.lineTo(knee, mid);
        ctx.quadraticCurveTo(floor, mid, floor, bot);

        const c = isHP ? color.pink : color.orange;
        ctx.strokeStyle = c;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round'
        ctx.stroke();

        ctx.lineTo(isHP ? w * 0.95 : w * 0.05, bot)

        const grad = ctx.createRadialGradient(knee, mid, 0, knee, mid, w);
        grad.addColorStop(0, withAlpha(c, 0.5))
        grad.addColorStop(1, withAlpha(color.tan, 0))
        ctx.fillStyle = grad
        ctx.fill()
    };

    const kneeW = w * 0.2;
    const lpKnee = w * 0.05 + w * 0.7 * lp;
    drawFilterResponse(w * 0.05, lpKnee, lpKnee + kneeW, false);

    const hpKnee = w * 0.25 + w * 0.7 * hp;
    drawFilterResponse(w * 0.95, hpKnee, hpKnee - kneeW, true);

    ctx.restore();
}

export function drawReverbDecay(ctx, w, h, val = 1, hovered = false, aux = {}) {
    const tan = hovered ? color.lightertan : color.tan;
    const orange = hovered ? color.lighterorange : color.orange;
    const pink = hovered ? color.lighterpink : color.pink;
    const dotColor = hovered ? brighten("#808080") : "grey";

    // dots
    for(let i = 0; i < 12; i++){
        let xPos = w * 0.1 + ((w * 0.8 / 12) * i);

        ctx.beginPath()
        ctx.arc(xPos, h * 0.8, 1, 0, Math.PI * 2, true)
        ctx.fillStyle = dotColor;
        ctx.fill()
    }

    // arcs
    for (let i = 0; i < 7; i++) {
        const clipped = Math.min(val * 7 + 1, i + 1);
        const radius = (w * 0.345 / 6) * (8 - clipped);

        ctx.beginPath();
        for (let j = 0; j <= 36; j++) {
            const angle = Math.PI / 2 + Math.PI / 36 * j
            const yPos = h * 0.75 + Math.cos(angle) * radius;
            let xPos = w * 0.2 + ((w * 0.6 / 7) * clipped);
            xPos += Math.sin(angle) * radius / 2;

            if (j === 0) { ctx.moveTo(xPos, yPos); }
            else { ctx.lineTo(xPos, yPos); }
        }

        const grad = ctx.createLinearGradient(w * 0.05, h/2, w * 0.95, h/2)
        grad.addColorStop(0, tan);
        grad.addColorStop(0.25, withAlpha(orange, 0.75));
        grad.addColorStop(1, withAlpha(pink, 0.25));
        ctx.strokeStyle = grad;
        ctx.lineCap = "round"
        ctx.lineWidth = 1.5
        ctx.stroke()
    }
}
