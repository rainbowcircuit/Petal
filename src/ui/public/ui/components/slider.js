import { LitElement, html, css, unsafeCSS } from 'lit';
import { getSliderState } from '../../juce.js';
import { HOVER_BRIGHTEN_FILTER } from '../shared/drawing.js';

export class PetalSliderBase extends LitElement {
    static properties = {
        sensitivity: { type: Number },
        fineFactor: { type: Number },
        default: { type: Number, attribute: 'default' },
        juceID: { type: String, attribute: 'juceid' },
    };

    constructor() {
        super();
        this.sensitivity = 0.005;
        this.fineFactor = 0.2;
        this.default = 0;
        this.norm = 0;

        this.addEventListener('pointerdown', this.down);
        this.addEventListener('pointermove', this.move);
        this.addEventListener('pointerup', this.up);
    }

    firstUpdated() {
        this.rebindJuceSlider();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        if (this.onJuceChange) {
            this.juceSlider?.valueChangedEvent.removeListener(this.onJuceChange);
        }
        if (this.onJuceProperties) {
            this.juceSlider?.propertiesChangedEvent.removeListener(this.onJuceProperties);
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('juceID') && this.hasUpdated) {
            this.rebindJuceSlider();
        }
    }

    rebindJuceSlider() {
        if (this.onJuceChange) {
            this.juceSlider?.valueChangedEvent.removeListener(this.onJuceChange);
        }
        if (this.onJuceProperties) {
            this.juceSlider?.propertiesChangedEvent.removeListener(this.onJuceProperties);
        }

        this.juceSlider = getSliderState(this.juceID);

        this.onJuceChange = () => {
            if (this.isEditing) return;
            this.updateDisplay(this.juceSlider.getNormalisedValue());
        };
        this.onJuceChange();
        this.juceSlider.valueChangedEvent.addListener(this.onJuceChange);

        this.onJuceProperties = () => this.handlePropertiesChanged(this.juceSlider.properties);
        this.juceSlider.propertiesChangedEvent.addListener(this.onJuceProperties);
    }

    handlePropertiesChanged(_properties) { }

    updateDisplay(norm) {
        this.norm = norm;
    }

    quantizeNorm(norm) {
        const props = this.juceSlider?.properties;
        if (props && props.interval > 0) {
            return this.snapNormToInterval(norm, props);
        }
        return norm;
    }

    snapNormToInterval(norm, props) {
        const range = props.end - props.start;
        if (range === 0) return norm;
        const scaled = this.juceSlider.normalisedToScaledValue(norm);
        const snappedScaled = this.juceSlider.snapToLegalValue(scaled);
        return Math.pow((snappedScaled - props.start) / range, props.skew);
    }

    tryStartEditing(_deltaTime) {
        return false;
    }

    lastClickTime = 0;
    lastClickYPos = 0;
    startNorm = 0;
    mouseState = "idle";
    isEditing = false;

    down(e) {
        e.preventDefault();

        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastClickTime;

        if (this.tryStartEditing(deltaTime)) {
            this.lastClickTime = 0;
            this.mouseState = "idle";
            return;
        }

        if (e.metaKey) {
            this.reset();
            return;
        }

        this.lastClickTime = currentTime;
        this.lastClickYPos = e.clientY;
        this.startNorm = this.juceSlider.getNormalisedValue();
        this.setPointerCapture(e.pointerId);
        this.mouseState = "drag";
    }

    move(e) {
        if (this.mouseState !== "drag") return;
        if (!this.hasPointerCapture(e.pointerId)) return;

        const deltaY = this.lastClickYPos - e.clientY; // up = increase
        const sens = e.shiftKey ? this.sensitivity * this.fineFactor : this.sensitivity;

        const norm = this.startNorm + deltaY * sens;
        this.applyNorm(norm);
    }

    up() {
        this.mouseState = "idle";
    }

    reset() {
        this.applyNorm(this.default);
    }

    applyNorm(norm) {
        norm = Math.min(1, Math.max(0, norm));
        norm = this.quantizeNorm(norm);

        this.juceSlider.setNormalisedValue(norm);
        this.updateDisplay(norm);
    }
}


export class PetalNumSlider extends PetalSliderBase {
    static properties = {
        ...PetalSliderBase.properties,
        min: { type: Number },
        max: { type: Number },
        suffix: { type: String },
        mode: { type: String },
        exponent: { type: Number },
        enumerators: {
            converter: {
                fromAttribute: (v) => (v ? v.split(',').map((s) => s.trim()) : []),
                toAttribute: (v) => (Array.isArray(v) ? v.join(',') : v),
            },
        },
    };

    static styles = css`
        :host {
            display: flex;
            justify-content: var(--numbox-align, flex-start);
            width: var(--slider-width, auto);
        }

        input {
            border: transparent;
            outline: transparent;
            background-color: var(--numbox-bg, transparent);
            text-align: var(--numbox-align, left);
            color: var(--numbox-color, #aaaaaa);
            font-family: var(--numbox-font, "Verdana");
            font-size: var(--numbox-font-size, 12px);
            width: var(--numbox-width, 60px);
            height: var(--numbox-height, 13px);
            cursor: ns-resize;
        }
        input:focus {
            cursor: text;
        }
        input:hover {
            filter: ${unsafeCSS(HOVER_BRIGHTEN_FILTER)};
        }
    `;

    constructor() {
        super();
        this.min = 0;
        this.max = 100;
        this.suffix = "";
        this.mode = "";
        this.exponent = 1;
        /** @type {string[]} */
        this.enumerators = [];
    }

    firstUpdated() {
        this.input = this.shadowRoot.querySelector('input');

        super.firstUpdated();

        this.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (this.tryCommit()) {
                    this.isEditing = false;
                    this.input.blur();
                } else {
                    this.input.value = this.editString(this.juceSlider.getNormalisedValue());
                    this.input.select();
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.isEditing = false;
                this.updateDisplay(this.juceSlider.getNormalisedValue());
                this.input.blur();
            }
        });

        this.input.addEventListener('blur', () => {
            if (this.isEditing && !this.tryCommit()) {
                this.updateDisplay(this.juceSlider.getNormalisedValue());
            } else if (!this.isEditing) {
                this.updateDisplay(this.juceSlider.getNormalisedValue());
            }
            this.isEditing = false;
        });
    }

    handlePropertiesChanged(properties) {
        this.min = properties.start;
        this.max = properties.end;
        this.exponent = properties.skew !== 0 ? 1 / properties.skew : 1;
        this.updateDisplay(this.juceSlider.getNormalisedValue());
    }

    tryStartEditing(deltaTime) {
        if (deltaTime < 500 && deltaTime > 50) {
            this.isEditing = true;
            this.input.value = this.editString(this.juceSlider.getNormalisedValue());
            this.input.focus();
            this.input.select();
            return true;
        }
        return false;
    }

    quantizeNorm(norm) {
        if (this.mode === "enum" && this.enumerators.length > 1) {
            const n = this.enumerators.length;
            const index = Math.round(norm * (n - 1));
            return index / (n - 1);
        }
        return super.quantizeNorm(norm);
    }

    updateDisplay(norm) {
        this.norm = norm;
        if (this.input) {
            this.input.value = this.formatDisplay(this.normToValue(norm), norm);
        }
    }

    normToValue(norm) {
        const shaped = Math.pow(Math.min(1, Math.max(0, norm)), this.exponent);
        return this.min + shaped * (this.max - this.min);
    }

    valueToNorm(value) {
        const range = this.max - this.min;
        if (range === 0) return 0;
        const frac = Math.min(1, Math.max(0, (value - this.min) / range));
        return Math.pow(frac, 1 / this.exponent);
    }

    tryCommit() {
        const raw = this.input.value;

        let norm;
        if (this.mode === "enum") {
            const idx = this.enumerators.findIndex(
                (s) => s.toLowerCase() === raw.trim().toLowerCase()
            );
            if (idx < 0) return false; // reject non-matching label
            norm = this.enumerators.length > 1 ? idx / (this.enumerators.length - 1) : 0;
        } else {
            const value = this.parseNumeric(raw);
            if (value === null) return false; // reject non-numbers
            const clamped = Math.min(this.max, Math.max(this.min, value));
            norm = this.valueToNorm(clamped);
        }

        this.juceSlider.setNormalisedValue(norm);
        this.updateDisplay(norm); // re-applies the suffix
        return true;
    }

    parseNumeric(raw) {
        const trimmed = raw.trim();
        if (this.mode === "db") {
            const bare = trimmed.replace(/\s*dB$/i, "").trim();
            if (/^-inf(inity)?$/i.test(bare) || bare === "-∞") {
                return this.min;
            }
        }

        const m = raw.trim().match(/^([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s*([a-zA-Z%]*)$/);
        if (!m) return null;

        const num = parseFloat(m[1]);
        if (Number.isNaN(num)) return null;

        if (this.mode === "time") {
            const unit = m[2].toLowerCase();
            if (unit === "s") return num * 1000;
            return num;
        }
        if (this.mode === "rate") {
            const unit = m[2].toLowerCase();
            if (unit === "k" || unit === "khz") return num * 1000;
            return num;
        }
        return num;
    }

    isNegInf(value) {
        return value <= this.min + 0.05;
    }

    editString(norm) {
        const value = this.normToValue(norm);
        switch (this.mode) {
            case "enum": {
                const n = this.enumerators.length;
                if (!n) return "";
                const i = Math.min(n - 1, Math.max(0, Math.round(norm * (n - 1))));
                return this.enumerators[i];
            }
            case "time":
                return String(Math.round(value)); // edit in bare ms
            case "rate":
                return String(Math.round(value)); // edit in bare Hz
            case "db":
                return this.isNegInf(value) ? "-inf" : String(+value.toFixed(4));
            default:
                return String(+value.toFixed(4));  // trims trailing zeros, drops suffix/%
        }
    }

    formatDisplay(value, norm) {
        switch (this.mode) {
            case "enum": {
                const n = this.enumerators.length;
                if (!n) return "";
                const index = Math.min(n - 1, Math.max(0, Math.round(norm * (n - 1))));
                return this.enumerators[index];
            }
            case "time":
                return this.formatTime(value); // value is in ms
            case "rate":
                return this.formatRate(value); // value is in Hz
            case "percent":
                return `${value.toFixed(0)}%`;
            case "int":
                return `${Math.floor(value) + this.suffix}`;
            case "db":
                return this.isNegInf(value) ? `-inf${this.suffix}` : value.toFixed(1) + this.suffix;
            default:
                return value.toFixed(1) + this.suffix;
        }
    }

    formatTime(ms) {
        if (ms < 1000) return `${Math.round(ms)} ms`;
        const s = ms / 1000;
        if (s < 10) return `${s.toFixed(0)} s`;
        return `${s.toFixed(1)} s`;
    }

    formatRate(hz) {
        if (hz < 1000) return `${hz.toFixed(1)} Hz`;
        return `${(hz / 1000).toFixed(1)} kHz`;
    }

    render() {
        return html`<input></input>`;
    }
}

customElements.define('petal-num-slider', PetalNumSlider);


export class PetalPictSlider extends PetalSliderBase {
    static properties = {
        ...PetalSliderBase.properties,
        drawing: { type: Object },
        drawingAux: { type: Object },
    };

    static styles = css`
        :host {
            display: flex;
            justify-content: var(--numbox-align, flex-start);
            width: var(--slider-width, auto);
        }

        canvas {
            display: block;
            width: var(--slider-width, 75px);
            height: var(--slider-height, 15px);
            cursor: ns-resize;
        }
    `;

    constructor() {
        super();
        this.drawing = null;
        this.drawingAux = null;
        this.hovered = false;
    }

    firstUpdated() {
        this.canvas = this.shadowRoot.querySelector('canvas');

        this.canvas.addEventListener("mouseenter", () => { this.hovered = true; this.drawCanvas(); });
        this.canvas.addEventListener("mouseleave", () => { this.hovered = false; this.drawCanvas(); });

        // display:none ancestors (hidden tabs) never get a layout box, so
        // ResizeObserver won't fire until the tab is shown; size from computed
        // style (a definite length, resolvable even while hidden) so it paints immediately.
        const dpr = window.devicePixelRatio || 1;
        const cs = getComputedStyle(this.canvas);
        this.w = parseFloat(cs.width) || this.canvas.clientWidth;
        this.h = parseFloat(cs.height) || this.canvas.clientHeight;
        this.canvas.width = Math.round(this.w * dpr);
        this.canvas.height = Math.round(this.h * dpr);

        this.resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            // display:none reports a 0x0 rect the moment observe() is called;
            // ignore it so it doesn't clobber the computed-style sizing above.
            if (width === 0 || height === 0) return;
            const dpr = window.devicePixelRatio || 1;

            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
            this.w = width;
            this.h = height;

            this.drawCanvas();
        });
        this.resizeObserver.observe(this.canvas);

        super.firstUpdated();
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();
    }

    updated(changedProperties) {
        super.updated(changedProperties);
        if (changedProperties.has('drawing') || changedProperties.has('drawingAux')) {
            this.drawCanvas();
        }
    }

    updateDisplay(norm) {
        this.norm = norm;
        this.drawCanvas();
    }

    drawCanvas() {
        if (!this.canvas || !this.drawing) return;
        const ctx = this.canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;

        const w = this.w ?? this.canvas.width / dpr;
        const h = this.h ?? this.canvas.height / dpr;

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        this.drawing(ctx, w, h, this.norm, this.hovered, this.drawingAux);
        ctx.restore();
    }

    render() {
        return html`<canvas></canvas>`;
    }
}

customElements.define('petal-pict-slider', PetalPictSlider);