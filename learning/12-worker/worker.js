self.onmessage = (event) => {
  const count = event.data.count || 0;
  const points = new Float32Array(count * 2);

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 600;
    const y = (Math.random() - 0.5) * 400;
    points[i * 2] = x;
    points[i * 2 + 1] = y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  self.postMessage(
    {
      points: points.buffer,
      bbox: [
        Number(minX.toFixed(2)),
        Number(minY.toFixed(2)),
        Number(maxX.toFixed(2)),
        Number(maxY.toFixed(2)),
      ],
    },
    [points.buffer]
  );
};
