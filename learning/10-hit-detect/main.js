import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {Feature} from '../shared/feature.js';
import {Point, LineString, Polygon} from '../shared/geometry.js';
import {VectorSource} from '../shared/vector-source.js';
import {VectorLayer} from '../shared/vector-layer.js';
import {create, compose, makeInverse, apply} from '../shared/transform.js';

const infoEl = document.getElementById('info');

const features = [
  new Feature(new Point([0, 0]), {name: 'Origin'}),
  new Feature(new Point([140, 60]), {name: 'Point A'}),
  new Feature(new LineString([
    [-160, -80],
    [-60, 20],
    [60, 40],
    [160, -50],
  ]), {name: 'Line 1'}),
  new Feature(new Polygon([
    [
      [-80, 140],
      [40, 180],
      [100, 120],
      [10, 90],
      [-80, 140],
    ],
  ]), {name: 'Polygon 1'}),
];

const source = new VectorSource({features});
let selected = null;
const index = buildGridIndex(features, 120);

const layer = new VectorLayer({
  source,
  style: (feature) => {
    if (feature === selected) {
      return {
        stroke: {color: '#e63946', width: 3},
        fill: {color: 'rgba(230, 57, 70, 0.25)'},
        radius: 8,
      };
    }
    return {
      stroke: {color: '#1b7f7a', width: 2},
      fill: {color: 'rgba(27, 127, 122, 0.18)'},
      radius: 6,
    };
  },
});

const view = new View({center: [0, 0], resolution: 1, rotation: 0});

const coordinateToPixel = create();
const pixelToCoordinate = create();
let lastFrameState = null;

function renderFrame(ctx, frameState) {
  const {size, pixelRatio, viewState} = frameState;

  compose(
    coordinateToPixel,
    size[0] / 2,
    size[1] / 2,
    1 / viewState.resolution,
    -1 / viewState.resolution,
    -viewState.rotation,
    -viewState.center[0],
    -viewState.center[1]
  );
  makeInverse(pixelToCoordinate, coordinateToPixel);

  frameState.coordinateToPixelTransform = coordinateToPixel;
  frameState.pixelToCoordinateTransform = pixelToCoordinate;
  lastFrameState = frameState;

  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);
  ctx.restore();

  layer.render(ctx, frameState, layer.getLayerState());
}

const map = new Map({target: 'map', view, renderFrame});
const canvas = map.getCanvas();

canvas.addEventListener('click', (event) => {
  if (!lastFrameState) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const pixel = [event.clientX - rect.left, event.clientY - rect.top];
  const coord = apply(lastFrameState.pixelToCoordinateTransform, pixel.slice());

  const tolerance = 10 * view.getResolution();
  const searchExtent = [
    coord[0] - tolerance,
    coord[1] - tolerance,
    coord[0] + tolerance,
    coord[1] + tolerance,
  ];
  const candidates = index.search(searchExtent);
  const hit = hitTest(coord, candidates, tolerance);
  selected = hit?.feature || null;
  if (selected) {
    infoEl.textContent = `Hit: ${selected.get('name') || 'feature'} (distance ${hit.distance.toFixed(
      2
    )}) | candidates: ${candidates.length}`;
  } else {
    infoEl.textContent = `No feature hit. | candidates: ${candidates.length}`;
  }
  map.render();
});

function hitTest(coordinate, features, tolerance) {
  let best = null;
  features.forEach((feature) => {
    const geometry = feature.getGeometry();
    const result = distanceToGeometry(coordinate, geometry);
    if (result <= tolerance) {
      if (!best || result < best.distance) {
        best = {feature, distance: result};
      }
    }
  });
  return best;
}

function distanceToGeometry(coord, geometry) {
  const type = geometry.getType();
  if (type === 'Point') {
    const pt = geometry.getCoordinates();
    return Math.hypot(coord[0] - pt[0], coord[1] - pt[1]);
  }
  if (type === 'LineString') {
    return distanceToLine(coord, geometry.getCoordinates());
  }
  if (type === 'Polygon') {
    const rings = geometry.getCoordinates();
    if (pointInPolygon(coord, rings[0])) {
      return 0;
    }
    return distanceToLine(coord, rings[0]);
  }
  return Infinity;
}

function buildGridIndex(features, cellSize) {
  const cells = new Map();
  const keyFor = (x, y) => `${x},${y}`;

  function insert(feature) {
    const extent = geometryExtent(feature.getGeometry());
    const minX = Math.floor(extent[0] / cellSize);
    const maxX = Math.floor(extent[2] / cellSize);
    const minY = Math.floor(extent[1] / cellSize);
    const maxY = Math.floor(extent[3] / cellSize);
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const key = keyFor(cx, cy);
        if (!cells.has(key)) {
          cells.set(key, []);
        }
        cells.get(key).push(feature);
      }
    }
  }

  features.forEach(insert);

  return {
    search(extent) {
      const minX = Math.floor(extent[0] / cellSize);
      const maxX = Math.floor(extent[2] / cellSize);
      const minY = Math.floor(extent[1] / cellSize);
      const maxY = Math.floor(extent[3] / cellSize);
      const set = new Set();
      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = keyFor(cx, cy);
          const bucket = cells.get(key);
          if (!bucket) {
            continue;
          }
          bucket.forEach((feature) => set.add(feature));
        }
      }
      return Array.from(set);
    },
  };
}

function geometryExtent(geometry) {
  const type = geometry.getType();
  if (type === 'Point') {
    const [x, y] = geometry.getCoordinates();
    return [x, y, x, y];
  }
  if (type === 'LineString') {
    return extentFromCoords(geometry.getCoordinates());
  }
  if (type === 'Polygon') {
    const rings = geometry.getCoordinates();
    return extentFromCoords(rings[0]);
  }
  return [0, 0, 0, 0];
}

function extentFromCoords(coords) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  coords.forEach(([x, y]) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });
  return [minX, minY, maxX, maxY];
}

function distanceToLine(point, line) {
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const dist = distanceToSegment(point, line[i], line[i + 1]);
    if (dist < min) {
      min = dist;
    }
  }
  return min;
}

function distanceToSegment(p, a, b) {
  const abx = b[0] - a[0];
  const aby = b[1] - a[1];
  const apx = p[0] - a[0];
  const apy = p[1] - a[1];
  const denom = abx * abx + aby * aby;
  const t = denom === 0 ? 0 : Math.max(0, Math.min(1, (apx * abx + apy * aby) / denom));
  const projx = a[0] + t * abx;
  const projy = a[1] + t * aby;
  return Math.hypot(p[0] - projx, p[1] - projy);
}

function pointInPolygon(point, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersect =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}
