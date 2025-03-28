// src/engine/InputManager.js
import * as THREE from 'three';

export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = {
      x: 0,
      y: 0,
      worldPosition: new THREE.Vector3(),
      isDown: false,
      rightIsDown: false
    };
    this.touches = [];
    this.canvas = null;
    this.raycaster = new THREE.Raycaster();
    this.listeners = {};
    this.isInitialized = false;
  }
  
  /**
   * Initialize the input manager
   * @param {HTMLCanvasElement} canvas - The canvas element for mouse/touch events
   * @returns {boolean} Success status
   */
  init(canvas) {
    // Call the existing initialize method for backward compatibility
    this.initialize(canvas);
    return true;
  }
  
  initialize(canvas) {
    if (this.isInitialized) {
      console.warn('InputManager already initialized');
      return this;
    }
    
    console.log('Initializing InputManager...');
    
    this.canvas = canvas;
    
    // Add event listeners
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    window.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));
    
    // Touch events
    canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
    canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
    canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
    
    // Disable right-click menu
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    
    this.isInitialized = true;
    return this;
  }
  
  // Keyboard handling
  handleKeyDown(event) {
    this.keys[event.code] = true;
    
    // Notify listeners
    this.notifyListeners('keydown', { code: event.code });
  }
  
  handleKeyUp(event) {
    this.keys[event.code] = false;
    
    // Notify listeners
    this.notifyListeners('keyup', { code: event.code });
  }
  
  isKeyPressed(code) {
    return !!this.keys[code];
  }
  
  // Mouse handling
  handleMouseDown(event) {
    if (event.button === 0) {
      this.mouse.isDown = true;
    } else if (event.button === 2) {
      this.mouse.rightIsDown = true;
    }
    
    this.updateMousePosition(event);
    
    // Notify listeners
    this.notifyListeners('mousedown', { 
      button: event.button,
      position: { x: this.mouse.x, y: this.mouse.y },
      worldPosition: this.mouse.worldPosition.clone()
    });
  }
  
  handleMouseUp(event) {
    if (event.button === 0) {
      this.mouse.isDown = false;
    } else if (event.button === 2) {
      this.mouse.rightIsDown = false;
    }
    
    this.updateMousePosition(event);
    
    // Notify listeners
    this.notifyListeners('mouseup', { 
      button: event.button,
      position: { x: this.mouse.x, y: this.mouse.y },
      worldPosition: this.mouse.worldPosition.clone()
    });
  }
  
  handleMouseMove(event) {
    this.updateMousePosition(event);
    
    // Notify listeners
    this.notifyListeners('mousemove', { 
      position: { x: this.mouse.x, y: this.mouse.y },
      worldPosition: this.mouse.worldPosition.clone()
    });
  }
  
  updateMousePosition(event) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Normalized device coordinates (-1 to +1)
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  handleContextMenu(event) {
    event.preventDefault();
  }
  
  updateMouseWorldPosition(camera) {
    if (!camera) return;
    
    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Set to a point along the ray
    const farPoint = this.raycaster.ray.at(1000, new THREE.Vector3());
    this.mouse.worldPosition.copy(farPoint);
  }
  
  // Touch handling
  handleTouchStart(event) {
    event.preventDefault();
    
    const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      this.touches[touch.identifier] = this.getRelativeTouchPosition(touch);
    }
    
    // Simulate mouse down for single touch
    if (event.touches.length === 1) {
      this.mouse.isDown = true;
      this.updateTouchAsMousePosition(event.touches[0]);
    }
    
    // Notify listeners
    this.notifyListeners('touchstart', { touches: [...this.touches] });
  }
  
  handleTouchEnd(event) {
    event.preventDefault();
    
    const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      delete this.touches[touch.identifier];
    }
    
    // Simulate mouse up for last touch
    if (event.touches.length === 0) {
      this.mouse.isDown = false;
    } else {
      this.updateTouchAsMousePosition(event.touches[0]);
    }
    
    // Notify listeners
    this.notifyListeners('touchend', { touches: [...this.touches] });
  }
  
  handleTouchMove(event) {
    event.preventDefault();
    
    const touches = event.changedTouches;
    for (let i = 0; i < touches.length; i++) {
      const touch = touches[i];
      this.touches[touch.identifier] = this.getRelativeTouchPosition(touch);
    }
    
    // Update mouse position for first touch
    if (event.touches.length > 0) {
      this.updateTouchAsMousePosition(event.touches[0]);
    }
    
    // Notify listeners
    this.notifyListeners('touchmove', { touches: [...this.touches] });
  }
  
  getRelativeTouchPosition(touch) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Normalized device coordinates (-1 to +1)
    const x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    
    return { id: touch.identifier, x, y };
  }
  
  updateTouchAsMousePosition(touch) {
    const rect = this.canvas.getBoundingClientRect();
    
    // Normalized device coordinates (-1 to +1)
    this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
  }
  
  // Event subscription
  addEventListener(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [];
    }
    
    this.listeners[type].push(callback);
    return callback; // Return for later removal
  }
  
  removeEventListener(type, callback) {
    if (!this.listeners[type]) return;
    
    const index = this.listeners[type].indexOf(callback);
    if (index !== -1) {
      this.listeners[type].splice(index, 1);
    }
  }
  
  notifyListeners(type, data) {
    if (!this.listeners[type]) return;
    
    for (const callback of this.listeners[type]) {
      callback(data);
    }
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
    
    if (this.canvas) {
      this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
      this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
      this.canvas.removeEventListener('contextmenu', this.handleContextMenu.bind(this));
      
      this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
      this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
      this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
    }
    
    window.removeEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // Clear data
    this.keys = {};
    this.mouse = { x: 0, y: 0, isDown: false, rightIsDown: false };
    this.touches = [];
    this.listeners = {};
    
    this.isInitialized = false;
    return this;
  }
}