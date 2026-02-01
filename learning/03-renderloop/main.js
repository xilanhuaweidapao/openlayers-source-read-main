import {View} from '../shared/view.js';
import {Map} from '../shared/map.js';

const frameEl = document.getElementById('frame');

const view = new View({center: [0, 0], resolution: 1, rotation: 0});
const map = new Map({target: 'map', view});

function updateFrame(event) {
  const frameState = event.frameState;
  if (!frameState) {
    frameEl.textContent = 'No frameState';
    return;
  }
  frameEl.textContent = JSON.stringify(
    {
      index: frameState.index,
      time: Math.round(frameState.time),
      size: frameState.size,
      pixelRatio: frameState.pixelRatio,
      viewState: frameState.viewState,
    },
    null,
    2
  );
}

map.on('postrender', updateFrame);

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
