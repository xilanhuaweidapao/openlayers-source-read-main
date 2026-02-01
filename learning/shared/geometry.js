// Minimal geometry classes inspired by src/ol/geom/*

export class Point {
  constructor(coordinate) {
    this.coordinate_ = coordinate.slice();
  }

  getType() {
    return 'Point';
  }

  getCoordinates() {
    return this.coordinate_.slice();
  }
}

export class LineString {
  constructor(coordinates) {
    this.coordinates_ = coordinates.map((coord) => coord.slice());
  }

  getType() {
    return 'LineString';
  }

  getCoordinates() {
    return this.coordinates_.map((coord) => coord.slice());
  }
}

export class Polygon {
  constructor(rings) {
    this.rings_ = rings.map((ring) => ring.map((coord) => coord.slice()));
  }

  getType() {
    return 'Polygon';
  }

  getCoordinates() {
    return this.rings_.map((ring) => ring.map((coord) => coord.slice()));
  }
}
