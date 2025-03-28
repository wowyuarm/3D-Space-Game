// src/engine/GameEngine.js
import * as THREE from 'three';
import { Renderer } from './Renderer';
import { AudioManager } from './AudioManager';
import { InputManager } from './InputManager';
import { PhysicsSystem } from './PhysicsSystem';
import { GameState } from '../game/GameState';
import { PostProcessor } from './PostProcessor';
import { UIManager } from '../ui/UIManager.jsx';
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
    this.physicsSystem = null;
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
    this.audioInitialized = false;
  }
  
  async init(canvas) {
    if (this.isInitialized) {
      console.warn('GameEngine already initialized');
      return false;
    }
    
    console.log('Initializing GameEngine...');
    
    try {
      // Initialize renderer with canvas if provided
      if (canvas) {
        this.renderer = new Renderer();
        this.renderer.init(canvas, window.innerWidth, window.innerHeight);
      } else {
        // Otherwise create our own renderer
        const success = await this.initRenderer();
        if (!success) {
          console.error('Failed to initialize renderer');
          return false;
        }
      }
      
      // Initialize physics system
      this.physicsSystem = new PhysicsSystem();
      this.physicsSystem.init();
      
      // Initialize input system
      this.inputManager = new InputManager();
      this.inputManager.init(canvas);
      
      // Initialize audio system
      const audioSuccess = this.initAudio();
      if (!audioSuccess) {
        console.warn('Audio system initialization failed, continuing without audio');
      }
      
      // Initialize game state
      this.gameState = new GameState();
      // Check if GameState has an init method, otherwise use initialize
      if (typeof this.gameState.init === 'function') {
        this.gameState.init({ gameEngine: this });
      } else if (typeof this.gameState.initialize === 'function') {
        this.gameState.initialize({ gameEngine: this });
      }
      
      // Create UI manager
      this.uiManager = new UIManager();
      this.uiManager.init();
      
      // Connect components
      this.uiManager.setGameState(this.gameState);
      if (this.audioManager) {
        this.uiManager.setAudioManager(this.audioManager);
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
      
      // Set up post-processing if renderer was provided
      if (this.renderer) {
        this.postProcessor = new PostProcessor();
        this.postProcessor.init(this.renderer, this.gameState.gameSettings.pixelationLevel || 4);
      } else {
        // Initialize post-processing effects
        this.initPostProcessing();
      }
      
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
      
      // Auto-start the engine
      this.start();
      
      console.log('GameEngine initialization complete');
      return true;
    } catch (error) {
      console.error('Error during GameEngine initialization:', error);
      return false;
    }
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
    if (this.physicsSystem) {
      this.physicsSystem.update(this.deltaTime);
    }
    
    // Update game state
    if (this.gameState) {
      this.gameState.update(this.deltaTime, this.elapsed);
    }
    
    // Update UI
    if (this.uiManager && this.gameState) {
      this.uiManager.updateHUD(this.gameState);
    }
    
    // Render scene
    if (this.gameState && this.gameState.currentScene && this.renderer) {
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
    
    if (this.audioManager) {
      this.audioManager.pauseAll();
    }
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
    this.physicsSystem = null;
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
        
        // Wait for user interaction before loading audio
        const unlockAudio = () => {
          if (!this.audioInitialized) {
            this.audioManager.resumeAudio();
            
            // Preload main sound effects
            this.audioManager.preloadSounds([
              'button_click', 
              'alert', 
              'resource_collected'
            ]);
            
            this.audioInitialized = true;
            console.log('Audio unlocked by user interaction');
          }
          
          // Remove event listeners
          document.removeEventListener('click', unlockAudio);
          document.removeEventListener('keydown', unlockAudio);
        };
        
        // Add event listeners to unlock audio
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
  
  /**
   * Initialize the rendering system
   * @returns {Promise<boolean>} Success status
   */
  async initRenderer() {
    try {
      // Create scene
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000011); // Dark blue background
      
      // Create camera
      this.camera = new THREE.PerspectiveCamera(
        75, // Field of view
        window.innerWidth / window.innerHeight, // Aspect ratio
        0.1, // Near plane
        2000 // Far plane
      );
      this.camera.position.set(0, 5, 15);
      this.camera.lookAt(0, 0, 0);
      
      // Create renderer
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      
      // Add renderer's canvas to DOM if not already present
      if (!document.body.contains(this.renderer.domElement)) {
        document.body.appendChild(this.renderer.domElement);
      }
      
      // Setup basic lighting
      this.setupLights();
      
      return true;
    } catch (error) {
      console.error('Error initializing renderer:', error);
      return false;
    }
  }
  
  /**
   * Setup basic scene lighting
   */
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    
    // Configure shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.bias = -0.0001;
    
    this.scene.add(sunLight);
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  /**
   * Initialize post-processing effects
   */
  initPostProcessing() {
    // This can be implemented later when needed
  }
  
  /**
   * Handle key press events
   * @param {KeyboardEvent} event - The keyboard event
   */
  onKeyPressed(event) {
    // This can be implemented later when needed
  }
}