
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

  // 生成敌人
  generateEnemy(type: number): HTMLCanvasElement {
    const size = type === 2 ? 80 : 48;
    const { canvas, ctx } = this.createCanvas(size, size);
    ctx.save();
    ctx.translate(size/2, size/2);

    if (type === 0) { // 杂兵：红色无人机
      ctx.fillStyle = '#c53030';
      ctx.beginPath();
      ctx.moveTo(0, 15);
      ctx.lineTo(15, -10);
      ctx.lineTo(0, -5);
      ctx.lineTo(-15, -10);
      ctx.closePath();
      ctx.fill();
      
      // 核心
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
      ctx.fillStyle = '#2f855a';
      // 六边形底盘
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        ctx.lineTo(25 * Math.cos(angle), 25 * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fill();

      // 炮塔
      ctx.fillStyle = '#68d391';
      ctx.beginPath();
      ctx.rect(-10, -15, 20, 30);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return canvas;
  }

  // 生成 Boss (根据等级生成不同复杂度)
  generateBoss(level: number): HTMLCanvasElement {
    const size = 160 + (level * 20);
    const { canvas, ctx } = this.createCanvas(size, size);
    ctx.save();
    ctx.translate(size/2, size/2);
    ctx.rotate(Math.PI); // 面向下

    // 颜色主题
    const hue = (level * 60) % 360;
    const primaryColor = `hsl(${hue}, 70%, 30%)`;
    const secondaryColor = `hsl(${hue}, 100%, 70%)`;

    // 绘制主体结构
    ctx.fillStyle = primaryColor;
    
    // 主躯干
    ctx.beginPath();
    ctx.moveTo(0, -size/3);
    ctx.lineTo(size/4, 0);
    ctx.lineTo(0, size/2.5);
    ctx.lineTo(-size/4, 0);
    ctx.closePath();
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#fff';
    ctx.stroke();

    // 侧翼 (根据等级增加翅膀数量)
    const wings = 1 + Math.floor(level / 2);
    for(let i=0; i<wings; i++) {
        const offset = 20 + i * 20;
        ctx.fillStyle = '#2d3748';
        
        // 左翼
        ctx.beginPath();
        ctx.moveTo(-size/4, -i*10);
        ctx.lineTo(-size/2 + i*5, size/4);
        ctx.lineTo(-size/4, size/3);
        ctx.fill();
        ctx.stroke();

        // 右翼
        ctx.beginPath();
        ctx.moveTo(size/4, -i*10);
        ctx.lineTo(size/2 - i*5, size/4);
        ctx.lineTo(size/4, size/3);
        ctx.fill();
        ctx.stroke();
    }

    // 核心发光部件
    ctx.shadowBlur = 20;
    ctx.shadowColor = secondaryColor;
    ctx.fillStyle = secondaryColor;
    ctx.beginPath();
    ctx.arc(0, 0, 15 + level * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // 额外的武器挂载点
    const mounts = 2 + level;
    for(let i=0; i<mounts; i++) {
        const angle = (i / mounts) * Math.PI; // 半圆分布
        const r = size/3;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r * 0.5; // 压扁一点
        
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
    return canvas;
  }

  // 生成子弹
  generateBullet(type: 'vulcan' | 'laser' | 'missile' | 'wave' | 'plasma' | 'enemy_orb' | 'enemy_beam'): HTMLCanvasElement {
    let w = 0, h = 0;
    
    if (type === 'vulcan') { w = 16; h = 32; }
    else if (type === 'laser') { w = 24; h = 64; }
    else if (type === 'missile') { w = 24; h = 48; }
    else if (type === 'wave') { w = 64; h = 32; }
    else if (type === 'plasma') { w = 48; h = 48; }
    else if (type === 'enemy_orb') { w = 32; h = 32; }
    else { w = 32; h = 32; } 

    const { canvas, ctx } = this.createCanvas(w, h);
    ctx.translate(w/2, h/2);

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
        // 尾焰
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
        // Swirling energy ball
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
        ctx.ellipse(0, 0, 15, 8, Math.PI/4, 0, Math.PI*2);
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
    }

    return canvas;
  }

  generatePowerup(type: number): HTMLCanvasElement {
      const { canvas, ctx } = this.createCanvas(40, 40);
      
      let color = '#fff';
      let label = '?';

      switch(type) {
          case 0: color = '#ecc94b'; label = 'P'; break; // Power
          case 1: color = '#4fd1c5'; label = 'L'; break; // Laser
          case 2: color = '#ed8936'; label = 'V'; break; // Vulcan
          case 3: color = '#48bb78'; label = 'H'; break; // Heal
          case 4: color = '#63b3ed'; label = 'W'; break; // Wave
          case 5: color = '#ed64a6'; label = 'X'; break; // Plasma
      }
      
      ctx.translate(20, 20);
      
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath();
      ctx.roundRect(-15, -15, 30, 30, 5);
      ctx.fill();
      
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, 1);

      return canvas;
  }
}
