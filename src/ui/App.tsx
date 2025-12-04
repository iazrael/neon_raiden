
import { Engine } from "../engine";
import { Blueprint } from "../engine/blueprints";
import { useEffect, useRef, useState } from "react";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [engine] = useState(() => new Engine());
  const [snap, setSnap] = useState(engine.snapshot$.value);

  useEffect(() => {
    const sub = engine.snapshot$.subscribe(setSnap);
    return () => sub.unsubscribe();
  }, []);

  if (!snap) return null;

  // 选游戏 → 启动
  const startGame = (bp: Blueprint) => {
    engine.start(canvasRef.current!, bp);
  };

  // 暂停 / 继续
  const pause = () => engine.pause();
  const resume = () => engine.resume();

  // 退出 / 重来
  const exit = () => {
    engine.stop();
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden touch-none select-none">
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  );
}
