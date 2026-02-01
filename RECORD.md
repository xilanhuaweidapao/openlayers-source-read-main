(1)
严格来说并发控制逻辑在 Map.js 的 handlePostRender()，但它完全依赖 renderFrame_() 生成的 frameState（尤其是 time 和 viewHints），所以可以理解为“在 renderFrame_ 驱动的渲染流程里做并发控制”。

renderFrame_() 每帧创建 frameState，包含 time、viewHints、tileQueue，并通过 setTimeout(0) 触发 handlePostRender()；后者据此决定瓦片并发量。Map.js
当 viewHints[ANIMATING] 或 viewHints[INTERACTING] 为真时，handlePostRender() 把并发上限从默认 maxTilesLoading_（构造函数默认 16）降到 maxTotalLoading = 8，新启动加载数降到 maxNewLoads = 2；如果这一帧耗时超过 8ms（Date.now() - frameState.time > 8），两个值直接降为 0。Map.js
TileQueue.loadMoreTiles() 会严格受 maxTotalLoading 和 maxNewLoads 限制，只有在 tilesLoading_ < maxTotalLoading 时才会继续出队加载，所以交互/动画时自然会“降低瓦片加载数”。TileQueue.js
目的：交互/动画时视图每帧都在变化，过多并行加载会占用主线程和解码资源导致卡顿，并且容易加载“很快就移出视窗”的瓦片；降低并发能保持流畅响应并减少无效请求。

下面是一个“可运行的 html+js、由浅入深、通过实现来学习 OpenLayers 架构”的详细方案。目标是把仓库的核心能力拆成可执行小实验，每一步都能跑起来、看得到效果，并且能对照源码理解设计取舍。

总体原则

每一步都是独立的 index.html + main.js，可直接在浏览器运行。
先做“最小可运行”的实现，再逐步替换为仓库真实实现对照理解。
所有实验隔离在 learning/（不污染 src/）。
建议目录结构

learning/
  00-bootstrap/
  01-events/
  02-view/
  03-renderloop/
  04-transform/
  05-layer/
  06-tile/
  07-tile-queue/
  08-vector/
  09-interaction/
  10-hit-detect/
  11-cache/
  12-worker/
  shared/
运行方式（两种任选其一）

轻量模式（无打包）：用本地静态服务器运行每个实验目录（适合早期步骤）。
例：python -m http.server 5173 或 npx http-server -p 5173
进阶模式（需要打包）：当你开始接入 rbush/earcut/pbf 等依赖时，建议用打包器（自建最小 webpack/vite 配置即可）。
由浅入深步骤（每一步都可运行）
Step 00｜最小运行壳

目标：能打开一个空白地图容器，打印日志。
最小实现：index.html 里放一个 #map，main.js 里 console.log('ok')。
验证：浏览器加载无报错。
Step 01｜事件系统（Observable/Target 的最小实现）

目标：实现 on/once/un + change:prop 的通知。
最小实现：自写 EventTarget + ObservableObject，支持 set/get 触发事件。
对照源码：Target.js、Observable.js、Object.js
验证：obj.set('x', 1) 能触发 change:x 和 propertychange。
Step 02｜ViewState 与约束

目标：实现 center/resolution/rotation 状态与简单约束。
最小实现：View 类，setCenter/setZoom/setRotation + getState()。
对照源码：View.js、centerconstraint.js 等
验证：状态变化能触发事件，控制台输出更新。
Step 03｜Map + renderLoop

目标：实现 render() + requestAnimationFrame 的渲染循环。
最小实现：Map 管理 View，每帧生成 frameState。
对照源码：Map.js 的 renderFrame_ 结构
验证：frameState.time 每帧更新。
Step 04｜坐标变换

目标：实现 coordinateToPixel 和 pixelToCoordinate 的矩阵变换。
最小实现：一个 2D 仿射矩阵函数 + 屏幕中心映射。
对照源码：transform.js
验证：显示一个十字线，移动中心能正确变化。
Step 05｜Layer / LayerGroup

目标：实现 BaseLayer + LayerGroup 的渲染顺序与状态合并。
最小实现：Layer 有 render(frameState)；LayerGroup 合并 opacity/visible。
对照源码：Layer.js、Group.js
验证：多个图层按 zIndex 正确覆盖。
Step 06｜TileLayer（最小瓦片显示）

目标：根据 viewState 计算 tile 坐标并加载图片。
最小实现：固定 z/x/y 计算 + img 绘制到 canvas。
对照源码：XYZ.js、src/ol/tilegrid/*
验证：能看到真实瓦片地图。
Step 07｜TileQueue + 优先级

目标：实现 PriorityQueue + TileQueue，并限制并发加载。
最小实现：enqueue/dequeue/reprioritize + maxTilesLoading。
对照源码：TileQueue.js、PriorityQueue.js、ViewHint.js
验证：交互时并发下降（在控制台打印加载数）。
Step 08｜VectorLayer（点线面 + 样式）

目标：实现 Feature + Geometry + StyleFunction。
最小实现：点/线/面绘制到 canvas。
对照源码：Feature.js、src/ol/style/*
验证：加载一组 GeoJSON 后能绘制并换样式。
Step 09｜Interaction（拖拽/滚轮缩放）

目标：实现交互驱动 View 更新。
最小实现：pointerdown/move/up 做 pan，wheel 做 zoom。
对照源码：src/ol/interaction/*
验证：拖动和平滑缩放正常。
Step 10｜命中检测

目标：实现 forEachFeatureAtCoordinate。
最小实现：点到线/面距离检测 + layer 顺序。
对照源码：Map.js 的命中逻辑
验证：点击 feature 能高亮或输出信息。
Step 11｜缓存（LRU）

目标：瓦片/图标的 LRU 缓存淘汰。
最小实现：LRUCache + expireCache。
对照源码：LRUCache.js
验证：缓存达到上限会自动释放。
Step 12｜Worker（可选高级）

目标：把矢量解析/渲染拆到 Worker（OffscreenCanvas）。
最小实现：主线程发数据、worker 绘制。
对照源码：webgl.js
验证：主线程仍流畅，worker 能更新画面。
学习记录建议（配合 RECORD.md）
每个 step 结束后记录：

实现要点（自己的最小实现）
与源码差异（哪段设计没覆盖）
体验问题（性能、架构耦合点）
下一步想补的能力