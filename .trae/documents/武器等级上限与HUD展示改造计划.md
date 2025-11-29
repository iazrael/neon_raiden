**现状梳理**
- 玩家武器：`WeaponConfig` 定义数值，升级曲线在 `game/config/weapons/upgrades.ts:12-100`（1~9级），实际升级上限由 `PowerupEffects.maxWeaponLevel=9` 控制（`game/config/powerups/effects.ts`）。伤害/射速随等级在 `game/systems/WeaponSystem.ts` 应用。
- Boss武器：结构在 `types/sprite.ts:242-249`，配置在 `game/config/bosses/weapons.ts:7-68`，当前无 `maxLevel` 字段，也无升级曲线。
- HUD左上角：武器名字显示为枚举小写字符串 `{weaponType}`（`components/GameUI.tsx:83-88`）。
- 机体上方：Canvas 文本绘制 `LV.{weaponLevel}`（`game/systems/RenderSystem.ts:287-296`），来源于 `GameEngine.draw(..., this.weaponLevel, ...)`（`game/GameEngine.ts:1261-1277`）。

**目标对齐**
1) 在 Boss 武器配置中增加“武器最高等级限制”。
2) 将“武器等级”移动到左上角，紧挨武器名称展示；武器名称改为“首字母大写”。
3) 保留机体上方的等级文字，但其含义改为“战机等级”。
4) 修改设计文档以准确描述上述规则，不改变现有数值与曲线。

**文档更新方案（/docs/GAME_BALANCE_DESIGN.md）**
- 在“2. 武器系统”补充：
  - “武器等级上限：玩家武器上限为 9（由 `PowerupEffects.maxWeaponLevel` 控制）；Boss 武器配置新增 `maxLevel`（默认 9），用于限定数值边界与展示。”
  - “HUD 规范：左上角显示 `Capitalize(武器名) Lv.{weaponLevel}`；机体上方 `LV.{fighterLevel}` 表示战机等级（取自 `ComboSystem` 的等级档位，映射为 1~4）。”
- 不改动各武器基础伤害/成长/射速等现有数值与曲线，仅补充上限与展示规范。

**代码修改方案**
- 类型：
  - `types/sprite.ts`：为 `BossWeaponEntity` 增加可选字段 `maxLevel?: number`；为 `WeaponEntity` 增加可选 `maxLevel?: number`（便于未来统一读取），不影响现有使用。
- 配置：
  - `game/config/bosses/weapons.ts`：为 `RADIAL/TARGETED/SPREAD/HOMING/LASER` 增加 `maxLevel: 9`。不更改其他字段。
- HUD左上角：
  - `components/GameUI.tsx`：在 `GameUIProps` 增加 `weaponLevel?: number`；将 `{weaponType}` 替换为 `capitalize(weaponType)` 并追加 `Lv.{weaponLevel}`。次武器名称同样首字母大写（不显示等级，按需求最小化变更）。
  - `App.tsx`：新增本地状态 `weaponLevel`，在动画循环内 `setWeaponLevel(engine.weaponLevel)`，并将其传入 `GameUI`。
  - 新增 `utils/string.ts` 的 `capitalize(str)`，避免重复实现。
- 机体上方等级：
  - `game/GameEngine.ts`：在 `draw()` 里计算 `fighterLevel = comboSys.getState().level + 1`，并将该值作为“机体显示的等级”传给 `RenderSystem.draw(...)` 的对应参数位置（替换原 `this.weaponLevel`）。
  - `game/systems/RenderSystem.ts`：保持样式，绘制文本改为 `LV.{fighterLevel}`。
- 升级上限逻辑：
  - 玩家武器上限仍由 `PowerupEffects.maxWeaponLevel` 生效（不在本次修改中变更升级逻辑），Boss 的 `maxLevel` 仅用于展示与数值边界。

**验证要点**
- 拾取 `POWER` 后 `weaponLevel` 变化正确，HUD 左上角显示 `Vulcan Lv.2`（示例），名称首字母大写。
- 连击达到 10/25/50/100 时，机体上方 `LV.x` 随 `combo.level+1` 变化；数值与文档一致。
- Boss 图鉴或后续展示可读取 `BossWeaponConfig[type].maxLevel`，不影响现有战斗逻辑。

如确认以上方案，我将先更新文档与类型/配置，再实现 UI 与渲染层改造。