# Change: 重构为纯ECS架构

## Why

当前项目代码实现耦合严重，GameEngine类承担了过多的职责，系统之间通过直接引用实现通信，导致：
- 系统间高度耦合，修改一个系统可能影响多个系统
- 实体管理分散，没有统一的组件化设计
- 状态管理混乱，游戏状态散落在各个系统属性中
- 扩展性差，添加新功能需要修改核心类
- 测试困难，系统之间依赖关系复杂

参考`game/engine.ts`的设计模式，需要将引擎改造为轻量且可扩展的纯ECS架构。

## What Changes

- **BREAKING**: 重构GameEngine为轻量Engine类，仅负责游戏循环和系统编排
- **BREAKING**: 引入World对象作为单一状态容器，统一管理所有实体、组件和事件
- **BREAKING**: 将所有系统从类改为函数，接受(world, dt)参数
- **BREAKING**: 定义核心组件类型，实现数据与逻辑分离
- **BREAKING**: 引入Entity-Component架构，实体通过组件组合
- **BREAKING**: 使用事件驱动的系统间通信机制
- 重构实体创建、销毁和查询机制
- 重构配置加载和蓝图系统

## Impact

- 影响的specs:
  - `engine-core` - 引擎核心架构
  - `entity-management` - 实体管理
  - `game-systems` - 游戏系统
- 影响的代码:
  - `game/GameEngine.ts` - 完全重构
  - `game/systems/*.ts` - 所有系统需要改为函数式
  - `game/engine/EntityManager.ts` - 改为基于组件的查询
  - `game/engine/EventBus.ts` - 集成到World.events
  - 所有React集成层需要适配新的Engine API
