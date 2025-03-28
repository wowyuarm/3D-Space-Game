// src/engine/GameEngine.js
import * as THREE from 'three';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { PhysicsEngine } from './PhysicsEngine';
import { GameState } from '../game/GameState';
import { PostProcessor } from './PostProcessor';
import { UIManager } from '../ui/UIManager.jsx';
import { PhysicsSystem } from './PhysicsSystem';
import { Universe } from '../universe/Universe';
import { PlayerShip } from '../game/PlayerShip';
import { CameraController } from './CameraController';
import { ResourceManager } from './ResourceManager';
import { MissionSystem } from './MissionSystem';

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
  
  async init() {
    if (this.isInitialized) {
      console.warn('GameEngine already initialized');
      return false;
    }
    
    console.log('Initializing GameEngine...');
    
    try {
      // Initialize physics system
      this.physicsSystem = new PhysicsSystem();
      this.physicsSystem.init();
      
      // Initialize input system
      this.inputManager = new InputManager(this.onKeyPressed.bind(this));
      this.inputManager.init();
      
      // Initialize rendering system
      const success = await this.initRenderer();
      if (!success) {
        console.error('Failed to initialize renderer');
        return false;
      }
      
      // Initialize audio system
      const audioSuccess = this.initAudio();
      if (!audioSuccess) {
        console.warn('Audio system initialization failed, continuing without audio');
      }
      
      // Initialize universe
      this.universe = new Universe();
      this.universe.init();
      
      // Set up player ship
      this.player = new PlayerShip();
      this.player.init(this.scene, new THREE.Vector3(0, 0, 10));
      
      // Set up camera to follow player
      this.cameraController = new CameraController(this.camera);
      this.cameraController.setTarget(this.player.getObject());
      
      // Set up resource management
      this.resourceManager = new ResourceManager();
      this.resourceManager.init();
      
      // Set up mission system
      this.missionSystem = new MissionSystem(this);
      this.missionSystem.init();
      
      // Initialize post-processing effects
      this.initPostProcessing();
      
      // Set up event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this));
      
      // Mark as initialized
      this.isInitialized = true;
      this.lastUpdateTime = performance.now();
      
      // Play background music once initialized
      if (this.audioManager) {
        // Start background music with fade in
        setTimeout(() => {
          try {
            this.audioManager.playMusic('space_ambient', 2000);
          } catch (error) {
            console.warn('Error starting background music', error);
          }
        }, 1000);
      }
      
      console.log('GameEngine initialization complete');
      return true;
    } catch (error) {
      console.error('Error during GameEngine initialization:', error);
      return false;
    }
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
  
  initAudio() {
    // Initialize audio system if not already
    if (!this.audioManager) {
      try {
        this.audioManager = new AudioManager();
        this.audioManager.init();
        
        // 等待用户交互后加载音频
        const unlockAudio = () => {
          if (!this.audioInitialized) {
            this.audioManager.resumeAudio();
            
            // 预加载主要音效
            this.audioManager.preloadSounds([
              'button_click', 
              'alert', 
              'resource_collected'
            ]);
            
            this.audioInitialized = true;
            console.log('Audio unlocked by user interaction');
          }
          
          // 移除事件监听器
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
        };
        
        // 添加事件监听器以解锁音频
        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);
        
        return true;
      } catch (error) {
        console.error('Failed to initialize audio system:', error);
        return false;
      }
    }
    return true;
  }
}