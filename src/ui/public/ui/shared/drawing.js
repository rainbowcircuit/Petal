export const color = {
    pink: "#CB8B93", // og pink
    orange: "#E3895A", // og orange
    tan: "#BEDBBA", //"#2d2d2d"
    lighttan: "#CFE1CE",
    grey: "#3d3d3d",
    lightgrey: "#aaaaaa"
}

// color helpers
export const hexToRgb = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

export const rgb = (c) => `#${c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('')}`;

export const lerpColor = (hexA, hexB, t) => {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    return rgb(a.map((v, i) => v + (b[i] - v) * t));
};

export function withAlpha(hex, alpha) {
    const h = hex.replace("#", "");
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// adds `amount` (0-255) to each RGB channel, clamped to [0, 255]
export function brighten(hex, amount = 10) {
    const clamp = (v) => Math.min(255, Math.max(0, v + amount));
    return rgb(hexToRgb(hex).map(clamp));
}

// hover-state variants of the palette above, each +10 brighter per channel
color.lighterpink = brighten(color.pink);
color.lighterorange = brighten(color.orange);
color.lightertan = brighten(color.tan);
color.lighterlighttan = brighten(color.lighttan);
color.lightergrey = brighten(color.grey);
color.lighterlightgrey = brighten(color.lightgrey);

// CSS filter that adds 10/255 to each RGB channel of whatever it's applied to —
// used for hover feedback on plain (non-canvas) controls that have no discrete
// palette color to swap.
const HOVER_FILTER_SVG = `<svg xmlns='http://www.w3.org/2000/svg'><filter id='petal-hover-brighten' color-interpolation-filters='sRGB'><feComponentTransfer><feFuncR type='linear' slope='1' intercept='${(10 / 255).toFixed(6)}'/><feFuncG type='linear' slope='1' intercept='${(10 / 255).toFixed(6)}'/><feFuncB type='linear' slope='1' intercept='${(10 / 255).toFixed(6)}'/></feComponentTransfer></filter></svg>`;
export const HOVER_BRIGHTEN_FILTER = `url("data:image/svg+xml,${encodeURIComponent(HOVER_FILTER_SVG)}#petal-hover-brighten")`;
