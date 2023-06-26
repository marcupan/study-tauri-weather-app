import vsShader from "../../assets/shaders/vertex.glsl";
import fsShader from "../../assets/shaders/fragment.glsl";

export const initCanvasBgWebGL = ({
  canvas,
}: {
  canvas: HTMLCanvasElement;
}) => {
  const gl = canvas.getContext("webgl");

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  const vs = vsShader;
  const fs = fsShader;
  if (!initShaders(gl, vs, fs)) {
    console.log("Failed to intialize shaders.");
    return;
  }

  const n = initVertexBuffers(gl);
  if (n < 0) {
    console.log("Failed to set the positions of the vertices");
    return;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.drawArrays(gl.TRIANGLES, 0, n);


};

function initVertexBuffers(gl: WebGLRenderingContext) {
  const dim = 3;
  const vertices = new Float32Array([
    0,
    0.5,
    0, // Vertice #1
    -0.5,
    -0.5,
    0, // Vertice #2
    0.5,
    -0.5,
    0, // Vertice #3
  ]);

  const vertexBuffer = gl.createBuffer();
  if (!vertexBuffer) {
    console.log("Failed to create the buffer object");
    return -1;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  // @ts-ignore
  const a_Position = gl.getAttribLocation(gl.program, "a_Position");
  if (a_Position < 0) {
    console.log("Failed to get the storage location of a_Position");
    return -1;
  }
  gl.vertexAttribPointer(a_Position, dim, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  return vertices.length / dim;
}

function initShaders(
  gl: WebGLRenderingContext,
  vs_source: string,
  fs_source: string
) {
  const vertexShader = makeShader(gl, vs_source, gl.VERTEX_SHADER);
  const fragmentShader = makeShader(gl, fs_source, gl.FRAGMENT_SHADER);

  const glProgram = gl.createProgram();

  if (!glProgram || !vertexShader || !fragmentShader) return;

  gl.attachShader(glProgram, vertexShader);
  gl.attachShader(glProgram, fragmentShader);

  gl.linkProgram(glProgram);

  if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
    console.log("Unable to initialize the shader program");
    return false;
  }

  // Use program
  gl.useProgram(glProgram);
  // @ts-ignore
  gl.program = glProgram;

  return true;
}

function makeShader(gl: WebGLRenderingContext, src: string, type: number) {
  const shader = gl.createShader(type);

  if (!shader) return;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.log("Error compiling shader: " + gl.getShaderInfoLog(shader));
    return;
  }

  return shader;
}
