

export class SpriteGenerator {
  createCanvas(width: number, height: number): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D } {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  // 生成玩家战机 (雷电风格)
  generatePlayer(): HTMLCanvasElement {
    const { canvas, ctx } = this.createCanvas(64, 64);

    ctx.save();
    ctx.translate(32, 32);

    // 机翼
    ctx.fillStyle = '#4a5568';
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(24, 15);
    ctx.lineTo(24, 25);
    ctx.lineTo(8, 10);
    ctx.lineTo(-8, 10);
    ctx.lineTo(-24, 25);
    ctx.lineTo(-24, 15);
    ctx.closePath();
    ctx.fill();

    // 机身
    const grad = ctx.createLinearGradient(-10, 0, 10, 0);
    grad.addColorStop(0, '#2d3748');
    grad.addColorStop(0.5, '#a0aec0');
    grad.addColorStop(1, '#2d3748');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.bezierCurveTo(8, -10, 8, 20, 0, 28);
    ctx.bezierCurveTo(-8, 20, -8, -10, 0, -30);
    ctx.fill();

    // 驾驶舱
    ctx.fillStyle = '#0bc5ea';
    ctx.shadowColor = '#0bc5ea';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.ellipse(0, -5, 3, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 细节线条
    ctx.strokeStyle = '#63b3ed';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-24, 15); ctx.lineTo(-8, 10);
    ctx.moveTo(24, 15); ctx.lineTo(8, 10);
    ctx.stroke();

    // 尾翼
    ctx.fillStyle = '#2d3748';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.lineTo(8, 28);
    ctx.lineTo(-8, 28);
    ctx.fill();

    ctx.restore();
    return canvas;
  }

  // 僚机/浮游炮
  generateOption(): HTMLCanvasElement {
    const { canvas, ctx } = this.createCanvas(32, 32);
    ctx.translate(16, 16);

    ctx.shadowBlur = 5;
    ctx.shadowColor = '#00ffff';
    ctx.fillStyle = '#111';
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.moveTo(-12, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();

    return canvas;
  }

  // 生成敌人
  generateEnemy(type: number): HTMLCanvasElement {
    const size = (type === 2 || type === 4) ? 80 : 48;
    const { canvas, ctx } = this.createCanvas(size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);

    if (type === 0) { // 杂兵：红色无人机
      ctx.fillStyle = '#c53030';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(15, -10);
      ctx.lineTo(0, -5);
      ctx.lineTo(-15, -10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#feb2b2';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 1) { // 快速：紫色飞翼
      ctx.rotate(Math.PI);
      ctx.fillStyle = '#805ad5';
      ctx.beginPath();
      ctx.moveTo(0, -20);
      ctx.bezierCurveTo(15, -10, 20, 10, 0, 20);
      ctx.bezierCurveTo(-20, 10, -15, -10, 0, -20);
      ctx.fill();
      ctx.strokeStyle = '#d6bcfa';
      ctx.lineWidth = 2;
      ctx.stroke();

    } else if (type === 2) { // 坦克/重型：绿色
      // Chassis
      ctx.fillStyle = '#276749';
      ctx.fillRect(-25, -30, 50, 60);
      // Treads
      ctx.fillStyle = '#22543d';
      ctx.fillRect(-35, -35, 10, 70);
      ctx.fillRect(25, -35, 10, 70);
      // Turret
      ctx.fillStyle = '#48bb78';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      // Cannon
      ctx.fillStyle = '#2f855a';
      ctx.fillRect(-5, 10, 10, 30);
      // Detail
      ctx.fillStyle = '#9ae6b4';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 3) { // 自爆机：橙色尖刺 (Spiked Mine)
      ctx.fillStyle = '#c05621';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      // Spikes
      ctx.fillStyle = '#ed8936';
      for (let i = 0; i < 8; i++) {
        const angle = i * Math.PI / 4;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        ctx.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25);
        ctx.lineTo(Math.cos(angle + 0.2) * 18, Math.sin(angle + 0.2) * 18);
        ctx.fill();
      }
      // Core
      ctx.fillStyle = '#fbd38d';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();

    } else if (type === 4) { // 精英炮舰：蓝色
      ctx.fillStyle = '#2b6cb0';
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(30, -10);
      ctx.lineTo(10, -30);
      ctx.lineTo(-10, -30);
      ctx.lineTo(-30, -10);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#63b3ed';
      ctx.beginPath();
      ctx.rect(-25, -5, 10, 20); // Guns
      ctx.rect(15, -5, 10, 20);
      ctx.fill();
    } else if (type === 5) { // Type 5: Laser Interceptor (Sleek, White/Cyan)
      ctx.rotate(Math.PI);
      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(15, 15);
      ctx.lineTo(0, 5);
      ctx.lineTo(-15, 15);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#0bc5ea';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -25);
      ctx.lineTo(0, 5);
      ctx.stroke();

      // Glowing core
      ctx.shadowColor = '#0bc5ea';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#0bc5ea';
      ctx.beginPath();
      ctx.arc(0, -5, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

    } else if (type === 6) { // Type 6: Mine Layer (Bulky, Dark Grey/Yellow)
      // Main Body
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(-30, -20);
      ctx.lineTo(30, -20);
      ctx.lineTo(40, 0);
      ctx.lineTo(30, 20);
      ctx.lineTo(-30, 20);
      ctx.lineTo(-40, 0);
      ctx.closePath();
      ctx.fill();

      // Armor Plates
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(-20, -15, 40, 30);

      // Mine Rack / Warning Stripes
      ctx.fillStyle = '#ecc94b';
      ctx.beginPath();
      ctx.moveTo(-15, -10); ctx.lineTo(-5, 10); ctx.lineTo(-10, 10); ctx.lineTo(-20, -10);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5, -10); ctx.lineTo(15, 10); ctx.lineTo(10, 10); ctx.lineTo(0, -10);
      ctx.fill();

      // Rear Mine Port
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.arc(0, 20, 8, Math.PI, 0);
      ctx.fill();
    }

    ctx.restore();
    return canvas;
  }

  createSvgImage(svgContent: string, width: number, height: number): HTMLImageElement {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.width = width;
    img.height = height;
    img.src = url;
    return img;
  }

  // 生成 Boss - All redesigned with complex, unique visuals using SVG
  generateBoss(level: number): HTMLImageElement | HTMLCanvasElement {
    const size = 160 + (level * 20);

    // Helper to wrap SVG content
    const wrapSvg = (content: string) => `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4a5568;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#a0aec0;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2d3748;stop-opacity:1" />
          </linearGradient>
        </defs>
        <g transform="translate(${size / 2}, ${size / 2})">
          ${content}
        </g>
      </svg>
    `;

    let svgContent = '';

    // Level 1: Drone Carrier - Blue carrier with drone bays
    if (level === 1) {
      svgContent = `
        <!-- Main Hull -->
        <rect x="-60" y="-80" width="120" height="160" rx="10" fill="#1a365d" stroke="#2b6cb0" stroke-width="4"/>
        
        <!-- Drone Bays -->
        <g fill="#2c5282" stroke="#4299e1" stroke-width="2">
          <rect x="-50" y="-60" width="30" height="40" />
          <rect x="20" y="-60" width="30" height="40" />
          <rect x="-50" y="20" width="30" height="40" />
          <rect x="20" y="20" width="30" height="40" />
        </g>

        <!-- Central Core -->
        <circle cx="0" cy="0" r="25" fill="#3182ce" filter="url(#glow)" />
        <circle cx="0" cy="0" r="15" fill="#63b3ed" />
        
        <!-- Details -->
        <path d="M-10 -80 L-10 80 M10 -80 L10 80" stroke="#4299e1" stroke-width="2" opacity="0.5"/>
      `;
    }

    // Level 2: Assault Cruiser - Military vessel with turrets
    else if (level === 2) {
      svgContent = `
        <!-- Main Body -->
        <path d="M0 -90 L40 -40 L40 80 L-40 80 L-40 -40 Z" fill="#2d3748" stroke="#4a5568" stroke-width="3"/>
        
        <!-- Bridge -->
        <path d="M-15 40 L15 40 L20 70 L-20 70 Z" fill="#4a5568" />
        <rect x="-10" y="50" width="20" height="10" fill="#0bc5ea" filter="url(#glow)" />

        <!-- Turrets -->
        <g fill="#718096" stroke="#2d3748">
          <circle cx="-25" cy="-20" r="12" />
          <rect x="-28" y="-40" width="6" height="25" />
          
          <circle cx="25" cy="-20" r="12" />
          <rect x="22" y="-40" width="6" height="25" />
          
          <circle cx="0" cy="10" r="15" />
          <rect x="-4" y="-15" width="8" height="30" />
        </g>
      `;
    }

    // Level 3: Heavy Battleship - Armored warship
    else if (level === 3) {
      svgContent = `
        <!-- Heavy Armor Plates -->
        <path d="M-50 -80 L50 -80 L60 0 L50 80 L-50 80 L-60 0 Z" fill="#1a202c" stroke="#4a5568" stroke-width="4"/>
        <rect x="-40" y="-70" width="80" height="140" fill="#2d3748" rx="5" />
        
        <!-- Engine Glow -->
        <path d="M-30 80 L-40 100 L-20 100 Z" fill="#f56565" filter="url(#glow)" />
        <path d="M30 80 L20 100 L40 100 Z" fill="#f56565" filter="url(#glow)" />

        <!-- Cannons -->
        <g fill="#718096">
          <rect x="-10" y="-60" width="20" height="60" />
          <rect x="-45" y="-20" width="15" height="40" />
          <rect x="30" y="-20" width="15" height="40" />
        </g>
        
        <!-- Red Accents -->
        <circle cx="0" cy="0" r="10" fill="#c53030" filter="url(#glow)" />
      `;
    }

    // Level 4: Stealth Fighter - Angular stealth design
    else if (level === 4) {
      svgContent = `
        <!-- Stealth Body -->
        <path d="M0 -90 L60 40 L0 70 L-60 40 Z" fill="#171923" stroke="#0bc5ea" stroke-width="2"/>
        
        <!-- Inner Detail -->
        <path d="M0 -50 L30 20 L0 40 L-30 20 Z" fill="#2d3748" opacity="0.8"/>
        
        <!-- Cockpit -->
        <path d="M0 0 L10 20 L0 30 L-10 20 Z" fill="#0bc5ea" filter="url(#glow)" />
        
        <!-- Engine Trails -->
        <path d="M-40 40 L-50 60" stroke="#0bc5ea" stroke-width="2" stroke-dasharray="5,5"/>
        <path d="M40 40 L50 60" stroke="#0bc5ea" stroke-width="2" stroke-dasharray="5,5"/>
      `;
    }

    // Level 5: Energy Fortress - Purple crystal structure
    else if (level === 5) {
      svgContent = `
        <!-- Hexagonal Base -->
        <path d="M0 -80 L70 -40 L70 40 L0 80 L-70 40 L-70 -40 Z" fill="#44337a" stroke="#805ad5" stroke-width="3"/>
        
        <!-- Inner Crystal -->
        <path d="M0 -50 L43 -25 L43 25 L0 50 L-43 25 L-43 -25 Z" fill="#6b46c1" opacity="0.8"/>
        
        <!-- Energy Core -->
        <circle cx="0" cy="0" r="20" fill="#d6bcfa" filter="url(#glow)">
          <animate attributeName="r" values="20;25;20" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <!-- Nodes -->
        <g fill="#9f7aea" filter="url(#glow)">
          <circle cx="0" cy="-80" r="8" />
          <circle cx="70" cy="-40" r="8" />
          <circle cx="70" cy="40" r="8" />
          <circle cx="0" cy="80" r="8" />
          <circle cx="-70" cy="40" r="8" />
          <circle cx="-70" cy="-40" r="8" />
        </g>
      `;
    }

    // Level 6: Gemini Twins - Two interconnected ships
    else if (level === 6) {
      svgContent = `
        <!-- Energy Link -->
        <rect x="-50" y="-10" width="100" height="20" fill="#4299e1" opacity="0.6" filter="url(#glow)">
          <animate attributeName="opacity" values="0.4;0.8;0.4" dur="1s" repeatCount="indefinite" />
        </rect>

        <!-- Left Ship -->
        <g transform="translate(-60, 0)">
          <path d="M-20 -50 L20 -50 L30 40 L-30 40 Z" fill="#2c5282" stroke="#63b3ed" stroke-width="2"/>
          <circle cx="0" cy="0" r="10" fill="#0bc5ea" filter="url(#glow)"/>
          <rect x="-5" y="-60" width="10" height="30" fill="#90cdf4" />
        </g>

        <!-- Right Ship -->
        <g transform="translate(60, 0)">
          <path d="M-20 -50 L20 -50 L30 40 L-30 40 Z" fill="#2c5282" stroke="#63b3ed" stroke-width="2"/>
          <circle cx="0" cy="0" r="10" fill="#0bc5ea" filter="url(#glow)"/>
          <rect x="-5" y="-60" width="10" height="30" fill="#90cdf4" />
        </g>
      `;
    }

    // Level 7: Triangle Fortress - Triangle with laser arrays
    else if (level === 7) {
      svgContent = `
        <!-- Main Triangle -->
        <path d="M0 -90 L80 50 L-80 50 Z" fill="#742a2a" stroke="#c53030" stroke-width="4"/>
        
        <!-- Inner Structure -->
        <path d="M0 -50 L40 20 L-40 20 Z" fill="#9b2c2c" />
        
        <!-- Laser Arrays -->
        <g fill="#fc8181" filter="url(#glow)">
          <circle cx="0" cy="-90" r="10" />
          <circle cx="80" cy="50" r="10" />
          <circle cx="-80" cy="50" r="10" />
        </g>
        
        <!-- Core -->
        <circle cx="0" cy="10" r="15" fill="#fff5f5" filter="url(#glow)" />
      `;
    }

    // Level 8: Spider Mech - Mechanical spider
    else if (level === 8) {
      svgContent = `
        <!-- Legs -->
        <g stroke="#805ad5" stroke-width="4" fill="none">
          <path d="M-20 -20 L-60 -60" />
          <path d="M20 -20 L60 -60" />
          <path d="M-25 0 L-70 0" />
          <path d="M25 0 L70 0" />
          <path d="M-20 20 L-60 60" />
          <path d="M20 20 L60 60" />
          <path d="M0 -30 L0 -70" />
          <path d="M0 30 L0 70" />
        </g>
        
        <!-- Body -->
        <circle cx="0" cy="0" r="35" fill="#44337a" stroke="#b794f4" stroke-width="3"/>
        
        <!-- Eyes -->
        <g fill="#f56565" filter="url(#glow)">
          <circle cx="-10" cy="-10" r="5" />
          <circle cx="10" cy="-10" r="5" />
          <circle cx="0" cy="10" r="8" />
        </g>
      `;
    }

    // Level 9: Ring Core - Rotating ring
    else if (level === 9) {
      svgContent = `
        <!-- Outer Ring -->
        <circle cx="0" cy="0" r="70" fill="none" stroke="#c53030" stroke-width="8" stroke-dasharray="20,10">
           <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="10s" repeatCount="indefinite"/>
        </circle>
        
        <!-- Inner Ring -->
        <circle cx="0" cy="0" r="50" fill="none" stroke="#e53e3e" stroke-width="6" stroke-dasharray="10,10">
           <animateTransform attributeName="transform" type="rotate" from="360 0 0" to="0 0 0" dur="8s" repeatCount="indefinite"/>
        </circle>

        <!-- Core -->
        <circle cx="0" cy="0" r="25" fill="#fff" filter="url(#glow)" />
        
        <!-- Emitters -->
        <g fill="#63b3ed">
          <circle cx="0" cy="-70" r="6" />
          <circle cx="70" cy="0" r="6" />
          <circle cx="0" cy="70" r="6" />
          <circle cx="-70" cy="0" r="6" />
        </g>
      `;
    }

    // Level 10: Final Demon - Demon mechanical form
    else if (level === 10) {
      svgContent = `
        <!-- Horns -->
        <path d="M-30 -60 Q-60 -90 -40 -30" stroke="#742a2a" stroke-width="8" fill="none"/>
        <path d="M30 -60 Q60 -90 40 -30" stroke="#742a2a" stroke-width="8" fill="none"/>

        <!-- Head/Body -->
        <path d="M0 -70 L40 -30 L30 60 L0 80 L-30 60 L-40 -30 Z" fill="#1a202c" stroke="#9b2c2c" stroke-width="3"/>
        
        <!-- Face Details -->
        <path d="M-20 -20 L-10 0 L-30 0 Z" fill="#f56565" filter="url(#glow)"/>
        <path d="M20 -20 L30 0 L10 0 Z" fill="#f56565" filter="url(#glow)"/>
        
        <!-- Core -->
        <circle cx="0" cy="30" r="15" fill="#9f1239" filter="url(#glow)">
          <animate attributeName="r" values="15;18;15" dur="0.5s" repeatCount="indefinite" />
        </circle>

        <!-- Wings/Weapons -->
        <path d="M-40 -30 L-80 0 L-50 40" stroke="#742a2a" stroke-width="4" fill="none"/>
        <path d="M40 -30 L80 0 L50 40" stroke="#742a2a" stroke-width="4" fill="none"/>
      `;
    }

    return this.createSvgImage(wrapSvg(svgContent), size, size);
  }

  // 生成子弹
  generateBullet(type: 'vulcan' | 'laser' | 'missile' | 'wave' | 'plasma' | 'enemy_orb' | 'enemy_beam' | 'tesla' | 'magma' | 'shuriken'): HTMLCanvasElement {
    let w = 0, h = 0;

    if (type === 'vulcan') { w = 16; h = 32; }
    else if (type === 'laser') { w = 24; h = 64; }
    else if (type === 'missile') { w = 24; h = 48; }
    else if (type === 'wave') { w = 64; h = 32; }
    else if (type === 'plasma') { w = 48; h = 48; }
    else if (type === 'enemy_orb') { w = 32; h = 32; }
    else if (type === 'tesla') { w = 32; h = 32; }
    else if (type === 'magma') { w = 32; h = 32; }
    else if (type === 'shuriken') { w = 32; h = 32; }
    else { w = 32; h = 32; }

    const { canvas, ctx } = this.createCanvas(w, h);
    ctx.translate(w / 2, h / 2);

    if (type === 'vulcan') {
      ctx.shadowBlur = 5;
      ctx.shadowColor = '#ecc94b';
      ctx.fillStyle = '#ffeb3b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 10, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'laser') {
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#4fd1c5';
      ctx.fillStyle = '#e6fffa';
      ctx.fillRect(-4, -25, 8, 50);
    } else if (type === 'missile') {
      ctx.fillStyle = '#9f7aea';
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(5, 5);
      ctx.lineTo(0, 10);
      ctx.lineTo(-5, 5);
      ctx.fill();
      ctx.fillStyle = '#ed8936';
      ctx.beginPath();
      ctx.arc(0, 12, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'wave') {
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#4299e1';
      ctx.fillStyle = '#63b3ed';
      ctx.beginPath();
      ctx.arc(0, 10, 30, Math.PI * 1.2, Math.PI * 1.8);
      ctx.fill();
    } else if (type === 'plasma') {
      const grad = ctx.createRadialGradient(0, 0, 5, 0, 0, 20);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.4, '#ed64a6');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 8, Math.PI / 4, 0, Math.PI * 2);
      ctx.stroke();
    } else if (type === 'enemy_orb') {
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 10);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.5, '#f56565');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'tesla') {
      ctx.strokeStyle = '#63b3ed';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#63b3ed';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -15);
      // Zigzag lightning
      for (let i = 0; i < 4; i++) {
        ctx.lineTo(i % 2 === 0 ? 5 : -5, -15 + (i + 1) * 8);
      }
      ctx.stroke();
    } else if (type === 'magma') {
      const grad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
      grad.addColorStop(0, '#fff');
      grad.addColorStop(0.3, '#f6e05e');
      grad.addColorStop(0.6, '#ed8936');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'shuriken') {
      ctx.fillStyle = '#a0aec0';
      ctx.beginPath();
      // 4-pointed star
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2;
        ctx.lineTo(Math.cos(angle) * 15, Math.sin(angle) * 15);
        ctx.lineTo(Math.cos(angle + Math.PI / 4) * 5, Math.sin(angle + Math.PI / 4) * 5);
      }
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }

    return canvas;
  }

  // 生成掉落物，现在包含内部图标
  generatePowerup(type: number): HTMLCanvasElement {
    const { canvas, ctx } = this.createCanvas(40, 40);

    let color = '#fff';
    let icon: HTMLCanvasElement | null = null;
    let label = '';

    // 0:Power, 1:Laser, 2:Vulcan, 3:Heal/Shield, 4:Wave, 5:Plasma, 6:Bomb, 7:Option
    switch (type) {
      case 0: color = '#ecc94b'; label = 'P'; break;
      case 1: color = '#4fd1c5'; icon = this.generateBullet('laser'); break;
      case 2: color = '#ed8936'; icon = this.generateBullet('vulcan'); break;
      case 3: color = '#48bb78'; label = 'H'; break;
      case 4: color = '#63b3ed'; icon = this.generateBullet('wave'); break;
      case 5: color = '#ed64a6'; icon = this.generateBullet('plasma'); break;
      case 6: color = '#f56565'; label = 'B'; break; // Bomb
      case 7: color = '#a0aec0'; label = 'O'; break; // Option
      case 8: color = '#63b3ed'; icon = this.generateBullet('tesla'); break; // Tesla
      case 9: color = '#ed8936'; icon = this.generateBullet('magma'); break; // Magma (Fire)
      case 10: color = '#a0aec0'; icon = this.generateBullet('shuriken'); break; // Shuriken
    }

    ctx.translate(20, 20);

    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 5);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    if (icon) {
      ctx.save();
      // Scale down icon to fit
      ctx.scale(0.6, 0.6);
      // Center icon
      ctx.drawImage(icon, -icon.width / 2, -icon.height / 2);
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 1);
    }

    return canvas;
  }
}
