// Minimal VectorLayer inspired by src/ol/layer/Vector.js and Canvas renderer
import {Layer} from './layer.js';
import {apply} from './transform.js';

const defaultStyle = {
  stroke: {color: '#1b7f7a', width: 2},
  fill: {color: 'rgba(27, 127, 122, 0.2)'},
  radius: 6,
};

export class VectorLayer extends Layer {
  constructor(options = {}) {
    super(options);
    this.source_ = options.source;
    this.styleFunction_ = options.style || (() => defaultStyle);
  }

  getSource() {
    return this.source_;
  }

  render(ctx, frameState, layerState) {
    if (!layerState.visible) {
      return;
    }
    const transform = frameState.coordinateToPixelTransform;
    const features = this.source_.getFeatures();
    ctx.save();
    ctx.globalAlpha = layerState.opacity;

    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      const style = this.styleFunction_(feature) || defaultStyle;
      drawGeometry(ctx, geometry, transform, style);
    });

    ctx.restore();
  }
}

function drawGeometry(ctx, geometry, transform, style) {
  const type = geometry.getType();
  if (type === 'Point') {
    const coord = geometry.getCoordinates();
    const pixel = apply(transform, coord.slice());
    ctx.fillStyle = style.fill?.color || '#1b7f7a';
    ctx.beginPath();
    ctx.arc(pixel[0], pixel[1], style.radius ?? 6, 0, Math.PI * 2);
    ctx.fill();
    if (style.stroke) {
      ctx.strokeStyle = style.stroke.color;
      ctx.lineWidth = style.stroke.width;
      ctx.stroke();
    }
    return;
  }

  if (type === 'LineString') {
    const coords = geometry.getCoordinates();
    ctx.strokeStyle = style.stroke?.color || '#1b7f7a';
    ctx.lineWidth = style.stroke?.width || 2;
    ctx.beginPath();
    coords.forEach((coord, index) => {
      const pixel = apply(transform, coord.slice());
      if (index === 0) {
        ctx.moveTo(pixel[0], pixel[1]);
      } else {
        ctx.lineTo(pixel[0], pixel[1]);
      }
    });
    ctx.stroke();
    return;
  }

  if (type === 'Polygon') {
    const rings = geometry.getCoordinates();
    ctx.beginPath();
    rings.forEach((ring) => {
      ring.forEach((coord, index) => {
        const pixel = apply(transform, coord.slice());
        if (index === 0) {
          ctx.moveTo(pixel[0], pixel[1]);
        } else {
          ctx.lineTo(pixel[0], pixel[1]);
        }
      });
      ctx.closePath();
    });
    if (style.fill) {
      ctx.fillStyle = style.fill.color;
      ctx.fill();
    }
    if (style.stroke) {
      ctx.strokeStyle = style.stroke.color;
      ctx.lineWidth = style.stroke.width;
      ctx.stroke();
    }
  }
}
