ECS架构模式要求:                                         
  - 蓝图: src/engine/blueprints - 实体通过蓝图配置         
  - 组件: src/engine/components - 数据结构                 
  - 系统: src/engine/systems - 纯函数,处理逻辑             
  - 配置: src/engine/configs - 数值配置   
  - 获取组件：src/engine/world.ts - view函数和其他工具方法
  - 时间单位： 所有时间相关的单位，都用**毫秒**

* ./game/ 目录是重构前的代码，就将要废弃的，部分代码可以参考，如 RenderSystem \ GameEngine 等
* ./src/ 是重构后的新代码，所有后续需求都应该基于这个目录处理
* 所有需求完成后, 都必须确保 pnpm test 全部通过