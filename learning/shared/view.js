// Minimal View inspired by src/ol/View.js and constraint helpers
import {ObservableObject} from './events.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export class View extends ObservableObject {
  constructor(options = {}) {
    super();
    const center = options.center ? options.center.slice() : [0, 0];
    const resolution = options.resolution ?? 1;
    const rotation = options.rotation ?? 0;

    this.constraints_ = {
      resolution: {min: 0.25, max: 4},
      rotation: {min: -Math.PI, max: Math.PI},
    };

    this.set('center', center);
    this.setResolution(resolution);
    this.setRotation(rotation);
  }

  getCenter() {
    return this.get('center');
  }

  getResolution() {
    return this.get('resolution');
  }

  getRotation() {
    return this.get('rotation');
  }

  setCenter(center) {
    this.set('center', center.slice());
  }

  setResolution(resolution) {
    const {min, max} = this.constraints_.resolution;
    this.set('resolution', clamp(resolution, min, max));
  }

  setRotation(rotation) {
    const {min, max} = this.constraints_.rotation;
    this.set('rotation', clamp(rotation, min, max));
  }

  getState() {
    return {
      center: this.getCenter(),
      resolution: this.getResolution(),
      rotation: this.getRotation(),
    };
  }
}
