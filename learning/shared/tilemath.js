// Minimal tile math helpers for XYZ tiles
const TILE_SIZE = 256;

export function getTileSize() {
  return TILE_SIZE;
}

export function lonLatToWorldPixel(lon, lat, zoom) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = ((lon + 180) / 360) * n * TILE_SIZE;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
    n *
    TILE_SIZE;
  return [x, y];
}

export function worldPixelToLonLat(x, y, zoom) {
  const n = Math.pow(2, zoom);
  const lon = (x / (n * TILE_SIZE)) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / (n * TILE_SIZE))));
  const lat = (latRad * 180) / Math.PI;
  return [lon, lat];
}

export function wrapTileX(x, zoom) {
  const limit = Math.pow(2, zoom);
  const wrapped = ((x % limit) + limit) % limit;
  return wrapped;
}

export function clampTileY(y, zoom) {
  const limit = Math.pow(2, zoom);
  return Math.min(limit - 1, Math.max(0, y));
}
