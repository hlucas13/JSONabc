// ── Physics-Based Liquid Glass Displacement Map ──
// Generates per-surface displacement maps based on Snell's-law refraction
// for a convex glass bezel.
//
// Two SVG filters are maintained:
//   #glass-distortion-dock  — pill-shaped floating dock (updated on resize)
//   #glass-distortion-panel — modals and menus (objectBoundingBox)

const GlassDistortion = {
  // Index of refraction of the glass (1.45 ≈ borosilicate / optical glass)
  IOR: 1.45,

  // Controls how steeply the convex surface rises from the outer edge.
  GLASS_THICKNESS: 0.72,

  // Bezel width relative to min(element_size) / 2.
  BEZEL_FRACTION: 0.38,

  _innerDist(
    px: number,
    py: number,
    cx: number,
    cy: number,
    hw: number,
    hh: number,
    r: number,
  ): number {
    const qx = Math.abs(px - cx) - (hw - r);
    const qy = Math.abs(py - cy) - (hh - r);
    const outer =
      Math.sqrt(Math.max(qx, 0) ** 2 + Math.max(qy, 0) ** 2) + Math.min(Math.max(qx, qy), 0) - r;
    return -outer;
  },

  _neutralDataUrl(): string {
    const c = document.createElement('canvas');
    c.width = 2;
    c.height = 2;
    const ctx = c.getContext('2d')!;
    const id = ctx.createImageData(2, 2);
    for (let i = 0; i < 16; i += 4) {
      id.data[i] = id.data[i + 1] = id.data[i + 2] = 128;
      id.data[i + 3] = 255;
    }
    ctx.putImageData(id, 0, 0);
    return c.toDataURL('image/png');
  },

  build(
    width: number,
    height: number,
    borderRadius: number,
  ): { dataUrl: string; scale: number; width: number; height: number } {
    const W = Math.max(Math.ceil(width), 2);
    const H = Math.max(Math.ceil(height), 2);
    const R = Math.min(borderRadius, Math.min(W, H) / 2);
    const cx = W / 2;
    const cy = H / 2;
    const bezelW = Math.min(Math.min(W, H) * this.BEZEL_FRACTION * 0.5, R * 0.85);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;
    const imgData = ctx.createImageData(W, H);
    const d = imgData.data;

    const mags = new Float32Array(W * H);
    const dxArr = new Float32Array(W * H);
    const dyArr = new Float32Array(W * H);
    let maxMag = 0;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const dist = this._innerDist(px, py, cx, cy, W / 2, H / 2, R);
        const i = y * W + x;

        if (dist <= 0 || dist >= bezelW) continue;

        const t = dist / bezelW;
        const slope = (this.GLASS_THICKNESS * 0.5) / Math.sqrt(t + 0.001);
        const sinT1 = slope / Math.sqrt(1 + slope * slope);
        const cosT1 = Math.sqrt(Math.max(0, 1 - sinT1 * sinT1));
        const sinT2 = sinT1 / this.IOR;
        const cosT2 = Math.sqrt(Math.max(0, 1 - sinT2 * sinT2));
        const tanT1 = sinT1 / (cosT1 + 1e-9);
        const tanT2 = sinT2 / (cosT2 + 1e-9);
        const mag = Math.abs(tanT1 - tanT2) * bezelW;

        mags[i] = mag;
        if (mag > maxMag) maxMag = mag;

        const nx = cx - px;
        const ny = cy - py;
        const len = Math.sqrt(nx * nx + ny * ny) + 1e-9;
        dxArr[i] = nx / len;
        dyArr[i] = ny / len;
      }
    }

    if (maxMag < 0.001) maxMag = 1;

    for (let i = 0; i < W * H; i++) {
      const idx = i * 4;
      const mag = mags[i];
      if (mag > 0) {
        const n = mag / maxMag;
        d[idx] = Math.min(255, Math.max(0, (128 + dxArr[i] * n * 127 + 0.5) | 0));
        d[idx + 1] = Math.min(255, Math.max(0, (128 + dyArr[i] * n * 127 + 0.5) | 0));
      } else {
        d[idx] = 128;
        d[idx + 1] = 128;
      }
      d[idx + 2] = 128;
      d[idx + 3] = 255;
    }

    ctx.putImageData(imgData, 0, 0);
    return {
      dataUrl: canvas.toDataURL('image/png'),
      scale: maxMag,
      width: W,
      height: H,
    };
  },

  _applyToDock(w: number, h: number): void {
    const filter = document.getElementById('glass-distortion-dock');
    if (!filter) return;
    const feImg = filter.querySelector('feImage') as SVGElement | null;
    const feDisp = filter.querySelector('feDisplacementMap') as SVGElement | null;
    if (!feImg || !feDisp) return;

    const r = h / 2;
    const { dataUrl, scale } = this.build(w, h, r);
    feImg.setAttribute('href', dataUrl);
    feImg.setAttribute('width', String(Math.ceil(w)));
    feImg.setAttribute('height', String(Math.ceil(h)));
    feDisp.setAttribute('scale', scale.toFixed(2));
  },

  _applyToPanel(): void {
    const filter = document.getElementById('glass-distortion-panel');
    if (!filter) return;
    const feImg = filter.querySelector('feImage') as SVGElement | null;
    const feDisp = filter.querySelector('feDisplacementMap') as SVGElement | null;
    if (!feImg || !feDisp) return;

    const { dataUrl, scale, width } = this.build(580, 500, 20);
    feImg.setAttribute('href', dataUrl);
    feDisp.setAttribute('scale', (scale / width).toFixed(4));
  },

  initDock(): void {
    const dock = document.querySelector('.glass-dock') as HTMLElement | null;
    if (!dock) return;

    const neutral = this._neutralDataUrl();
    const dockFilter = document.getElementById('glass-distortion-dock');
    if (dockFilter) {
      const fi = dockFilter.querySelector('feImage') as SVGElement | null;
      const fd = dockFilter.querySelector('feDisplacementMap') as SVGElement | null;
      if (fi) fi.setAttribute('href', neutral);
      if (fd) fd.setAttribute('scale', '0');
    }

    const refresh = (w: number, h: number) => {
      this._applyToDock(w, h);
    };

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 4 && height > 4) refresh(width, height);
    });
    ro.observe(dock);

    const rect = dock.getBoundingClientRect();
    if (rect.width > 4 && rect.height > 4) refresh(rect.width, rect.height);
  },

  initPanel(): void {
    const neutral = this._neutralDataUrl();
    const panelFilter = document.getElementById('glass-distortion-panel');
    if (panelFilter) {
      const fi = panelFilter.querySelector('feImage') as SVGElement | null;
      const fd = panelFilter.querySelector('feDisplacementMap') as SVGElement | null;
      if (fi) fi.setAttribute('href', neutral);
      if (fd) fd.setAttribute('scale', '0');
    }
    this._applyToPanel();
  },
};

GlassDistortion.initDock();
GlassDistortion.initPanel();
