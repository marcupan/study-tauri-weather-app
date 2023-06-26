precision mediump float;
uniform float time;
varying vec2 vUv;

void main() {
    vec2 p = vUv;
    float speed = 2.0;
    float frequency = 15.0;
    float amplitude = 0.2;

    // float offset = sin(p.y * frequency + time * speed) * amplitude;
    float offset = sin((p.y - p.x) * frequency + time * speed) * amplitude;
    p.x += offset;

    vec3 color = vec3(0.5, 0.5, 1.0); // Blue color for rain
    float alpha = smoothstep(0.1, 0.2, abs(offset));
    gl_FragColor = vec4(color, alpha);
}
