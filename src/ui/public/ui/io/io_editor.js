import { LitElement, html, css } from 'lit';
import "../components/slider.js"
import "../components/utility.js"
import './preset_editor.js'
import { color } from '../shared/drawing.js';
import { getSliderState } from '../../juce.js';
import { drawFilterGraph, drawModDisplay, drawSlider } from './drawing.js';

export class IOEditor extends LitElement {
    static styles = css`
        *, *::before, *::after {
            box-sizing: border-box;
        }

        :host {
            --label-col: 1fr;
            --control-col: 64px;
            --row-gap: 6px;
            --group-gap: 10px;
        }

        .panel {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            padding: 20px;
            gap: 14px;
        }

        label {
            margin: 0;
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
        }

        .section-label {
            color: white;
            display: block;
            margin-bottom: 4px;
        }

        .row {
            display: grid;
            grid-template-columns: var(--label-col) var(--control-col);
            align-items: center;
            column-gap: var(--row-gap);
        }

        .row label {
            color: white;
        }

        .group-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            column-gap: var(--group-gap);
        }

        .group-row .row {
            grid-template-columns: auto var(--control-col);
            justify-content: space-evenly

        }

        petal-num-slider {
            justify-self: end;
        }
    `

    constructor() {
        super();
    }

    firstUpdated(){
        this.filterCutoff = getSliderState("filterCutoff");
        this.filterShape = getSliderState("filterShape");
        this.lfoRate = getSliderState("lfoRate");
        this.lfoAmount = getSliderState("lfoAmount");

        this.redrawFilterGraph = this.redrawFilterGraph.bind(this);
        this.redrawModDisplay = this.redrawModDisplay.bind(this);

        this.filterCanvas = this.renderRoot.querySelector('#filterGraph');
        this.filterResizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            const dpr = window.devicePixelRatio || 1;
            this.filterCanvas.width = Math.round(width * dpr);
            this.filterCanvas.height = Math.round(height * dpr);
            this.redrawFilterGraph();
        });

        this.modCanvas = this.renderRoot.querySelector('#modGraph');
        this.modResizeObserver = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            const dpr = window.devicePixelRatio || 1;
            this.modCanvas.width = Math.round(width * dpr);
            this.modCanvas.height = Math.round(height * dpr);
            this.redrawModDisplay();
        });
        
        this.filterResizeObserver.observe(this.filterCanvas);
        this.modResizeObserver.observe(this.modCanvas);

        this.filterCutoff.valueChangedEvent.addListener(this.redrawFilterGraph);
        this.filterShape.valueChangedEvent.addListener(this.redrawFilterGraph);
        this.lfoRate.valueChangedEvent.addListener(this.redrawModDisplay);
        this.lfoAmount.valueChangedEvent.addListener(this.redrawModDisplay);
    }

    disconnectedCallback(){
        super.disconnectedCallback();
        this.filterResizeObserver?.disconnect();
        this.modResizeObserver?.disconnect();
    }

    redrawFilterGraph(){
        if (this.filterCanvas){
            drawFilterGraph(this.filterCanvas,
                this.filterCutoff.getNormalisedValue(),
                this.filterShape.getNormalisedValue()
            );
        }
    }

    redrawModDisplay() {
        if (this.modCanvas) {
            drawModDisplay(this.modCanvas,
                this.lfoRate.getNormalisedValue(),
                this.lfoAmount.getNormalisedValue()
            );
        }
    }

    

    render() {
        return html`
        <div class="panel">

            <!-- preset editors -->
            <preset-editor></preset-editor>

            <!-- filter controls -->
            <div style="display: flex; flex-direction: row; justify-content: space-between">
                <div style="display: flex; flex-direction: column; justify-content: space-around; align-items: left" >
                    <label style="color: ${ color.lighttan }">Input Filtering</label>
                    <div style="display: flex; flex-direction: row">
                        <label>Cutoff</label>
                        <petal-num-slider juceID="filterCutoff" mode="rate"  style="--numbox-align: right"></petal-num-slider>
                    </div>

                    <div style="display: flex; flex-direction: row">
                        <label>Shape</label>
                        <petal-num-slider juceID="filterShape" suffix=" %"  style="--numbox-align: right"></petal-num-slider>
                    </div>
                </div>
                <canvas id="filterGraph" width="200" height="75" style="width: 200px; height: 75px;"></canvas>
            </div>

            <!-- modulation controls -->
            <div style="display: flex; flex-direction: row; justify-content: space-between">
                <div style="display: flex; flex-direction: column; justify-content: space-around; align-items: left" >
                    <label style="color: ${ color.lighttan }">Modulation</label>
                    <div style="display: flex; flex-direction: row">
                        <label>Rate</label>
                        <petal-num-slider juceID="lfoRate" suffix=" %" mode="rate" style="--numbox-align: right"></petal-num-slider>
                    </div>

                    <div style="display: flex; flex-direction: row">
                        <label>Amount</label>
                        <petal-num-slider juceID="lfoAmount" suffix=" %" style="--numbox-align: right"></petal-num-slider>
                    </div>
                </div>
                <canvas id="modGraph" width="200" height="75" style="width: 200px; height: 75px"></canvas>
            </div>

            <!-- window size -->
            <div style="display: flex; flex-direction: row; justify-content: space-between">
                <label style="color: ${ color.lighttan }">Window Size</label>
                <petal-num-slider juceID="windowSize" suffix=" ms" style="--numbox-align: right"></petal-num-slider>
            </div>



            <!-- volume controls -->
                <label style="color: ${ color.lighttan }">Levels</label>
                <div style="display: flex; flex-direction: row; justify-content: space-between">
                    <div style="display: flex; flex-direction: column; align-items: center">
                        <label>Input</label>
                        <petal-pict-slider juceID="inputLevel" .drawing="${drawSlider}" style="--slider-height: 80px; --slider-width: 45px"></petal-pict-slider>
                        <petal-num-slider juceID="inputLevel" suffix=" dB" mode="db" style="--numbox-align: center"></petal-num-slider>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center">
                        <label>Delay</label>
                        <petal-pict-slider juceID="delayLevel" .drawing="${drawSlider}" style="--slider-height: 80px; --slider-width: 45px"></petal-pict-slider>
                        <petal-num-slider juceID="delayLevel" suffix=" dB" mode="db" style="--numbox-align: center"></petal-num-slider>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center">
                        <label>Reverb</label>
                        <petal-pict-slider juceID="reverbLevel" .drawing="${drawSlider}" style="--slider-height: 80px; --slider-width: 45px"></petal-pict-slider>
                        <petal-num-slider juceID="reverbLevel" suffix=" dB" mode="db" style="--numbox-align: center"></petal-num-slider>
                    </div>

                    <div style="display: flex; flex-direction: column; align-items: center">
                        <label>Dry</label>
                        <petal-pict-slider juceID="dryLevel" .drawing="${drawSlider}" style="--slider-height: 80px; --slider-width: 45px"></petal-pict-slider>
                        <petal-num-slider juceID="dryLevel" suffix=" dB" mode="db" style="--numbox-align: center"></petal-num-slider>
                    </div>
                </div>
        </div>
        `
    }
};

customElements.define('io-editor', IOEditor);