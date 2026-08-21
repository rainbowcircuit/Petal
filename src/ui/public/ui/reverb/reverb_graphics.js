import { LitElement, html, css } from 'lit';
import * as THREE from 'three';
import { Smoothening } from '../components/utility.js';
import { getSliderState } from '../../juce.js';
import { color } from '../shared/drawing.js';

export class ReverbGraphic extends LitElement {

    static properties = {
        width: { type: Number },
        height: { type: Number }, 
    }

    static styles = css`
        #canvas-container {
            position: relative;;
            width: 450px;
            height: 300px;
        }

        #canvas-container > canvas {
            position: absolute;
            top: 0;
            left: 0;
        }
    `

    constructor() {
        super();
        this.width = 450;
        this.height = 300;

        this.reverbLevelMsr = 0.0;

        this.backendListeners = [];
        if (window.__JUCE__) {
            this.backendListeners.push(
                window.__JUCE__.backend.addEventListener("reverbLevelMsr", (values) => { this.reverbLevelMsr = JSON.parse(values); })
            );
        } else {
            console.warn("JUCE backend not found — using placeholder reverb level");
        }
    }

    firstUpdated() {
        this.container = this.renderRoot.querySelector("#canvas-container");
        const resizeObserver = new ResizeObserver(() => {
            if (this.width > 0) {
                resizeObserver.disconnect();
                this.initializeSpace();
            }
        });
        resizeObserver.observe(this.container);

        // Guarded: the reverb tab starts hidden (display:none), so ResizeObserver
        // never fires and initializeSpace()/this.mesh are delayed until the tab is
        // shown. Without this guard, the backend's initial value broadcast (which
        // arrives right at startup, before the mesh exists) would throw here — and
        // since callListeners() has no try/catch, that throw silently aborts the
        // broadcast for every other listener queued after this one, including the
        // reverbDecayTime/reverbSize slider widgets themselves.
        this.onSliderChange = () => {
            if (!this.mesh) return;
            let decay = this.reverbDecaySlider.getNormalisedValue();
            let size = this.reverbSizeSlider.getNormalisedValue();
            size = size * 0.625 + 0.125;

            this.displace(decay);
            this.mesh.material.opacity = size;
        }

        this.reverbDecaySlider = getSliderState("reverbDecayTime");
        this.reverbDecaySlider.valueChangedEvent.addListener(this.onSliderChange);

        this.reverbSizeSlider = getSliderState("reverbSize");
        this.reverbSizeSlider.valueChangedEvent.addListener(this.onSliderChange);
    }

    createTexture(){
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const size = 128;
        canvas.width = size; 
        canvas.height = size;
        ctx.beginPath(); 

        const grad = ctx.createLinearGradient(size/2, 0, size/2, size);
        grad.addColorStop(0, color.orange);
        grad.addColorStop(0.5, color.pink);
        grad.addColorStop(1, color.tan);
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, size, size)
        return canvas;
    }

    initializeSpace() {
        this.scene = new THREE.Scene();

        const r = 4;
        const aspect = this.width / this.height;
        const halfHeight = 1.5;
        const halfWidth = halfHeight * aspect;
        this.camera = new THREE.OrthographicCamera(-halfWidth, halfWidth, halfHeight, -halfHeight); 
        this.camera.position.set(r * -0.5, r * -0.35, r * 0.7);
        this.camera.lookAt(0, 0, 0);

        const grid = this.makeGridLines(3, 1.5, 15, 10);
        grid.rotation.x = Math.PI / 2
        grid.position.set(0, -0.35, 0)
        this.scene.add(grid);


        this.geometry = new THREE.PlaneGeometry(3, 1.5, 128, 24);
        this.pos = this.geometry.attributes.position;
        this.srcPos = this.pos.clone();

        const texture = new THREE.CanvasTexture(this.createTexture());
        texture.colorSpace = THREE.SRGBColorSpace
        const material = new THREE.MeshBasicMaterial({
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,  
            map: texture
        });
        this.mesh = new THREE.Mesh(this.geometry, material);
        this.mesh.renderOrder = 0; 
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.position.y = -0.25
        this.displace(0)
        this.scene.add(this.mesh);

        this.outerMesh = new THREE.Mesh(this.geometry,
            new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide,
                color: color.tan,
                transparent: true,
                opacity: 0.1,
                depthWrite: false, // add
            }));
        this.outerMesh.renderOrder = 1; 
        this.outerMesh.rotation.x = -Math.PI / 2;
        this.scene.add(this.outerMesh);
        this.reverbSmoother = new Smoothening(0.1, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(4)
        this.container.appendChild(this.renderer.domElement);

        // The mesh now exists, so pull the current decay/size values instead of
        // waiting for the next change event (the initial one may have already
        // fired and been missed while the mesh didn't exist yet).
        this.onSliderChange();

        this.animate();
    }

    makeGridLines(width, height, widthSegments, heightSegments){
        const positions = [];
        const halfW = width / 2;
        const halfH = height / 2;
        const stepX = width / widthSegments;
        const stepY = height / heightSegments;

        for (let i = 0; i <= widthSegments; i++) {
            const x = -halfW + i * stepX;
            positions.push(x, -halfH, 0, x, halfH, 0);
        }
        for (let j = 0; j <= heightSegments; j++) {
            const y = -halfH + j * stepY;
            positions.push(-halfW, y, 0, halfW, y, 0);
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ 
            color: color.lightgrey,
            depthWrite: false,
            transparent: true,
            opacity: 0.35,

         }));
    }

    displace(amount = 1) {
        const width = this.geometry.parameters.width;
        const colorAttr = this.geometry.attributes.color;
        const vertexColor = new THREE.Color();

        for (let i = 0; i < this.pos.count; i++) {
            const x = this.srcPos.getX(i);
            const y = this.srcPos.getY(i);
            const z = this.srcPos.getZ(i);

            const u = (x + width / 2) / width;
            const falloffExp = amount + 1;
            const envelope = Math.pow(1 - u, falloffExp);

            const baseFreq = Math.PI * 2 * amount;
            const wave = Math.cos(baseFreq * (1 - envelope) + Math.PI * 2 * x);
            const height = (wave * wave) * 0.5;
            const amplitude = height * envelope;

            this.pos.setXYZ(i, x, y, z + amplitude);
        }
        this.pos.needsUpdate = true;
        this.geometry.computeVertexNormals();
    }
    
    animate() {
        this.reverbSmoother.set(Math.abs(this.reverbLevelMsr));


        this.reverbLevel = this.reverbSmoother.get();
        this.outerMesh.position.y = this.reverbLevel + 0.02;
        this.outerMesh.material.opacity = this.reverbLevel * 0.75

        this.renderer.render(this.scene, this.camera);
        this.raf = requestAnimationFrame(() => this.animate());
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        cancelAnimationFrame(this.raf);
        for (const handle of this.backendListeners) {
            window.__JUCE__.backend.removeEventListener(handle);
        }
        this.renderer?.dispose();
    }

    render() {
        return html`<div id="canvas-container"></div>`;
    }
}

customElements.define('reverb-graphic', ReverbGraphic);
