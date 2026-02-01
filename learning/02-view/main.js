import {View} from '../shared/view.js';

const stateEl = document.getElementById('state');
const view = new View({center: [0, 0], resolution: 1, rotation: 0});

function renderState() {
  const state = view.getState();
  stateEl.textContent = JSON.stringify(state, null, 2);
}

view.on('change', renderState);
renderState();

document.getElementById('pan-left').addEventListener('click', () => {
  const [x, y] = view.getCenter();
  view.setCenter([x - 10, y]);
});

document.getElementById('pan-right').addEventListener('click', () => {
  const [x, y] = view.getCenter();
  view.setCenter([x + 10, y]);
});

document.getElementById('zoom-in').addEventListener('click', () => {
  view.setResolution(view.getResolution() * 0.8);
});

document.getElementById('zoom-out').addEventListener('click', () => {
  view.setResolution(view.getResolution() * 1.25);
});

document.getElementById('rotate-left').addEventListener('click', () => {
  view.setRotation(view.getRotation() - Math.PI / 12);
});

document.getElementById('rotate-right').addEventListener('click', () => {
  view.setRotation(view.getRotation() + Math.PI / 12);
});
