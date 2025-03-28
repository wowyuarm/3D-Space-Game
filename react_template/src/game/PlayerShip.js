import * as THREE from 'three';
import { Spaceship } from './Spaceship';

/**
 * PlayerShip class represents the player's spaceship with additional functionality
 * specific to the player's vessel
 */
export class PlayerShip extends Spaceship {
  constructor() {
    super();
    
    // Override default properties
    this.name = 'Player Scout Ship';
    this.type = 'player_scout';
    
    // Player-specific properties
    this.controlSensitivity = 1.0;
    this.cameraAttachPoint = new THREE.Vector3(0, 2, -8);
    this.weaponMounts = [];
    this.engineParticles = null;
  }
  
  /**
   * Initialize the player ship
   * @param {THREE.Scene} scene - The scene to add the ship to
   * @param {THREE.Vector3} position - Initial position
   * @returns {PlayerShip} this
   */
  init(scene, position = new THREE.Vector3(0, 0, 0)) {
    if (this.isInitialized) {
      console.warn('PlayerShip already initialized');
      return this;
    }
    
    console.log('PlayerShip初始化开始...');
    
    try {
      // Set position
      this.position.copy(position);
      
      // Create ship mesh
      this.createPlayerShipMesh();
      
      // 验证mesh是否创建成功
      if (!this.mesh) {
        console.error('PlayerShip mesh创建失败');
        this.mesh = new THREE.Group(); // 创建空组作为后备
        this.mesh.userData.spaceship = this;
      }
      
      // 确保mesh是THREE.Object3D的实例
      if (!(this.mesh instanceof THREE.Object3D)) {
        console.error('PlayerShip mesh不是THREE.Object3D的实例，创建备用对象');
        const backup = new THREE.Group();
        backup.position.copy(this.position);
        backup.userData.spaceship = this;
        this.mesh = backup;
      }
      
      // Add to scene
      if (scene && this.mesh) {
        console.log('将飞船添加到场景中');
        try {
          scene.add(this.mesh);
        } catch (e) {
          console.error('添加飞船到场景时出错:', e);
        }
      } else {
        console.warn('场景或mesh无效，无法添加飞船');
      }
      
      this.isInitialized = true;
      console.log('PlayerShip初始化完成');
    } catch (error) {
      console.error('PlayerShip初始化过程中出错:', error);
      // 确保即使出错也有有效的mesh
      if (!this.mesh) {
        this.mesh = new THREE.Group();
        this.mesh.userData.spaceship = this;
      }
    }
    
    return this;
  }
  
  /**
   * Create a more detailed mesh for the player ship
   */
  createPlayerShipMesh() {
    // Create ship base using the parent class method
    super.createShipMesh();
    
    if (!this.mesh) return;
    
    // Add player-specific visual enhancements
    
    // Cockpit 
    const cockpitGeometry = new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0xaaddff,
      emissive: 0x1133cc,
      transparent: true,
      opacity: 0.9,
      roughness: 0.1,
      metalness: 0.3
    });
    
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.3, 0.4);
    cockpit.rotation.x = Math.PI / 2;
    this.mesh.add(cockpit);
    
    // Engine boosters
    const boosterGeometry = new THREE.CylinderGeometry(0.15, 0.25, 0.5, 8);
    const boosterMaterial = new THREE.MeshStandardMaterial({
      color: 0x999999,
      emissive: 0x222222,
      roughness: 0.3,
      metalness: 0.9
    });
    
    // Left booster
    const leftBooster = new THREE.Mesh(boosterGeometry, boosterMaterial);
    leftBooster.position.set(-0.6, 0, -0.8);
    leftBooster.rotation.x = Math.PI / 2;
    this.mesh.add(leftBooster);
    
    // Right booster
    const rightBooster = new THREE.Mesh(boosterGeometry, boosterMaterial);
    rightBooster.position.set(0.6, 0, -0.8);
    rightBooster.rotation.x = Math.PI / 2;
    this.mesh.add(rightBooster);
    
    // Engine glow for boosters
    const engineGlowGeometry = new THREE.CircleGeometry(0.2, 16);
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x22ffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    const leftBoosterGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
    leftBoosterGlow.position.set(-0.6, 0, -1.1);
    this.mesh.add(leftBoosterGlow);
    
    const rightBoosterGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
    rightBoosterGlow.position.set(0.6, 0, -1.1);
    this.mesh.add(rightBoosterGlow);
    
    // 添加飞船轮廓发光效果
    const outlineGeometry = new THREE.SphereGeometry(1.5, 16, 16);
    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide
    });
    
    const outline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    this.mesh.add(outline);
    
    // Store references for animation
    this.engineGlows = [this.engineGlow, leftBoosterGlow, rightBoosterGlow];
  }
  
  /**
   * Update the player ship
   * @param {number} deltaTime - Time since last update in seconds
   */
  update(deltaTime) {
    // Call parent update
    super.update(deltaTime);
    
    // Update all engine glows
    this.updateAllEngineGlows();
  }
  
  /**
   * Update all engine glow effects
   */
  updateAllEngineGlows() {
    if (!this.engineGlows || !this.engineGlows.length) return;
    
    const thrustIntensity = Math.min(Math.abs(this.velocity.length()) / 5, 1);
    const boostFactor = this.isBoosting ? 1.5 : 1.0;
    const glowIntensity = 0.5 + thrustIntensity * 0.5 * boostFactor;
    const glowScale = 0.8 + thrustIntensity * 0.4 * boostFactor;
    
    this.engineGlows.forEach(glow => {
      if (glow) {
        glow.material.opacity = glowIntensity;
        glow.scale.set(glowScale, glowScale, glowScale);
      }
    });
  }
  
  /**
   * Get the ship object for camera following
   * @returns {THREE.Object3D} The mesh or group representing the ship
   */
  getObject() {
    return this.mesh;
  }
  
  /**
   * Get the forward direction of the ship
   * @returns {THREE.Vector3} The normalized forward direction vector
   */
  getDirection() {
    // 创建一个表示前向方向的向量 (0,0,-1) 是Three.js中的"前向"
    const direction = new THREE.Vector3(0, 0, -1);
    
    // 如果有mesh，应用其旋转，将局部方向转换为世界方向
    if (this.mesh) {
      // 使用船舶的四元数旋转方向向量
      direction.applyQuaternion(this.mesh.quaternion);
    }
    
    return direction.normalize();
  }
  
  /**
   * Apply damage to the player ship
   * @param {number} amount - Amount of damage
   * @param {string} type - Type of damage
   * @returns {number} Remaining health
   */
  applyDamage(amount, type = 'generic') {
    // Check shields first
    if (this.shields.enabled && this.shields.strength > 0) {
      // Shields absorb 70% of damage
      const absorbedAmount = amount * 0.7;
      const remainingDamage = amount - absorbedAmount;
      
      // Reduce shield strength
      this.shields.strength = Math.max(0, this.shields.strength - absorbedAmount);
      
      // If shields are depleted, apply remaining damage to hull
      if (this.shields.strength === 0) {
        this.health = Math.max(0, this.health - remainingDamage);
      }
      
      // If shield is depleted, disable it
      if (this.shields.strength === 0) {
        this.shields.enabled = false;
      }
    } else {
      // No shields, apply damage directly to hull
      this.health = Math.max(0, this.health - amount);
    }
    
    return this.health;
  }
} 