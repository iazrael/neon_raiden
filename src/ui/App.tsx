import { useEffect } from 'react';
import { GameCanvas } from './GameCanvas';
import { HUD } from './HUD';
import { useEngine } from './hooks/useEngine';
import { createWorld, setWorldForEngine } from '../engine';
import { spawnPlayer } from '../engine/factory';
import { FIGHTER_LIGHT, BOMBER_HEAVY } from '../engine/blueprints';
import { keys } from '../engine/systems/InputSystem';

function Loading() {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      color: '#fff',
      fontSize: '24px'
    }}>
      Loading...
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
    const shipType = urlParams.get('ship') === 'heavy' ? 'heavy' : 'light';
    
    spawnPlayer(shipType === 'heavy' ? BOMBER_HEAVY : FIGHTER_LIGHT);
    
    // Set up keyboard event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      keys[e.code] = true;
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  if (!snap) return <Loading />;
  
  return (
    <div className="game" style={{ 
      position: 'relative', 
      width: '800px', 
      height: '600px', 
      margin: '0 auto',
      border: '2px solid #333'
    }}>
      <GameCanvas />
      <HUD player={snap.player} />
    </div>
  );
}