// src/assets/shaders/pixelFragment.glsl
uniform sampler2D tDiffuse;
uniform vec2 resolution;
uniform float pixelSize;
uniform float time;
uniform float scanlineIntensity;
uniform float scanlineCount;
uniform float vignetteIntensity;

varying vec2 vUv;

void main() {
  // Pixelation effect
  vec2 dxy = pixelSize / resolution;
  vec2 pixelCoord = dxy * floor(vUv / dxy);
  vec4 color = texture2D(tDiffuse, pixelCoord);

  // Scanlines effect
  float scanline = sin(vUv.y * scanlineCount + time) * 0.5 + 0.5;
  scanline = pow(scanline, 1.0) * scanlineIntensity;
  color.rgb -= scanline;

  // Vignette effect
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);
  float vignette = smoothstep(0.4, 0.75, dist);
  color.rgb -= vignette * vignetteIntensity;

  // Slightly enhance contrast to give more of a retro look
  color.rgb = (color.rgb - 0.5) * 1.1 + 0.5;

  // Slight color shift to give more vintage feel
  color.r *= 1.05;
  color.b *= 0.95;

  // Apply a subtle noise pattern for that old CRT look
  float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233) * time * 0.01)) * 43758.5453);
  color.rgb += (noise - 0.5) * 0.05;

  // Set output color
  gl_FragColor = color;
}