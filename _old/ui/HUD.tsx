import { GameSnapshot } from '../engine/types';

interface BarProps {
  label: string;
  cur: number;
  max: number;
  color: string;
}

function Bar({ label, cur, max, color }: BarProps) {
  const percentage = max > 0 ? (cur / max) * 100 : 0;
  
  return (
    <div style={{ margin: '4px 0' }}>
      <div style={{ fontSize: '12px', color: '#fff' }}>{label}: {cur}/{max}</div>
      <div style={{ 
        width: '200px', 
        height: '16px', 
        background: '#333', 
        border: '1px solid #555',
        position: 'relative' 
      }}>
        <div 
          style={{ 
            width: `${percentage}%`, 
            height: '100%', 
            background: color,
            transition: 'width 0.2s ease'
          }} 
        />
      </div>
    </div>
  );
}

interface HUDProps {
  player: GameSnapshot['player'];
}

export function HUD({ player }: HUDProps) {
  return (
    <div className="hud" style={{ 
      position: 'absolute', 
      top: '10px', 
      left: '10px', 
      background: 'rgba(0,0,0,0.7)', 
      padding: '10px',
      borderRadius: '4px',
      color: '#fff'
    }}>
      <Bar label="HP" cur={player.hp} max={player.maxHp} color="#f66" />
      <Bar label="Shield" cur={player.shield} max={100} color="#0af" />
      <div style={{ fontSize: '12px', marginTop: '8px' }}>
        Ammo: {player.ammo}/{player.maxAmmo}
      </div>
      <div style={{ fontSize: '12px' }}>
        Position: ({Math.round(player.x)}, {Math.round(player.y)})
      </div>
    </div>
  );
}