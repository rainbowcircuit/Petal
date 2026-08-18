export class Smoothening {
    #previous = 0;
    constructor(factor, initial = 0, releaseFactor = factor) {
        this.factor = factor;
        this.releaseFactor = releaseFactor;
        this.#previous = initial;
        this.target = initial;
    }

    set(value) { this.target = value; }

    get() {
        const factor = this.target < this.#previous ? this.releaseFactor : this.factor;
        this.#previous += (this.target - this.#previous) * factor;
        return this.#previous;
    }
}
