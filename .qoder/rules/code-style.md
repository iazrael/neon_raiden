---
trigger: always_on
alwaysApply: true
---
# 核心代码质量规则：高内聚、低耦合、零冗余
# 遵循严格类型，不能出现any类型
# 对玩法、数值、子系统的调整，都应该先读取`GAME_BALANCE_DESIGN`确认现状，然后更新`GAME_BALANCE_DESIGN`
# 对独立模块、系统的改造后，都应该写上配套的单元测试并运行通过