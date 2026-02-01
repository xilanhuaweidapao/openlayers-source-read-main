import {View} from '../shared/view.js';
import {Map} from '../shared/map.js';
import {create, compose, apply, makeInverse} from '../shared/transform.js';

const matrixEl = document.getElementById('matrix');
const cursorEl = document.getElementById('cursor');
const sampleEl = document.getElementById('sample');

const view = new View({center: [0, 0], resolution: 1, rotation: 0});
const coordinateToPixel = create();
const pixelToCoordinate = create();

let lastFrameState = null;

function formatTransform(transform) {
  return transform.map((value) => value.toFixed(3)).join(', ');
}

function toPixel(x, y) {
  return apply(coordinateToPixel, [x, y]);
}

function renderFrame(ctx, frameState) {
  const {size, viewState, pixelRatio} = frameState;

  // Similar to MapRenderer.calculateMatrices2D in src/ol/renderer/Map.js
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
  lastFrameState = frameState;

  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.clearRect(0, 0, size[0], size[1]);

  ctx.fillStyle = '#fffdf9';
  ctx.fillRect(0, 0, size[0], size[1]);

  const halfWidth = (size[0] / 2) * viewState.resolution;
  const halfHeight = (size[1] / 2) * viewState.resolution;
  const minX = viewState.center[0] - halfWidth;
  const maxX = viewState.center[0] + halfWidth;
  const minY = viewState.center[1] - halfHeight;
  const maxY = viewState.center[1] + halfHeight;

  const spacing = 80 * viewState.resolution;
  const startX = Math.floor(minX / spacing) * spacing;
  const startY = Math.floor(minY / spacing) * spacing;

  ctx.strokeStyle = 'rgba(27, 127, 122, 0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = startX; x <= maxX; x += spacing) {
    const p0 = toPixel(x, minY);
    const p1 = toPixel(x, maxY);
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
  }
  for (let y = startY; y <= maxY; y += spacing) {
    const p0 = toPixel(minX, y);
    const p1 = toPixel(maxX, y);
    ctx.moveTo(p0[0], p0[1]);
    ctx.lineTo(p1[0], p1[1]);
  }
  ctx.stroke();

  ctx.strokeStyle = '#c25b1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const centerLineH0 = toPixel(minX, viewState.center[1]);
  const centerLineH1 = toPixel(maxX, viewState.center[1]);
  ctx.moveTo(centerLineH0[0], centerLineH0[1]);
  ctx.lineTo(centerLineH1[0], centerLineH1[1]);

  const centerLineV0 = toPixel(viewState.center[0], minY);
  const centerLineV1 = toPixel(viewState.center[0], maxY);
  ctx.moveTo(centerLineV0[0], centerLineV0[1]);
  ctx.lineTo(centerLineV1[0], centerLineV1[1]);
  ctx.stroke();

  const sampleCoord = [
    viewState.center[0] + 120 * viewState.resolution,
    viewState.center[1] + 80 * viewState.resolution,
  ];
  const samplePixel = toPixel(sampleCoord[0], sampleCoord[1]);

  ctx.fillStyle = '#1b7f7a';
  ctx.beginPath();
  ctx.arc(samplePixel[0], samplePixel[1], 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  matrixEl.textContent = [
    `coordinateToPixel: [${formatTransform(coordinateToPixel)}]`,
    `pixelToCoordinate: [${formatTransform(pixelToCoordinate)}]`,
    `viewState: ${JSON.stringify(viewState)}`,
  ].join('\n');

  sampleEl.textContent = `Sample: coord ${sampleCoord.map((v) => v.toFixed(2)).join(', ')} -> pixel ${samplePixel
    .map((v) => v.toFixed(2))
    .join(', ')}`;
}

const map = new Map({target: 'map', view, renderFrame});

function pan(dx) {
  const [x, y] = view.getCenter();
  view.setCenter([x + dx, y]);
}

function zoom(factor) {
  view.setResolution(view.getResolution() * factor);
}

function rotate(delta) {
  view.setRotation(view.getRotation() + delta);
}

document.getElementById('pan-left').addEventListener('click', () => pan(-10));
document.getElementById('pan-right').addEventListener('click', () => pan(10));
document.getElementById('zoom-in').addEventListener('click', () => zoom(0.8));
document.getElementById('zoom-out').addEventListener('click', () => zoom(1.25));
document.getElementById('rotate-left').addEventListener('click', () => rotate(-Math.PI / 12));
document.getElementById('rotate-right').addEventListener('click', () => rotate(Math.PI / 12));

const canvas = map.getCanvas();
canvas.addEventListener('mousemove', (event) => {
  if (!lastFrameState) {
    return;
  }
  const rect = canvas.getBoundingClientRect();
  const pixel = [event.clientX - rect.left, event.clientY - rect.top];
  const coord = apply(pixelToCoordinate, pixel.slice());
  cursorEl.textContent = `Cursor: pixel ${pixel.map((v) => v.toFixed(2)).join(', ')} -> coord ${coord
    .map((v) => v.toFixed(2))
    .join(', ')}`;
});
