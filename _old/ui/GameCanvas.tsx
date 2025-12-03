import { useEffect, useRef } from 'react';
import { startEngine } from '../engine';

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (canvasRef.current) {
      startEngine(canvasRef.current);
    }
  }, []);
  
  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{ border: '1px solid #333', background: '#000' }}
    />
  );
}