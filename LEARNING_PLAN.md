# OpenLayers 源码学习方案（由浅入深）

> 目标：在理解 OpenLayers 架构的同时，能够独立定位问题、阅读模块实现并做出小型改动。
> 说明：本仓库是源码快照，仅包含 `src/`、`mini-src/`、`imgs/` 等子集目录。

## 0. 准备与定位（0.5 天）

1. 快速浏览文档
   - `README.md`：整体介绍与使用方式
   - `DEVELOPING.md`：开发流程
   - `CONTRIBUTING.md`：贡献规范与提交要求
2. 了解目录结构
   - `src/ol/` 是核心库
   - `mini-src/` 是精简子集（适合先行阅读）
3. 建立阅读方法
   - 先理解“数据流”和“渲染流”，再深入工具函数。
   - 阅读顺序：入口 → 核心类 → 子系统 → 细节模块。

## 1. 认识核心入口与导出（1 天）

**目标**：知道库导出了什么，以及最小可用路径。

阅读顺序：
- `src/ol/index.js`：导出聚合入口
- `src/ol/Map.js`：地图主类
- `src/ol/View.js`：视图与状态

练习：
- 用文字描述：Map 初始化后包含哪些组件（View、Layer、Controls、Interactions 等）。
- 画一张“Map 生命周期”流程图：构造 → 事件注册 → render → postrender。

## 2. 事件系统与基础对象模型（1-2 天）

**目标**：理解事件、可观察对象与属性变更传播机制。

阅读顺序：
- `src/ol/Observable.js`
- `src/ol/Object.js`
- `src/ol/events.js`
- `src/ol/Collection.js`
- `src/ol/MapBrowserEvent.js`
- `src/ol/MapBrowserEventHandler.js`

练习：
- 追踪一次 `MapBrowserEvent` 从 DOM 到 Map 的路径。
- 摘要 `Observable` 与 `Object` 的区别与用途。

## 3. View 与渲染状态（2-3 天）

**目标**：理解 view 状态与 render loop 的驱动关系。

阅读顺序：
- `src/ol/View.js`
- `src/ol/ViewHint.js`
- `src/ol/ViewProperty.js`
- `src/ol/centerconstraint.js`
- `src/ol/resolutionconstraint.js`
- `src/ol/rotationconstraint.js`
- `src/ol/MapEvent.js`, `src/ol/MapEventType.js`
- `src/ol/render.js`（frame state 相关）

练习：
- 理解 `View` 中的状态：中心点/分辨率/旋转。
- 追踪 `Map.js` 中 render 触发与 `frameState` 的构建。

## 4. Layer 与 Source 数据通路（3-4 天）

**目标**：掌握图层层级与数据加载机制。

阅读顺序：
- `src/ol/layer/`（从 Base → Tile → Vector）
- `src/ol/source/`（重点：`XYZ`, `OSM`, `Vector`, `Tile`, `Image`)
- `src/ol/source.js`, `src/ol/layer.js`
- `src/ol/Tile.js`, `src/ol/Image.js`, `src/ol/TileQueue.js`
- `src/ol/tilegrid.js`, `src/ol/tilecoord.js`
- `src/ol/VectorTile.js`, `src/ol/VectorRenderTile.js`

练习：
- 画出 Tile 数据路径：Source → Tile → Renderer。
- 对比 Tile Layer 与 Vector Layer 的差异。

## 5. Feature / Geometry / Style / Format（3-4 天）

**目标**：理解矢量数据结构与样式体系。

阅读顺序：
- `src/ol/Feature.js`
- `src/ol/geom/`（Point/LineString/Polygon/Geometry 基类）
- `src/ol/style/`（Style/Fill/Stroke/Icon/Text）
- `src/ol/format/`（再读 `src/ol/format/readme.md`）

练习：
- 解释 Feature 如何持有 Geometry 与 Style。
- 读懂任意一种 format（如 `GPX`）的解析流程。

## 6. 渲染管线（Canvas 与 WebGL）（4-6 天）

**目标**：理解渲染从“数据”到“画面”的完整链路。

建议顺序：
1. **简化入口**：
   - `mini-src/renderer/Layer.js`（快速理解最小渲染逻辑）
2. **Canvas 渲染器**：
   - `src/ol/render/canvas/*`（Builder/Executor/Instruction）
   - `src/ol/renderer/canvas/*`（Layer renderer）
3. **WebGL 渲染器**：
   - `src/ol/render/webgl/*`
   - `src/ol/renderer/webgl/*`
   - `src/ol/webgl/`

练习：
- 选择一个 `VectorLayer` 的渲染路径并写出步骤。
- 对比 Canvas 与 WebGL 的渲染差异点。

## 7. Interaction 与 Control（2-3 天）

**目标**：理解交互与控件的事件处理路径。

阅读顺序：
- `src/ol/interaction/`（拖拽、缩放、选择等）
- `src/ol/control/`（ScaleLine、Zoom 等）
- `src/ol/pointer/`

练习：
- 追踪 `DragPan` 的事件流与状态改变。
- 解释 controls 如何挂载到 Map 上。

## 8. 高级主题与扩展（2-3 天）

**目标**：掌握常见问题点与易出错模块。

推荐主题：
- 坐标与投影：`src/ol/proj.js`、`src/ol/proj/`
- 几何计算与范围：`src/ol/extent.js`、`src/ol/sphere.js`
- 重投影：`src/ol/reproj.js`
- Worker 相关：`src/ol/worker/`

练习：
- 理解投影转换路径及其影响（视图与渲染）。
- 阅读一个 reprojection 相关流程。

## 9. 实战强化（持续进行）

**目标**：从阅读转向动手修改。

建议做法：
- 选一个“可追踪问题”或“新增小特性”。
- 只修改 1-2 个模块，遵循 `CONTRIBUTING.md` 规范。
- 每次修改后记录：影响范围、性能风险、回退方案。

## 10. 建议的“阅读顺序清单”

1. `src/ol/index.js`
2. `src/ol/Map.js`
3. `src/ol/View.js`
4. `src/ol/Observable.js` → `src/ol/Object.js`
5. `src/ol/layer/*`, `src/ol/source/*`
6. `src/ol/Feature.js`, `src/ol/geom/*`, `src/ol/style/*`
7. `src/ol/render/*` + `src/ol/renderer/*`
8. `src/ol/interaction/*`, `src/ol/control/*`
9. `src/ol/proj.js`, `src/ol/reproj.js`

## 附：仓库快照限制提示

此仓库缺少 `examples/`、`test/`、`config/` 等目录，因此：
- `npm run serve-examples`、`npm test` 等脚本可能不可用。
- 如需运行完整示例或测试，建议切换到完整 OpenLayers 主仓库。

