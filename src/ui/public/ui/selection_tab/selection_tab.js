import { LitElement, html, css } from 'lit';
import "../components/button.js"
import { drawSelectDelay, drawSelectReverb, drawSelectIO } from './drawing.js';

export class SelectionTab extends LitElement {
    static properties = {
        isDisplayingDelay: { type: Boolean },
        isDisplayingIO: { type: Boolean }
    }

    constructor(){
        super()
        this.isDisplayingDelay = false;
        this.isDisplayingIO = true;
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
    `

    render(){
        return html`
        <div style="display: flex; flex-direction: column; justify-content: space-between; align-items: center; height: 100%; padding: 20px; box-sizing: border-box">
            <div style="display: flex; flex-direction: column;">
                <petal-button
                    @click=${() => this._selectDelay(true)}
                    style="--button-width: 50px;
                    --button-height: 50px"
                    .drawing=${drawSelectDelay}>
                </petal-button>

                <petal-button
                    @click=${() => this._selectDelay(false)}
                    style="--button-width: 50px;
                    --button-height: 50px"
                    .drawing=${drawSelectReverb}>
                </petal-button>
            </div>

            <petal-button
                @click=${() => this._toggleIO()}
                style="--button-width: 50px;
                --button-height: 50px"
                .drawing=${drawSelectIO}>
            </petal-button>
        </div>
        `
    }

    updated() {
        const [delayButton, reverbButton, ioButton] = this.shadowRoot.querySelectorAll('petal-button');
        if (delayButton) delayButton.value = this.isDisplayingDelay;
        if (reverbButton) reverbButton.value = !this.isDisplayingDelay;
        if (ioButton) ioButton.value = this.isDisplayingIO;
    }

    _selectDelay(isDelay) {
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

    _toggleIO() {
        this.dispatchEvent(new CustomEvent('display-io-change', {
            detail: !this.isDisplayingIO,
            bubbles: true,
            composed: true
        }));
    }
}



customElements.define("selection-tab", SelectionTab)
