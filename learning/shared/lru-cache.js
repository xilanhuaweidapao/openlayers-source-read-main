// Minimal LRU cache inspired by src/ol/structs/LRUCache.js

export class LRUCache {
  constructor(highWaterMark = 64) {
    this.highWaterMark = highWaterMark;
    this.count_ = 0;
    this.entries_ = {};
    this.oldest_ = null;
    this.newest_ = null;
  }

  getCount() {
    return this.count_;
  }

  canExpireCache() {
    return this.highWaterMark > 0 && this.count_ > this.highWaterMark;
  }

  set(key, value) {
    if (this.entries_[key]) {
      throw new Error('Key already set');
    }
    const entry = {key_: key, value_: value, newer: null, older: this.newest_};
    if (!this.newest_) {
      this.oldest_ = entry;
    } else {
      this.newest_.newer = entry;
    }
    this.newest_ = entry;
    this.entries_[key] = entry;
    this.count_ += 1;
  }

  get(key) {
    const entry = this.entries_[key];
    if (!entry) {
      return undefined;
    }
    if (entry === this.newest_) {
      return entry.value_;
    }
    if (entry === this.oldest_) {
      this.oldest_ = entry.newer;
      if (this.oldest_) {
        this.oldest_.older = null;
      }
    } else {
      entry.newer.older = entry.older;
      entry.older.newer = entry.newer;
    }
    entry.newer = null;
    entry.older = this.newest_;
    this.newest_.newer = entry;
    this.newest_ = entry;
    return entry.value_;
  }

  pop() {
    const entry = this.oldest_;
    if (!entry) {
      return undefined;
    }
    delete this.entries_[entry.key_];
    if (entry.newer) {
      entry.newer.older = null;
    }
    this.oldest_ = entry.newer;
    if (!this.oldest_) {
      this.newest_ = null;
    }
    this.count_ -= 1;
    return entry.value_;
  }

  getKeys() {
    const keys = [];
    let entry = this.newest_;
    while (entry) {
      keys.push(entry.key_);
      entry = entry.older;
    }
    return keys;
  }

  expireCache() {
    while (this.canExpireCache()) {
      this.pop();
    }
  }
}
