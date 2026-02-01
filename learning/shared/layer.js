// Minimal Layer and LayerGroup inspired by src/ol/layer/Layer.js and src/ol/layer/Group.js
import {ObservableObject} from './events.js';

export class Layer extends ObservableObject {
  constructor(options = {}) {
    super();
    this.set('opacity', options.opacity ?? 1);
    this.set('visible', options.visible ?? true);
    this.set('zIndex', options.zIndex);
  }

  getOpacity() {
    return this.get('opacity');
  }

  getVisible() {
    return this.get('visible');
  }

  getZIndex() {
    return this.get('zIndex');
  }

  setOpacity(opacity) {
    this.set('opacity', opacity);
  }

  setVisible(visible) {
    this.set('visible', visible);
  }

  setZIndex(zIndex) {
    this.set('zIndex', zIndex);
  }

  getLayerState() {
    return {
      layer: this,
      opacity: this.getOpacity(),
      visible: this.getVisible(),
      zIndex: this.getZIndex(),
    };
  }

  render(ctx, frameState, layerState) {
    // Override in subclasses.
  }
}

export class LayerGroup extends Layer {
  constructor(options = {}) {
    super(options);
    this.layers_ = (options.layers || []).slice();
  }

  getLayers() {
    return this.layers_;
  }

  addLayer(layer) {
    this.layers_.push(layer);
    this.changed();
  }

  removeLayer(layer) {
    const index = this.layers_.indexOf(layer);
    if (index !== -1) {
      this.layers_.splice(index, 1);
      this.changed();
    }
  }

  getLayerStatesArray() {
    const states = [];
    const groupState = this.getLayerState();

    const walk = (layer, parentState) => {
      if (layer instanceof LayerGroup) {
        const nextState = mergeStates(parentState, layer.getLayerState());
        layer.getLayers().forEach((child) => walk(child, nextState));
      } else {
        const layerState = mergeStates(parentState, layer.getLayerState());
        states.push(layerState);
      }
    };

    walk(this, groupState);
    return states;
  }
}

function mergeStates(parent, child) {
  return {
    layer: child.layer,
    opacity: parent.opacity * child.opacity,
    visible: parent.visible && child.visible,
    zIndex: child.zIndex !== undefined ? child.zIndex : parent.zIndex,
  };
}
