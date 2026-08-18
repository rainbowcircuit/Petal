import { LitElement, html, css } from 'lit';
import { getNativeFunction } from '../../juce.js';


export class PresetEditor extends LitElement {
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

        button {
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
            background-color: transparent;
            border-color: transparent;
            cursor: pointer;
        }

        select {
            font-size: 12px;
            font-family: Verdana;
            color: #696969;
            background-color: transparent;
            border-color: transparent;
        }
        `

    constructor(){
        super();
    }

    firstUpdated() {
        this.menu = this.renderRoot.querySelector('select');
        this.loadPreset = getNativeFunction("loadPreset");
        this.getAllPreset = getNativeFunction("getAllPreset");
        this.attemptSave = getNativeFunction("attemptSave");

        if (this.menu) {
            this.menu.addEventListener("change", (e) => this.onSelection(e));
        }

        this.saveButton = this.renderRoot.querySelector('#save');
        if (this.saveButton) {
            this.saveButton.addEventListener('click', () => {
                this.attemptSave()
                    .then(() => this.repopulateMenu()) // list may have changed, rebuild
                    .catch(err => console.error("attemptSave failed:", err));
            });
        }

        this.prevButton = this.renderRoot.querySelector('#prev');
        if (this.prevButton) this.prevButton.addEventListener('click', () => this.nextOrPrev(-1));

        this.nextButton = this.renderRoot.querySelector('#next');
        if (this.nextButton) this.nextButton.addEventListener('click', () => this.nextOrPrev(1));

        this.repopulateMenu();
    }

    async repopulateMenu() {
        if (!this.menu) return;
        this.menu.innerHTML = "";
        const presetList = await this.getAllPreset();
        if (!presetList) return;

        const { presets, currentIndex } = presetList;
        for (let i = 0; i < presets.length; i++) {
            const opt = document.createElement('option');
            opt.value = presets[i];
            opt.textContent = presets[i];
            if (i === currentIndex) opt.selected = true;
            this.menu.appendChild(opt);
        }
    }

    onSelection(e) {
        this.loadPreset(e.target.value);
    }

    async nextOrPrev(direction) {
        const presetList = await this.getAllPreset();
        const presets = presetList?.presets;
        if (!presets || presets.length === 0) return;

        const currentIndex = presetList.currentIndex;
        const nextIndex = currentIndex === -1
            ? (direction === 1 ? 0 : presets.length - 1)
            : ((currentIndex + direction) % presets.length + presets.length) % presets.length;

        await this.loadPreset(presets[nextIndex]);
        this.menu.value = presets[nextIndex]; 
    }

    render()
    {
        return html`
        <div style="display: flex; flex-direction: column; justify-content: center; align-items: left; padding: 0px">
            <div style="display: flex; flex-direction: row; justify-content: center; align-items: left">
                <button id="prev">◀</button>
                <select name="pets" id="menu-container" style="width: 200px"></select>
                <button id="next">▶</button>
                <button id="save">Save</button>
            </div>
        </div>
        `
    }
};

customElements.define('preset-editor', PresetEditor);

