import vsShader from "../../assets/shaders/vertex.glsl";
import fsShader from "../../assets/shaders/fragment.glsl";

export const initCanvasBgWebGL = ({
  canvas,
}: {
  canvas: HTMLCanvasElement;
}) => {
  let render: any;
  const gl = canvas.getContext("webgl");

  const devicePixelRatio = window.devicePixelRatio || 1;
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;

  if (!gl) {
    console.log("Failed to get the rendering context for WebGL");
    return;
  }

  let currentTime = 0;
  let previousTime = 0;

  if (render) {
    cancelAnimationFrame(render);
  }

  // Render loop
  render = () => {
    if (!gl) {
      console.log("Failed to get the rendering context for WebGL");
      return;
    }

    const vs = vsShader;
    const fs = fsShader;
    // Create shaders, program, and set up attributes
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) return;
    gl.shaderSource(vertexShader, vs);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) return;
    gl.shaderSource(fragmentShader, fs);
    gl.compileShader(fragmentShader);

    const shaderProgram = gl.createProgram();
    if (!shaderProgram) return;
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    const positionAttributeLocation = gl.getAttribLocation(
      shaderProgram,
      "position"
    );
    gl.enableVertexAttribArray(positionAttributeLocation);
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    const positions = [
      -1.0, -1.0, 0.0, 1.0, -1.0, 0.0, 1.0, 1.0, 0.0, -1.0, 1.0, 0.0,
    ];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionAttributeLocation, 3, gl.FLOAT, false, 0, 0);

    // Set up time uniform
    const timeUniformLocation = gl.getUniformLocation(shaderProgram, "time");

    gl.uniform1f(timeUniformLocation, currentTime);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);

    requestAnimationFrame((now) => {
      currentTime = now / 1000.0;

      // console.log(currentTime);

      previousTime = now;

      // render();
    });
  };

  render();
};
