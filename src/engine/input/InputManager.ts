// src/engine/input/InputManager.ts

export class InputManager {
    private static instance: InputManager;
    public static getInstance(): InputManager {
        if (!this.instance) this.instance = new InputManager();
        return this.instance;
    }

    // 状态存储
    private keys: Set<string> = new Set();

    // 指针状态 (鼠标 + 触摸)
    private pointerDelta = { x: 0, y: 0 }; // 本帧位移增量
    private lastPointer = { x: 0, y: 0 };  // 上一次坐标
    private isPointerDown = false;

    // 动作状态
    private _isFiring = false;
    private _isBombing = false;

    private canvas: HTMLCanvasElement | null = null;

    private constructor() { }

    /** 
     * 初始化：必须传入 Canvas 以计算正确的坐标 
     * 在 main.ts 或 React useEffect 中调用
     */
    public init(canvas: HTMLCanvasElement) {
        if (this.canvas) return; // 防止重复绑定
        this.canvas = canvas;

        // --- 键盘监听 ---
        window.addEventListener('keydown', (e) => this.keys.add(e.code));
        window.addEventListener('keyup', (e) => this.keys.delete(e.code));
        window.addEventListener('blur', () => this.resetState());

        // --- 触摸监听 (Touch) ---
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault(); // 防止滚动
            const t = e.touches[0];
            this.startPointer(t.clientX, t.clientY);
        }, { passive: false });

        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.isPointerDown) return;
            const t = e.touches[0];
            this.movePointer(t.clientX, t.clientY);
        }, { passive: false });

        canvas.addEventListener('touchend', () => this.endPointer());

        // --- 鼠标监听 (Mouse) ---
        // 将鼠标按下视为触摸开始，模拟拖拽操作
        canvas.addEventListener('mousedown', (e) => {
            this.startPointer(e.clientX, e.clientY);
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!this.isPointerDown) return;
            this.movePointer(e.clientX, e.clientY);
        });

        canvas.addEventListener('mouseup', () => this.endPointer());
        canvas.addEventListener('mouseleave', () => this.endPointer());
    }

    // --- 内部辅助逻辑 ---

    private startPointer(x: number, y: number) {
        this.isPointerDown = true;
        this.lastPointer.x = x;
        this.lastPointer.y = y;
        this._isFiring = true; // 触摸/点击屏幕通常意味着开火
    }

    private movePointer(x: number, y: number) {
        const dx = x - this.lastPointer.x;
        const dy = y - this.lastPointer.y;

        // 累加位移 (因为一帧内可能触发多次 move 事件)
        this.pointerDelta.x += dx;
        this.pointerDelta.y += dy;

        this.lastPointer.x = x;
        this.lastPointer.y = y;
    }

    private endPointer() {
        this.isPointerDown = false;
        this._isFiring = false;
    }

    private resetState() {
        this.keys.clear();
        this.pointerDelta = { x: 0, y: 0 };
        this.isPointerDown = false;
        this._isFiring = false;
    }

    // ========== 对外接口 (供 InputSystem 使用) ==========

    /** 获取并重置指针位移 (由 System 每帧调用一次) */
    public consumePointerDelta() {
        const delta = { ...this.pointerDelta };
        this.pointerDelta = { x: 0, y: 0 }; // 消费后归零
        return delta;
    }

    /** 获取键盘方向向量 (归一化) */
    public getKeyboardVector() {
        let dx = 0;
        let dy = 0;
        if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) dx -= 1;
        if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) dx += 1;
        if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) dy -= 1;
        if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) dy += 1;
        return { x: dx, y: dy };
    }

    public isFiring() {
        return this.keys.has('Space') || this._isFiring;
    }

    public isBombing() {
        return this.keys.has('KeyB');
    }
}

export const inputManager = InputManager.getInstance();