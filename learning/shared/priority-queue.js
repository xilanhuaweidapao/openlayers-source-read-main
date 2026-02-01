// Minimal priority queue inspired by src/ol/structs/PriorityQueue.js

export const DROP = Infinity;

export class PriorityQueue {
  constructor(priorityFunction, keyFunction) {
    this.priorityFunction_ = priorityFunction;
    this.keyFunction_ = keyFunction;
    this.elements_ = [];
    this.priorities_ = [];
    this.queuedElements_ = {};
  }

  enqueue(element) {
    const key = this.keyFunction_(element);
    if (this.queuedElements_[key]) {
      throw new Error('Element already queued');
    }
    const priority = this.priorityFunction_(element);
    if (priority === DROP) {
      return false;
    }
    this.elements_.push(element);
    this.priorities_.push(priority);
    this.queuedElements_[key] = true;
    this.siftDown_(0, this.elements_.length - 1);
    return true;
  }

  dequeue() {
    const element = this.elements_[0];
    if (this.elements_.length === 1) {
      this.elements_.length = 0;
      this.priorities_.length = 0;
    } else {
      this.elements_[0] = this.elements_.pop();
      this.priorities_[0] = this.priorities_.pop();
      this.siftUp_(0);
    }
    delete this.queuedElements_[this.keyFunction_(element)];
    return element;
  }

  reprioritize() {
    const elements = this.elements_;
    const priorities = this.priorities_;
    let index = 0;
    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];
      const priority = this.priorityFunction_(element);
      if (priority === DROP) {
        delete this.queuedElements_[this.keyFunction_(element)];
      } else {
        priorities[index] = priority;
        elements[index++] = element;
      }
    }
    elements.length = index;
    priorities.length = index;
    this.heapify_();
  }

  isEmpty() {
    return this.elements_.length === 0;
  }

  getCount() {
    return this.elements_.length;
  }

  isKeyQueued(key) {
    return !!this.queuedElements_[key];
  }

  isQueued(element) {
    return this.isKeyQueued(this.keyFunction_(element));
  }

  siftUp_(index) {
    const elements = this.elements_;
    const priorities = this.priorities_;
    const count = elements.length;
    const element = elements[index];
    const priority = priorities[index];
    const startIndex = index;

    while (index < count >> 1) {
      const l = index * 2 + 1;
      const r = index * 2 + 2;
      const smallerChild = r < count && priorities[r] < priorities[l] ? r : l;
      elements[index] = elements[smallerChild];
      priorities[index] = priorities[smallerChild];
      index = smallerChild;
    }

    elements[index] = element;
    priorities[index] = priority;
    this.siftDown_(startIndex, index);
  }

  siftDown_(startIndex, index) {
    const elements = this.elements_;
    const priorities = this.priorities_;
    const element = elements[index];
    const priority = priorities[index];

    while (index > startIndex) {
      const parentIndex = (index - 1) >> 1;
      if (priorities[parentIndex] > priority) {
        elements[index] = elements[parentIndex];
        priorities[index] = priorities[parentIndex];
        index = parentIndex;
      } else {
        break;
      }
    }

    elements[index] = element;
    priorities[index] = priority;
  }

  heapify_() {
    for (let i = (this.elements_.length >> 1) - 1; i >= 0; i--) {
      this.siftUp_(i);
    }
  }
}
