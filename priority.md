这是 PriorityQueue.js 的实现解读（按“数据结构 → 核心操作 → 细节/陷阱”组织）：

整体思路

这是一个**最小堆（min-heap）**实现的优先队列：数值越小优先级越高，dequeue() 返回最小优先级元素。
允许传入两个函数：
priorityFunction(element) -> number：计算优先级
keyFunction(element) -> string：用于去重和快速判断是否已入队
特殊值 DROP = Infinity：表示当前元素不应入队（或被剔除）。
内部数据结构

elements*: 堆数组，存放元素
priorities*: 与 elements* 同步的优先级数组
queuedElements*: {[key]: true}，用于去重/快速查找
堆性质：priorities*[parent] <= priorities*[child]
核心操作

enqueue(element)

断言该元素未入队（用 keyFunction 判断）
计算优先级
若 priority == DROP 直接返回 false
否则 push 到数组尾部，然后 siftDown\_ 把新元素往上“冒泡”
时间复杂度 O(log N)
dequeue()

取出堆顶（最小优先级）
用最后一个元素顶替堆顶
调用 siftUp* 把该元素往下“下沉”
删除 queuedElements* 里的 key
时间复杂度 O(log N)
reprioritize()

重新计算每个元素的优先级
如果优先级变成 DROP，就从队列里移除
否则写入新的优先级并压缩数组
最后 heapify\_() 一次性重建堆
时间复杂度 O(N)
典型用途：优先级依赖外部状态时（比如视图变化）
“命名看着反常”的地方

siftDown* 实际上是“把某个元素往上移动”（bubble up）
siftUp* 实际上是“把某个元素往下移动”（bubble down）
这套命名沿用了 Closure Library 的实现方式，不是逻辑错误。
关键实现细节

enqueue() 只有 priority != DROP 才会入队
queuedElements* 让队列保证“同 key 唯一”
reprioritize() 会把 DROP 的元素彻底移除（连 queuedElements* 也清理）
复杂度汇总

enqueue / dequeue: O(log N)
reprioritize: O(N)
isQueued, isKeyQueued: O(1)
如果你还想看这个队列在 OpenLayers 里的实际应用，我可以结合 TileQueue.js（瓦片加载调度）讲一遍“优先级函数如何设计 + 为什么用 DROP”。

结合 TileQueue.js（瓦片加载调度）讲一遍“优先级函数如何设计 + 为什么用 DROP

结合 TileQueue.js 来看：

优先级函数如何设计（getTilePriority）

入口是 TileQueue 的元素数组：[tile, tileSourceKey, tileCenter, tileResolution]，优先级由 getTilePriority(frameState, tile, tileSourceKey, tileCenter, tileResolution) 计算。
先做“是否需要加载”的硬过滤：若 !frameState 或 tileSourceKey 不在 frameState.wantedTiles，直接返回 DROP；若该 tile.getKey() 不在 wantedTiles[tileSourceKey]，也返回 DROP。这一步把“不在当前视图或不再需要”的瓦片剔除。
真正的优先级公式是
priority = 65536 \* Math.log(tileResolution) + distance / tileResolution
其中 distance 是瓦片中心与视图中心的距离（世界坐标），除以 tileResolution 后变成“像素距离”，这样不同缩放级别可比较。
Math.log(tileResolution) 让高缩放级别（更小的 resolution）优先，而距离项只在同一缩放级别内区分“离中心更近的瓦片先加载”。注释里写明 65536 这个系数是为了让“缩放级别优先级”压过“距离差异”。
为什么用 DROP = Infinity

在 PriorityQueue.js 中，enqueue() 若优先级为 DROP 直接返回 false，元素不入队；reprioritize() 时若优先级变成 DROP，元素会被移出队列并从 queuedElements* 里清理。
这使得 视图变化时“过期瓦片”能够被主动清理，避免继续加载已经不可见/不需要的瓦片，节省带宽和 CPU。
与 Map.renderFrame*() 的调度配合：每帧会 tileQueue.reprioritize()，然后 loadMoreTiles() 根据当前交互状态限制并发加载数量；因此 DROP 是“快速过滤 + 队列瘦身”的关键机制。
如果你想，我可以继续结合 Map.renderFrame\_() 中的并发控制解释为什么交互/动画时会降低瓦片加载数。
