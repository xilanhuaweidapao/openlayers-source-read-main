import {Map} from '../shared/map.js';
import {View} from '../shared/view.js';
import {create, compose, makeInverse, apply} from '../shared/transform.js';

const statsEl = document.getElementById('stats');

const view = new View({center: [0, 0], resolution: 1, rotation: 0});
const coordinateToPixel = create();
const pixelToCoordinate = create();

let points = null;
let bbox = null;

const worker = new Worker('./worker.js', {type: 'module'});
worker.onmessage = (event) => {
  points = new Float32Array(event.data.points);
  bbox = event.data.bbox;
  statsEl.textContent = JSON.stringify(
    {
      count: points.length / 2,
      bbox,
    },
    null,
    2
  );
  map.render();
};

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

  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);
  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);

  if (points) {
    ctx.fillStyle = 'rgba(27, 127, 122, 0.6)';
    for (let i = 0; i < points.length; i += 2) {
      const pixel = apply(coordinateToPixel, [points[i], points[i + 1]]);
      ctx.fillRect(pixel[0], pixel[1], 2, 2);
    }
  }

  if (bbox) {
    const [minX, minY, maxX, maxY] = bbox;
    const p0 = apply(coordinateToPixel, [minX, minY]);
    const p1 = apply(coordinateToPixel, [maxX, maxY]);
    ctx.strokeStyle = '#c25b1a';
    ctx.lineWidth = 2;
    ctx.strokeRect(p0[0], p1[1], p1[0] - p0[0], p0[1] - p1[1]);
  }

  ctx.restore();
}

const map = new Map({target: 'map', view, renderFrame});

document.getElementById('gen-10k').addEventListener('click', () => {
  worker.postMessage({count: 10000});
});

document.getElementById('gen-50k').addEventListener('click', () => {
  worker.postMessage({count: 50000});
});

document.getElementById('clear').addEventListener('click', () => {
  points = null;
  bbox = null;
  statsEl.textContent = 'Cleared.';
  map.render();
});
