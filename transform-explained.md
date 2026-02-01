# src/ol/transform.js 说明

## 这个文件为什么存在
`src/ol/transform.js` 是 OpenLayers 在渲染与交互中处理二维仿射变换的基础工具集。它的存在有三类核心原因：

1. **统一坐标体系转换**
   - 地图内部使用“地图坐标/世界坐标”，屏幕渲染使用“像素坐标”。
   - 需要高频地在两者之间转换，例如渲染、点击命中、拖拽/缩放计算。

2. **高性能、低分配的数学工具**
   - 采用长度为 6 的数组表示 2D 仿射矩阵（兼容 SVGMatrix），避免对象创建开销。
   - 大量函数原地修改输入数组，减少 GC 压力。

3. **与渲染管线深度耦合**
   - `MapRenderer.calculateMatrices2D` 依赖这里的 `compose`、`makeInverse` 生成 `coordinateToPixelTransform` 和 `pixelToCoordinateTransform`。
   - 这些矩阵被写入 `frameState`，整个渲染与命中检测都基于它们工作。

## 变换矩阵的表示方式

OpenLayers 使用 6 个数字表示 2D 仿射矩阵：

```
[ a c e ]
[ b d f ]
[ 0 0 1 ]
```

对应数组：`[a, b, c, d, e, f]`。

这与 SVG / Canvas 的矩阵表示一致，便于直接用于 CSS transform 或 Canvas transform。

## 主要函数与作用

### 1) 创建与重置
- `create()`：生成单位矩阵 `[1,0,0,1,0,0]`。
- `reset(transform)`：把已有矩阵重置为单位矩阵。

### 2) 组合与更新
- `set(transform, a,b,c,d,e,f)`：直接设置矩阵值。
- `setFromArray(t1, t2)`：拷贝矩阵。
- `multiply(t1, t2)`：矩阵相乘，结果写回 `t1`。
- `compose(transform, dx1, dy1, sx, sy, angle, dx2, dy2)`：
  将“平移 -> 缩放 -> 旋转 -> 平移”组合成一个矩阵，这是渲染中最常用的组合方式。

### 3) 单步变换
- `translate(transform, dx, dy)`：平移。
- `scale(transform, sx, sy)`：缩放。
- `rotate(transform, angle)`：旋转。

### 4) 坐标应用与逆变换
- `apply(transform, coordinate)`：原地把坐标转换到新坐标系。
- `invert(source)` / `makeInverse(target, source)`：求逆矩阵。
- `determinant(mat)`：行列式，用于判断是否可逆。

### 5) CSS 兼容输出
- `toString(mat)`：输出 `matrix(a,b,c,d,e,f)` 字符串，并用浏览器规范化。
- `composeCssTransform(...)`：一次性生成 CSS 可用的 matrix() 字符串。

## 在渲染中的典型使用场景

### 1) 渲染阶段
`MapRenderer.calculateMatrices2D` 会计算：
- `coordinateToPixelTransform`：世界坐标 -> 像素坐标
- `pixelToCoordinateTransform`：像素坐标 -> 世界坐标（由上面的矩阵求逆）

流程大致是：

```
compose(
  coordinateToPixel,
  size[0] / 2,
  size[1] / 2,
  1 / resolution,
  -1 / resolution,
  -rotation,
  -centerX,
  -centerY
)
makeInverse(pixelToCoordinate, coordinateToPixel)
```

### 2) 命中检测
点击屏幕时需要把像素坐标转换回地图坐标，再去做 Feature 命中。

### 3) 叠加层 CSS 变换
`toString()` 输出 `matrix(...)` 可直接用于 DOM 元素的 `transform` 样式。

## 设计细节与工程取舍

- **数组而非类**：避免大量对象创建，性能更稳定。
- **in-place 操作**：大量函数直接修改输入矩阵，减少临时对象。
- **tmp_ 复用**：`rotate/scale/translate` 使用共享临时矩阵，进一步降低分配。
- **可逆性检查**：`makeInverse` 使用 `assert(det !== 0)` 保证可逆。
- **兼容浏览器规范**：`toString` 通过临时 DOM 节点规范化 transform 字符串。

## 与源码中其他模块的关系

- `src/ol/renderer/Map.js`：使用 `compose` / `makeInverse` 计算变换。
- `src/ol/Map.js`：把变换写入 `frameState`。
- `src/ol/render/canvas/*`：绘制时频繁使用 `apply` 或已生成的矩阵。
- `src/ol/interaction/*`：交互过程中需要像素/坐标互转。

## 总结

`src/ol/transform.js` 是 OpenLayers 里“坐标与像素之间的桥梁”。它把渲染、交互、命中检测、DOM 变换统一在一套高性能的 2D 仿射矩阵工具之上，是整个渲染管线的基础支撑。缺少它，Map/View/Renderer 之间就无法形成稳定而高效的变换通道。
