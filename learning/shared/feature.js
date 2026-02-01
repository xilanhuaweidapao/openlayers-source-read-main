// Minimal Feature inspired by src/ol/Feature.js
import {ObservableObject} from './events.js';

export class Feature extends ObservableObject {
  constructor(geometry, properties = {}) {
    super();
    this.geometry_ = geometry;
    Object.keys(properties).forEach((key) => this.set(key, properties[key]));
  }

  getGeometry() {
    return this.geometry_;
  }

  setGeometry(geometry) {
    this.geometry_ = geometry;
    this.changed();
  }
}
