import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {Layer, LayerGroup} from '../shared/layer.js';

const statesEl = document.getElementById('states');

class ColorLayer extends Layer {
  constructor(options) {
    super(options);
    this.color_ = options.color;
    this.label_ = options.label;
    this.rect_ = options.rect;
  }

  render(ctx, frameState, layerState) {
    if (!layerState.visible) {
      return;
    }
    ctx.save();
    ctx.globalAlpha = layerState.opacity;
    ctx.fillStyle = this.color_;
    const [x, y, w, h] = this.rect_;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = '#111';
    ctx.font = '14px sans-serif';
    ctx.fillText(this.label_, x + 12, y + 24);
    ctx.restore();
  }
}

class GridLayer extends Layer {
  render(ctx, frameState, layerState) {
    if (!layerState.visible) {
      return;
    }
    const {size} = frameState;
    ctx.save();
    ctx.globalAlpha = layerState.opacity;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= size[0]; x += 40) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size[1]);
    }
    for (let y = 0; y <= size[1]; y += 40) {
      ctx.moveTo(0, y);
      ctx.lineTo(size[0], y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

const grid = new GridLayer({zIndex: 0});
const layerA = new ColorLayer({
  label: 'Layer A',
  color: 'rgba(194, 91, 26, 0.65)',
  rect: [100, 80, 240, 180],
  zIndex: 1,
});
const layerB = new ColorLayer({
  label: 'Layer B',
  color: 'rgba(27, 127, 122, 0.65)',
  rect: [200, 140, 240, 180],
  zIndex: 2,
});

const group = new LayerGroup({layers: [grid, layerA, layerB], opacity: 1});

const view = new View({center: [0, 0], resolution: 1, rotation: 0});

function renderFrame(ctx, frameState) {
  const {size, pixelRatio} = frameState;
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);

  const layerStates = group.getLayerStatesArray();
  layerStates.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  layerStates.forEach((state) => {
    state.layer.render(ctx, frameState, state);
  });
  ctx.restore();

  statesEl.textContent = JSON.stringify(
    layerStates.map((state) => ({
      label: state.layer.label_ || 'grid',
      opacity: Number(state.opacity.toFixed(2)),
      visible: state.visible,
      zIndex: state.zIndex,
    })),
    null,
    2
  );
}

const map = new Map({target: 'map', view, renderFrame});

let groupOpacity = 1;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

document.getElementById('toggle-a').addEventListener('click', () => {
  layerA.setVisible(!layerA.getVisible());
  map.render();
});

document.getElementById('toggle-b').addEventListener('click', () => {
  layerB.setVisible(!layerB.getVisible());
  map.render();
});

document.getElementById('opacity-up').addEventListener('click', () => {
  groupOpacity = clamp(groupOpacity + 0.1, 0.1, 1);
  group.setOpacity(groupOpacity);
  map.render();
});

document.getElementById('opacity-down').addEventListener('click', () => {
  groupOpacity = clamp(groupOpacity - 0.1, 0.1, 1);
  group.setOpacity(groupOpacity);
  map.render();
});

document.getElementById('swap-z').addEventListener('click', () => {
  const zA = layerA.getZIndex();
  layerA.setZIndex(layerB.getZIndex());
  layerB.setZIndex(zA);
  map.render();
});
