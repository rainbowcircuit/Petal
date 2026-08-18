import { LitElement, html, css } from 'lit';
import "../components/slider.js"
import "../components/button.js"
import "./delay_graphic.js"
import { color } from '../shared/drawing.js';
import "../components/utility.js"

import { drawLock, drawSkew } from './drawing.js';

const SYNC_TIME_LABELS = [
    "1/32", "3/64", "1/16", "3/32", "1/8", "3/16",
    "1/4", "3/8", "1/2", "3/4", "1"
];

export class DelayEditor extends LitElement {
    static properties = {
        isSyncL: { type: Boolean },
        isSyncR: { type: Boolean },
        isStereoLock: { type: Boolean }
    }

    constructor() {
        super();
        this.isSyncL = true;
        this.isSyncR = true;
        this.isStereoLock = true;
    }
    static styles = css`
        *, *::before, *::after {
            box-sizing: border-box;
        }

        label {
            margin: 0;
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
        }
        `

    render() {
        return html`
    <div style="padding: 25px; display: flex; flex-direction: column; justify-content: space-between; width: 450px; height: 450px">

        <!-- top menu items -->
        <div style="display: flex; flex-direction: row; justify-content: space-between">
            <!-- left delay -->
            <div style="display: flex; flex-direction: column">
                <div style="height: 30px;">
                    <petal-num-slider juceID="freeTimeL"
                        suffix=" ms"
                        min="5" max="500"
                        style="
                            display: ${!this.isSyncL ? 'block' : 'none'}; 
                            --numbox-width: 150px; 
                            --numbox-height: 31px; 
                            --numbox-font-size: 30px; 
                            --numbox-color: ${color.lighttan}; 
                            --numbox-font: Helvetica;
                            --numbox-align: left">
                    </petal-num-slider>
                    <petal-num-slider juceID="syncTimeL" 
                        mode="enum" .enumerators=${SYNC_TIME_LABELS} 
                        style=" 
                            display: ${this.isSyncL ? 'block' : 'none'}; 
                            --numbox-width: 150px; 
                            --numbox-height: 31px; 
                            --numbox-font-size: 30px; 
                            --numbox-color: ${color.lighttan}; 
                            --numbox-font: Helvetica;
                            --numbox-align: left">
                    </petal-num-slider>
                </div>
                <petal-button juceID="isSyncL" onLabel="Sync" offLabel="Free" 
                    style="--button-width: 50px; --button-align: left" 
                    @change=${e => this.isSyncL = e.detail}>
                </petal-button>
            </div>

            <petal-button juceID="stereoLock" style="--button-width: 30px; --button-height: 30px" .drawing=${drawLock}
                @change=${e => this.isStereoLock = e.detail}>
            </petal-button>
            
            <!-- right delay -->
            <div style="display: flex; flex-direction: column; align-items: flex-end">
                <div style=" height: 30px;">
                    <petal-num-slider juceID="${this.isStereoLock ? "freeTimeL" : "freeTimeR"}"
                        suffix=" ms"
                        min="5" max="500"
                        style="display: ${!this.isSyncR ? 'block' : 'none'}; 
                            --numbox-width: 150px; 
                            --numbox-height: 31px; 
                            --numbox-font-size: 30px; 
                            --numbox-color: ${color.lighttan}; 
                            --numbox-font: Helvetica;
                            --numbox-align: right;
                            --text-align: right">
                    </petal-num-slider>
                    <petal-num-slider juceID="${this.isStereoLock ? "syncTimeL" : "syncTimeR"}" 
                        mode="enum" .enumerators=${SYNC_TIME_LABELS} 
                        style=" display: ${this.isSyncR ? 'block' : 'none'}; 
                            --numbox-width: 150px; 
                            --numbox-height: 31px; 
                            --numbox-font-size: 30px; 
                            --numbox-color: ${color.lighttan}; 
                            --numbox-font: Helvetica;
                            --numbox-align: right;
                            --text-align: right">
                    </petal-num-slider>
                </div>
                <petal-button juceID="isSyncR" onLabel="Sync" offLabel="Free" 
                    style="--button-width: 50px; --button-align: right" 
                    @change=${e => this.isSyncR = e.detail}>
                </petal-button>
            </div>
        </div>

        <!-- visualizer -->
        <div style="display: flex; flex-direction: column; align-items: center">
            <delay-graphic style="width: 300px; height: 300px" .isStereoLock="${ this.isStereoLock }"></delay-graphic>
        </div>

        <!-- bottom controls -->
        <div style="display: flex; flex-direction: row; justify-content: space-around">
            <div style="display: flex; flex-direction: column; align-items: center">
                <label>Position</label>
                <petal-num-slider juceID="positionL" suffix=" %" 
                    style="--numbox-align: center"></petal-num-slider>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center">
                <label>Skew</label>
                <petal-num-slider juceID="skewL" min="-100" max="100" suffix=" %" 
                    style="--numbox-align: center"></petal-num-slider>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center">
                <label>Round</label>
                <petal-num-slider juceID="round" suffix=" %" 
                    style="--numbox-align: center"></petal-num-slider>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center">
                <label>Skew</label>
                <petal-num-slider juceID="${this.isStereoLock ? "skewL" : "skewR"}" min="-100" max="100" suffix=" %" 
                    style="--numbox-align: center"></petal-num-slider>
            </div>

            <div style="display: flex; flex-direction: column; align-items: center">
                <label>Position</label>
                <petal-num-slider juceID="${this.isStereoLock ? "positionL" : "positionR"}" suffix=" %" 
                    style="--numbox-align: center"></petal-num-slider>
            </div>
        </div>
    </div>
    `
    }
};

customElements.define('delay-editor', DelayEditor);
