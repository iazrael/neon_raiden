#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取配置文件
const configPath = path.join(__dirname, 'icon-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { input, output, icons } = config;

try {
  // 为每个图标尺寸生成命令并执行
  icons.forEach(({ size, filename }) => {
    const outputPath = path.join(output, filename);
    const command = `sharp -i ${input} -o ${outputPath} resize ${size} ${size}`;
    console.log(`🖼️  生成 ${filename}...`);
    execSync(command, { stdio: 'inherit' });
  });
  
  console.log('\n✅ 所有图标生成完成！');
} catch (error) {
  console.error('\n❌ 图标生成失败:', error.message);
  process.exit(1);
}
