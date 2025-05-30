// src/game/Player.js
import * as THREE from 'three';
import { Spaceship } from './Spaceship';
import { Inventory } from './Inventory';

export class Player {
  constructor() {
    this.spaceship = null;
    this.inventory = null;
    this.credits = 1000;
    this.name = 'Space Explorer';
    this.experience = 0;
    this.level = 1;
    
    // Player stats
    this.pilotingSkill = 1;
    this.tradingSkill = 1;
    this.explorationSkill = 1;
    this.combatSkill = 1;
    
    // Player state
    this.currentStarSystem = null;
    this.currentPlanet = null;
    this.isLanded = false;
    this.isInCombat = false;
    
    // Player control settings
    this.controlSensitivity = 1.0;
    this.invertY = false;
    
    this.isInitialized = false;
  }
  
  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Player already initialized');
      return this;
    }
    
    console.log('Initializing Player...');
    
    // Create spaceship
    this.spaceship = new Spaceship().initialize({
      position: options.position || new THREE.Vector3(0, 0, 0),
      type: 'scout', // Default ship type
      gameEngine: options.gameEngine
    });
    
    // Create inventory
    this.inventory = new Inventory().initialize({
      capacity: 20 // Default inventory slots
    });
    
    // Apply custom player options
    if (options.name) this.name = options.name;
    if (options.credits) this.credits = options.credits;
    if (options.level) this.level = options.level;
    if (options.experience) this.experience = options.experience;
    
    this.isInitialized = true;
    
    return this;
  }
  
  update(deltaTime, inputManager) {
    if (!this.isInitialized || !this.spaceship) return;
    
    // Handle player flight controls if not landed
    if (!this.isLanded) {
      this.handleFlightControls(deltaTime, inputManager);
    }
    
    // Update spaceship systems
    this.spaceship.update(deltaTime);
  }
  
  handleFlightControls(deltaTime, inputManager) {
    if (!inputManager || !this.spaceship) return;
    
    // Flight control variables - 大幅增强控制灵敏度和速度
    const thrustForce = 50.0 * this.spaceship.thrustPower;  // 极大增强推力
    const turnSpeed = 3.0 * this.spaceship.maneuverability;  // 增强转向速度
    const maxRotationRate = 4.0;
    let thrust = 0;
    const rotation = new THREE.Vector3(0, 0, 0);
    
    // Forward/backward thrust
    if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) {
      thrust = thrustForce;
    } else if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) {
      thrust = -thrustForce * 0.7; // 提高反向推力
    }
    
    // Turning controls
    if (inputManager.isKeyPressed('KeyA') || inputManager.isKeyPressed('ArrowLeft')) {
      rotation.y = turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('KeyD') || inputManager.isKeyPressed('ArrowRight')) {
      rotation.y = -turnSpeed * deltaTime;
    }
    
    // 将键盘上下键映射为前进和后退，而不是俯仰控制
    // Pitch control
    if (inputManager.isKeyPressed('KeyI')) {
      rotation.x = this.invertY ? -turnSpeed * deltaTime : turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('KeyK')) {
      rotation.x = this.invertY ? turnSpeed * deltaTime : -turnSpeed * deltaTime;
    }
    
    // Roll control
    if (inputManager.isKeyPressed('KeyQ') || inputManager.isKeyPressed('KeyJ')) {
      rotation.z = turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('KeyE') || inputManager.isKeyPressed('KeyL')) {
      rotation.z = -turnSpeed * deltaTime;
    }
    
    // Apply controls to spaceship
    this.spaceship.setThrust(thrust);
    this.spaceship.rotate(rotation);
    
    // Boost (temporary speed increase)
    if ((inputManager.isKeyPressed('ShiftLeft') || inputManager.isKeyPressed('ShiftRight')) && this.spaceship.energy > 0) {
      this.spaceship.boost(deltaTime);
    } else {
      this.spaceship.stopBoost();
    }
    
    // 空格键处理: 如果靠近星球则着陆，否则执行跃迁/急刹车
    if (inputManager.isKeyPressed('Space') && !this._lastSpaceState) {
      // 设置空格键状态，防止持续触发
      this._lastSpaceState = true;
      
      // 检查是否有最近的星球，且距离足够近
      if (this.currentStarSystem && this.nearestPlanet && this.nearestPlanetDistance < 20) {
        // 尝试降落到行星上
        console.log(`尝试降落到行星: ${this.nearestPlanet.name}`);
        this.landOnPlanet(this.nearestPlanet);
      } else {
        // 否则执行跃迁 - 朝当前方向快速加速
        console.log("执行超空间跃迁");
        this.performJump(deltaTime);
      }
    } else if (!inputManager.isKeyPressed('Space')) {
      // 重置空格键状态
      this._lastSpaceState = false;
    }
  }
  
  // 超空间跃迁功能
  performJump(deltaTime) {
    if (!this.spaceship) return;
    
    // 如果能量足够且不在跃迁中
    const jumpEnergyCost = 25;
    const jumpSpeed = 120.0; // 增强跃迁推力
    
    if (this.spaceship.energy > jumpEnergyCost && !this._isJumping) {
      try {
        // 获取当前方向
        const direction = this.spaceship.getDirection();
        
        // 设置强大的瞬时速度
        this.spaceship.velocity.addScaledVector(direction, jumpSpeed);
        
        // 消耗能量
        this.spaceship.energy -= jumpEnergyCost;
        
        // 设置跃迁标志
        this._isJumping = true;
        
        // 创建跃迁视觉效果
        this.createJumpEffect();
        
        // 播放跃迁音效
        if (this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
          const audioManager = this.spaceship.gameEngine.audioManager;
          const jumpSound = audioManager.audioFiles['jump'] || audioManager.audioFiles['boost'];
          
          if (jumpSound) {
            audioManager.playSound(jumpSound, 0.8);
          }
        }
        
        // 添加通知
        if (this.spaceship.gameEngine && this.spaceship.gameEngine.uiManager) {
          this.spaceship.gameEngine.uiManager.addNotification(
            '超空间跃迁已激活', 
            'info',
            3000
          );
        }
        
        console.log('执行超空间跃迁!');
        
        // 3秒后自动重置跃迁状态
        setTimeout(() => {
          this._isJumping = false;
        }, 3000);
        
        return true;
      } catch (error) {
        console.error('跃迁执行失败:', error);
        return false;
      }
    } else if (this.spaceship.energy <= jumpEnergyCost) {
      // 能量不足，显示提示
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.uiManager) {
        this.spaceship.gameEngine.uiManager.addNotification(
          '能量不足，无法跃迁', 
          'warning',
          2000
        );
      }
      
      // 能量不足，只执行普通刹车
      this.spaceship.brake(deltaTime);
      return false;
    }
    
    return false;
  }
  
  // 创建跃迁视觉效果
  createJumpEffect() {
    if (!this.spaceship || !this.spaceship.mesh) return;
    
    try {
      // 移除现有的跃迁效果
      const existingGlow = this.spaceship.mesh.children.find(child => child.name === 'jumpGlow');
      if (existingGlow) {
        this.spaceship.mesh.remove(existingGlow);
        existingGlow.geometry.dispose();
        existingGlow.material.dispose();
      }
      
      // 创建一个大型的发光球体
      const geometry = new THREE.SphereGeometry(5, 24, 24);
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.BackSide
      });
      
      const glow = new THREE.Mesh(geometry, material);
      glow.name = 'jumpGlow';
      this.spaceship.mesh.add(glow);
      
      // 创建双色发光效果
      const innerGeometry = new THREE.SphereGeometry(3, 20, 20);
      const innerMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.4,
        side: THREE.BackSide
      });
      
      const innerGlow = new THREE.Mesh(innerGeometry, innerMaterial);
      innerGlow.name = 'innerJumpGlow';
      this.spaceship.mesh.add(innerGlow);
      
      // 动画效果
      let scale = 1.0;
      let growing = true;
      
      const animate = () => {
        if (!this.spaceship || !this.spaceship.mesh) return;
        
        // 缩放动画
        if (growing) {
          scale += 0.08;
          if (scale >= 1.5) growing = false;
        } else {
          scale -= 0.05;
          if (scale <= 1.0) growing = true;
        }
        
        // 应用缩放
        const jumpGlow = this.spaceship.mesh.children.find(child => child.name === 'jumpGlow');
        const innerGlow = this.spaceship.mesh.children.find(child => child.name === 'innerJumpGlow');
        
        if (jumpGlow) {
          jumpGlow.scale.set(scale, scale, scale);
          jumpGlow.material.opacity = 0.6 - Math.abs(scale - 1.25) * 0.3;
        }
        
        if (innerGlow) {
          innerGlow.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
          innerGlow.material.opacity = 0.4 - Math.abs(scale - 1.25) * 0.2;
        }
        
        // 如果还在跃迁中，继续动画
        if (this._isJumping) {
          requestAnimationFrame(animate);
        } else {
          // 停止跃迁，移除发光效果
          setTimeout(() => {
            if (this.spaceship && this.spaceship.mesh) {
              const glowToRemove = this.spaceship.mesh.children.find(child => child.name === 'jumpGlow');
              const innerGlowToRemove = this.spaceship.mesh.children.find(child => child.name === 'innerJumpGlow');
              
              if (glowToRemove) {
                this.spaceship.mesh.remove(glowToRemove);
                glowToRemove.geometry.dispose();
                glowToRemove.material.dispose();
              }
              
              if (innerGlowToRemove) {
                this.spaceship.mesh.remove(innerGlowToRemove);
                innerGlowToRemove.geometry.dispose();
                innerGlowToRemove.material.dispose();
              }
            }
          }, 500);
        }
      };
      
      // 启动动画
      animate();
      
      // 2.5秒后自动停止动画效果（无论跃迁状态如何）
      setTimeout(() => {
        if (this.spaceship && this.spaceship.mesh) {
          const glowToRemove = this.spaceship.mesh.children.find(child => child.name === 'jumpGlow');
          const innerGlowToRemove = this.spaceship.mesh.children.find(child => child.name === 'innerJumpGlow');
          
          if (glowToRemove) {
            this.spaceship.mesh.remove(glowToRemove);
            glowToRemove.geometry.dispose();
            glowToRemove.material.dispose();
          }
          
          if (innerGlowToRemove) {
            this.spaceship.mesh.remove(innerGlowToRemove);
            innerGlowToRemove.geometry.dispose();
            innerGlowToRemove.material.dispose();
          }
        }
      }, 2500);
    } catch (error) {
      console.error('创建跃迁效果时出错:', error);
    }
  }
  
  gainExperience(amount) {
    this.experience += amount;
    
    // Check for level up
    const nextLevelThreshold = this.level * 1000;
    
    if (this.experience >= nextLevelThreshold) {
      this.levelUp();
    }
    
    return this;
  }
  
  levelUp() {
    this.level += 1;
    
    // Increase base skills slightly
    this.pilotingSkill += 0.2;
    this.tradingSkill += 0.2;
    this.explorationSkill += 0.2;
    this.combatSkill += 0.2;
    
    console.log(`Level up! ${this.name} is now level ${this.level}`);
    
    return this;
  }
  
  addCredits(amount) {
    this.credits += amount;
    return this;
  }
  
  spendCredits(amount) {
    if (amount > this.credits) {
      return false;
    }
    
    this.credits -= amount;
    return true;
  }
  
  enterStarSystem(starSystem) {
    if (!starSystem) return false;
    
    this.currentStarSystem = starSystem;
    this.currentPlanet = null;
    this.isLanded = false;
    
    return true;
  }
  
  orbitPlanet(planet) {
    if (!planet) return false;
    
    this.currentPlanet = planet;
    this.isLanded = false;
    
    return true;
  }
  
  landOnPlanet(planet) {
    if (!planet) {
      console.warn('尝试降落，但没有指定行星');
      return false;
    }
    
    if (!planet.canLand) {
      // 显示无法降落的通知
      if (this.spaceship && this.spaceship.gameEngine && this.spaceship.gameEngine.uiManager) {
        this.spaceship.gameEngine.uiManager.addNotification(
          `无法降落到 ${planet.name}`, 
          'warning',
          3000
        );
      }
      console.warn(`行星 ${planet.name} 不支持降落`);
      return false;
    }
    
    // 设置降落状态
    this.currentPlanet = planet;
    this.isLanded = true;
    
    // 停止飞船移动
    if (this.spaceship) {
      this.spaceship.setThrust(0);
      this.spaceship.velocity.set(0, 0, 0);
      
      // 播放降落音效
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
        const audioManager = this.spaceship.gameEngine.audioManager;
        // 使用适当的音效
        const landingSound = audioManager.audioFiles['landing'] || audioManager.audioFiles['alert'];
        
        if (landingSound) {
          audioManager.playSound(landingSound, 0.7);
        }
      }
      
      // 显示降落通知
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.uiManager) {
        this.spaceship.gameEngine.uiManager.addNotification(
          `已降落到 ${planet.name}`, 
          'success',
          4000
        );
      }
      
      // 记录统计数据
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.gameState) {
        const stats = this.spaceship.gameEngine.gameState.stats;
        if (stats) {
          stats.planetLandings = (stats.planetLandings || 0) + 1;
        }
      }
      
      // 可以在这里添加更多降落功能，例如收集资源、交易等
      console.log(`成功降落到行星: ${planet.name}`);
      
      // 添加一些经验值奖励
      this.gainExperience(50);
    }
    
    return true;
  }
  
  takeOff() {
    if (!this.isLanded) return false;
    
    this.isLanded = false;
    
    return true;
  }
  
  upgradeSkill(skillName, amount = 1) {
    switch (skillName.toLowerCase()) {
      case 'piloting':
        this.pilotingSkill += amount;
        break;
      case 'trading':
        this.tradingSkill += amount;
        break;
      case 'exploration':
        this.explorationSkill += amount;
        break;
      case 'combat':
        this.combatSkill += amount;
        break;
      default:
        return false;
    }
    
    return true;
  }
  
  serialize() {
    return {
      name: this.name,
      credits: this.credits,
      experience: this.experience,
      level: this.level,
      pilotingSkill: this.pilotingSkill,
      tradingSkill: this.tradingSkill,
      explorationSkill: this.explorationSkill,
      combatSkill: this.combatSkill,
      position: this.spaceship ? {
        x: this.spaceship.position.x,
        y: this.spaceship.position.y,
        z: this.spaceship.position.z
      } : { x: 0, y: 0, z: 0 },
      inventory: this.inventory ? this.inventory.serialize() : null,
      spaceship: this.spaceship ? this.spaceship.serialize() : null,
      currentStarSystem: this.currentStarSystem ? this.currentStarSystem.id : null,
      currentPlanet: this.currentPlanet ? this.currentPlanet.id : null,
      isLanded: this.isLanded,
      controlSettings: {
        sensitivity: this.controlSensitivity,
        invertY: this.invertY
      }
    };
  }
  
  deserialize(data) {
    if (!data) return this;
    
    this.name = data.name || this.name;
    this.credits = data.credits || this.credits;
    this.experience = data.experience || this.experience;
    this.level = data.level || this.level;
    
    // Load skills
    this.pilotingSkill = data.pilotingSkill || this.pilotingSkill;
    this.tradingSkill = data.tradingSkill || this.tradingSkill;
    this.explorationSkill = data.explorationSkill || this.explorationSkill;
    this.combatSkill = data.combatSkill || this.combatSkill;
    
    // Load control settings
    if (data.controlSettings) {
      this.controlSensitivity = data.controlSettings.sensitivity || this.controlSensitivity;
      this.invertY = data.controlSettings.invertY || this.invertY;
    }
    
    // Load spaceship & inventory data
    if (this.spaceship && data.spaceship) {
      this.spaceship.deserialize(data.spaceship);
    }
    
    if (this.inventory && data.inventory) {
      this.inventory.deserialize(data.inventory);
    }
    
    // Load position data
    if (data.position && this.spaceship) {
      this.spaceship.position.set(
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      );
    }
    
    // Load state data
    this.isLanded = data.isLanded || false;
    
    // Note: currentStarSystem and currentPlanet need to be handled separately
    // by the GameState since they are references to complex objects
    
    return this;
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    if (this.spaceship) {
      this.spaceship.dispose();
      this.spaceship = null;
    }
    
    if (this.inventory) {
      this.inventory.dispose();
      this.inventory = null;
    }
    
    this.isInitialized = false;
    
    return this;
  }
}