import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {Layer} from '../shared/layer.js';
import {EventTargetLite} from '../shared/events.js';
import {DROP} from '../shared/priority-queue.js';
import {TileQueue} from '../shared/tile-queue.js';
import {
  getTileSize,
  lonLatToWorldPixel,
  worldPixelToLonLat,
  wrapTileX,
  clampTileY,
} from '../shared/tilemath.js';

const statsEl = document.getElementById('stats');

const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

class Tile extends EventTargetLite {
  constructor(z, x, y, url) {
    super();
    this.z_ = z;
    this.x_ = x;
    this.y_ = y;
    this.key_ = `${z}/${x}/${y}`;
    this.state_ = 'idle';
    this.url_ = url;
    this.img_ = new Image();
    this.img_.crossOrigin = 'anonymous';
  }

  getKey() {
    return this.key_;
  }

  getState() {
    return this.state_;
  }

  getImage() {
    return this.img_;
  }

  load() {
    if (this.state_ !== 'idle') {
      return;
    }
    this.state_ = 'loading';
    this.dispatchEvent('change');
    this.img_.onload = () => {
      this.state_ = 'loaded';
      this.dispatchEvent('change');
    };
    this.img_.onerror = () => {
      this.state_ = 'error';
      this.dispatchEvent('change');
    };
    this.img_.src = this.url_;
  }
}

class TileLayer extends Layer {
  constructor(options) {
    super(options);
    this.urlTemplate_ = options.url;
    this.cache_ = new Map();
  }

  getTile(z, x, y) {
    const key = `${z}/${x}/${y}`;
    if (this.cache_.has(key)) {
      return this.cache_.get(key);
    }
    const url = this.urlTemplate_
      .replace('{z}', z)
      .replace('{x}', x)
      .replace('{y}', y);
    const tile = new Tile(z, x, y, url);
    this.cache_.set(key, tile);
    return tile;
  }

  render(ctx, frameState, layerState, wantedTiles, tileMeta, sourceKey) {
    if (!layerState.visible) {
      return;
    }
    const {size, pixelRatio} = frameState;
    const {zoom, center} = frameState.viewState;
    const tileSize = getTileSize();

    const halfW = size[0] / 2;
    const halfH = size[1] / 2;
    const minX = center[0] - halfW;
    const minY = center[1] - halfH;
    const maxX = center[0] + halfW;
    const maxY = center[1] + halfH;

    const minTileX = Math.floor(minX / tileSize);
    const maxTileX = Math.floor((maxX - 1) / tileSize);
    const minTileY = Math.floor(minY / tileSize);
    const maxTileY = Math.floor((maxY - 1) / tileSize);

    ctx.save();
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.globalAlpha = layerState.opacity;

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      const y = clampTileY(ty, zoom);
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const x = wrapTileX(tx, zoom);
        const tile = this.getTile(zoom, x, y);
        if (!wantedTiles[sourceKey]) {
          wantedTiles[sourceKey] = {};
        }
        wantedTiles[sourceKey][tile.getKey()] = true;
        tileMeta[tile.getKey()] = {
          center: [tx * tileSize + tileSize / 2, y * tileSize + tileSize / 2],
          resolution: Math.pow(2, -zoom),
        };

        const dx = tx * tileSize - minX;
        const dy = y * tileSize - minY;
        if (tile.getState() === 'loaded') {
          ctx.drawImage(tile.getImage(), dx, dy, tileSize, tileSize);
        } else {
          ctx.fillStyle = 'rgba(194, 91, 26, 0.08)';
          ctx.fillRect(dx, dy, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(194, 91, 26, 0.2)';
          ctx.strokeRect(dx, dy, tileSize, tileSize);
        }
      }
    }
    ctx.restore();
  }
}

const view = new View({center: [0, 0], resolution: 1, rotation: 0});
view.set('zoom', 3);
view.setCenter(lonLatToWorldPixel(0, 0, view.get('zoom')));

const tileLayer = new TileLayer({url: TILE_URL});

let currentFrameState = null;
let interacting = false;

const tileSourceKey = 'osm';
const wantedTiles = {};
const tileMeta = {};

function getTilePriority(frameState, tile, sourceKey) {
  if (!frameState || !frameState.wantedTiles?.[sourceKey]) {
    return DROP;
  }
  if (!frameState.wantedTiles[sourceKey][tile.getKey()]) {
    return DROP;
  }
  const meta = tileMeta[tile.getKey()];
  if (!meta) {
    return DROP;
  }
  const center = frameState.viewState.center;
  const tileCenter = meta.center;
  const tileResolution = meta.resolution;
  const dx = tileCenter[0] - center[0];
  const dy = tileCenter[1] - center[1];
  return (
    65536 * Math.log(tileResolution) +
    Math.sqrt(dx * dx + dy * dy) / tileResolution
  );
}

const tileQueue = new TileQueue(
  (element) => getTilePriority(currentFrameState, element[0], element[1]),
  () => map.render()
);

function renderFrame(ctx, frameState) {
  const {size, pixelRatio, viewState} = frameState;
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);
  ctx.restore();

  Object.keys(wantedTiles).forEach((key) => delete wantedTiles[key]);
  Object.keys(tileMeta).forEach((key) => delete tileMeta[key]);
  tileLayer.render(ctx, frameState, tileLayer.getLayerState(), wantedTiles, tileMeta, tileSourceKey);

  const lonLat = worldPixelToLonLat(viewState.center[0], viewState.center[1], viewState.zoom);
  statsEl.textContent = JSON.stringify(
    {
      zoom: viewState.zoom,
      interacting,
      tilesQueued: tileQueue.getCount(),
      tilesLoading: tileQueue.getTilesLoading(),
      wantedTiles: Object.keys(wantedTiles[tileSourceKey] || {}).length,
      centerLonLat: lonLat.map((v) => Number(v.toFixed(4))),
    },
    null,
    2
  );
}

const map = new Map({
  target: 'map',
  view,
  renderFrame,
  frameStateHook: (frameState) => {
    frameState.viewState.zoom = view.get('zoom');
    frameState.viewHints = {interacting};
    frameState.wantedTiles = wantedTiles;
  },
});

map.on('postrender', (event) => {
  currentFrameState = event.frameState;
  if (!currentFrameState) {
    return;
  }

  const wantedKeys = Object.keys(wantedTiles[tileSourceKey] || {});
  wantedKeys.forEach((key) => {
    const tile = tileLayer.cache_.get(key);
    if (tile && tile.getState() === 'idle' && !tileQueue.isKeyQueued(tile.getKey())) {
      tileQueue.enqueue([tile, tileSourceKey]);
    }
  });

  tileQueue.reprioritize();
  const lowOnFrameBudget = Date.now() - currentFrameState.time > 8;
  let maxTotalLoading = 16;
  let maxNewLoads = 16;
  if (interacting) {
    maxTotalLoading = lowOnFrameBudget ? 0 : 8;
    maxNewLoads = lowOnFrameBudget ? 0 : 2;
  }
  if (tileQueue.getTilesLoading() < maxTotalLoading) {
    tileQueue.loadMoreTiles(maxTotalLoading, maxNewLoads);
  }
});

function setZoom(nextZoom) {
  const zoom = Math.max(1, Math.min(6, nextZoom));
  const prevZoom = view.get('zoom');
  if (zoom === prevZoom) {
    return;
  }
  const scale = Math.pow(2, zoom - prevZoom);
  const [cx, cy] = view.getCenter();
  view.set('zoom', zoom);
  view.setCenter([cx * scale, cy * scale]);
  map.render();
}

document.getElementById('zoom-in').addEventListener('click', () => setZoom(view.get('zoom') + 1));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(view.get('zoom') - 1));

document.getElementById('toggle-interact').addEventListener('click', () => {
  interacting = !interacting;
  map.render();
});
