// Minimal VectorSource inspired by src/ol/source/Vector.js
import {EventTargetLite} from './events.js';

export class VectorSource extends EventTargetLite {
  constructor(options = {}) {
    super();
    this.features_ = (options.features || []).slice();
  }

  addFeatures(features) {
    features.forEach((feature) => this.features_.push(feature));
    this.dispatchEvent('change');
  }

  getFeatures() {
    return this.features_.slice();
  }
}
