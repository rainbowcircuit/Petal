import { color } from '../shared/drawing.js';

export function drawLock(ctx, w, h, val, hovered = false) {
    const cx = w * 0.5, cy = h * 0.5, r = w * 0.18;
    const unlocked = val ? 0 : h * 0.15;

    const grad = ctx.createLinearGradient(cx - w * 0.2, h / 2, cx + w * 0.2, h / 2)
    grad.addColorStop(0, hovered ? color.lighterpink : color.pink);
    grad.addColorStop(1, hovered ? color.lighterlightgrey : color.lightgrey);

    ctx.beginPath();
    ctx.roundRect(w * 0.2, h * 0.48, w * 0.6, h * 0.38, 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx - r, cy - unlocked);
    ctx.lineTo(cx - r, h * 0.4 - unlocked);
    ctx.arc(cx, h * 0.4 - unlocked, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy - unlocked);

    ctx.strokeStyle = grad;
    ctx.lineWidth = w * 0.07;
    ctx.lineCap = "round";
    ctx.stroke();
}

export function drawSkew(ctx, w, h, val = 0, hovered = false, aux = {}){
    const radius = w * 0.45 * (val * 0.75 + 0.25);

    ctx.beginPath();
    ctx.arc(w/2, h/2, radius, 0, Math.PI * 1.75)
    ctx.strokeStyle = 'white'
    ctx.stroke()

    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.45, 0, Math.PI * 1.75)
    ctx.strokeStyle = 'white'
    ctx.stroke()

}
