

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

  // 生成 Boss - All redesigned with complex, unique visuals
  generateBoss(level: number): HTMLCanvasElement {
    const size = 160 + (level * 20);
    const { canvas, ctx } = this.createCanvas(size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate(Math.PI);

    // Level 1: Drone Carrier - Carrier ship with drone bays
    if (level === 1) {
      // Main hull
      ctx.fillStyle = '#1a365d';
      ctx.beginPath();
      ctx.moveTo(-50, -30);
      ctx.lineTo(50, -30);
      ctx.lineTo(60, 30);
      ctx.lineTo(-60, 30);
      ctx.closePath();
      ctx.fill();

      // Armor plating
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(-40, -20, 80, 40);

      // Drone bays (glowing)
      ctx.fillStyle = '#3182ce';
      for (let i = -1; i <= 1; i++) {
        ctx.fillRect(i * 25 - 5, -10, 10, 20);
      }

      // Core
      ctx.fillStyle = '#63b3ed';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#63b3ed';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 2: Assault Cruiser - Military vessel with turrets
    if (level === 2) {
      // Main body
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(40, 0);
      ctx.lineTo(30, 50);
      ctx.lineTo(-30, 50);
      ctx.lineTo(-40, 0);
      ctx.closePath();
      ctx.fill();

      // Turrets
      ctx.fillStyle = '#4a5568';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 30, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Gun barrels
        ctx.fillStyle = '#718096';
        ctx.fillRect(i * 30 - 3, 10, 6, 25);
      }

      // Bridge
      ctx.fillStyle = '#0bc5ea';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#0bc5ea';
      ctx.fillRect(-15, -30, 30, 20);
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 3: Heavy Battleship - Armored warship
    if (level === 3) {
      // Hull
      ctx.fillStyle = '#1a202c';
      ctx.fillRect(-60, -40, 120, 80);

      // Armor layers
      ctx.fillStyle = '#2d3748';
      ctx.fillRect(-50, -35, 100, 70);
      ctx.fillStyle = '#4a5568';
      ctx.fillRect(-40, -30, 80, 60);

      // Main cannon
      ctx.fillStyle = '#718096';
      ctx.fillRect(-8, 20, 16, 50);

      // Side cannons
      for (let i = -1; i <= 1; i += 2) {
        ctx.fillRect(i * 40 - 4, 10, 8, 30);
      }

      // Engine glow
      ctx.fillStyle = '#f56565';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f56565';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(i * 25, -30, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 4: Stealth Fighter - Angular stealth design
    if (level === 4) {
      // Stealth body
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(50, -20);
      ctx.lineTo(60, 40);
      ctx.lineTo(0, 50);
      ctx.lineTo(-60, 40);
      ctx.lineTo(-50, -20);
      ctx.closePath();
      ctx.fill();

      // Angular panels
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(40, -15);
      ctx.lineTo(0, 0);
      ctx.lineTo(-40, -15);
      ctx.closePath();
      ctx.fill();

      // Stealth coating highlights
      ctx.strokeStyle = '#4a5568';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-50, -20);
      ctx.lineTo(0, -60);
      ctx.lineTo(50, -20);
      ctx.stroke();

      // Cockpit
      ctx.fillStyle = '#0bc5ea';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#0bc5ea';
      ctx.beginPath();
      ctx.ellipse(0, -20, 12, 18, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 5: Energy Fortress - Crystalline structure
    if (level === 5) {
      // Crystal core
      ctx.fillStyle = '#805ad5';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? 60 : 40;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Energy layers
      ctx.fillStyle = '#9f7aea';
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const r = i % 2 === 0 ? 45 : 30;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();

      // Central core
      ctx.fillStyle = '#d6bcfa';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#d6bcfa';
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Energy nodes
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        ctx.fillStyle = '#e9d8fd';
        ctx.beginPath();
        ctx.arc(Math.cos(angle) * 50, Math.sin(angle) * 50, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      return canvas;
    }

    // Level 6: Gemini Twins - Two interconnected ships with laser cannons
    if (level === 6) {
      // Ship 1 (Left)
      ctx.fillStyle = '#2c5282';
      ctx.beginPath();
      ctx.moveTo(-60, -40);
      ctx.lineTo(-30, -40);
      ctx.lineTo(-20, 50);
      ctx.lineTo(-70, 50);
      ctx.closePath();
      ctx.fill();

      // Ship 2 (Right)
      ctx.beginPath();
      ctx.moveTo(60, -40);
      ctx.lineTo(30, -40);
      ctx.lineTo(20, 50);
      ctx.lineTo(70, 50);
      ctx.closePath();
      ctx.fill();

      // Connector bridge
      ctx.fillStyle = '#1a365d';
      ctx.fillRect(-40, -15, 80, 30);

      // Laser cannons
      ctx.fillStyle = '#0bc5ea';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0bc5ea';
      for (let i = -1; i <= 1; i += 2) {
        ctx.fillRect(i * 45 - 3, 20, 6, 35);
        ctx.beginPath();
        ctx.arc(i * 45, 15, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Bridge core
      ctx.fillStyle = '#63b3ed';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#63b3ed';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 7: Triangle Fortress - Three-sided fortress with laser arrays
    if (level === 7) {
      // Main triangle body
      ctx.fillStyle = '#c05621';
      ctx.beginPath();
      ctx.moveTo(0, -70);
      ctx.lineTo(70, 50);
      ctx.lineTo(-70, 50);
      ctx.closePath();
      ctx.fill();

      // Inner triangle
      ctx.fillStyle = '#9c4221';
      ctx.beginPath();
      ctx.moveTo(0, -50);
      ctx.lineTo(50, 35);
      ctx.lineTo(-50, 35);
      ctx.closePath();
      ctx.fill();

      // Laser arrays on each edge
      ctx.fillStyle = '#f56565';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#f56565';
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * 45;
        const y = Math.sin(angle) * 45;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Central core
      ctx.fillStyle = '#fed7d7';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#fed7d7';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 8: Spider Mech - Mechanical spider with laser legs
    if (level === 8) {
      // Central body
      ctx.fillStyle = '#553c9a';
      ctx.beginPath();
      ctx.arc(0, 0, 45, 0, Math.PI * 2);
      ctx.fill();

      // Armor plating
      ctx.fillStyle = '#6b46c1';
      ctx.beginPath();
      ctx.arc(0, 0, 35, 0, Math.PI * 2);
      ctx.fill();

      // Laser legs (8 legs)
      ctx.strokeStyle = '#9f7aea';
      ctx.lineWidth = 10;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#9f7aea';
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const x1 = Math.cos(angle) * 45;
        const y1 = Math.sin(angle) * 45;
        const x2 = Math.cos(angle) * 90;
        const y2 = Math.sin(angle) * 90;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Leg joints
        ctx.fillStyle = '#d6bcfa';
        ctx.beginPath();
        ctx.arc(x2, y2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Core eye
      ctx.fillStyle = '#f56565';
      ctx.shadowBlur = 20;
      ctx.shadowColor = '#f56565';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore();
      return canvas;
    }

    // Level 9: Ring Core - Rotating ring structure with laser emitters
    if (level === 9) {
      // Outer ring
      ctx.strokeStyle = '#c53030';
      ctx.lineWidth = 25;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Middle ring
      ctx.strokeStyle = '#e53e3e';
      ctx.lineWidth = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 70, 0, Math.PI * 2);
      ctx.stroke();

      // Laser emitters around ring
      ctx.fillStyle = '#0bc5ea';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0bc5ea';
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const x = Math.cos(angle) * 70;
        const y = Math.sin(angle) * 70;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Central core
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#fff';
      ctx.beginPath();
      ctx.arc(0, 0, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner core detail
      ctx.fillStyle = '#feb2b2';
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    // Level 10: Final Demon - Demonic mechanical form with multiple laser systems
    if (level === 10) {
      // Main demon body
      ctx.fillStyle = '#1a202c';
      ctx.beginPath();
      ctx.moveTo(0, -90);
      ctx.lineTo(70, -50);
      ctx.lineTo(50, 70);
      ctx.lineTo(0, 90);
      ctx.lineTo(-50, 70);
      ctx.lineTo(-70, -50);
      ctx.closePath();
      ctx.fill();

      // Demon armor
      ctx.strokeStyle = '#742a2a';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Inner body
      ctx.fillStyle = '#2d3748';
      ctx.beginPath();
      ctx.moveTo(0, -70);
      ctx.lineTo(50, -35);
      ctx.lineTo(35, 50);
      ctx.lineTo(0, 70);
      ctx.lineTo(-35, 50);
      ctx.lineTo(-50, -35);
      ctx.closePath();
      ctx.fill();

      // Demon eyes (laser emitters)
      ctx.fillStyle = '#f56565';
      ctx.shadowBlur = 25;
      ctx.shadowColor = '#f56565';
      ctx.beginPath();
      ctx.arc(-25, -30, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(25, -30, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Laser weapon mounts
      ctx.fillStyle = '#0bc5ea';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#0bc5ea';
      for (let i = -1; i <= 1; i += 2) {
        ctx.fillRect(i * 55 - 4, 0, 8, 40);
        ctx.beginPath();
        ctx.arc(i * 55, -5, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Central core
      ctx.fillStyle = '#9f1239';
      ctx.shadowBlur = 30;
      ctx.shadowColor = '#9f1239';
      ctx.beginPath();
      ctx.arc(0, 0, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Demon horns
      ctx.fillStyle = '#742a2a';
      ctx.beginPath();
      ctx.moveTo(-40, -70);
      ctx.lineTo(-50, -90);
      ctx.lineTo(-35, -75);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(40, -70);
      ctx.lineTo(50, -90);
      ctx.lineTo(35, -75);
      ctx.fill();

      ctx.restore();
      return canvas;
    }

    ctx.restore();
    return canvas;
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
