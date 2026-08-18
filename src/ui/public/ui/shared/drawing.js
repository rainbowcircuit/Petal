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
