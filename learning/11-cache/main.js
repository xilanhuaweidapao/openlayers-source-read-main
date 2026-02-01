import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {Layer} from '../shared/layer.js';
import {LRUCache} from '../shared/lru-cache.js';
import {
  getTileSize,
  lonLatToWorldPixel,
  worldPixelToLonLat,
  wrapTileX,
  clampTileY,
} from '../shared/tilemath.js';

const statsEl = document.getElementById('stats');
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

class TileLayer extends Layer {
  constructor(options) {
    super(options);
    this.urlTemplate_ = options.url;
    this.cache_ = new LRUCache(options.cacheSize || 40);
  }

  getTileKey(z, x, y) {
    return `${z}/${x}/${y}`;
  }

  getTile(z, x, y) {
    const key = this.getTileKey(z, x, y);
    let tile = this.cache_.get(key);
    if (!tile) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = this.urlTemplate_
        .replace('{z}', z)
        .replace('{x}', x)
        .replace('{y}', y);
      tile = {img, state: 'loading', key};
      img.onload = () => (tile.state = 'loaded');
      img.onerror = () => (tile.state = 'error');
      this.cache_.set(key, tile);
    }
    return tile;
  }

  render(ctx, frameState, layerState) {
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
        const dx = tx * tileSize - minX;
        const dy = y * tileSize - minY;
        if (tile.state === 'loaded') {
          ctx.drawImage(tile.img, dx, dy, tileSize, tileSize);
        } else {
          ctx.fillStyle = 'rgba(27, 127, 122, 0.08)';
          ctx.fillRect(dx, dy, tileSize, tileSize);
          ctx.strokeStyle = 'rgba(27, 127, 122, 0.2)';
          ctx.strokeRect(dx, dy, tileSize, tileSize);
        }
      }
    }

    ctx.restore();
    this.cache_.expireCache();
  }
}

const view = new View({center: [0, 0], resolution: 1, rotation: 0});
view.set('zoom', 3);
view.setCenter(lonLatToWorldPixel(2.3522, 48.8566, view.get('zoom')));

const tileLayer = new TileLayer({url: TILE_URL, cacheSize: 40});

function renderFrame(ctx, frameState) {
  const {size, pixelRatio, viewState} = frameState;
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);
  ctx.restore();

  tileLayer.render(ctx, frameState, tileLayer.getLayerState());

  const lonLat = worldPixelToLonLat(viewState.center[0], viewState.center[1], viewState.zoom);
  statsEl.textContent = JSON.stringify(
    {
      zoom: viewState.zoom,
      cacheSize: tileLayer.cache_.getCount(),
      cacheKeys: tileLayer.cache_.getKeys().slice(0, 8),
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
  },
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

function goTo(lon, lat) {
  const zoom = view.get('zoom');
  view.setCenter(lonLatToWorldPixel(lon, lat, zoom));
  map.render();
}

document.getElementById('zoom-in').addEventListener('click', () => setZoom(view.get('zoom') + 1));
document.getElementById('zoom-out').addEventListener('click', () => setZoom(view.get('zoom') - 1));

document.getElementById('go-paris').addEventListener('click', () => goTo(2.3522, 48.8566));
document.getElementById('go-sf').addEventListener('click', () => goTo(-122.4194, 37.7749));
