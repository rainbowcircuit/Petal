import { LitElement, html, css, unsafeCSS } from 'lit';
import "../components/button.js"
import { drawSelectDelay, drawSelectReverb, drawSelectIO } from './drawing.js';
import { color } from '../shared/drawing.js';

export class SelectionTab extends LitElement {
    static properties = {
        isDisplayingDelay: { type: Boolean },
        isDisplayingIO: { type: Boolean }
    }

    constructor(){
        super()
        this.isDisplayingDelay = false;
        this.isDisplayingIO = false;
    }

    static styles = css `
        *, *::before, *::after {
            box-sizing: border-box;
        }

        p {
            font-size: 14px;
            font-family: Verdana;
            color: #696969;
        }

        .tab-container {
            position: relative;
            display: flex;
            flex-direction: column;
            height: 100%;
            padding: 10px 0;
        }

        .tab-row {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .indicator {
            position: absolute;
            left: 0;
            width: 1.5px;
            height: calc(100% / 3);
            border-radius: 1px;
            background: linear-gradient(180deg, ${unsafeCSS(color.pink)}, ${unsafeCSS(color.orange)});
        }

        .indicator-select {
            top: 0;
            transition: top 0.1s ease;
        }

        .indicator-toggle {
            top: calc(2 * 100% / 3);
            opacity: 0;
            transition: opacity 0.1s ease;
        }

        .indicator-toggle.active {
            opacity: 1;
        }
    `

    render(){
        const selectIndex = this.isDisplayingDelay ? 0 : 1;

        return html`
        <div class="tab-container">
            <div class="indicator indicator-select" style="top: calc(${selectIndex} * 100% / 3)"></div>
            <div class="indicator indicator-toggle ${this.isDisplayingIO ? 'active' : ''}"></div>

            <div class="tab-row">
                <petal-button
                    @click=${() => this.selectDelay(true)}
                    style="--button-width: 50px;
                    --button-height: 50px"
                    .drawing=${drawSelectDelay}>
                </petal-button>
            </div>

            <div class="tab-row">
                <petal-button
                    @click=${() => this.selectDelay(false)}
                    style="--button-width: 50px;
                    --button-height: 50px"
                    .drawing=${drawSelectReverb}>
                </petal-button>
            </div>

            <div class="tab-row">
                <petal-button
                    @click=${() => this.toggleIO()}
                    style="--button-width: 50px;
                    --button-height: 50px"
                    .drawing=${drawSelectIO}>
                </petal-button>
            </div>
        </div>
        `
    }

    updated() {
        const [delayButton, reverbButton, ioButton] = this.shadowRoot.querySelectorAll('petal-button');
        if (delayButton) delayButton.value = this.isDisplayingDelay;
        if (reverbButton) reverbButton.value = !this.isDisplayingDelay;
        if (ioButton) ioButton.value = this.isDisplayingIO;
    }

    selectDelay(isDelay) {
        if (this.isDisplayingDelay === isDelay) {
            this.requestUpdate();
            return;
        }
        this.dispatchEvent(new CustomEvent('display-delay-change', {
            detail: isDelay,
            bubbles: true,
            composed: true
        }));
    }

    toggleIO() {
        this.dispatchEvent(new CustomEvent('display-io-change', {
            detail: !this.isDisplayingIO,
            bubbles: true,
            composed: true
        }));
    }
}

customElements.define("selection-tab", SelectionTab)
