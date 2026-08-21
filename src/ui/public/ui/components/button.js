import { LitElement, html, css, unsafeCSS } from 'lit';
import { getSliderState } from '../../juce.js';
import { HOVER_BRIGHTEN_FILTER } from '../shared/drawing.js';

export class PetalButton extends LitElement {
    static properties = {
        onLabel: {},
        offLabel: {},
        value: { type: Boolean },
        juceID: { type: String, attribute: 'juceid' },
        drawing: { type: Object }
    }

    static styles = css`
        button {
            border: none;
            outline: none;
            background-color: var(--button-bg, transparent);
            text-align: var(--button-align, center);
            color: var(--button-color, #6c6c6c);
            font-family: var(--button-font, "Verdana");
            font-size: var(--button-font-size, 12px);
            width: var(--button-width, 200px);
            height: var(--button-height, 30px);
            padding: 0;
            cursor: pointer;
            overflow: hidden;
        }
        canvas {
            display: block;
            width: 100%;
            height: 100%;
        }
        button:hover:not(:has(canvas)) {
            filter: ${unsafeCSS(HOVER_BRIGHTEN_FILTER)};
        }
    `;

    constructor() {
        super();
        this.onLabel = "On"
        this.offLabel = "Off"
        this.value = false;
        this.drawing = null;
        this.juceSlider = null;
        this.hovered = false;
    }

    firstUpdated() {
        this.button = this.shadowRoot.querySelector('button');
        this.button.addEventListener("click", () => this.toggle());

        if (this.juceID) this.rebindJuceSlider();

        if (this.drawing) {
            this.canvas = this.shadowRoot.querySelector('canvas');

            this.button.addEventListener("mouseenter", () => { this.hovered = true; this.draw(); });
            this.button.addEventListener("mouseleave", () => { this.hovered = false; this.draw(); });

            this.resizeObserver = new ResizeObserver((entries) => {
                const { width, height } = entries[0].contentRect;
                const dpr = window.devicePixelRatio || 1;

                this.canvas.width = Math.round(width * dpr);
                this.canvas.height = Math.round(height * dpr);
                this.w = width;
                this.h = height;

                this.draw();
            });
            this.resizeObserver.observe(this.button);
        }
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();
        if (this.onJuceChange) {
            this.juceSlider?.valueChangedEvent.removeListener(this.onJuceChange);
        }
    }

    updated(changedProperties) {
        if (changedProperties.has('juceID') && this.hasUpdated && this.juceID) {
            this.rebindJuceSlider();
        }
        if (this.drawing && this.canvas) this.draw();
    }

    rebindJuceSlider() {
        if (this.onJuceChange) {
            this.juceSlider?.valueChangedEvent.removeListener(this.onJuceChange);
        }

        this.juceSlider = getSliderState(this.juceID);

        this.onJuceChange = () => {
            this.value = this.juceSlider.getNormalisedValue() >= 0.5;
            this.dispatchEvent(new CustomEvent('change', {
                detail: this.value,
                bubbles: true,
                composed: true
            }));
        };
        this.onJuceChange();
        this.juceSlider.valueChangedEvent.addListener(this.onJuceChange);
    }

    toggle() {
        this.value = !this.value;
        this.juceSlider?.setNormalisedValue(this.value ? 1 : 0);
        this.dispatchEvent(new CustomEvent('change', {
            detail: this.value,
            bubbles: true,
            composed: true
        }));
    }

    draw() {
        if (!this.canvas || !this.drawing || !this.w || !this.h) return;

        const dpr = window.devicePixelRatio || 1;
        const ctx = this.canvas.getContext('2d');

        ctx.save();
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, this.w, this.h);
        this.drawing(ctx, this.w, this.h, this.value, this.hovered);
        ctx.restore();
    }

    render() {
        return html`
            <button>
                ${this.drawing
                ? html`<canvas></canvas>`
                : (this.value ? this.onLabel : this.offLabel)
                }
            </button>`;
    }
}

customElements.define('petal-button', PetalButton);
