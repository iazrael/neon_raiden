import { GameEngine } from '@/game/GameEngine';
import { GameState } from '@/types';

function createCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  return canvas as HTMLCanvasElement;
}

test('GameEngine start and loop', () => {
  const canvas = createCanvas();
  const engine = new GameEngine(
    canvas,
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    () => {},
    () => {}
  );
  engine.startGame();
  expect(engine.state).toBe(GameState.PLAYING);
  engine.loop(16);
});

