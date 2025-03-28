// src/engine/Renderer.js
import * as THREE from 'three';

export class Renderer {
  constructor() {
    this.renderer = null;
    this.width = 800;
    this.height = 600;
    this.pixelRatio = 1;
    this.canvas = null;
    this.isInitialized = false;
  }
  
  /**
   * Initialize the renderer - wrapper for backward compatibility
   * @param {HTMLCanvasElement} canvas - The canvas element to render to
   * @param {number} width - The width of the renderer
   * @param {number} height - The height of the renderer
   * @returns {boolean} Success status
   */
  init(canvas, width = 800, height = 600) {
    // Call the existing initialize method for backward compatibility
    this.initialize(canvas, width, height);
    return true;
  }
  
  initialize(canvas, width = 800, height = 600) {
    if (this.isInitialized) {
      console.warn('Renderer already initialized');
      return this;
    }
    
    console.log('Initializing Renderer...');
    
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);
    
    // Create WebGL renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false, // Disable antialiasing for pixelated look
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: true
    });
    
    // Configure renderer
    this.renderer.setClearColor(0x000011); // Dark blue color
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Enable texture encoding for physically correct lighting
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    this.isInitialized = true;
    
    return this;
  }
  
  render(scene, camera) {
    if (!this.isInitialized || !scene || !camera) return;
    
    // Perform the render
    this.renderer.render(scene, camera);
  }
  
  setResolution(width, height) {
    if (!this.isInitialized) return;
    
    this.width = width;
    this.height = height;
    
    // Update renderer size
    this.renderer.setSize(width, height);
    
    // Update post-processor if it exists
    if (this.postProcessor) {
      this.postProcessor.setSize(width, height);
    }
  }
  
  setPixelRatio(ratio) {
    if (!this.isInitialized) return;
    
    this.pixelRatio = ratio;
    this.renderer.setPixelRatio(ratio);
  }
  
  enableShadows(enabled = true) {
    if (!this.isInitialized) return;
    
    this.renderer.shadowMap.enabled = enabled;
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    // Dispose of THREE.js renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer = null;
    }
    
    this.isInitialized = false;
  }
  
  // Direct access to the underlying THREE.js renderer
  getWebGLRenderer() {
    return this.renderer;
  }
  
  // Access to renderer DOM element
  getDomElement() {
    return this.canvas;
  }
  
  // Get current dimensions
  getDimensions() {
    return {
      width: this.width,
      height: this.height
    };
  }
}