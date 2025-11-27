import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';

// 确保输出目录存在
const outputDir = path.join(process.cwd(), 'public', 'assets', 'splashs');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 定义不同设备的启动屏尺寸
const splashScreens = [
    // iPhone SE (1st generation) and iPhone 8
    { name: 'splash-iphone8.png', width: 750, height: 1334 },

    // iPhone 8 Plus
    { name: 'splash-iphone8plus.png', width: 1242, height: 2208 },

    // iPhone X, XS, 11 Pro
    { name: 'splash-iphonex.png', width: 1125, height: 2436 },

    // iPhone XR, 11
    { name: 'splash-iphonexr.png', width: 828, height: 1792 },

    // iPhone XS Max, 11 Pro Max
    { name: 'splash-iphone11promax.png', width: 1242, height: 2688 },

    // iPhone 12, 12 Pro, 13, 13 Pro
    { name: 'splash-iphone12.png', width: 1170, height: 2532 },

    // iPhone 12 Mini, 13 Mini
    { name: 'splash-iphone12mini.png', width: 1080, height: 2340 },

    // iPhone 12 Pro Max, 13 Pro Max, 14 Plus
    { name: 'splash-iphone12promax.png', width: 1284, height: 2778 },

    // iPhone 14, 15
    { name: 'splash-iphone14.png', width: 1170, height: 2532 },

    // iPhone 14 Pro, 15 Pro
    { name: 'splash-iphone14pro.png', width: 1179, height: 2556 },

    // iPhone 14 Pro Max, 15 Pro Max
    { name: 'splash-iphone14promax.png', width: 1290, height: 2796 }
];

// 创建启动屏图片
async function createSplashScreen(size) {
    // 创建画布
    const canvas = createCanvas(size.width, size.height);
    const ctx = canvas.getContext('2d');

    // 设置背景色
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, size.width, size.height);

    // 绘制网格背景
    drawGrid(ctx, size.width, size.height);

    // 绘制Logo（简化版本）
    drawSimpleLogo(ctx, size.width, size.height);

    // 绘制文字
    drawText(ctx, size.width, size.height);

    // 保存图片
    const outputPath = path.join(outputDir, size.name);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`已生成: ${size.name} (${size.width}x${size.height})`);
}

// 绘制网格背景
function drawGrid(ctx, width, height) {
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
    ctx.lineWidth = 1;

    // 绘制水平线
    for (let y = 0; y <= height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // 绘制垂直线
    for (let x = 0; x <= width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

// 绘制完整Logo（基于logo.svg，但去掉四周边框）
function drawSimpleLogo(ctx, width, height) {
    const centerX = width / 2;
    const centerY = height / 2 - 100; // 将Logo向上移动，为文字留出更多空间
    const size = Math.min(width, height) * 0.3;
    const scale = size / 512 * 2; // 基于原始512x512尺寸进行缩放

    // 设置阴影效果，模拟.neon-glow类
    function setNeonGlow() {
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10 * scale;
    }

    // 设置紫色霓虹效果，模拟.neon-purple类
    function setNeonPurple() {
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 10 * scale;
    }

    // 重置阴影
    function resetShadow() {
        ctx.shadowBlur = 0;
    }

    // 绘制主要的闪电符号（基于SVG中的polygon点）
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 12 * scale;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    setNeonGlow();

    ctx.beginPath();
    // 调整坐标以适应画布中心
    const points1 = [
        [256, 80], [180, 220], [240, 220], [140, 420], 
        [256, 280], [200, 280], [300, 80]
    ];
    
    const scaledPoints1 = points1.map(([x, y]) => [
        centerX + (x - 256) * scale,
        centerY + (y - 256) * scale
    ]);
    
    ctx.moveTo(scaledPoints1[0][0], scaledPoints1[0][1]);
    for (let i = 1; i < scaledPoints1.length; i++) {
        ctx.lineTo(scaledPoints1[i][0], scaledPoints1[i][1]);
    }
    ctx.stroke();

    // 绘制右侧紫色装饰（基于SVG中的polygon点）
    setNeonPurple();
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 8 * scale;
    ctx.globalAlpha = 0.8;

    ctx.beginPath();
    const points2 = [
        [256, 80], [280, 160], [320, 160], [270, 240], 
        [300, 320], [250, 260], [260, 360], [240, 300], 
        [200, 340], [220, 240], [180, 200], [220, 180]
    ];
    
    const scaledPoints2 = points2.map(([x, y]) => [
        centerX + (x - 256) * scale,
        centerY + (y - 256) * scale
    ]);
    
    ctx.moveTo(scaledPoints2[0][0], scaledPoints2[0][1]);
    for (let i = 1; i < scaledPoints2.length; i++) {
        ctx.lineTo(scaledPoints2[i][0], scaledPoints2[i][1]);
    }
    ctx.stroke();

    // 重置透明度
    ctx.globalAlpha = 1.0;

    // 绘制中心绿点（基于SVG中的circle）
    setNeonGlow();
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20 * scale, 0, Math.PI * 2);
    ctx.fillStyle = '#00ff88';
    ctx.fill();

    // 绘制中心绿点的外圈
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30 * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 3 * scale;
    ctx.stroke();

    // 重置阴影
    resetShadow();
}

// 绘制文字
function drawText(ctx, width, height) {
    const centerX = width / 2;
    const logoBottom = height / 2; // 更新Logo底部位置的计算

    // 绘制中文标题
    ctx.font = `bold ${Math.min(width, height) * 0.08}px Arial`;
    ctx.fillStyle = '#ff00ff'; // 使用紫色，与Logo中的紫色装饰呼应
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.fillText('霓电战记', centerX, logoBottom + 100); // 增加与Logo的间距

    // 绘制英文标题
    ctx.font = `${Math.min(width, height) * 0.05}px Arial`;
    ctx.fillStyle = '#00ff88'; // 保持绿色，与Logo中的绿色元素呼应
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 15;
    ctx.fillText('NEON RAIDEN', centerX, logoBottom + 170); // 增加与中文标题的间距

    // 重置阴影
    ctx.shadowBlur = 0;
}

// 生成所有启动屏图片
async function generateAllSplashScreens() {
    console.log('开始生成iOS启动屏图片...');

    for (const size of splashScreens) {
        try {
            await createSplashScreen(size);
        } catch (error) {
            console.error(`生成 ${size.name} 时出错:`, error.message);
        }
    }

    console.log('所有启动屏图片生成完成！');
}

// 运行脚本
generateAllSplashScreens().catch(console.error);