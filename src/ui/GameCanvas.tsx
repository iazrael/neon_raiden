import { useEffect, useRef } from "react";
import { startEngine } from "../engine";

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      startEngine(canvasRef.current);
    }
  }, []);

  return <canvas ref={canvasRef} className="block w-full h-full" />;
}
