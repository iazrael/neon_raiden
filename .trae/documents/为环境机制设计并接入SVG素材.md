## 目标

* 为关卡环境机制（障碍物、第5关能量风暴、第9关重力场）设计紧凑边界的SVG素材，尺寸与`EnvironmentSystem`一致，消除“绘制不对应”问题。

* 将环境素材接入渲染管线，优先使用sprite绘制，保留现有动态/粒子/血条叠加效果。

## 现状评估

* `EnvironmentSystem`：障碍物`60x80`、风暴高`120`（宽度等于屏幕）、重力场宽`150`（高度等于屏幕），颜色分别为`#888888 / #4ade80 / #8b5cf6`。

* `RenderSystem.drawEnvironmentElement`当前用几何形状绘制，未使用`spriteKey`。

* `SpriteGenerator/AssetsLoader`已支持SVG加载与缓存，但预加载目录仅有`fighters/enemies/bullets/bosses`，没有`environment`。

* 障碍物实体已有`spriteKey: 'obstacle'`，风暴/重力场暂无`spriteKey`。

## 素材目录与命名

* 路径根：`assets/sprites/environment/`

* 文件：

  * `obstacle.svg`（60x80）

  * `energy_storm.svg`（600x120，横向可拉伸）

  * `gravity_field.svg`（150x600，纵向可拉伸）

## 设计规范

* 紧凑边界：`viewBox`与视觉内容严格贴合，无额外留白，避免碰撞误差。

* 可缩放：使用线性渐变与简洁几何，`preserveAspectRatio="none"`以适配不同屏幕尺寸拉伸。

* 颜色一致：采用系统配置色值，透明度通过`fill-opacity/stop-opacity`实现。

* 轻量：不嵌入SMIL/CSS动画（作为`<img>`绘制不会生效），动态由Canvas叠加实现。

## SVG 素材草图

* `assets/sprites/environment/obstacle.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="60" height="80" viewBox="0 0 60 80" preserveAspectRatio="none">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#AAAAAA"/>
      <stop offset="0.5" stop-color="#888888"/>
      <stop offset="1" stop-color="#666666"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="60" height="80" rx="6" ry="6" fill="url(#g)"/>
  <rect x="2" y="2" width="56" height="76" rx="4" ry="4" fill="#999999" fill-opacity="0.25"/>
  <rect x="0" y="0" width="20" height="80" fill="#FFFFFF" fill-opacity="0.15"/>
</svg>
```

* `assets/sprites/environment/energy_storm.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="120" viewBox="0 0 600 120" preserveAspectRatio="none">
  <defs>
    <linearGradient id="band" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4ade80" stop-opacity="0.35"/>
      <stop offset="0.5" stop-color="#4ade80" stop-opacity="0.5"/>
      <stop offset="1" stop-color="#4ade80" stop-opacity="0.35"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="600" height="120" fill="url(#band)"/>
  <g fill="#4ade80" fill-opacity="0.6">
    <rect x="0" y="10" width="600" height="2"/>
    <rect x="0" y="40" width="600" height="2"/>
    <rect x="0" y="70" width="600" height="2"/>
    <rect x="0" y="100" width="600" height="2"/>
  </g>
</svg>
```

* `assets/sprites/environment/gravity_field.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="150" height="600" viewBox="0 0 150 600" preserveAspectRatio="none">
  <defs>
    <linearGradient id="gf" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#8b5cf6" stop-opacity="0.25"/>
      <stop offset="0.5" stop-color="#8b5cf6" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#8b5cf6" stop-opacity="0.25"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="150" height="600" fill="url(#gf)"/>
  <g fill="#8b5cf6" fill-opacity="0.6">
    <circle cx="30" cy="60" r="3"/>
    <circle cx="90" cy="120" r="3"/>
    <circle cx="60" cy="200" r="3"/>
    <circle cx="120" cy="300" r="3"/>
    <circle cx="45" cy="380" r="3"/>
    <circle cx="105" cy="450" r="3"/>
  </g>
</svg>
```

## 接入方案

* 资源：将上述SVG放入`assets/sprites/environment/`。

* 生成器：在`SpriteGenerator`新增环境加载方法或复用`loadSVG`：

  * `loadSVG(`${ASSETS\_BASE\_PATH}environment/obstacle.svg`, 60, 80)`

  * `loadSVG(`${ASSETS\_BASE\_PATH}environment/energy\_storm.svg`, screenWidth, 120)`

  * `loadSVG(`${ASSETS\_BASE\_PATH}environment/gravity\_field.svg`, 150, screenHeight)`

* 注册：在`RenderSystem.loadAssets()`添加：

  * `this.sprites['obstacle'] = ...`

  * `this.sprites['energy_storm'] = ...`

  * `this.sprites['gravity_field'] = ...`

* 实体：在`EnvironmentSystem.spawnEnergyStorm/spawnGravityField`设置`spriteKey`：

  * 风暴：`spriteKey: 'energy_storm'`

  * 重力场：`spriteKey: 'gravity_field'`

* 渲染：在`drawEnvironmentElement`中优先绘制`elem.spriteKey`对应图像，随后保留现有叠加效果：

  * 障碍物：图像 + 顶部血条

  * 能量风暴：图像 + 动态透明度与竖直波纹

  * 重力场：图像 + 粒子点阵

* 预加载：可选在`AssetsLoader.preloadAssets()`追加`environment`目录三款资源，减少首帧缺图。

## 验证

* 启动开发环境，进入第3/5/9关分别检查：

  * 视觉与尺寸与`EnvironmentSystem`一致，碰撞无额外留白。

  * 风暴与重力场叠加动画仍正常（透明度波动、粒子移动）。

  * 障碍物血条显示与销毁逻辑正常。

* 在不同屏幕比例下拉伸无失真（`preserveAspectRatio="none"`生效）。

## 交付

* 交付三个SVG文件与代码接入修改，保持

