import { LitElement, html, css } from 'lit';
import './delay/delay_editor.js'
import './reverb/reverb_editor.js'
import './tap/tap_editor.js'
import './io/io_editor.js'
import './selection_tab/selection_tab.js'

class App extends LitElement {
    static properties = {
        isDisplayingDelay: { type: Boolean },
        isDisplayingIO: { type: Boolean },
        scale: { type: Number }
    }

    static styles = css`
        :host {
            display: flex;
            width: 100%;
            height: 100%;
            justify-content: center;
            align-items: center;
        }

        #window {
            display: flex;
            width: 920px;
            height: 460px;
            transform-origin: center center;
            justify-content: center;
            align-items: center;
            user-select: none;
            -webkit-touch-callout: none;
            -webkit-user-select: none;
        }

        .window {
            background-color: #212121;
            border-radius: 10px;
        }
        `;

    constructor(){
        super()
        this.isDisplayingDelay = true;
        this.isDisplayingIO = true;
        this.scale = 0.875;
    }

    connectedCallback() {
        super.connectedCallback();
        if (window.__JUCE__) {
            window.__JUCE__.backend.addEventListener("windowSize", (value) => {
                const { width, height } = JSON.parse(value);
                this.scale = Math.min(width / 920, height / 460);
            });
        }
    }

    render(){
        return html`
        <div id="window" style="transform: scale(${this.scale})">
            <div style="display: flex; flex-direction: row; align-items: center; gap: 10px; margin: 0px; padding: 0px">
                <!-- delay and reverb -->
                <div style="position: relative; width: 445px; height: 445px; overflow: hidden">
                    <div style="position: relative; width: 450px; height: 450px; transform: scale(0.98889); transform-origin: top left">
                        <reverb-editor class="window"
                            style="display: ${this.isDisplayingDelay ? 'none' : 'block'}; width: 450px; height: 450px">
                        </reverb-editor>

                        <delay-editor class="window"
                            style="display: ${this.isDisplayingDelay ? 'block' : 'none'}; width: 450px; height: 450px">
                        </delay-editor>
                    </div>
                </div>

                <!-- controls -->
                <div style="position: relative; width: 445px; height: 445px; overflow: hidden">
                    <div style="position: relative; display: flex; flex-direction: row; width: 450px; height: 450px; transform: scale(0.98889); transform-origin: top left">
                        <tap-editor class="window"
                            style="display: ${this.isDisplayingIO ? 'none' : 'block'}; width: 375px"
                            .isPitch=${this.isDisplayingDelay} >
                        </tap-editor>
                        <io-editor class="window" style="display: ${this.isDisplayingIO ? 'block' : 'none'}; width: 375px"></io-editor>
                        <selection-tab
                            class="window"
                            .isDisplayingDelay=${this.isDisplayingDelay}
                            .isDisplayingIO=${this.isDisplayingIO}
                            @display-delay-change=${e => this.isDisplayingDelay = e.detail}
                            @display-io-change=${e => this.isDisplayingIO = e.detail}
                            style="width: 75px; height: 450px">
                        </selection-tab>
                    </div>
                </div>
            </div>
        </div>
        `
    }
}

customElements.define('main-app', App)