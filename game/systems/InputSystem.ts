export class InputSystem {
    keys: { [key: string]: boolean } = {};
    touch: { x: number, y: number, active: boolean } = { x: 0, y: 0, active: false };
    lastTouch: { x: number, y: number } = { x: 0, y: 0 };
    touchDelta: { x: number, y: number } = { x: 0, y: 0 };
    canvas: HTMLCanvasElement;

    onAction: ((action: string) => void) | null = null;
    onMouseMove: ((x: number, y: number) => void) | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.bind();
    }

    bind() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'KeyB' || e.code === 'Space') {
                if (this.onAction) this.onAction('bomb_or_fire');
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);

        // Mouse Movement (treated as direct position for now, or we can ignore if we want pure keyboard/touch)
        // The original game used mousemove to set player position directly.
        window.addEventListener('mousemove', (e) => {
            this.touch.x = e.clientX;
            this.touch.y = e.clientY;
            if (this.onMouseMove) this.onMouseMove(e.clientX, e.clientY);
        });

        window.addEventListener('mousedown', () => {
            if (this.onAction) this.onAction('touch_start');
        });

        // Touch
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this.touch.active = true;
            this.lastTouch.x = t.clientX;
            this.lastTouch.y = t.clientY;

            if (this.onAction) this.onAction('touch_start');
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.touch.active) return;
            const t = e.touches[0];

            // Calculate delta
            const dx = t.clientX - this.lastTouch.x;
            const dy = t.clientY - this.lastTouch.y;

            this.touchDelta.x += dx;
            this.touchDelta.y += dy;

            this.lastTouch.x = t.clientX;
            this.lastTouch.y = t.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.touch.active = false;
            if (this.onAction) this.onAction('touch_end');
        });
    }

    // Helper to get movement direction from keys
    getKeyboardVector() {
        let dx = 0;
        let dy = 0;
        if (this.keys['ArrowLeft']) dx -= 1;
        if (this.keys['ArrowRight']) dx += 1;
        if (this.keys['ArrowUp']) dy -= 1;
        if (this.keys['ArrowDown']) dy += 1;
        return { x: dx, y: dy };
    }

    // For mouse/touch absolute positioning
    getPointerPosition() {
        return { x: this.touch.x, y: this.touch.y };
    }

    getTouchDelta() {
        const d = { ...this.touchDelta };
        this.touchDelta = { x: 0, y: 0 };
        return d;
    }
}
