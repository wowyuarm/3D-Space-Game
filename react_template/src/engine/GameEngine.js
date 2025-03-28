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
      // 记录初始化步骤
      const initSteps = [];
      
      // Initialize renderer with canvas if provided
      if (canvas) {
        console.log('使用提供的canvas初始化渲染器');
        this.renderer = new Renderer();
        this.renderer.init(canvas, window.innerWidth, window.innerHeight);
        initSteps.push('Renderer initialized with canvas');
      } else {
        // Otherwise create our own renderer
        console.log('创建内部渲染器');
        const success = await this.initRenderer();
        if (!success) {
          console.error('Failed to initialize renderer');
          return false;
        }
        initSteps.push('Internal renderer initialized');
      }
      
      // 确保渲染器成功初始化
      if (!this.renderer || !this.renderer.isInitialized) {
        console.error('Renderer initialization failed or not completed');
        return false;
      }
      
      console.log('初始化物理系统');
      // Initialize physics system
      this.physicsSystem = new PhysicsSystem();
      this.physicsSystem.init();
      initSteps.push('Physics system initialized');
      
      console.log('初始化输入系统');
      // Initialize input system
      this.inputManager = new InputManager();
      this.inputManager.init(canvas);
      initSteps.push('Input system initialized');
      
      // 确保场景已创建
      if (!this.scene) {
        console.log('场景尚未创建，初始化场景');
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        initSteps.push('Scene created');
      }
      
      // 确保相机已创建
      if (!this.camera) {
        console.log('相机尚未创建，初始化相机');
        this.camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          2000
        );
        this.camera.position.set(0, 5, 15);
        this.camera.lookAt(0, 0, 0);
        initSteps.push('Camera created');
      }
      
      console.log('初始化音频系统');
      // Initialize audio system
      const audioSuccess = this.initAudio();
      if (!audioSuccess) {
        console.warn('Audio system initialization failed, continuing without audio');
      } else {
        initSteps.push('Audio system initialized');
      }
      
      console.log('初始化游戏状态');
      // Initialize game state
      this.gameState = new GameState();
      // Check if GameState has an init method, otherwise use initialize
      if (typeof this.gameState.init === 'function') {
        this.gameState.init({ gameEngine: this });
        initSteps.push('GameState initialized with init()');
      } else if (typeof this.gameState.initialize === 'function') {
        this.gameState.initialize({ gameEngine: this });
        initSteps.push('GameState initialized with initialize()');
      }
      
      // 设置当前场景和相机
      console.log('设置GameEngine的场景和相机');
      if (this.gameState && this.gameState.currentScene) {
        this.scene = this.gameState.currentScene;
        initSteps.push('Using GameState scene');
      }
      
      if (this.gameState && this.gameState.currentCamera) {
        this.camera = this.gameState.currentCamera;
        initSteps.push('Using GameState camera');
      }
      
      console.log('初始化UI管理器');
      // Create UI manager
      this.uiManager = new UIManager();
      this.uiManager.init();
      initSteps.push('UI manager initialized');
      
      // Connect components
      this.uiManager.setGameState(this.gameState);
      if (this.audioManager) {
        this.uiManager.setAudioManager(this.audioManager);
      }
      
      console.log('初始化宇宙');
      // Initialize universe
      this.universe = new Universe();
      this.universe.init();
      initSteps.push('Universe initialized');
      
      console.log('设置玩家飞船');
      // Set up player ship
      this.player = new PlayerShip();
      // 确保场景存在
      const shipInitScene = this.scene || this.gameState?.currentScene || new THREE.Scene();
      this.player.init(shipInitScene, new THREE.Vector3(0, 0, 10));
      initSteps.push('Player ship initialized');
      
      console.log('设置相机控制器');
      // Set up camera to follow player
      this.cameraController = new CameraController(this.camera);
      this.cameraController.setTarget(this.player.getObject());
      initSteps.push('Camera controller initialized');
      
      console.log('初始化资源管理器');
      // Set up resource management
      this.resourceManager = new ResourceManager();
      this.resourceManager.init();
      initSteps.push('Resource manager initialized');
      
      console.log('初始化任务系统');
      // Set up mission system
      this.missionSystem = new MissionSystem(this);
      this.missionSystem.init();
      initSteps.push('Mission system initialized');
      
      console.log('设置后处理效果');
      // Set up post-processing if renderer was provided
      if (this.renderer) {
        this.postProcessor = new PostProcessor();
        this.postProcessor.init(this.renderer, this.gameState.gameSettings.pixelationLevel || 4);
        initSteps.push('Post-processor initialized');
      }
      
      // Set up event listeners
      window.addEventListener('resize', this.onWindowResize.bind(this));
      initSteps.push('Event listeners set up');
      
      // Mark as initialized
      this.isInitialized = true;
      this.lastUpdateTime = performance.now();
      
      console.log('游戏引擎初始化完成。初始化步骤:', initSteps.join(' → '));
      
      // Play background music once initialized
      if (this.audioManager) {
        // Start background music with fade in
        setTimeout(() => {
          try {
            // 首先检查音频是否可用
            const musicId = 'space_ambient';
            if (this.audioManager.isInitialized &&
                (!this.audioManager.knownBrokenAudio || !this.audioManager.knownBrokenAudio.has(musicId))) {
              this.audioManager.playMusic(musicId, 2000);
            } else {
              console.log(`Not playing ${musicId} music as it appears to be unavailable`);
            }
          } catch (error) {
            // 更全面的错误处理，不让音频问题影响游戏启动
            console.warn('Error starting background music, continuing without audio:', error);
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
    
    // 更新星空背景
    this.updateStarBackground(this.deltaTime);
    
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
    try {
      // Stop the engine
      this.pause();
      
      // Dispose resources
      if (this.renderer && typeof this.renderer.dispose === 'function') {
        this.renderer.dispose();
      }
      
      if (this.audioManager && typeof this.audioManager.dispose === 'function') {
        this.audioManager.dispose();
      }
      
      if (this.inputManager && typeof this.inputManager.dispose === 'function') {
        this.inputManager.dispose();
      }
      
      if (this.gameState && typeof this.gameState.dispose === 'function') {
        this.gameState.dispose();
      }
      
      // 清理其他可能存在的组件
      if (this.postProcessor && typeof this.postProcessor.dispose === 'function') {
        this.postProcessor.dispose();
      }
      
      if (this.physicsSystem && typeof this.physicsSystem.dispose === 'function') {
        this.physicsSystem.dispose();
      }
      
      // 清理THREE.js资源
      if (this.scene) {
        this.disposeSceneResources(this.scene);
      }
      
      // Clear references
      this.renderer = null;
      this.audioManager = null;
      this.inputManager = null;
      this.physicsSystem = null;
      this.gameState = null;
      this.uiManager = null;
      this.postProcessor = null;
      this.scene = null;
      this.camera = null;
      this.stars = null;
      
      this.isInitialized = false;
      
      console.log('GameEngine resources disposed successfully');
    } catch (error) {
      console.error('Error during GameEngine disposal:', error);
    }
    
    return this;
  }
  
  /**
   * 清理THREE.js场景中的资源
   * @param {THREE.Scene} scene 要清理的场景
   */
  disposeSceneResources(scene) {
    try {
      if (!scene) return;
      
      // 递归处理所有子对象
      scene.traverse(object => {
        // 释放几何体
        if (object.geometry && typeof object.geometry.dispose === 'function') {
          object.geometry.dispose();
        }
        
        // 释放材质
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => {
              if (material && typeof material.dispose === 'function') {
                material.dispose();
              }
            });
          } else if (typeof object.material.dispose === 'function') {
            object.material.dispose();
          }
        }
      });
      
      // 清空场景
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
      
      console.log('Scene resources disposed');
    } catch (error) {
      console.error('Error disposing scene resources:', error);
    }
  }
  
  initAudio() {
    try {
      console.log('Initializing audio system...');
      
      // 创建音频管理器
      this.audioManager = new AudioManager();
      
      // 初始化音频管理器
      if (typeof this.audioManager.init === 'function') {
        this.audioManager.init();
      }
      
      // 主动标记所有可能有问题的音频文件
      if (this.audioManager.knownBrokenAudio) {
        console.log('Pre-marking potentially problematic audio files...');
        
        const potentialProblemFiles = [
          'resource_collected', 
          'space_ambient', 
          'main_theme',
          'discovery',
          'button_click',
          'alert'
        ];
        
        potentialProblemFiles.forEach(id => {
          this.audioManager.knownBrokenAudio.add(id);
          console.log(`Pre-marking ${id} as problematic audio file`);
        });
      }
      
      // 立即创建静音替代品
      if (typeof this.audioManager.createSilentAudio === 'function') {
        const criticalSounds = ['button_click', 'alert', 'resource_collected'];
        criticalSounds.forEach(id => {
          if (!this.audioManager.sounds.has(id)) {
            console.log(`Creating silent replacement for sound: ${id}`);
            this.audioManager.sounds.set(id, this.audioManager.createSilentAudio());
          }
        });
        
        const musicTracks = ['main_theme', 'space_ambient'];
        musicTracks.forEach(id => {
          if (!this.audioManager.music.has(id)) {
            console.log(`Creating silent replacement for music: ${id}`);
            this.audioManager.music.set(id, this.audioManager.createSilentAudio(true));
          }
        });
      }
      
      // 确保音频在用户交互后解锁
      window.addEventListener('click', () => {
        try {
          if (this.audioManager && typeof this.audioManager.resumeAudio === 'function') {
            this.audioManager.resumeAudio();
            console.log('Audio unlocked by user interaction');
          }
        } catch (error) {
          console.warn('Error resuming audio on user interaction:', error);
        }
      }, { once: true });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize audio system:', error);
      // 返回true，表示即使音频系统初始化失败，游戏也应继续进行
      return true;
    }
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
      
      // 添加星星背景效果
      this.createStarBackground();
      
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
   * 创建星星背景
   * 在远处添加大量星星以避免空间看起来太空旷
   */
  createStarBackground() {
    try {
      // 创建星星群
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.0,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: false
      });
      
      // 创建1000个随机位置的星星
      const starPositions = [];
      const starColors = [];
      const radius = 1000; // 星星分布半径
      
      for (let i = 0; i < 1500; i++) {
        // 球形分布
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        const distance = radius * Math.random();
        
        const x = distance * Math.sin(phi) * Math.cos(theta);
        const y = distance * Math.sin(phi) * Math.sin(theta);
        const z = distance * Math.cos(phi);
        
        starPositions.push(x, y, z);
        
        // 随机星星颜色
        const brightness = 0.7 + Math.random() * 0.3;
        const colorTint = Math.random();
        
        if (colorTint < 0.6) {
          // 白色到蓝色
          starColors.push(brightness * 0.9, brightness * 0.9, brightness);
        } else if (colorTint < 0.8) {
          // 橙色/黄色星星
          starColors.push(brightness, brightness * 0.8, brightness * 0.5);
        } else if (colorTint < 0.95) {
          // 蓝色星星
          starColors.push(brightness * 0.7, brightness * 0.8, brightness);
        } else {
          // 红色星星
          starColors.push(brightness, brightness * 0.5, brightness * 0.5);
        }
      }
      
      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
      starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
      starsMaterial.vertexColors = true;
      
      // 创建星星点云
      this.stars = new THREE.Points(starsGeometry, starsMaterial);
      this.scene.add(this.stars);
      
      // 添加远处星云
      this.createDistantNebulas();
      
      console.log('添加了星空背景');
    } catch (error) {
      console.error('创建星星背景时出错:', error);
    }
  }
  
  /**
   * 创建远处的星云
   */
  createDistantNebulas() {
    try {
      // 添加几个彩色星云作为远景
      const nebulaColors = [
        new THREE.Color(0x3366ff).multiplyScalar(0.5), // 蓝色
        new THREE.Color(0xff5566).multiplyScalar(0.4), // 红色
        new THREE.Color(0x6633ff).multiplyScalar(0.5), // 紫色
        new THREE.Color(0x66ffcc).multiplyScalar(0.4)  // 青色
      ];
      
      // 创建4个星云
      for (let i = 0; i < 4; i++) {
        const nebulaSize = 200 + Math.random() * 300;
        const nebulaGeometry = new THREE.PlaneGeometry(nebulaSize, nebulaSize);
        
        // 使用自定义着色器材质创建星云效果
        const nebulaMaterial = new THREE.MeshBasicMaterial({
          color: nebulaColors[i],
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        });
        
        const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
        
        // 随机位置
        const distance = 500 + Math.random() * 300;
        const theta = 2 * Math.PI * Math.random();
        const phi = Math.acos(2 * Math.random() - 1);
        
        nebula.position.x = distance * Math.sin(phi) * Math.cos(theta);
        nebula.position.y = distance * Math.sin(phi) * Math.sin(theta);
        nebula.position.z = distance * Math.cos(phi);
        
        // 让星云面向中心
        nebula.lookAt(0, 0, 0);
        
        // 添加到场景
        this.scene.add(nebula);
      }
      
      console.log('添加了远处星云');
    } catch (error) {
      console.error('创建星云时出错:', error);
    }
  }
  
  /**
   * 更新星空背景动画
   * 在update方法中调用
   */
  updateStarBackground(deltaTime) {
    if (this.stars) {
      // 让星星微微旋转以产生动态效果
      this.stars.rotation.y += deltaTime * 0.01;
      this.stars.rotation.x += deltaTime * 0.005;
    }
  }
  
  /**
   * Setup basic scene lighting
   */
  setupLights() {
    // Ambient light - 增强环境光亮度
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun) - 增强直射光亮度
    const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    
    // Configure shadow properties
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 50;
    sunLight.shadow.bias = -0.0001;
    
    this.scene.add(sunLight);
    
    // 添加额外的点光源以增强视觉效果
    const pointLight1 = new THREE.PointLight(0xffffcc, 1.0, 50);
    pointLight1.position.set(-10, 15, 5);
    this.scene.add(pointLight1);
    
    // 添加另一个点光源，从不同角度照亮物体
    const pointLight2 = new THREE.PointLight(0xccffff, 1.0, 50);
    pointLight2.position.set(10, -5, 15);
    this.scene.add(pointLight2);
  }
  
  /**
   * Handle window resize
   */
  onWindowResize() {
    if (!this.camera || !this.renderer) {
      console.warn('相机或渲染器不存在，无法调整大小');
      return;
    }
    
    try {
      // 更新相机宽高比
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      
      // 更新渲染器大小
      if (typeof this.renderer.setSize === 'function') {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
      } else if (this.renderer.renderer && typeof this.renderer.renderer.setSize === 'function') {
        // 尝试使用renderer.renderer.setSize
        this.renderer.renderer.setSize(window.innerWidth, window.innerHeight);
      } else if (typeof this.renderer.setResolution === 'function') {
        // 尝试使用renderer.setResolution
        this.renderer.setResolution(window.innerWidth, window.innerHeight);
      } else {
        console.warn('无法调整渲染器大小：renderer没有setSize方法');
      }
    } catch (error) {
      console.error('调整窗口大小时出错:', error);
    }
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