  ECS架构模式要求:                                         
  - 蓝图: src/engine/blueprints - 实体通过蓝图配置         
  - 组件: src/engine/components - 数据结构                 
  - 系统: src/engine/systems - 纯函数,处理逻辑             
  - 配置: src/engine/configs - 数值配置   
  - 获取组件：src/engine/world.ts - view函数和其他工具方法