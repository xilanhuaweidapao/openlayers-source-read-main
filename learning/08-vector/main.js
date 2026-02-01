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
  new Feature(new Point([120, 80]), {name: 'Point A'}),
  new Feature(new LineString([
    [-140, -60],
    [-80, 20],
    [40, 40],
    [140, -40],
  ])),
  new Feature(new Polygon([
    [
      [-60, 120],
      [20, 160],
      [80, 120],
      [20, 80],
      [-60, 120],
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
      rotation: Number(viewState.rotation.toFixed(2)),
    },
    null,
    2
  );
}

const map = new Map({target: 'map', view, renderFrame});

function pan(dx, dy) {
  const [x, y] = view.getCenter();
  view.setCenter([x + dx, y + dy]);
  map.render();
}

function zoom(factor) {
  view.setResolution(view.getResolution() * factor);
  map.render();
}

function rotate(delta) {
  view.setRotation(view.getRotation() + delta);
  map.render();
}

document.getElementById('pan-left').addEventListener('click', () => pan(-20, 0));
document.getElementById('pan-right').addEventListener('click', () => pan(20, 0));
document.getElementById('zoom-in').addEventListener('click', () => zoom(0.8));
document.getElementById('zoom-out').addEventListener('click', () => zoom(1.25));
document.getElementById('rotate-left').addEventListener('click', () => rotate(-Math.PI / 12));
document.getElementById('rotate-right').addEventListener('click', () => rotate(Math.PI / 12));
