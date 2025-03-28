// src/game/GameState.js
import * as THREE from 'three';
import { Player } from './Player';
import { Universe } from '../universe/Universe';
import { SaveSystem } from '../utils/SaveSystem';
import { PlanetGenerator } from './PlanetGenerator';
import { ResourceCollector } from './ResourceCollector';

export class GameState {
  constructor() {
    this.player = null;
    this.universe = null;
    this.saveSystem = null;
    this.gameEngine = null;
    this.planetGenerator = null;
    this.resourceCollector = null;
    this.currentTime = 0;
    this.gameTime = 0; // In-game time in hours
    this.gameSpeed = 1; // Time multiplier
    this.isGamePaused = false;
    this.isNewGame = true;
    this.isInitialized = false;
    
    // 当前场景和相机
    this.currentScene = null;
    this.currentCamera = null;
    
    // Game settings
    this.gameSettings = {
      difficulty: 'normal', // easy, normal, hard
      seed: Math.floor(Math.random() * 10000),
      version: '0.1.0',
      pixelationLevel: 4,
      audioEnabled: true,
      musicVolume: 0.5,
      sfxVolume: 0.8
    };
    
    // Game stats
    this.stats = {
      planetsVisited: 0,
      starsExplored: 0,
      distanceTraveled: 0,
      resourcesCollected: 0,
      creditsEarned: 0,
      timePlayed: 0
    };
  }
  
  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('GameState already initialized');
      return this;
    }
    
    console.log('Initializing GameState...');
    
    // Apply configuration options
    if (options.gameEngine) this.gameEngine = options.gameEngine;
    if (options.difficulty) this.gameSettings.difficulty = options.difficulty;
    if (options.seed !== undefined) this.gameSettings.seed = options.seed;
    
    // 创建基础场景
    this.setupScene();
    
    // Initialize save system
    this.saveSystem = new SaveSystem();
    
    // 初始化行星生成器
    this.planetGenerator = new PlanetGenerator();
    
    // Create player
    this.player = new Player().initialize({ 
      gameEngine: this.gameEngine,
      gameState: this 
    });
    
    // 初始化资源收集器
    this.resourceCollector = new ResourceCollector().initialize({
      player: this.player
    });
    
    // Create universe with seeded random
    this.universe = new Universe().initialize({
      seed: this.gameSettings.seed,
      numGalaxies: 1, // Start with a single galaxy for simplicity
      planetGenerator: this.planetGenerator // 将行星生成器传给宇宙系统
    });
    
    // Set starting location
    if (this.universe.galaxies.length > 0) {
      const startingGalaxy = this.universe.galaxies[0];
      if (startingGalaxy.starSystems.length > 0) {
        const startingSystem = startingGalaxy.starSystems[0];
        this.player.enterStarSystem(startingSystem);
        
        // Position player's ship at the star system
        if (this.player.spaceship) {
          this.player.spaceship.position.copy(startingSystem.position);
          
          // 将飞船添加到场景中
          this.currentScene.add(this.player.spaceship);
        }
        
        // 生成星系中的行星
        this.generatePlanetsForSystem(startingSystem);
      }
    }
    
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 设置基础场景和相机
   */
  setupScene() {
    // 创建场景
    this.currentScene = new THREE.Scene();
    
    // 使用更深的蓝黑色作为背景
    this.currentScene.background = new THREE.Color(0x000022);
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x303050, 0.7);
    this.currentScene.add(ambientLight);
    
    // 添加定向光源
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.currentScene.add(directionalLight);
    
    // 添加第二个彩色光源营造氛围
    const colorLight = new THREE.DirectionalLight(0x6666ff, 0.4);
    colorLight.position.set(-1, 0.5, -1);
    this.currentScene.add(colorLight);
    
    // 创建相机
    this.currentCamera = new THREE.PerspectiveCamera(
      75, window.innerWidth / window.innerHeight, 0.1, 10000
    );
    this.currentCamera.position.set(0, 10, 20);
    this.currentCamera.lookAt(0, 0, 0);
    
    // 添加远处的恒星背景
    this.createStarfield();
    
    // 添加星云效果
    this.createNebulae();
    
    return this;
  }
  
  /**
   * 创建恒星背景
   */
  createStarfield() {
    // 创建大量恒星 
    const starsGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = [];
    const starColors = [];
    const starSizes = [];
    
    for (let i = 0; i < starCount; i++) {
      // 随机位置 - 在以相机为中心的大半径球上
      const radius = 1000 + Math.random() * 4000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      starPositions.push(x, y, z);
      
      // 随机星星颜色 - 主要是白、蓝、黄和红色系
      let r, g, b;
      const colorType = Math.random();
      
      if (colorType < 0.6) {
        // 白色/蓝白色恒星 (60%)
        r = 0.8 + Math.random() * 0.2;
        g = 0.8 + Math.random() * 0.2;
        b = 0.9 + Math.random() * 0.1;
      } else if (colorType < 0.8) {
        // 黄色/橙色恒星 (20%)
        r = 0.9 + Math.random() * 0.1;
        g = 0.6 + Math.random() * 0.3;
        b = 0.3 + Math.random() * 0.2;
      } else if (colorType < 0.95) {
        // 蓝色恒星 (15%)
        r = 0.4 + Math.random() * 0.2;
        g = 0.6 + Math.random() * 0.2;
        b = 0.9 + Math.random() * 0.1;
      } else {
        // 红色恒星 (5%)
        r = 0.9 + Math.random() * 0.1;
        g = 0.2 + Math.random() * 0.3;
        b = 0.2 + Math.random() * 0.2;
      }
      
      starColors.push(r, g, b);
      
      // 星星大小 - 有少量明亮的大恒星
      let size;
      if (Math.random() < 0.05) {
        // 亮星 (5%)
        size = 3 + Math.random() * 3;
      } else {
        // 普通恒星 (95%)
        size = 0.5 + Math.random() * 1.5;
      }
      
      starSizes.push(size);
    }
    
    // 创建恒星的Buffer属性
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));
    starsGeometry.setAttribute('size', new THREE.Float32BufferAttribute(starSizes, 1));
    
    // 创建恒星材质 - 使用自定义着色器实现闪烁效果
    const starsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // 添加时间因子产生闪烁效果
          float twinkle = sin(time * 0.5 + position.x * 0.01 + position.y * 0.01 + position.z * 0.01) * 0.5 + 0.5;
          
          gl_PointSize = size * (1.0 + twinkle * 0.2) * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          // 计算到点中心的距离，创建圆形光点
          float distance = length(gl_PointCoord - vec2(0.5, 0.5));
          if (distance > 0.5) discard; // 丢弃远离中心的片段，形成圆形
          
          // 根据到中心的距离创建发光效果
          float intensity = 1.0 - distance * 2.0;
          vec3 finalColor = vColor * intensity;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    });
    
    // 创建点云
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    this.currentScene.add(starField);
    this.starField = starField;
    
    // 添加几个特别明亮的恒星和光晕
    this.createBrightStars();
  }
  
  /**
   * 创建明亮的恒星
   */
  createBrightStars() {
    // 添加6-10个明亮的恒星
    const brightStarCount = 6 + Math.floor(Math.random() * 5);
    
    for (let i = 0; i < brightStarCount; i++) {
      // 随机位置 - 较远处
      const radius = 2000 + Math.random() * 3000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // 决定恒星颜色
      let color;
      const colorType = Math.random();
      
      if (colorType < 0.3) {
        color = 0xffffaa; // 黄色
      } else if (colorType < 0.6) {
        color = 0xaaaaff; // 蓝色
      } else if (colorType < 0.8) {
        color = 0xffaa88; // 橙色
      } else {
        color = 0xff8888; // 红色
      }
      
      // 创建恒星光晕
      const size = 15 + Math.random() * 15;
      
      // 几何体
      const starGeometry = new THREE.SphereGeometry(size, 16, 16);
      
      // 恒星材质 - 使用自发光
      const starMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });
      
      const star = new THREE.Mesh(starGeometry, starMaterial);
      star.position.set(x, y, z);
      this.currentScene.add(star);
      
      // 添加光晕
      const glowSize = size * 2;
      const glowGeometry = new THREE.SphereGeometry(glowSize, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      star.add(glow);
      
      // 添加射线效果
      this.createStarRays(star, color, size * 3);
    }
  }
  
  /**
   * 创建恒星射线
   */
  createStarRays(star, color, length) {
    const rayCount = 4 + Math.floor(Math.random() * 4); // 4-8条射线
    
    for (let i = 0; i < rayCount; i++) {
      // 随机角度
      const angle = Math.random() * Math.PI * 2;
      
      // 创建射线几何体
      const rayGeometry = new THREE.CylinderGeometry(0.5, 0.1, length, 8);
      rayGeometry.rotateX(Math.PI / 2); // 使射线指向外部
      
      // 随机旋转
      rayGeometry.rotateY(angle);
      rayGeometry.rotateZ(Math.random() * Math.PI / 4); // 添加一些倾斜
      
      // 射线材质
      const rayMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.3 + Math.random() * 0.3
      });
      
      const ray = new THREE.Mesh(rayGeometry, rayMaterial);
      ray.position.set(0, 0, 0);
      star.add(ray);
    }
  }
  
  /**
   * 创建星云效果
   */
  createNebulae() {
    // 添加2-4个星云
    const nebulaCount = 2 + Math.floor(Math.random() * 3);
    
    for (let i = 0; i < nebulaCount; i++) {
      // 随机位置 - 较远处但可见
      const radius = 1000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      // 星云尺寸
      const size = 200 + Math.random() * 500;
      
      // 星云材质颜色 - 多彩
      let color;
      const colorType = Math.random();
      
      if (colorType < 0.25) {
        color = new THREE.Color(0.2, 0.1, 0.6); // 蓝紫色
      } else if (colorType < 0.5) {
        color = new THREE.Color(0.6, 0.1, 0.2); // 红色
      } else if (colorType < 0.75) {
        color = new THREE.Color(0.2, 0.6, 0.1); // 绿色
      } else {
        color = new THREE.Color(0.6, 0.4, 0.1); // 橙黄色
      }
      
      // 创建云状几何体
      const nebulaGeometry = new THREE.SphereGeometry(size, 24, 24);
      
      // 创建基于噪声的星云材质
      const nebulaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          baseColor: { value: color }
        },
        vertexShader: `
          varying vec3 vPosition;
          
          void main() {
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float time;
          uniform vec3 baseColor;
          varying vec3 vPosition;
          
          // 简单的噪声函数
          float noise(vec3 p) {
            float t = fract(time * 0.01);
            return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164)) + t) * 43758.5453);
          }
          
          void main() {
            // 生成多层噪声，创建云状效果
            float n1 = noise(vPosition * 0.01);
            float n2 = noise(vPosition * 0.02 + vec3(100.0));
            float n3 = noise(vPosition * 0.005 - vec3(50.0));
            
            // 组合噪声层
            float finalNoise = n1 * 0.5 + n2 * 0.3 + n3 * 0.2;
            
            // 使边缘更透明
            float distFromCenter = length(gl_PointCoord - vec2(0.5));
            float edge = 1.0 - distFromCenter * 2.0;
            
            // 最终颜色和不透明度
            vec3 finalColor = baseColor * finalNoise * 1.5;
            float opacity = finalNoise * edge * 0.4; // 控制透明度
            
            // 丢弃非常暗的部分
            if (opacity < 0.05) discard;
            
            gl_FragColor = vec4(finalColor, opacity);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      
      const nebula = new THREE.Mesh(nebulaGeometry, nebulaMaterial);
      nebula.position.set(x, y, z);
      
      // 随机旋转星云
      nebula.rotation.x = Math.random() * Math.PI * 2;
      nebula.rotation.y = Math.random() * Math.PI * 2;
      nebula.rotation.z = Math.random() * Math.PI * 2;
      
      this.currentScene.add(nebula);
      
      // 将星云加入到可动画对象列表
      if (!this.nebulae) this.nebulae = [];
      this.nebulae.push(nebula);
    }
  }
  
  /**
   * 为星系生成行星
   * @param {Object} starSystem - 星系对象
   */
  generatePlanetsForSystem(starSystem) {
    if (!starSystem || !this.planetGenerator) return;
    
    // 根据星系类型和大小确定行星数量
    const planetCount = 3 + Math.floor(Math.random() * 5); // 3-7个行星
    
    // 生成行星
    const planets = this.planetGenerator.generatePlanetSystem(planetCount, false);
    
    // 将行星添加到星系和场景中
    planets.forEach(planet => {
      // 添加到星系
      starSystem.planets.push(planet);
      
      // 添加到场景
      this.currentScene.add(planet);
      
      // 设置行星围绕恒星的初始轨道位置
      const orbitRadius = 50 + starSystem.planets.indexOf(planet) * 30;
      const angle = Math.random() * Math.PI * 2;
      
      planet.position.set(
        starSystem.position.x + Math.cos(angle) * orbitRadius,
        starSystem.position.y + (Math.random() - 0.5) * 20,
        starSystem.position.z + Math.sin(angle) * orbitRadius
      );
      
      // 记录轨道信息到planet.userData中
      planet.userData.orbitCenter = starSystem.position.clone();
      planet.userData.orbitRadius = orbitRadius;
      planet.userData.orbitAngle = angle;
      planet.userData.orbitSpeed = 0.001 + Math.random() * 0.002;
    });
    
    console.log(`Generated ${planets.length} planets for star system ${starSystem.name}`);
    return planets;
  }
  
  update(deltaTime, elapsed) {
    if (!this.isInitialized || this.isGamePaused) return;
    
    // Update game time
    this.currentTime += deltaTime;
    this.gameTime += deltaTime * this.gameSpeed;
    this.stats.timePlayed += deltaTime;
    
    // 更新星空背景动画
    this.updateStarfieldAnimations(deltaTime);
    
    // Update player
    if (this.player) {
      this.player.update(deltaTime, this.gameEngine?.inputManager);
      
      // 检测最近的星球
      this.checkNearestPlanet();
    }
    
    // Update universe
    if (this.universe) {
      this.universe.update(deltaTime, elapsed);
    }
    
    // Animate planets
    this.updatePlanetAnimations(deltaTime);
    
    // Update resource collection
    if (this.resourceCollector) {
      this.resourceCollector.update(deltaTime);
    }
    
    // Position camera
    this.updateCamera();
    
    // Check for star system interactions
    this.checkStarSystemInteractions();
    
    // Check for planet interactions
    this.checkPlanetInteractions();
    
    // Update current scene and camera reference for rendering
    if (this.scene) {
      this.currentScene = this.scene;
    }
    
    if (this.camera) {
      this.currentCamera = this.camera;
    }
  }
  
  /**
   * 检测玩家附近的星球，并更新player.nearestPlanet和player.nearestPlanetDistance
   */
  checkNearestPlanet() {
    if (!this.player || !this.player.spaceship || !this.universe) return;
    
    let nearestPlanet = null;
    let nearestDistance = Infinity;
    
    // 获取当前星系中的所有行星
    const currentSystem = this.player.currentStarSystem;
    if (!currentSystem || !currentSystem.planets) return;
    
    // 遍历星系中的行星
    for (const planet of currentSystem.planets) {
      if (!planet.position) continue;
      
      // 计算飞船与行星之间的距离
      const distance = this.player.spaceship.position.distanceTo(planet.position);
      
      // 更新最近行星
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlanet = planet;
      }
    }
    
    // 更新player的属性
    this.player.nearestPlanet = nearestPlanet;
    this.player.nearestPlanetDistance = nearestDistance;
    
    // 如果距离很近，显示UI提示
    if (nearestDistance < 20 && nearestPlanet) {
      console.log(`接近行星 ${nearestPlanet.name}，距离: ${nearestDistance.toFixed(2)}`);
      // 可以触发HUD显示行星信息
      // this.gameEngine?.uiManager?.showPlanetProximityAlert(nearestPlanet);
    }
  }
  
  /**
   * 更新相机位置，跟随玩家飞船
   */
  updateCamera() {
    if (!this.player || !this.player.spaceship || !this.currentCamera) return;
    
    const ship = this.player.spaceship;
    
    // 计算相机位置：在飞船后方稍微上方
    const shipPosition = ship.position.clone();
    const shipDirection = ship.getDirection();
    
    // 相机到飞船的距离
    const cameraDistance = 30;
    
    // 计算相机位置：飞船后方一定距离
    const cameraPosition = shipPosition.clone().sub(
      shipDirection.clone().multiplyScalar(cameraDistance)
    );
    
    // 稍微上升相机高度
    cameraPosition.y += 10;
    
    // 平滑插值移动相机
    this.currentCamera.position.lerp(cameraPosition, 0.05);
    
    // 相机始终看向飞船
    this.currentCamera.lookAt(shipPosition);
  }
  
  /**
   * 更新行星动画：自转和公转
   */
  updatePlanetAnimations(deltaTime) {
    // 获取当前星系内的行星
    if (this.player && this.player.currentStarSystem) {
      const system = this.player.currentStarSystem;
      
      // 更新行星动画
      if (this.planetGenerator && system.planets && system.planets.length > 0) {
        this.planetGenerator.updatePlanetSystem(
          system.planets, 
          system.position,
          deltaTime
        );
      }
    }
  }
  
  /**
   * 检测玩家与行星的接近和交互
   */
  checkPlanetInteractions() {
    if (!this.player || !this.player.spaceship || !this.player.currentStarSystem) return;
    
    const ship = this.player.spaceship;
    const shipPos = ship.position;
    const planets = this.player.currentStarSystem.planets || [];
    
    // 标记最近的行星
    let closestPlanet = null;
    let closestDistance = Infinity;
    
    planets.forEach(planet => {
      // 确保行星对象有效
      if (!planet || !planet.mesh) return;
      
      // 使用行星的mesh来获取位置
      const planetPos = planet.mesh.position;
      
      // 安全检查：确保planetPos存在且有x、y、z属性
      if (!planetPos || typeof planetPos.x !== 'number') {
        console.warn(`Planet ${planet.name} has invalid position`, planet);
        return;
      }
      
      // 计算玩家和行星之间的距离
      const distance = shipPos.distanceTo(planetPos);
      const planetRadius = planet.size || 10;
      const interactionDistance = planetRadius * 2 + 20; // 交互距离为行星半径的2倍加20
      
      // 更新最近行星
      if (distance < closestDistance) {
        closestPlanet = planet;
        closestDistance = distance;
      }
      
      // 当玩家接近行星时
      if (distance < interactionDistance) {
        // 如果这是首次接近该行星
        if (!planet.mesh.userData.visited) {
          planet.mesh.userData.visited = true;
          
          // 显示UI通知
          if (this.gameEngine && this.gameEngine.uiManager) {
            this.gameEngine.uiManager.addNotification(
              `接近行星: ${planet.name}`, 
              'info', 
              5000
            );
            
            // 检查是否有discovery音效，如果没有使用alert音效代替
            const soundToPlay = this.gameEngine.audioManager.audioFiles['discovery'] 
              ? 'discovery' : 'alert';
            
            // 播放发现音效
            if (this.gameEngine.audioManager) {
              this.gameEngine.audioManager.playSound(soundToPlay, 0.7);
            }
          }
          
          // 添加到已访问行星统计
          this.stats.planetsVisited++;
        }
        
        // 检查玩家是否按下交互键(例如E键)来收集资源
        if (this.gameEngine && this.gameEngine.inputManager &&
            this.gameEngine.inputManager.isKeyPressed('KeyE') &&
            this.resourceCollector && !this.resourceCollector.isCollecting()) {
          
          // 安全检查：确保resourceCollector存在
          if (!this.resourceCollector || typeof this.resourceCollector.canCollectFrom !== 'function') {
            console.warn('ResourceCollector not properly initialized');
            return;
          }
          
          // 尝试开始资源收集
          if (this.resourceCollector.canCollectFrom(planet)) {
            const success = this.resourceCollector.startCollection(planet);
            
            if (success) {
              // 显示开始收集通知
              if (this.gameEngine.uiManager) {
                this.gameEngine.uiManager.addNotification(
                  `开始从 ${planet.name} 收集资源...`, 
                  'info', 
                  3000
                );
              }
            }
          } else {
            // 显示无法收集通知
            if (this.gameEngine.uiManager && this.gameEngine.inputManager.isKeyJustPressed('KeyE')) {
              this.gameEngine.uiManager.addNotification(
                `无法从 ${planet.name} 收集资源`, 
                'warning', 
                3000
              );
            }
          }
        }
      }
    });
    
    // 更新玩家的当前最近行星
    this.player.nearestPlanet = closestPlanet;
  }
  
  /**
   * 检测玩家与星系的接近和交互
   * 备注：同checkProximityToSystems功能一致，用于兼容性
   */
  checkStarSystemInteractions() {
    // 调用现有的检测方法
    return this.checkProximityToSystems();
  }
  
  /**
   * 检测玩家与周围星系的距离，发现新星系
   */
  checkProximityToSystems() {
    if (!this.player || !this.player.spaceship || !this.universe) return;
    
    const playerPos = this.player.spaceship.position;
    const discoverRadius = 50; // Units for auto-discovery
    
    // Check all star systems in current galaxy
    if (this.universe.galaxies.length > 0 && this.player.currentStarSystem) {
      const currentGalaxy = this.universe.galaxies[0]; // For now, just use first galaxy
      
      currentGalaxy.starSystems.forEach(system => {
        // Calculate distance to system
        const distance = new THREE.Vector3()
          .copy(system.position)
          .sub(playerPos)
          .length();
        
        // Auto-discover nearby systems
        if (distance < discoverRadius && !system.explored) {
          system.markExplored();
          this.stats.starsExplored++;
          
          // Notify UI of discovery
          if (this.gameEngine && this.gameEngine.uiManager) {
            this.gameEngine.uiManager.addNotification(
              `Discovered new star system: ${system.name}`,
              'discovery',
              5000
            );
            
            // Play discovery sound
            if (this.gameEngine.audioManager) {
              this.gameEngine.audioManager.playSound('discovery');
            }
            
            // Award experience to player
            this.player.gainExperience(50);
          }
        }
      });
    }
  }
  
  checkShipStatus() {
    if (!this.player || !this.player.spaceship) return;
    
    const ship = this.player.spaceship;
    
    // Critical health warning
    if (ship.health < 25 && !this._lowHealthWarningShown) {
      this._lowHealthWarningShown = true;
      
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          'WARNING: Ship hull integrity critical',
          'danger',
          8000
        );
        
        if (this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSound('warning_alarm');
        }
      }
    } else if (ship.health >= 25) {
      this._lowHealthWarningShown = false;
    }
    
    // Low energy warning
    if (ship.energy < 20 && !this._lowEnergyWarningShown) {
      this._lowEnergyWarningShown = true;
      
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          'WARNING: Ship energy reserves low',
          'warning',
          8000
        );
      }
    } else if (ship.energy >= 20) {
      this._lowEnergyWarningShown = false;
    }
  }
  
  pause() {
    this.isGamePaused = true;
    return this;
  }
  
  resume() {
    this.isGamePaused = false;
    return this;
  }
  
  saveGame() {
    if (!this.saveSystem) return false;
    
    const saveData = this.serialize();
    const success = this.saveSystem.saveGame(saveData);
    
    if (success && this.gameEngine && this.gameEngine.uiManager) {
      this.gameEngine.uiManager.addNotification(
        'Game saved successfully',
        'success',
        3000
      );
    }
    
    return success;
  }
  
  loadGame() {
    if (!this.saveSystem) return false;
    
    const saveData = this.saveSystem.loadGame();
    if (!saveData) return false;
    
    const success = this.deserialize(saveData);
    
    if (success && this.gameEngine && this.gameEngine.uiManager) {
      this.gameEngine.uiManager.addNotification(
        'Game loaded successfully',
        'success',
        3000
      );
      this.isNewGame = false;
    }
    
    return success;
  }
  
  resetGame() {
    console.log('重置游戏状态...');
    try {
      // Create a new universe and player
      this.gameSettings.seed = Math.floor(Math.random() * 10000);
      
      // Reset stats
      this.stats = {
        planetsVisited: 0,
        starsExplored: 0,
        distanceTraveled: 0,
        resourcesCollected: 0,
        creditsEarned: 0,
        timePlayed: 0
      };
      
      // 清理当前场景
      if (this.currentScene) {
        console.log('清理当前场景对象...');
        try {
          // 移除所有物体，除了灯光
          const objectsToRemove = [];
          this.currentScene.traverse(obj => {
            if (obj.type !== 'Light' && obj !== this.currentScene) {
              objectsToRemove.push(obj);
            }
          });
          
          objectsToRemove.forEach(obj => {
            try {
              this.currentScene.remove(obj);
              // 安全处理dispose
              if (obj && obj.geometry && typeof obj.geometry.dispose === 'function') {
                obj.geometry.dispose();
              }
              
              if (obj && obj.material) {
                if (Array.isArray(obj.material)) {
                  obj.material.forEach(mat => {
                    if (mat && typeof mat.dispose === 'function') {
                      mat.dispose();
                    }
                  });
                } else if (typeof obj.material.dispose === 'function') {
                  obj.material.dispose();
                }
              }
              
              // 处理子对象
              if (obj.children && obj.children.length > 0) {
                console.log(`释放对象 ${obj.name || 'unnamed'} 的子对象`);
              }
            } catch (e) {
              console.warn(`移除场景对象 ${obj.name || 'unnamed'} 时出错:`, e);
            }
          });
          console.log(`已清理 ${objectsToRemove.length} 个场景对象`);
        } catch (e) {
          console.warn('清理场景时出错:', e);
        }
      }
      
      // 安全释放各组件资源
      console.log('安全释放各组件资源...');
      
      // 释放玩家资源
      if (this.player) {
        try {
          console.log('释放玩家资源...');
          if (this.player && typeof this.player.dispose === 'function') {
            this.player.dispose();
          } else {
            console.log('玩家对象不存在或没有dispose方法');
          }
        } catch (e) {
          console.warn('释放玩家资源时出错:', e);
        }
      }
      
      // 释放宇宙资源
      if (this.universe) {
        try {
          console.log('释放宇宙资源...');
          if (this.universe && typeof this.universe.dispose === 'function') {
            this.universe.dispose();
          } else {
            console.log('宇宙对象不存在或没有dispose方法');
          }
        } catch (e) {
          console.warn('释放宇宙资源时出错:', e);
        }
      }
      
      // 释放资源收集器资源
      if (this.resourceCollector) {
        try {
          console.log('释放资源收集器资源...');
          if (this.resourceCollector && typeof this.resourceCollector.dispose === 'function') {
            this.resourceCollector.dispose();
          } else {
            console.log('资源收集器对象不存在或没有dispose方法');
          }
        } catch (e) {
          console.warn('释放资源收集器资源时出错:', e);
        }
      }
      
      // 创建新实例
      console.log('创建新游戏实例...');
      try {
        this.player = new Player().initialize({ 
          gameEngine: this.gameEngine,
          gameState: this 
        });
        
        this.universe = new Universe().initialize({
          seed: this.gameSettings.seed,
          numGalaxies: 1,
          planetGenerator: this.planetGenerator
        });
        
        this.resourceCollector = new ResourceCollector().initialize({
          player: this.player
        });
      } catch (e) {
        console.error('创建新游戏实例时出错:', e);
      }
      
      // 重置相机位置
      if (this.currentCamera) {
        try {
          this.currentCamera.position.set(0, 10, 20);
          this.currentCamera.lookAt(0, 0, 0);
        } catch (e) {
          console.warn('重置相机位置时出错:', e);
        }
      }
      
      // 设置起始位置
      try {
        if (this.universe && this.universe.galaxies && this.universe.galaxies.length > 0) {
          const startingGalaxy = this.universe.galaxies[0];
          if (startingGalaxy.starSystems && startingGalaxy.starSystems.length > 0) {
            const startingSystem = startingGalaxy.starSystems[0];
            
            if (this.player) {
              this.player.enterStarSystem(startingSystem);
              
              // 定位玩家飞船在星系位置
              if (this.player.spaceship) {
                this.player.spaceship.position.copy(startingSystem.position);
                
                // 将飞船添加到场景中
                if (this.currentScene && this.player.spaceship.mesh) {
                  try {
                    this.currentScene.add(this.player.spaceship.mesh);
                    console.log('已将飞船添加到场景');
                  } catch (e) {
                    console.error('无法将飞船添加到场景:', e);
                  }
                }
              }
              
              // 生成星系中的行星
              try {
                this.generatePlanetsForSystem(startingSystem);
                console.log('已为起始星系生成行星');
              } catch (e) {
                console.error('生成行星系统时出错:', e);
              }
            }
          }
        }
      } catch (e) {
        console.error('设置起始位置时出错:', e);
      }
      
      this.isNewGame = true;
      this.gameTime = 0;
      
      // Reset warnings
      this._lowHealthWarningShown = false;
      this._lowEnergyWarningShown = false;
      
      console.log('游戏重置完成');
      return true;
    } catch (error) {
      console.error('重置游戏时发生错误:', error.message, error.stack);
      // 即使发生错误，也尝试继续游戏
      return true;
    }
  }
  
  setDifficulty(difficulty) {
    const validDifficulties = ['easy', 'normal', 'hard'];
    if (!validDifficulties.includes(difficulty)) {
      console.warn(`Invalid difficulty: ${difficulty}`);
      return false;
    }
    
    this.gameSettings.difficulty = difficulty;
    
    // Apply difficulty effects
    switch (difficulty) {
      case 'easy':
        // More resources, less damage, etc.
        if (this.player && this.player.spaceship) {
          this.player.spaceship.maxHealth *= 1.5;
          this.player.spaceship.health = this.player.spaceship.maxHealth;
          this.player.spaceship.maxEnergy *= 1.3;
          this.player.spaceship.energy = this.player.spaceship.maxEnergy;
        }
        break;
        
      case 'hard':
        // Fewer resources, more damage, etc.
        if (this.player && this.player.spaceship) {
          this.player.spaceship.maxHealth *= 0.7;
          this.player.spaceship.health = this.player.spaceship.maxHealth;
          this.player.spaceship.maxEnergy *= 0.8;
          this.player.spaceship.energy = this.player.spaceship.maxEnergy;
        }
        break;
    }
    
    return true;
  }
  
  travelToStarSystem(starSystem, instantTravel = false) {
    if (!this.player || !starSystem) return false;
    
    // 检查是否超出跃迁范围
    if (!instantTravel && this.player.currentStarSystem) {
      // 计算与当前星系的距离
      const distance = new THREE.Vector3()
        .copy(starSystem.position)
        .sub(this.player.currentStarSystem.position)
        .length();
      
      // 如果超出最大跃迁范围且不是立即传送，返回错误
      const maxJumpDistance = this.player.spaceship ? this.player.spaceship.maxJumpDistance || 500 : 500;
      if (distance > maxJumpDistance) {
        if (this.gameEngine && this.gameEngine.uiManager) {
          this.gameEngine.uiManager.addNotification(
            `目标星系超出跃迁范围，距离：${distance.toFixed(1)}光年，最大范围：${maxJumpDistance.toFixed(1)}光年`,
            'warning',
            5000
          );
        }
        return false;
      }
    }
    
    // Record travel distance for stats
    if (this.player.currentStarSystem) {
      const distance = new THREE.Vector3()
        .copy(starSystem.position)
        .sub(this.player.currentStarSystem.position)
        .length();
      
      this.stats.distanceTraveled += distance;
    }
    
    // 创建超空间跃迁效果，无论是否立即传送
    if (this.player.spaceship && this.player.createJumpEffect) {
      try {
        this.player.createJumpEffect();
        
        // 创建扭曲效果
        if (this.player.createWarpEffect) {
          this.player.createWarpEffect();
        }
      } catch (error) {
        console.error("创建跃迁效果失败:", error);
      }
    }
    
    if (instantTravel) {
      // 立即执行传送，不需要等待动画
      this._executeTravelToSystem(starSystem);
      return true;
    } else {
      // 延迟800毫秒执行传送，等待动画效果
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `正在准备超空间跃迁到 ${starSystem.name}...`,
          'info',
          3000
        );
      }
      
      setTimeout(() => {
        this._executeTravelToSystem(starSystem);
      }, 800);
      
      return true;
    }
  }
  
  // 内部方法：执行传送到新星系的逻辑
  _executeTravelToSystem(starSystem) {
    // 从场景中移除当前星系的行星
    if (this.player.currentStarSystem && this.player.currentStarSystem.planets) {
      this.player.currentStarSystem.planets.forEach(planet => {
        if (planet && this.currentScene) {
          this.currentScene.remove(planet);
        }
      });
    }
    
    // Enter the new star system
    const success = this.player.enterStarSystem(starSystem);
    
    if (success) {
      // Update player ship position
      if (this.player.spaceship) {
        this.player.spaceship.position.copy(starSystem.position);
        this.player.spaceship.velocity.set(0, 0, 0); // Stop ship
      }
      
      // 如果星系尚未探索，则生成行星
      if (!starSystem.explored) {
        // 生成星系中的行星
        this.generatePlanetsForSystem(starSystem);
        
        // 标记为已探索
        starSystem.markExplored();
        this.stats.starsExplored++;
        
        // Award experience for discovery
        this.player.gainExperience(50);
        
        // 播放发现音效
        if (this.gameEngine && this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSound('discovery');
        }
        
        // 显示发现通知
        if (this.gameEngine && this.gameEngine.uiManager) {
          this.gameEngine.uiManager.addNotification(
            `发现新星系：${starSystem.name}！`,
            'discovery',
            5000
          );
        }
      } else {
        // 如果星系已探索但行星未加载到场景中，则重新加载
        if (starSystem.planets && starSystem.planets.length > 0) {
          starSystem.planets.forEach(planet => {
            if (planet && this.currentScene && !this.currentScene.children.includes(planet)) {
              this.currentScene.add(planet);
            }
          });
        }
      }
      
      // 切换背景音乐
      if (this.gameEngine && this.gameEngine.audioManager) {
        this.gameEngine.audioManager.playMusic('space_ambient', true, true);
      }
      
      // 显示到达通知
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `已抵达 ${starSystem.name} 星系`,
          'success',
          3000
        );
      }
    }
    
    return success;
  }
  
  landOnPlanet(planet) {
    if (!this.player || !planet || !planet.userData || !planet.userData.canLand) return false;
    
    // 停止收集资源如果正在进行
    if (this.resourceCollector && this.resourceCollector.isCollecting()) {
      this.resourceCollector.stopCollection(false);
    }
    
    const success = this.player.landOnPlanet(planet);
    
    if (success) {
      // Handle first visit to this planet
      if (!planet.userData.explored) {
        planet.userData.explored = true;
        this.stats.planetsVisited++;
        
        // Award experience for discovery
        this.player.gainExperience(100);
        
        if (this.gameEngine && this.gameEngine.uiManager) {
          this.gameEngine.uiManager.addNotification(
            `First landing on ${planet.userData.name}!`,
            'discovery',
            5000
          );
          
          // 播放发现音效
          if (this.gameEngine.audioManager) {
            this.gameEngine.audioManager.playSound('discovery');
          }
        }
      }
    }
    
    return success;
  }
  
  takeOff() {
    if (!this.player) return false;
    
    const success = this.player.takeOff();
    
    // 起飞时播放音效
    if (success && this.gameEngine && this.gameEngine.audioManager) {
      this.gameEngine.audioManager.playSound('engine_boost');
    }
    
    return success;
  }
  
  /**
   * 使用资源收集器收集行星资源
   * @param {THREE.Object3D} planet - 要收集资源的行星
   * @returns {boolean} 是否成功开始收集
   */
  startResourceCollection(planet) {
    if (!this.resourceCollector || !planet) return false;
    
    return this.resourceCollector.startCollection(planet);
  }
  
  /**
   * 停止资源收集过程
   * @param {boolean} complete - 是否收集完成
   * @returns {Array} 收集的资源
   */
  stopResourceCollection(complete = false) {
    if (!this.resourceCollector) return [];
    
    return this.resourceCollector.stopCollection(complete);
  }
  
  collectResource(resourceType, amount) {
    if (!this.player || !this.player.inventory) return false;
    
    // Create resource item
    const resource = {
      id: `${resourceType}_${Date.now()}`,
      name: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}`,
      type: 'resource',
      category: 'resources',
      resourceType: resourceType,
      quantity: amount,
      stackable: true,
      value: this.getResourceValue(resourceType) * amount
    };
    
    // Add to inventory
    const success = this.player.inventory.addItem(resource);
    
    if (success) {
      this.stats.resourcesCollected += amount;
    }
    
    return success;
  }
  
  getResourceValue(resourceType) {
    // Base value per unit
    switch (resourceType) {
      case 'minerals':
        return 5;
      case 'gases':
        return 7;
      case 'organics':
        return 10;
      case 'rareElements':
        return 25;
      default:
        return 2;
    }
  }
  
  sellResource(resourceId, quantity) {
    if (!this.player || !this.player.inventory) return false;
    
    // Find resource in inventory
    const resource = this.player.inventory.items.find(item => item.id === resourceId);
    if (!resource) return false;
    
    // Calculate value
    const value = resource.value / resource.quantity * quantity;
    
    // Remove from inventory
    const success = this.player.inventory.removeItem(resourceId, quantity);
    
    if (success) {
      // Add credits to player
      this.player.addCredits(value);
      this.stats.creditsEarned += value;
    }
    
    return success;
  }
  
  serialize() {
    return {
      player: this.player ? this.player.serialize() : null,
      universe: this.universe ? this.universe.serialize() : null,
      gameTime: this.gameTime,
      gameSettings: { ...this.gameSettings },
      stats: { ...this.stats },
      timestamp: Date.now()
    };
  }
  
  deserialize(data) {
    if (!data) return false;
    
    // Check version compatibility
    if (data.gameSettings && data.gameSettings.version !== this.gameSettings.version) {
      console.warn(`Save version mismatch. Save: ${data.gameSettings.version}, Current: ${this.gameSettings.version}`);
      // Could implement conversion logic here if needed
    }
    
    // Load game settings
    if (data.gameSettings) {
      this.gameSettings = { ...this.gameSettings, ...data.gameSettings };
    }
    
    this.gameTime = data.gameTime || 0;
    
    // Load stats
    if (data.stats) {
      this.stats = { ...this.stats, ...data.stats };
    }
    
    // Recreate universe from saved data
    if (data.universe) {
      if (this.universe) {
        this.universe.dispose();
      }
      this.universe = new Universe().deserialize(data.universe);
      this.universe.planetGenerator = this.planetGenerator;
    }
    
    // Recreate player from saved data
    if (data.player) {
      if (this.player) {
        this.player.dispose();
      }
      this.player = new Player().deserialize(data.player);
      
      // Connect player to game engine
      if (this.gameEngine) {
        this.player.initialize({ 
          gameEngine: this.gameEngine,
          gameState: this 
        });
      }
      
      // 重新初始化资源收集器
      if (this.resourceCollector) {
        this.resourceCollector.dispose();
      }
      
      this.resourceCollector = new ResourceCollector().initialize({
        player: this.player
      });
      
      // Reconnect player to universe objects
      if (data.player.currentStarSystem && this.universe) {
        const starSystem = this.universe.getStarSystemById(data.player.currentStarSystem);
        if (starSystem) {
          this.player.currentStarSystem = starSystem;
          
          // 如果星系中没有行星，生成行星
          if (!starSystem.planets || starSystem.planets.length === 0) {
            this.generatePlanetsForSystem(starSystem);
          } else {
            // 将行星添加到场景中
            starSystem.planets.forEach(planet => {
              if (planet && this.currentScene) {
                this.currentScene.add(planet);
              }
            });
          }
          
          // 添加飞船到场景
          if (this.player.spaceship && this.currentScene) {
            this.currentScene.add(this.player.spaceship);
          }
        }
      }
      
      if (data.player.currentPlanet && this.universe) {
        const planet = this.universe.getPlanetById(data.player.currentPlanet);
        if (planet) {
          this.player.currentPlanet = planet;
        }
      }
    }
    
    this.isNewGame = false;
    console.log('Game state loaded');
    return true;
  }
  
  dispose() {
    // 清理场景
    if (this.currentScene) {
      while (this.currentScene.children.length > 0) {
        const object = this.currentScene.children[0];
        
        // 移除前处理特殊对象
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
        
        this.currentScene.remove(object);
      }
    }
    
    if (this.player) {
      this.player.dispose();
      this.player = null;
    }
    
    if (this.universe) {
      this.universe.dispose();
      this.universe = null;
    }
    
    if (this.resourceCollector) {
      this.resourceCollector.dispose();
      this.resourceCollector = null;
    }
    
    this.currentScene = null;
    this.currentCamera = null;
    
    this.isInitialized = false;
    return this;
  }
  
  /**
   * 更新星空背景动画
   * @param {Number} deltaTime - 时间增量
   */
  updateStarfieldAnimations(deltaTime) {
    // 更新星星闪烁效果
    if (this.starField && this.starField.material && this.starField.material.uniforms) {
      this.starField.material.uniforms.time.value += deltaTime;
    }
    
    // 更新星云动画
    if (this.nebulae && this.nebulae.length > 0) {
      this.nebulae.forEach(nebula => {
        if (nebula && nebula.material && nebula.material.uniforms) {
          // 更新时间值
          nebula.material.uniforms.time.value += deltaTime;
          
          // 轻微旋转星云
          nebula.rotation.y += 0.001 * deltaTime;
          nebula.rotation.z += 0.0005 * deltaTime;
        }
      });
    }
    
    // 随机创建流星效果 (平均每30秒一次)
    if (Math.random() < 0.001 * deltaTime * 30) {
      this.createMeteor();
    }
  }
  
  /**
   * 创建流星效果
   */
  createMeteor() {
    if (!this.currentScene || !this.currentCamera) return;
    
    // 创建流星几何体
    const meteorGeometry = new THREE.BufferGeometry();
    
    // 流星起点(相对于相机在随机位置出现)
    const startX = (Math.random() - 0.5) * 300;
    const startY = 100 + Math.random() * 200;
    const startZ = -200 - Math.random() * 500;
    
    // 终点(向屏幕对侧落下)
    const endX = startX + (Math.random() - 0.5) * 400;
    const endY = -100 - Math.random() * 200;
    const endZ = startZ + (Math.random() - 0.5) * 200;
    
    // 转换到世界坐标
    const startWorld = new THREE.Vector3(startX, startY, startZ);
    const endWorld = new THREE.Vector3(endX, endY, endZ);
    
    startWorld.applyMatrix4(this.currentCamera.matrixWorld);
    endWorld.applyMatrix4(this.currentCamera.matrixWorld);
    
    // 创建轨迹点
    const points = [];
    const segments = 20;
    for (let i = 0; i <= segments; i++) {
      const point = new THREE.Vector3().lerpVectors(
        startWorld, endWorld, i / segments
      );
      points.push(point);
    }
    
    // 设置顶点
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i].x;
      positions[i * 3 + 1] = points[i].y;
      positions[i * 3 + 2] = points[i].z;
    }
    
    meteorGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    // 流星材质 - 随机颜色，但偏向蓝白色
    const meteorMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(0.7 + Math.random() * 0.3, 0.8 + Math.random() * 0.2, 1.0),
      transparent: true,
      opacity: 0.7
    });
    
    const meteor = new THREE.Line(meteorGeometry, meteorMaterial);
    this.currentScene.add(meteor);
    
    // 创建流星头部的发光效果
    const headGeometry = new THREE.SphereGeometry(1, 8, 8);
    const headMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    
    const meteorHead = new THREE.Mesh(headGeometry, headMaterial);
    meteorHead.position.copy(startWorld);
    this.currentScene.add(meteorHead);
    
    // 流星动画
    const duration = 1 + Math.random() * 1.5; // 1-2.5秒
    let elapsed = 0;
    
    const animateMeteor = () => {
      if (elapsed >= duration) {
        // 动画结束，移除流星
        this.currentScene.remove(meteor);
        this.currentScene.remove(meteorHead);
        meteor.geometry.dispose();
        meteor.material.dispose();
        meteorHead.geometry.dispose();
        meteorHead.material.dispose();
        return;
      }
      
      // 更新流星位置
      const progress = elapsed / duration;
      const position = new THREE.Vector3().lerpVectors(startWorld, endWorld, progress);
      meteorHead.position.copy(position);
      
      // 更新拖尾透明度
      meteor.material.opacity = 0.7 * (1 - progress);
      
      // 下一帧继续动画
      elapsed += 0.016; // 约60fps
      requestAnimationFrame(animateMeteor);
    };
    
    // 启动流星动画
    animateMeteor();
  }
}

export default GameState;