import { h, render, Component } from 'preact';
class XFrame extends HTMLElement {
    static get observedAttributes() {
        return ['src'];
    }

    // x-frame ready state
    // 0: instance node initiated
    // 1: instance node connected to document
    // 2: component loaded
    // 3: component rendered
    #readyState;

    // component mount point
    #mountPoint;

    // react component class
    #component;

    // component instance props
    #props;

    // is component waiting to render
    #pending;

    constructor() {
        super();

        this.#readyState = 0;
        this.#mountPoint = document.createElement('div');
        this.#component = null;
        this.#props = null;
        this.#pending = false;

        this.attachShadow({ mode: 'open' });
        this.shadowRoot.appendChild(this.#mountPoint);
    }

    attributeChangedCallback(name) {
        if (name === 'src') {
            this.#load();
        }
    }

    connectedCallback() {
        this.#readyState = 1;
        this.#load();
    }

    disconnectedCallback() {
        this.#readyState = 0;
    }

    get src() {
        return this.getAttribute('src');
    }

    set src(value) {
        this.setAttribute('src', value);
    }

    // re-render component with new props
    update(props) {
        props = props || this.#props;
        this.#props = props;

        if (this.#readyState < 2) { // component has not loaded
            this.#pending = true;
        } else {
            this.#pending = false;
            render(h(this.#component, this.#props, null), this.#mountPoint);
            this.#readyState = 3;
        }
    }

    #load() {
        if (this.#readyState >= 1) { // load component after instance node connected to document
            this.#readyState = 1;

            if (this.src) {
                let loader = document.createElement('script');
                loader.src = this.src;

                loader.onload = function () {
                    this.shadowRoot.removeChild(loader);
                    this.#component = window.__X_COMPONENT__(h, Component);
                    this.#readyState = 2;

                    if (!this.hasAttribute('defer') || this.#pending) {
                        this.update();
                    }
                }.bind(this);

                loader.onerror = function (e) {
                    this.shadowRoot.removeChild(loader);
                    throw new URIError(`The script ${e.target.src} didn't load correctly.`);
                }.bind(this);

                this.shadowRoot.appendChild(loader);
            }
        }
    }
}

customElements.define('x-frame', XFrame);