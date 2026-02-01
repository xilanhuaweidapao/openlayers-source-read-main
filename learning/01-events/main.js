import {ObservableObject} from '../shared/events.js';

const log = document.getElementById('log');
const lines = [];

function write(message) {
  lines.unshift(message);
  log.textContent = lines.slice(0, 8).join('\n');
}

const obj = new ObservableObject();

obj.on('change', () => write('change (any property)'));
obj.on('propertychange', (event) =>
  write(`propertychange: ${event.key} ${event.oldValue} -> ${event.newValue}`)
);
obj.on('change:x', (event) =>
  write(`change:x ${event.oldValue} -> ${event.newValue}`)
);

function setValue(value) {
  obj.set('x', value);
}

document.getElementById('set-x-1').addEventListener('click', () => setValue(1));
document.getElementById('set-x-2').addEventListener('click', () => setValue(2));
document
  .getElementById('set-x-2-again')
  .addEventListener('click', () => setValue(2));

write('Ready. Click a button to set x.');
