// src/game/ResourceCollector.js
import * as THREE from 'three';

/**
 * 资源收集系统，管理玩家与行星交互获取资源的过程
 */
export class ResourceCollector {
  constructor() {
    this.player = null;
    this.currentPlanet = null;
    this.activeCollection = false;
    this.collectionProgress = 0;
    this.collectionSpeed = 0.2; // 收集速度，每秒增加的百分比
    this.collectionTime = 5; // 完成收集需要的秒数
    this.collectionParticles = null;
    this.collectedResources = [];
    this.isInitialized = false;
  }
  
  /**
   * 初始化资源收集器
   * @param {Object} options - 初始化选项
   * @param {Player} options.player - 玩家实例
   */
  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('ResourceCollector already initialized');
      return this;
    }
    
    console.log('Initializing ResourceCollector...');
    
    if (options.player) this.player = options.player;
    
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 开始从行星收集资源
   * @param {Planet} planet - 要收集资源的行星
   * @returns {boolean} 是否成功开始收集
   */
  startCollection(planet) {
    if (!this.isInitialized || !this.player || this.activeCollection || !planet) {
      return false;
    }
    
    // 检查行星是否可以收集资源
    if (!this.canCollectFrom(planet)) {
      console.log(`Cannot collect resources from ${planet.name}`);
      return false;
    }
    
    // 设置收集目标
    this.currentPlanet = planet;
    this.activeCollection = true;
    this.collectionProgress = 0;
    this.collectedResources = [];
    
    // 创建收集特效
    this.createCollectionEffect();
    
    console.log(`Started resource collection on ${planet.name}`);
    return true;
  }
  
  /**
   * 停止资源收集过程
   * @param {boolean} complete - 是否收集完成
   * @returns {Object} 收集到的资源
   */
  stopCollection(complete = false) {
    if (!this.activeCollection) return [];
    
    // 移除收集特效
    this.removeCollectionEffect();
    
    const collectedResources = [...this.collectedResources];
    
    // 如果完成了收集，将资源添加到玩家物品栏
    if (complete && this.player && this.player.inventory) {
      collectedResources.forEach(resource => {
        this.player.inventory.addResource(resource.type, resource.amount);
      });
    }
    
    // 重置收集状态
    this.activeCollection = false;
    this.collectionProgress = 0;
    this.currentPlanet = null;
    this.collectedResources = [];
    
    return collectedResources;
  }
  
  /**
   * 更新资源收集进度
   * @param {number} deltaTime - 时间增量
   */
  update(deltaTime) {
    if (!this.isInitialized || !this.activeCollection || !this.currentPlanet) return;
    
    // 更新收集进度
    const progressIncrement = this.collectionSpeed * deltaTime;
    this.collectionProgress += progressIncrement;
    
    // 更新粒子特效
    this.updateCollectionEffect(deltaTime);
    
    // 检查是否需要分配一些资源
    const progressThreshold = 0.2; // 每20%进度分配一批资源
    if (Math.floor(this.collectionProgress / progressThreshold) > 
        Math.floor((this.collectionProgress - progressIncrement) / progressThreshold)) {
      this.allocateResources();
    }
    
    // 检查是否完成收集
    if (this.collectionProgress >= 1.0) {
      this.completeCollection();
    }
  }
  
  /**
   * 检查是否可以从行星收集资源
   * @param {Planet} planet - 行星
   * @returns {boolean} 是否可以收集资源
   */
  canCollectFrom(planet) {
    if (!planet) return false;
    
    // 检查距离
    if (this.player && this.player.spaceship) {
      const distance = this.player.spaceship.position.distanceTo(planet.position);
      const collectRadius = planet.size * 1.5 + 5; // 收集半径
      
      // 太远则无法收集
      if (distance > collectRadius) {
        return false;
      }
    }
    
    // 检查行星是否有资源
    return planet.resources && Object.values(planet.resources).some(val => val > 0);
  }
  
  /**
   * 分配收集到的资源
   */
  allocateResources() {
    if (!this.currentPlanet || !this.currentPlanet.resources) return;
    
    // 根据行星资源丰富度随机分配资源
    const resources = this.currentPlanet.resources;
    const resourceTypes = Object.keys(resources).filter(type => resources[type] > 0);
    
    if (resourceTypes.length === 0) return;
    
    // 随机选择一种资源类型
    const selectedType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
    
    // 根据资源丰富度计算收集量
    const abundance = resources[selectedType];
    const baseAmount = 1 + Math.floor(Math.random() * 3); // 基础收集量1-3
    const amount = baseAmount * (abundance / 10); // 根据丰富度(0-10)调整
    
    // 添加到收集列表
    this.collectedResources.push({
      type: selectedType,
      amount: amount
    });
    
    console.log(`Collected ${amount} of ${selectedType}`);
  }
  
  /**
   * 完成资源收集过程
   */
  completeCollection() {
    if (!this.activeCollection) return;
    
    // 确保收集完所有资源
    this.stopCollection(true);
    
    // 触发UI通知
    if (this.player && this.player.gameEngine && this.player.gameEngine.uiManager) {
      const resources = this.collectedResources.map(r => `${r.amount} ${r.type}`).join(', ');
      this.player.gameEngine.uiManager.addNotification(
        `收集完成: ${resources}`,
        'success',
        5000
      );
    }
    
    // 播放收集完成音效
    if (this.player && this.player.gameEngine && this.player.gameEngine.audioManager) {
      this.player.gameEngine.audioManager.playSound('resource_collect');
    }
    
    console.log('Resource collection completed');
  }
  
  /**
   * 创建资源收集特效
   */
  createCollectionEffect() {
    if (!this.currentPlanet || !this.player || !this.player.spaceship) return;
    
    // 创建粒子系统来表示资源收集过程
    const particleCount = 50;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    
    // 初始化所有粒子在行星表面
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // 随机在行星表面生成粒子
      const phi = Math.acos(-1 + (2 * Math.random()));
      const theta = 2 * Math.PI * Math.random();
      
      const planetRadius = this.currentPlanet.size || 1;
      particlePositions[i3] = planetRadius * Math.sin(phi) * Math.cos(theta) + this.currentPlanet.position.x;
      particlePositions[i3 + 1] = planetRadius * Math.sin(phi) * Math.sin(theta) + this.currentPlanet.position.y;
      particlePositions[i3 + 2] = planetRadius * Math.cos(phi) + this.currentPlanet.position.z;
      
      // 根据资源类型设置粒子颜色
      particleColors[i3] = 0.6 + Math.random() * 0.4; // R
      particleColors[i3 + 1] = 0.7 + Math.random() * 0.3; // G
      particleColors[i3 + 2] = 0.5 + Math.random() * 0.5; // B
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    this.collectionParticles = new THREE.Points(particleGeometry, particleMaterial);
    
    // 将粒子系统添加到场景
    if (this.player.gameEngine && this.player.gameEngine.gameState && 
        this.player.gameEngine.gameState.currentScene) {
      this.player.gameEngine.gameState.currentScene.add(this.collectionParticles);
    }
  }
  
  /**
   * 更新资源收集特效
   * @param {number} deltaTime - 时间增量
   */
  updateCollectionEffect(deltaTime) {
    if (!this.collectionParticles || !this.player || !this.player.spaceship) return;
    
    const positions = this.collectionParticles.geometry.attributes.position.array;
    const count = positions.length / 3;
    
    // 使粒子从行星移动到飞船
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      const particlePos = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2]);
      
      // 如果粒子已经很接近飞船，将其重新放置在行星表面
      const distanceToShip = particlePos.distanceTo(this.player.spaceship.position);
      
      if (distanceToShip < 1.0) {
        // 重新在行星表面生成粒子
        const phi = Math.acos(-1 + (2 * Math.random()));
        const theta = 2 * Math.PI * Math.random();
        
        const planetRadius = this.currentPlanet.size || 1;
        positions[i3] = planetRadius * Math.sin(phi) * Math.cos(theta) + this.currentPlanet.position.x;
        positions[i3 + 1] = planetRadius * Math.sin(phi) * Math.sin(theta) + this.currentPlanet.position.y;
        positions[i3 + 2] = planetRadius * Math.cos(phi) + this.currentPlanet.position.z;
      } else {
        // 将粒子向飞船移动
        const direction = new THREE.Vector3()
          .subVectors(this.player.spaceship.position, particlePos)
          .normalize();
        
        const speed = 5.0 * deltaTime * (1.0 - 0.8 * (distanceToShip / 20));
        
        positions[i3] += direction.x * speed;
        positions[i3 + 1] += direction.y * speed;
        positions[i3 + 2] += direction.z * speed;
      }
    }
    
    // 更新粒子系统
    this.collectionParticles.geometry.attributes.position.needsUpdate = true;
  }
  
  /**
   * 移除资源收集特效
   */
  removeCollectionEffect() {
    if (!this.collectionParticles) return;
    
    // 从场景中移除粒子系统
    if (this.player && this.player.gameEngine && this.player.gameEngine.gameState && 
        this.player.gameEngine.gameState.currentScene) {
      this.player.gameEngine.gameState.currentScene.remove(this.collectionParticles);
    }
    
    // 清理资源
    this.collectionParticles.geometry.dispose();
    this.collectionParticles.material.dispose();
    this.collectionParticles = null;
  }
  
  /**
   * 获取当前收集进度
   * @returns {number} 收集进度(0-1)
   */
  getCollectionProgress() {
    return this.collectionProgress;
  }
  
  /**
   * 检查是否正在收集资源
   * @returns {boolean} 是否正在收集资源
   */
  isCollecting() {
    return this.activeCollection;
  }
  
  /**
   * 获取当前收集的行星
   * @returns {Planet|null} 当前收集的行星
   */
  getCurrentPlanet() {
    return this.currentPlanet;
  }
  
  /**
   * 清理资源收集器
   */
  dispose() {
    this.stopCollection(false);
    this.player = null;
    this.isInitialized = false;
    
    return this;
  }
}

export default ResourceCollector;