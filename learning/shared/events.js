// Minimal event system inspired by src/ol/events/Target.js and src/ol/Observable.js

export class EventTargetLite {
  constructor() {
    this.listeners_ = new Map();
  }

  on(type, listener) {
    const list = this.listeners_.get(type) || [];
    list.push(listener);
    this.listeners_.set(type, list);
    return listener;
  }

  once(type, listener) {
    const wrapped = (event) => {
      this.un(type, wrapped);
      listener(event);
    };
    return this.on(type, wrapped);
  }

  un(type, listener) {
    const list = this.listeners_.get(type);
    if (!list) {
      return;
    }
    const next = list.filter((item) => item !== listener);
    if (next.length) {
      this.listeners_.set(type, next);
    } else {
      this.listeners_.delete(type);
    }
  }

  dispatchEvent(event) {
    const evt = typeof event === 'string' ? {type: event} : event;
    evt.target = evt.target || this;
    const list = this.listeners_.get(evt.type);
    if (!list) {
      return true;
    }
    list.slice().forEach((listener) => listener(evt));
    return !evt.defaultPrevented;
  }
}

// Minimal observable object inspired by src/ol/Object.js
export class ObservableObject extends EventTargetLite {
  constructor() {
    super();
    this.values_ = {};
  }

  get(key) {
    return this.values_[key];
  }

  set(key, value) {
    const prev = this.values_[key];
    if (prev === value) {
      return;
    }
    this.values_[key] = value;
    this.dispatchEvent({
      type: `change:${key}`,
      key,
      oldValue: prev,
      newValue: value,
    });
    this.dispatchEvent({
      type: 'propertychange',
      key,
      oldValue: prev,
      newValue: value,
    });
    this.changed();
  }

  changed() {
    this.dispatchEvent('change');
  }
}
