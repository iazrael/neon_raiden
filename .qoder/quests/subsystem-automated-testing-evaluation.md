# 子系统自动化单元测试实施计划

## 概述

本文档旨在规划Neon Raiden游戏引擎中各子系统的自动化单元测试实施工作。根据前期可行性评估结果，我们将按阶段开展测试代码开发，并将测试代码放置在专门的tests目录下。

## 测试环境搭建

### 测试框架选择

基于项目的TypeScript技术栈和浏览器环境依赖，我们选择以下测试工具组合：

1. **Jest** - 作为主要测试框架，提供断言、Mock和测试运行功能
2. **JSDOM** - 模拟浏览器环境，支持DOM和Canvas API测试
3. **@types/jest** - Jest类型定义
4. **ts-jest** - 支持TypeScript的Jest预处理器

### 目录结构调整

为了更好地组织测试代码，我们将创建以下目录结构：

```
tests/
├── unit/
│   ├── systems/
│   │   ├── WeaponSystem.test.ts
│   │   ├── EnemySystem.test.ts
│   │   ├── InputSystem.test.ts
│   │   └── BossSystem.test.ts
│   ├── utils/
│   └── mocks/
├── integration/
└── fixtures/
```

### package.json更新

需要添加测试相关的脚本和依赖项：

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "ts-jest": "^29.1.0"
  }
}
```

## 第一阶段实施计划（高优先级）

### 1. 测试基础设施搭建

#### 创建jest.config.js配置文件

```javascript
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  moduleDirectories: ['node_modules', 'src', 'game'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/game/(.*)$': '<rootDir>/game/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

#### 创建测试工具和Mock

在tests/mocks/目录下创建常用Mock对象和工具函数：

1. DOM事件Mock
2. Canvas API Mock
3. Audio API Mock
4. Entity对象工厂函数

### 2. WeaponSystem单元测试

#### 测试目标
- 验证不同武器类型的开火逻辑
- 测试武器升级对伤害和射击频率的影响
- 验证声音播放调用

#### 测试用例设计
- 不同武器类型的基础开火测试
- 武器等级对伤害的加成计算
- 武器等级对射击频率的影响
- AudioSystem调用验证

#### 实现要点
- Mock AudioSystem以隔离外部依赖
- 创建Entity工厂函数简化测试数据构造
- 验证子弹生成的正确性（位置、速度、属性）

### 3. EnemySystem单元测试

#### 测试目标
- 验证不同类型敌人的生成权重
- 测试精英敌人属性加成计算
- 验证各种敌人AI行为逻辑

#### 测试用例设计
- 敌人生成权重验证
- 精英敌人属性计算
- 不同敌人类型的AI行为测试
- 更新逻辑验证

#### 实现要点
- Mock随机数生成器以确保测试结果一致性
- 创建时间控制器处理dt参数
- 验证敌人行为随时间的变化

## 第二阶段实施计划（中优先级）

### 1. InputSystem单元测试

#### 测试目标
- 验证按键状态跟踪
- 测试触摸事件处理逻辑
- 验证回调函数正确触发

#### 实现要点
- 模拟DOM键盘和触摸事件
- 验证不同输入模式下的行为
- 测试事件回调的正确性

### 2. BossSystem单元测试

#### 测试目标
- 验证Boss生成位置计算
- 测试不同移动模式的实现
- 验证特殊机制（护盾再生、冲刺等）

#### 实现要点
- Mock时间控制系统行为
- 验证Boss状态转换逻辑
- 测试武器发射逻辑

## 第三阶段实施计划（低优先级）

### 辅助系统测试
- ComboSystem测试
- WeaponSynergySystem测试
- EnvironmentSystem测试

### 集成测试
- RenderSystem视觉输出验证
- AudioSystem声音播放测试
- 系统间协作测试

## 实施规范

### 代码质量要求

遵循项目的高内聚、低耦合原则：

1. 每个测试文件只关注单一系统的测试
2. 测试函数粒度适中，每个函数测试一个具体行为
3. 共用的测试工具和Mock应提取为独立模块
4. 测试代码命名需准确反映测试内容

### Mock策略

1. 对于外部依赖（Canvas API、Web Audio API），创建适当的Mock
2. 对于复杂对象（Entity），使用工厂函数简化测试数据构建
3. 对于时间相关逻辑，使用假定时器控制
4. 对于随机性因素，使用固定的随机种子

### 测试覆盖率目标

1. 第一阶段：核心系统达到80%以上行覆盖率
2. 第二阶段：扩展系统达到70%以上行覆盖率
3. 第三阶段：整体项目达到60%以上行覆盖率

## 预期成果

通过分阶段实施，我们将建立起完整的自动化测试体系：

1. 基础测试框架和工具链
2. 核心系统单元测试覆盖
3. 持续集成测试流程
4. 测试文档和最佳实践指南

这将显著提高代码质量和开发效率，减少回归错误的发生。