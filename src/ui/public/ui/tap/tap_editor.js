import { LitElement, html, css } from 'lit';
import { getSliderState } from '../../juce.js';
import "../components/slider.js"
import "../components/button.js"
import { color, lerpColor } from '../shared/drawing.js';
import { drawReverbSend, drawPitch, drawTapState } from './drawing.js';

export class TapEditorInstance extends LitElement {
    static properties = {
        isLeftColm: { type: Boolean },
        isPitch: { type: Boolean },
        tapIndex: { type: Number },
        isState: { type: Boolean}
    }

    constructor(){
        super()
        this.isPitch = false;
        this.isLeftColm = true;
        this.isState = true;
    }

    static styles = css `
        *, *::before, *::after {
            box-sizing: border-box;
        }

        #tapInstance {
            height: 70px;
            overflow: hidden;
            transition: height 0.5s
        }

        p {
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
        }
    `
    firstUpdated() {
        this.tapStateSlider = getSliderState(`tapState${this.tapIndex}`);
        this.onStateChange = () => {
            this.isState = this.tapStateSlider.getNormalisedValue() >= 0.5;
        };
        this.onStateChange();
        this.tapStateSlider.valueChangedEvent.addListener(this.onStateChange);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    render() {
        return html`
    <div id="tapInstance" style="display: flex; flex-direction: row; justify-content: space-between;">
        <petal-button id="leftSide" juceID="tapState${this.tapIndex}" 
            style="display: ${this.isLeftColm ? "block" : "none"}; 
                    --button-width: 25px; 
                    --button-height: 50px" 
            .drawing=${drawTapState}>
        </petal-button>
        <p id="leftSide" style="display: ${!this.isLeftColm ? "block" : "none"}">${this.tapIndex + 1}</p>
        <div style="display: flex; flex-direction: column; justify-content: space-between">

            <div style="display: ${!this.isPitch ? 'none' : 'flex'}; flex-direction: column">
                <petal-pict-slider juceID="tapShiftAmt${this.tapIndex}"
                    style="--slider-width: 100px;
                            --slider-height: 50px;
                            margin-bottom: 5px;"
                    .drawing=${drawPitch}
                    .drawingAux=${{ tapIndex: this.tapIndex, state: this.isState }}>
                </petal-pict-slider>

                <petal-num-slider juceID="tapShiftAmt${this.tapIndex}"
                    suffix=" st" min="-12" max="12" mode="int"
                    style="--numbox-align: center; --text-align: center;
                    --color: ${lerpColor(color.pink, color.orange, 0.125 * this.tapIndex)};">
                </petal-num-slider>
            </div>

            <div style="display: ${!this.isPitch ? 'flex' : 'none'}; flex-direction: column">
                <petal-pict-slider juceID="tapReverbAmt${this.tapIndex}"
                    style="--slider-width: 100px;
                            --slider-height: 50px;
                            margin-bottom: 5px;"
                    .drawing=${drawReverbSend}
                    .drawingAux=${{ tapIndex: this.tapIndex, state: this.isState }}>
                </petal-pict-slider>

                <petal-num-slider juceID="tapReverbAmt${this.tapIndex}"
                    suffix=" %"
                    style="--numbox-align: center; 
                    --text-align: center;
                    --color: ${lerpColor(color.pink, color.orange, 0.125 * this.tapIndex)};">
                </petal-num-slider>

            </div>
        </div>
        <p id="leftSide" style="display: ${this.isLeftColm ? "block" : "none"}">${this.tapIndex + 1}</p>

        <petal-button id="leftSide" 
            juceID="tapState${this.tapIndex}" 
            style="display: ${!this.isLeftColm ? "block" : "none"}; 
                    --button-width: 25px; 
                    --button-height: 50px" 
            .drawing=${drawTapState}>
        </petal-button>
    </div>
    `
    }
}

customElements.define("tap-instance", TapEditorInstance)

export class TapEditor extends LitElement {
    static properties = {
        isPitch: { type: Boolean }
    }
    
    static styles = css`
        label {
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
            margin: 0px;
        }
    `

    constructor() {
        super()
        this.isPitch = true;
    }

    render() {
        const instances = []

        return html`
    <div style="display: flex; flex-direction: column; justify-content: space-evenly; height: 100%; width: 100%">
        <!-- top controls -->
        <div style="display: flex; flex-direction: row; justify-content: space-evenly; align-items: center">
            <label>Feedback</label>
            <petal-num-slider juceID="feedbackAmt" suffix=" %"
                style="--numbox-align: right; --text-align: center" >
            </petal-num-slider>
            <label>Length</label>
            <petal-num-slider juceID="feedbackLen" suffix="" mode="int"
                style="--numbox-align: right; --text-align: center" >
            </petal-num-slider>
        </div>

        <!-- tap instances -->
        <div style="display: flex; flex-direction: row; justify-content: space-around; height: 80%">
            <div style="display: flex; flex-direction: column; justify-content: space-between;">
                <tap-instance style="width: 150px" .isPitch=${this.isPitch} tapIndex=0></tap-instance>
                <tap-instance .isPitch=${this.isPitch} tapIndex=2></tap-instance>
                <tap-instance .isPitch=${this.isPitch} tapIndex=4></tap-instance>
                <tap-instance .isPitch=${this.isPitch} tapIndex=6></tap-instance>
            </div>

            <div style="display: flex; flex-direction: column; justify-content: space-between">
                <tap-instance style="width: 150px" .isLeftColm=${false} .isPitch=${this.isPitch} tapIndex=1></tap-instance>
                <tap-instance .isLeftColm=${false} .isPitch=${this.isPitch} tapIndex=3></tap-instance>
                <tap-instance .isLeftColm=${false} .isPitch=${this.isPitch} tapIndex=5></tap-instance>
                <tap-instance .isLeftColm=${false} .isPitch=${this.isPitch} tapIndex=7></tap-instance>
            </div>
        </div>
    </div>
    `
    }
}

customElements.define("tap-editor", TapEditor)
