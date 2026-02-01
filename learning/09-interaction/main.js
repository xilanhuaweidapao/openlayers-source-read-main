import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {Feature} from '../shared/feature.js';
import {Point, LineString, Polygon} from '../shared/geometry.js';
import {VectorSource} from '../shared/vector-source.js';
import {VectorLayer} from '../shared/vector-layer.js';
import {create, compose, makeInverse} from '../shared/transform.js';

const infoEl = document.getElementById('info');

const features = [
  new Feature(new Point([0, 0]), {name: 'Origin'}),
  new Feature(new Point([150, 70]), {name: 'Point A'}),
  new Feature(new LineString([
    [-160, -80],
    [-60, 20],
    [60, 40],
    [160, -50],
  ])),
  new Feature(new Polygon([
    [
      [-80, 140],
      [40, 180],
      [100, 120],
      [10, 90],
      [-80, 140],
    ],
  ])),
];

const source = new VectorSource({features});

const layer = new VectorLayer({
  source,
  style: (feature) => {
    const name = feature.get('name');
    if (name) {
      return {
        stroke: {color: '#c25b1a', width: 2},
        fill: {color: 'rgba(194, 91, 26, 0.2)'},
        radius: 7,
      };
    }
    return {
      stroke: {color: '#1b7f7a', width: 2},
      fill: {color: 'rgba(27, 127, 122, 0.18)'},
      radius: 5,
    };
  },
});

const view = new View({center: [0, 0], resolution: 1, rotation: 0});

const coordinateToPixel = create();
const pixelToCoordinate = create();

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

  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);
  ctx.restore();

  layer.render(ctx, frameState, layer.getLayerState());

  infoEl.textContent = JSON.stringify(
    {
      center: viewState.center.map((v) => Number(v.toFixed(2))),
      resolution: Number(viewState.resolution.toFixed(2)),
    },
    null,
    2
  );
}

const map = new Map({target: 'map', view, renderFrame});
const canvas = map.getCanvas();

let dragging = false;
let lastPixel = null;

canvas.addEventListener('pointerdown', (event) => {
  dragging = true;
  lastPixel = [event.clientX, event.clientY];
  canvas.setPointerCapture(event.pointerId);
});

canvas.addEventListener('pointermove', (event) => {
  if (!dragging) {
    return;
  }
  const pixel = [event.clientX, event.clientY];
  const dx = pixel[0] - lastPixel[0];
  const dy = pixel[1] - lastPixel[1];
  lastPixel = pixel;

  const resolution = view.getResolution();
  const [cx, cy] = view.getCenter();
  view.setCenter([cx - dx * resolution, cy + dy * resolution]);
});

canvas.addEventListener('pointerup', (event) => {
  dragging = false;
  canvas.releasePointerCapture(event.pointerId);
});

canvas.addEventListener('pointerleave', () => {
  dragging = false;
});

canvas.addEventListener('wheel', (event) => {
  event.preventDefault();
  const delta = event.deltaY;
  const factor = delta > 0 ? 1.1 : 0.9;
  view.setResolution(view.getResolution() * factor);
}, {passive: false});
