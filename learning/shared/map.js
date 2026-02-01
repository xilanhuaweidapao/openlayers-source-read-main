// Minimal Map render loop inspired by src/ol/Map.js renderFrame_ flow
import {EventTargetLite} from './events.js';

export class Map extends EventTargetLite {
  constructor(options) {
    super();
    this.target_ = null;
    this.view_ = null;
    this.frameState_ = null;
    this.frameIndex_ = 0;
    this.rafKey_ = null;
    this.pixelRatio_ = window.devicePixelRatio || 1;
    this.size_ = [0, 0];
    this.renderFrameCallback_ = options?.renderFrame || null;
    this.frameStateHook_ = options?.frameStateHook || null;

    this.canvas_ = document.createElement('canvas');
    this.canvas_.width = 800;
    this.canvas_.height = 500;
    this.ctx_ = this.canvas_.getContext('2d');

    this.boundResize_ = this.handleResize_.bind(this);
    this.boundViewChange_ = this.handleViewChange_.bind(this);

    if (options?.target) {
      this.setTarget(options.target);
    }
    if (options?.view) {
      this.setView(options.view);
    }
  }

  setTarget(target) {
    const element = typeof target === 'string' ? document.getElementById(target) : target;
    if (!element) {
      throw new Error('Map target not found');
    }
    if (this.target_) {
      this.target_.removeChild(this.canvas_);
      window.removeEventListener('resize', this.boundResize_);
    }
    this.target_ = element;
    this.target_.appendChild(this.canvas_);
    window.addEventListener('resize', this.boundResize_);
    this.handleResize_();
    this.render();
  }

  setView(view) {
    if (this.view_) {
      this.view_.un('change', this.boundViewChange_);
    }
    this.view_ = view;
    if (this.view_) {
      this.view_.on('change', this.boundViewChange_);
    }
    this.render();
  }

  getSize() {
    return this.size_.slice();
  }

  getCanvas() {
    return this.canvas_;
  }

  render() {
    if (this.rafKey_ !== null) {
      return;
    }
    this.rafKey_ = requestAnimationFrame((time) => {
      this.rafKey_ = null;
      this.renderFrame_(time);
    });
  }

  handleResize_() {
    if (!this.target_) {
      return;
    }
    const rect = this.target_.getBoundingClientRect();
    this.pixelRatio_ = window.devicePixelRatio || 1;
    this.size_ = [
      Math.max(1, Math.floor(rect.width)),
      Math.max(1, Math.floor(rect.height)),
    ];
    this.canvas_.width = Math.floor(this.size_[0] * this.pixelRatio_);
    this.canvas_.height = Math.floor(this.size_[1] * this.pixelRatio_);
    this.render();
  }

  handleViewChange_() {
    this.render();
  }

  renderFrame_(time) {
    if (!this.view_) {
      this.frameState_ = null;
      return;
    }

    const size = this.getSize();
    const viewState = this.view_.getState();
    this.frameState_ = {
      time,
      index: this.frameIndex_++,
      size,
      pixelRatio: this.pixelRatio_,
      viewState,
    };
    if (this.frameStateHook_) {
      this.frameStateHook_(this.frameState_);
    }

    this.drawFrame_(this.frameState_);
    this.dispatchEvent({type: 'postrender', frameState: this.frameState_});
  }

  drawFrame_(frameState) {
    if (this.renderFrameCallback_) {
      this.renderFrameCallback_(this.ctx_, frameState);
      return;
    }
    const {size, viewState} = frameState;
    const ctx = this.ctx_;
    ctx.save();
    ctx.setTransform(this.pixelRatio_, 0, 0, this.pixelRatio_, 0, 0);
    ctx.clearRect(0, 0, size[0], size[1]);

    ctx.fillStyle = '#fffdf9';
    ctx.fillRect(0, 0, size[0], size[1]);

    ctx.translate(size[0] / 2, size[1] / 2);
    ctx.rotate(viewState.rotation);

    ctx.strokeStyle = '#c25b1a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-50, 0);
    ctx.lineTo(50, 0);
    ctx.moveTo(0, -50);
    ctx.lineTo(0, 50);
    ctx.stroke();

    ctx.restore();
  }
}
