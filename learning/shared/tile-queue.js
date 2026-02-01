// Minimal tile queue inspired by src/ol/TileQueue.js
import {PriorityQueue} from './priority-queue.js';

export class TileQueue extends PriorityQueue {
  constructor(priorityFunction, tileChangeCallback) {
    super(priorityFunction, (element) => element[0].getKey());
    this.tileChangeCallback_ = tileChangeCallback;
    this.tilesLoading_ = 0;
    this.tilesLoadingKeys_ = {};
    this.boundHandleTileChange_ = (event) => this.handleTileChange_(event);
  }

  getTilesLoading() {
    return this.tilesLoading_;
  }

  enqueue(element) {
    const added = super.enqueue(element);
    if (added) {
      element[0].addEventListener('change', this.boundHandleTileChange_);
    }
    return added;
  }

  handleTileChange_(event) {
    const tile = event.target;
    const state = tile.getState();
    if (state === 'loaded' || state === 'error') {
      const key = tile.getKey();
      if (this.tilesLoadingKeys_[key]) {
        delete this.tilesLoadingKeys_[key];
        this.tilesLoading_ -= 1;
      }
      this.tileChangeCallback_();
    }
  }

  loadMoreTiles(maxTotalLoading, maxNewLoads) {
    let newLoads = 0;
    while (
      this.tilesLoading_ < maxTotalLoading &&
      newLoads < maxNewLoads &&
      this.getCount() > 0
    ) {
      const tile = this.dequeue()[0];
      const key = tile.getKey();
      const state = tile.getState();
      if (state === 'idle' && !this.tilesLoadingKeys_[key]) {
        this.tilesLoadingKeys_[key] = true;
        this.tilesLoading_ += 1;
        newLoads += 1;
        tile.load();
      }
    }
  }
}
