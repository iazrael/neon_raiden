import { useEffect } from "react";
import { GameCanvas } from "./GameCanvas";
import { HUD } from "./HUD";
import { spawnPlayer } from "../engine/factory";
import { keys } from "../engine/systems/InputSystem";

function Loading() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        color: "#fff",
        fontSize: "24px",
      }}
    >
      Loading...
    </div>
  );
}

// App.tsx
import { Engine } from "@/engine";
import { useSnapshot } from "@/ui/hooks/useSnapshot";
import { GameSnapshot } from "@/ui/types";
import { Blueprint } from "../engine/types";

export default function App() {
  const [engine] = useState(() => new Engine());
  const snapshot = useSnapshot(engine.snapshot$);

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
    // 可选：保存跨局存档
    saveProgress(world.playerLevel, world.coins);
  };

  return (
    <div className="game">
      <canvas id="game" ref={canvasRef} />
      <HUD
        snapshot={snapshot}
        onPause={pause}
        onResume={resume}
        onExit={exit}
      />
    </div>
  );
}

export default function App() {
  const snap = useEngine();

  useEffect(() => {
    // Initialize the world and spawn player
    const world = createWorld();
    setWorldForEngine(world);

    // Get ship type from URL or default to fighter
    const urlParams = new URLSearchParams(window.location.search);
    const shipType = urlParams.get("ship") === "heavy" ? "heavy" : "light";

    spawnPlayer(shipType === "heavy" ? BOMBER_HEAVY : FIGHTER_LIGHT);

    // Set up keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  if (!snap) return <Loading />;

  return (
    <div
      className="game"
      style={{
        position: "relative",
        width: "800px",
        height: "600px",
        margin: "0 auto",
        border: "2px solid #333",
      }}
    >
      <GameCanvas />
      <HUD player={snap.player} />
    </div>
  );
}
