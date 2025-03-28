// src/utils/PixelShader.js
import * as THREE from 'three';

// Pixel shader effect for retro pixel art rendering
export const pixelShader = {
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  
  fragmentShader: `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform vec2 resolution;
    uniform float pixelSize;
    uniform float time;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float vignetteIntensity;
    
    void main() {
      // Pixelation effect
      vec2 dxy = pixelSize / resolution;
      vec2 pixelatedUV = vec2(
        dxy.x * floor(vUv.x / dxy.x),
        dxy.y * floor(vUv.y / dxy.y)
      );
      
      // Get pixelated color
      vec4 pixelColor = texture2D(tDiffuse, pixelatedUV);
      
      // Apply scanlines
      float scanline = sin(vUv.y * scanlineCount * 3.14159 * 2.0) * 0.5 + 0.5;
      scanline = pow(scanline, 3.0) * scanlineIntensity;
      pixelColor.rgb -= scanline;
      
      // Apply slight color shift
      float r = texture2D(tDiffuse, pixelatedUV + vec2(0.001 * sin(time), 0.0)).r;
      float g = pixelColor.g;
      float b = texture2D(tDiffuse, pixelatedUV - vec2(0.001 * sin(time), 0.0)).b;
      pixelColor.rgb = vec3(r, g, b);
      
      // Apply vignette effect
      vec2 position = vUv - vec2(0.5);
      float vignette = length(position) * vignetteIntensity;
      vignette = min(1.0, 1.0 - vignette);
      pixelColor.rgb *= vignette;
      
      // Final color
      gl_FragColor = pixelColor;
    }
  `
};

// Helper function to update pixel shader settings
export function updatePixelShaderSettings(shaderPass, settings = {}) {
  if (!shaderPass || !shaderPass.uniforms) return;
  
  // Update pixelation level
  if (settings.pixelationLevel !== undefined) {
    shaderPass.uniforms.pixelSize.value = settings.pixelationLevel;
  }
  
  // Update scanline intensity
  if (settings.scanlineIntensity !== undefined) {
    shaderPass.uniforms.scanlineIntensity.value = settings.scanlineIntensity;
  }
  
  // Update vignette effect
  if (settings.vignetteIntensity !== undefined) {
    shaderPass.uniforms.vignetteIntensity.value = settings.vignetteIntensity;
  }
}

// Create a Three.js material using the pixel shader
export function createPixelMaterial(resolution = new THREE.Vector2(800, 600), pixelSize = 4) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: resolution },
      pixelSize: { value: pixelSize },
      time: { value: 0.0 },
      scanlineIntensity: { value: 0.15 },
      scanlineCount: { value: resolution.y },
      vignetteIntensity: { value: 0.3 }
    },
    vertexShader: pixelShader.vertexShader,
    fragmentShader: pixelShader.fragmentShader
  });
}

export default { pixelShader, updatePixelShaderSettings, createPixelMaterial };