import { LitElement, html, css } from 'lit';
import "../components/slider.js"
import "./reverb_graphics.js"
import { color } from '../shared/drawing.js';
import { getSliderState } from '../../juce.js';
import { drawReverbSize, drawReverbDecay, drawReverbTone } from './drawing.js';

export class ReverbEditor extends LitElement {
    static styles = css`
        *, *::before, *::after {
            box-sizing: border-box;
        }

        label {
            margin: 0px;
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
        }
    `

    constructor(){
        super();
    }

    firstUpdated(){
        this.reverbLPF = getSliderState("reverbLPF");
        this.reverbHPF = getSliderState("reverbHPF");
        this.redrawTone = this.redrawTone.bind(this);
        this.canvas = this.renderRoot.querySelector('#reverbTone');

        const dpr = window.devicePixelRatio || 1;
        const cs = getComputedStyle(this.canvas);
        this.canvas.width = Math.round((parseFloat(cs.width) || this.canvas.clientWidth) * dpr);
        this.canvas.height = Math.round((parseFloat(cs.height) || this.canvas.clientHeight) * dpr);
        this.redrawTone();

        this.resizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            if (width === 0 || height === 0) return;
            const dpr = window.devicePixelRatio || 1;
            this.canvas.width = Math.round(width * dpr);
            this.canvas.height = Math.round(height * dpr);
            this.redrawTone();
        });
        this.resizeObserver.observe(this.canvas);

        this.reverbLPF.valueChangedEvent.addListener(this.redrawTone);
        this.reverbHPF.valueChangedEvent.addListener(this.redrawTone);
    }

    disconnectedCallback(){
        super.disconnectedCallback();
        this.resizeObserver?.disconnect();
    }

    redrawTone(){
        if (this.canvas){
            drawReverbTone(this.canvas,
                this.reverbLPF.getNormalisedValue(),
                this.reverbHPF.getNormalisedValue()
            );
        }
    }

    render(){
        return html`
        <div style="display: flex; flex-direction: column; justify-content: center; width: 450px">
            <reverb-graphic></reverb-graphic>
            
            <div style="display: flex; flex-direction: row; justify-content: center; align-items: center; gap: 16px">
                <div style="display: flex; flex-direction: column; align-items: center">
                    <label>Decay</label>
                    <petal-pict-slider
                        juceID="reverbDecayTime"
                        style="--slider-width: 80px;
                        --slider-height: 74px"
                        .drawing=${drawReverbDecay}>
                    </petal-pict-slider>

                    <petal-num-slider juceID="reverbDecayTime"
                        suffix=" %"
                        style="--numbox-color:  ${ color.lightgrey };
                        --numbox-width: 100px;
                        --numbox-align: center">
                    </petal-num-slider>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center">
                    <label>Size</label>
                    <petal-pict-slider juceID="reverbSize"
                        style="--slider-width: 80px;
                        --slider-height: 74px"
                        .drawing=${drawReverbSize}>
                    </petal-pict-slider>

                    <petal-num-slider juceID="reverbSize"
                        suffix=" %"
                        style="--numbox-color: ${ color.lightgrey };
                        --numbox-width: 100px;
                        --numbox-align: center">
                    </petal-num-slider>
                </div>

                <div style="display: flex; flex-direction: column; align-items: center; width: 160px">
                    <label>Tone</label>
                    <canvas id="reverbTone"
                        style="width: 140px; height: 74px">
                    </canvas>
                    <div style="display: flex; flex-direction: row; align-items: center">

                    <petal-num-slider juceID="reverbLPF" suffix=" Hz" mode="rate"
                        style="--numbox-color:  ${ color.lightgrey };
                        --numbox-width: 80px;
                        --numbox-align: right;
                        --text-align: center">
                    </petal-num-slider>

                    <petal-num-slider juceID="reverbHPF" suffix=" Hz" mode="rate"
                        style="--numbox-color:  ${ color.lightgrey };
                        --numbox-width: 80px;
                        --numbox-align: left
                        --text-align: center">
                    </petal-num-slider>

                    </div>
                </div>
            </div>

        </div>
        `
    }
};

customElements.define('reverb-editor', ReverbEditor);
