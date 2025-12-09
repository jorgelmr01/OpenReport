class Component {
    constructor(container) {
        this.container = container;
        this.state = {};
        this.elements = {};
        this.subscriptions = [];

        // Auto-bind methods
        this.render = this.render.bind(this);
        this.mount = this.mount.bind(this);
        this.destroy = this.destroy.bind(this);
    }

    destroy() {
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        this.container.innerHTML = '';
    }

    addSubscription(unsubscribeFn) {
        this.subscriptions.push(unsubscribeFn);
    }

    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.render();
    }

    mount() {
        this.render();
        this.onMount();
    }

    onMount() {
        // Lifecycle hook
    }

    render() {
        // To be implemented by child classes
        // Should update this.container.innerHTML
        // and re-bind events
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }

    // Helper to create elements safely
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }
}
