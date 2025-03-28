// src/engine/GameEngine.js
import * as THREE from 'three';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { PhysicsEngine } from './PhysicsEngine';
import { GameState } from '../game/GameState';
import { PostProcessor } from './PostProcessor';
import { UIManager } from '../ui/UIManager.jsx';

export class GameEngine {
  constructor() {
    // Engine components
    this.renderer = null;
    this.audioManager = null;
    this.inputManager = null;
    this.physicsEngine = null;
    this.postProcessor = null;
    this.uiManager = null;
    
    // Game state
    this.gameState = null;
    
    // Timing and animation
    this.clock = new THREE.Clock();
    this.deltaTime = 0;
    this.elapsed = 0;
    this.animationFrame = null;
    
    // Engine status
    this.isInitialized = false;
    this.isRunning = false;
  }
  
  initialize(canvas) {
    if (this.isInitialized) {
      console.warn('GameEngine already initialized');
      return this;
    }
    
    console.log('Initializing Game Engine...');
    
    // Create core engine components
    this.renderer = new Renderer()
      .initialize(canvas, window.innerWidth, window.innerHeight);
      
    this.audioManager = new AudioManager()
      .initialize();
      
    this.inputManager = new InputManager()
      .initialize(canvas);
      
    this.physicsEngine = new PhysicsEngine()
      .initialize();
      
    // Create game state
    this.gameState = new GameState(this)
      .initialize();
      
    // Create UI manager
    this.uiManager = new UIManager()
      .initialize();
      
    // Connect components
    this.uiManager.setGameState(this.gameState);
    this.uiManager.setAudioManager(this.audioManager);
    
    // Set up post-processing
    this.postProcessor = new PostProcessor()
      .initialize(this.renderer, this.gameState.gameSettings.pixelationLevel || 4);
    
    // Start engine loop
    this.isInitialized = true;
    this.isRunning = false;
    
    // Auto-start the engine
    this.start();
    
    return this;
  }
  
  start() {
    if (!this.isInitialized) {
      console.error('Cannot start uninitialized GameEngine');
      return this;
    }
    
    if (this.isRunning) {
      console.warn('GameEngine already running');
      return this;
    }
    
    console.log('Starting Game Engine...');
    this.isRunning = true;
    this.clock.start();
    this.update();
    
    return this;
  }
  
  update() {
    if (!this.isRunning) return;
    
    // Calculate timing
    this.deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap delta time to prevent large jumps
    this.elapsed = this.clock.getElapsedTime();
    
    // Update physics
    this.physicsEngine.update(this.deltaTime);
    
    // Update game state
    this.gameState.update(this.deltaTime, this.elapsed);
    
    // Update UI
    this.uiManager.updateHUD(this.gameState);
    
    // Render scene
    if (this.gameState.currentScene) {
      this.renderer.render(this.gameState.currentScene, this.gameState.currentCamera);
    }
    
    // Request next frame
    this.animationFrame = requestAnimationFrame(() => this.update());
  }
  
  pause() {
    if (!this.isRunning) return this;
    
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    
    this.audioManager.pauseAll();
    this.clock.stop();
    
    return this;
  }
  
  resume() {
    if (this.isRunning) return this;
    
    this.isRunning = true;
    this.clock.start();
    this.update();
    
    return this;
  }
  
  getGameState() {
    return this.gameState;
  }
  
  dispose() {
    // Stop the engine
    this.pause();
    
    // Dispose resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    if (this.audioManager) {
      this.audioManager.dispose();
    }
    
    if (this.inputManager) {
      this.inputManager.dispose();
    }
    
    if (this.gameState) {
      this.gameState.dispose();
    }
    
    // Clear references
    this.renderer = null;
    this.audioManager = null;
    this.inputManager = null;
    this.physicsEngine = null;
    this.gameState = null;
    this.uiManager = null;
    
    this.isInitialized = false;
    
    return this;
  }
}