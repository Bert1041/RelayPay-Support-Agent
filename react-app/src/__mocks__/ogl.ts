export class Renderer {
  gl = {
    canvas: document.createElement("canvas"),
    clearColor: jest.fn(),
    enable: jest.fn(),
    blendFunc: jest.fn(),
    clear: jest.fn(),
    getExtension: jest.fn(() => ({ loseContext: jest.fn() })),
    BLEND: 1,
    SRC_ALPHA: 1,
    ONE_MINUS_SRC_ALPHA: 1,
    COLOR_BUFFER_BIT: 1,
    DEPTH_BUFFER_BIT: 1,
  };
  setSize = jest.fn();
  render = jest.fn();
}

export class Program {
  uniforms: Record<string, { value: unknown }> = {};
  constructor(_gl: unknown, opts?: { uniforms?: Record<string, { value: unknown }> }) {
    if (opts?.uniforms) this.uniforms = opts.uniforms;
  }
}

export class Mesh {}
export class Triangle {}

export class Vec3 {
  x = 0;
  y = 0;
  z = 0;
  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  set = jest.fn();
}
