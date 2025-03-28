// src/engine/PostProcessor.js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { pixelShader, updatePixelShaderSettings } from '../utils/PixelShader';

export class PostProcessor {
  constructor() {
    this.composer = null;
    this.renderer = null;
    this.passes = {};
    this.isInitialized = false;
    this.pixelationLevel = 4;
  }
  
  initialize(renderer, pixelationLevel = 4) {
    if (this.isInitialized) {
      console.warn('PostProcessor already initialized');
      return this;
    }
    
    if (!renderer || !renderer.renderer) {
      console.error('PostProcessor requires a valid Renderer instance');
      return this;
    }
    
    console.log('Initializing PostProcessor...');
    
    this.renderer = renderer.renderer;
    this.pixelationLevel = pixelationLevel;
    
    // Create the effect composer
    this.composer = new EffectComposer(this.renderer);
    
    this.isInitialized = true;
    return this;
  }
  
  setupPasses(scene, camera) {
    if (!this.isInitialized || !scene || !camera) return this;
    
    // Clear existing passes
    this.composer.passes = [];
    this.passes = {};
    
    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);
    this.passes.render = renderPass;
    
    // Add pixel shader pass
    const dimensions = this.renderer.getSize(new THREE.Vector2());
    
    const pixelPass = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null },
        resolution: { value: new THREE.Vector2(dimensions.width, dimensions.height) },
        pixelSize: { value: this.pixelationLevel },
        time: { value: 0.0 },
        scanlineIntensity: { value: 0.15 },
        scanlineCount: { value: dimensions.height },
        vignetteIntensity: { value: 0.3 }
      },
      vertexShader: pixelShader.vertexShader,
      fragmentShader: pixelShader.fragmentShader
    });
    
    this.composer.addPass(pixelPass);
    this.passes.pixel = pixelPass;
    
    return this;
  }
  
  render(scene, camera, deltaTime = 0) {
    if (!this.isInitialized || !scene || !camera) return;
    
    // Make sure we have passes set up
    if (this.composer.passes.length === 0) {
      this.setupPasses(scene, camera);
    }
    
    // Update time uniform for animated effects
    if (this.passes.pixel) {
      this.passes.pixel.uniforms.time.value += deltaTime;
    }
    
    // Render the scene with post-processing
    this.composer.render();
  }
  
  setPixelationLevel(level) {
    if (!this.isInitialized) return;
    
    this.pixelationLevel = level;
    
    // Update shader uniform
    if (this.passes.pixel) {
      this.passes.pixel.uniforms.pixelSize.value = level;
    }
    
    return this;
  }
  
  setSize(width, height) {
    if (!this.isInitialized) return;
    
    // Update composer size
    this.composer.setSize(width, height);
    
    // Update resolution uniform in shader passes
    if (this.passes.pixel) {
      this.passes.pixel.uniforms.resolution.value.set(width, height);
      this.passes.pixel.uniforms.scanlineCount.value = height;
    }
    
    return this;
  }
  
  updateShaderSettings(settings) {
    if (!this.isInitialized || !this.passes.pixel) return;
    
    // Update pixel shader settings
    updatePixelShaderSettings(this.passes.pixel, settings);
    
    return this;
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    // Dispose of composer and passes
    if (this.composer) {
      // Dispose each pass
      for (const pass of this.composer.passes) {
        if (pass.dispose) {
          pass.dispose();
        }
      }
      
      this.composer = null;
    }
    
    this.passes = {};
    this.isInitialized = false;
    
    return this;
  }
}