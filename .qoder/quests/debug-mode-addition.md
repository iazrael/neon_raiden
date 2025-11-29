# 调试模式功能设计文档

## 1. 功能概述

### 1.1 目标
实现一个调试模式功能，当URL包含特定参数时激活。该模式将用于开发和测试目的，允许开发者快速触发某些游戏事件以验证系统行为。

### 1.2 核心需求
- 当URL包含`master`参数且`debug=1`时，激活调试模式
- 在调试模式下，经过10秒且击杀10个小怪后，Boss立即出现
- 此功能仅用于开发和测试环境，不应影响正常游戏体验

## 2. 技术方案

### 2.1 参数检测机制
在应用初始化阶段（App.tsx的useEffect中），解析URL参数：
```typescript
const urlParams = new URLSearchParams(window.location.search);
const isMaster = urlParams.has('master');
const debugMode = urlParams.get('debug') === '1';

if (isMaster && debugMode) {
  GameConfig.debug = true;
}
```

### 2.2 调试模式行为
在调试模式激活时，GameEngine需要增加特殊逻辑：
1. 记录游戏开始时间（levelStartTime已存在）
2. 跟踪小怪击杀数量（通过ComboSystem的killEnemy方法）
3. 当满足以下条件时触发Boss出现：
   - 游戏时间超过10秒
   - 击杀小怪数量达到10个

### 2.3 实现考虑
- 利用现有的GameConfig.debug配置项
- 利用现有的levelStartTime变量跟踪游戏开始时间
- 通过扩展killEnemy方法来跟踪击杀数量
- 通过修改Boss生成条件检查来实现即时生成
- 确保这些更改只在debug模式启用时生效

## 3. 影响分析

### 3.1 对现有系统的影响
此功能主要涉及以下系统的修改：
- App.tsx：增加URL参数解析逻辑，在游戏引擎初始化前设置GameConfig.debug
- GameEngine.ts：
  - 在update方法中增加调试模式下的Boss生成检查逻辑
  - 可能需要扩展killEnemy方法以跟踪击杀数量

### 3.2 兼容性考虑
- 该功能仅为调试用途，不会影响正常游戏流程
- 默认情况下GameConfig.debug为false，不会影响正常游戏体验
- 所有调试逻辑都包裹在debug模式检查中

## 4. 测试要点

### 4.1 功能测试
- 验证不带参数访问时GameConfig.debug保持false
- 验证带master参数但debug!=1时GameConfig.debug保持false
- 验证带master参数且debug=1时GameConfig.debug设为true
- 调试模式下，验证10秒计时器准确性
- 调试模式下，验证击杀计数准确性
- 调试模式下，验证Boss生成条件触发

### 4.2 边界情况测试
- URL参数缺失或错误时的行为
- 游戏暂停或中断时计时器的处理
- 多次进入调试模式的情况- 游戏暂停或中断时计时器的处理
