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
      
      // 更新引擎粒子效果
      this.updateEngineParticles(deltaTime);
    }
    
    // Update spaceship systems
    this.spaceship.update(deltaTime);
    
    // 更新加速时的视觉效果
    this.updateSpeedEffects(deltaTime);
  }
  
  handleFlightControls(deltaTime, inputManager) {
    if (!inputManager || !this.spaceship) return;
    
    // Flight control variables - 大幅增强控制灵敏度和速度
    const thrustForce = 50.0 * this.spaceship.thrustPower;  // 极大增强推力
    const turnSpeed = 3.0 * this.spaceship.maneuverability;  // 增强转向速度
    const maxRotationRate = 4.0;
    let thrust = 0;
    const rotation = new THREE.Vector3(0, 0, 0);
    
    // 鼠标控制 - 处理鼠标方向控制
    const mouseSensitivity = 0.5 * this.controlSensitivity; // 鼠标灵敏度可调整
    
    // 如果鼠标被激活（按住左键或右键）且鼠标位置数据可用
    if ((inputManager.mouse.isDown || inputManager.mouse.rightIsDown) && 
        (Math.abs(inputManager.mouse.x) > 0.05 || Math.abs(inputManager.mouse.y) > 0.05)) {
      
      // 横向控制 - 鼠标左右移动控制飞船转向
      rotation.y = -inputManager.mouse.x * mouseSensitivity * deltaTime * 10;
      
      // 纵向控制 - 鼠标上下移动控制飞船俯仰
      const pitchControl = inputManager.mouse.y * mouseSensitivity * deltaTime * 10;
      rotation.x = this.invertY ? -pitchControl : pitchControl;
      
      // 如果鼠标右键被按下且鼠标左右移动，控制滚转
      if (inputManager.mouse.rightIsDown && Math.abs(inputManager.mouse.x) > 0.1) {
        rotation.z = inputManager.mouse.x * mouseSensitivity * deltaTime * 5;
      }
    }
    
    // 使用左键控制加速，右键控制减速
    if (inputManager.mouse.isDown) {
      thrust = thrustForce; // 左键加速
    } else if (inputManager.mouse.rightIsDown) {
      thrust = -thrustForce * 0.7; // 右键减速/后退
    }
    
    // Forward/backward thrust (键盘控制保留)
    if (inputManager.isKeyPressed('KeyW') || inputManager.isKeyPressed('ArrowUp')) {
      thrust = thrustForce;
    } else if (inputManager.isKeyPressed('KeyS') || inputManager.isKeyPressed('ArrowDown')) {
      thrust = -thrustForce * 0.7; // 提高反向推力
    }
    
    // Turning controls (键盘控制保留)
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
    
    // 更新引擎视觉效果与声音随推力变化
    this.updateEngineEffects(thrust, deltaTime);
    
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
  
  // 新增方法: 更新引擎效果随推力变化
  updateEngineEffects(thrust, deltaTime) {
    if (!this.spaceship || !this.spaceship.engineGlow) return;
    
    // 获取引擎发光效果
    const engineGlow = this.spaceship.engineGlow;
    
    // 根据推力调整引擎发光效果
    if (thrust > 0) {
      // 向前推进时，增加发光强度和大小
      const intensity = 0.5 + (thrust / (50.0 * this.spaceship.thrustPower)) * 0.5;
      const scale = 1.0 + (thrust / (50.0 * this.spaceship.thrustPower)) * 1.5;
      
      engineGlow.material.opacity = Math.min(intensity, 1.0);
      engineGlow.scale.set(scale, scale, 1.0);
      
      // 创建推进粒子效果
      if (!this.engineParticleTime || this.engineParticleTime <= 0) {
        this.createEngineParticles();
        this.engineParticleTime = 0.1; // 每0.1秒创建一次粒子
      } else {
        this.engineParticleTime -= deltaTime;
      }
      
      // 播放引擎声音
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
        const audioManager = this.spaceship.gameEngine.audioManager;
        if (!this._engineSoundPlaying) {
          audioManager.playSound('engine_idle', 0.2, true);
          this._engineSoundPlaying = true;
        }
      }
    } else {
      // 非推进状态，减小发光
      engineGlow.material.opacity = 0.3;
      engineGlow.scale.set(1.0, 1.0, 1.0);
      
      // 停止引擎声音
      if (this._engineSoundPlaying && this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
        const audioManager = this.spaceship.gameEngine.audioManager;
        audioManager.stopSound('engine_idle');
        this._engineSoundPlaying = false;
      }
    }
  }
  
  // 创建引擎粒子效果
  createEngineParticles() {
    if (!this.spaceship || !this.spaceship.mesh || !this.spaceship.gameEngine || !this.spaceship.gameEngine.scene) return;
    
    const scene = this.spaceship.gameEngine.scene;
    const shipDirection = this.spaceship.getDirection().clone().negate(); // 反方向，因为粒子从后面喷出
    
    // 创建粒子
    const particleCount = Math.floor(5 + Math.random() * 5); // 5-10个粒子
    
    for (let i = 0; i < particleCount; i++) {
      // 创建一个小球作为粒子
      const geometry = new THREE.SphereGeometry(0.1 + Math.random() * 0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.5 + Math.random() * 0.5, 0.8 + Math.random() * 0.2, 1.0),
        transparent: true,
        opacity: 0.7
      });
      
      const particle = new THREE.Mesh(geometry, material);
      
      // 设置粒子初始位置 - 在引擎后方
      const enginePosition = this.spaceship.mesh.position.clone();
      const engineOffset = shipDirection.clone().multiplyScalar(2); // 引擎位置偏移
      particle.position.copy(enginePosition.add(engineOffset));
      
      // 添加一点随机偏移
      particle.position.x += (Math.random() - 0.5) * 0.5;
      particle.position.y += (Math.random() - 0.5) * 0.5;
      particle.position.z += (Math.random() - 0.5) * 0.5;
      
      // 设置粒子初始速度 - 向后喷射
      const velocity = shipDirection.clone().multiplyScalar(5 + Math.random() * 10);
      particle.userData.velocity = velocity;
      particle.userData.life = 1.0; // 粒子生命值
      
      // 添加到场景
      scene.add(particle);
      
      // 添加到粒子列表用于更新
      if (!this.engineParticles) this.engineParticles = [];
      this.engineParticles.push(particle);
      
      // 粒子生命周期结束后自动移除
      setTimeout(() => {
        if (particle && scene) {
          scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
          
          // 从粒子列表中移除
          if (this.engineParticles) {
            const index = this.engineParticles.indexOf(particle);
            if (index !== -1) this.engineParticles.splice(index, 1);
          }
        }
      }, 1000); // 1秒后消失
    }
  }
  
  // 超空间跃迁功能
  performJump(deltaTime) {
    if (!this.spaceship) return;
    
    // 如果能量足够且不在跃迁中
    const jumpEnergyCost = 25;
    const jumpDistance = 500.0; // 一次跃迁可以移动的距离
    
    if (this.spaceship.energy > jumpEnergyCost && !this._isJumping) {
      try {
        // 获取当前方向
        const direction = this.spaceship.getDirection();
        
        // 设置跃迁标志
        this._isJumping = true;
        
        // 计算目标点位置
        const targetPosition = this.spaceship.position.clone().add(
          direction.clone().multiplyScalar(jumpDistance)
        );
        
        // 创建跃迁视觉效果
        this.createJumpEffect();
        
        // 播放跃迁音效
        if (this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
          const audioManager = this.spaceship.gameEngine.audioManager;
          const jumpSound = audioManager.audioFiles['warp_drive'] || audioManager.audioFiles['jump'] || audioManager.audioFiles['boost'];
          
          if (jumpSound) {
            audioManager.playSound(jumpSound, 1.0);
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
        
        // 创建扭曲效果
        this.createWarpEffect();
        
        // 0.8秒后瞬间移动到目标位置
        setTimeout(() => {
          // 直接设置位置到目标点
          this.spaceship.position.copy(targetPosition);
          
          // 重置速度
          this.spaceship.velocity.set(0, 0, 0);
          
          // 消耗能量 (跃迁结束时才扣除能量)
          this.spaceship.energy -= jumpEnergyCost;
          
          // 检查是否接近行星
          if (this.currentStarSystem) {
            this.checkPlanetProximity(targetPosition);
          }
          
          // 播放退出跃迁音效
          if (this.spaceship.gameEngine && this.spaceship.gameEngine.audioManager) {
            const audioManager = this.spaceship.gameEngine.audioManager;
            audioManager.playSound('alert', 0.5);
          }
        }, 800);
        
        // 1.5秒后重置跃迁状态
        setTimeout(() => {
          this._isJumping = false;
        }, 1500);
        
        return true;
      } catch (error) {
        console.error('跃迁执行失败:', error);
        this._isJumping = false;
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
          scale += 0.15; // 更快的脉动效果
          if (scale >= 2.0) growing = false;
        } else {
          scale -= 0.1;
          if (scale <= 1.0) growing = true;
        }
        
        // 应用缩放
        const jumpGlow = this.spaceship.mesh.children.find(child => child.name === 'jumpGlow');
        const innerGlow = this.spaceship.mesh.children.find(child => child.name === 'innerJumpGlow');
        
        if (jumpGlow) {
          jumpGlow.scale.set(scale, scale, scale);
          jumpGlow.material.opacity = 0.6 - Math.abs(scale - 1.5) * 0.2;
        }
        
        if (innerGlow) {
          innerGlow.scale.set(scale * 1.2, scale * 1.2, scale * 1.2);
          innerGlow.material.opacity = 0.4 - Math.abs(scale - 1.5) * 0.15;
          
          // 随机变换发光颜色，产生能量波动效果
          if (Math.random() > 0.5) {
            innerGlow.material.color.setHSL(
              Math.random() * 0.1 + 0.5, // 蓝青色范围
              0.8,
              0.5
            );
          }
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
      console.error('创建跃迁效果失败:', error);
    }
  }
  
  // 创建扭曲效果
  createWarpEffect() {
    if (!this.spaceship || !this.spaceship.gameEngine || !this.spaceship.gameEngine.postProcessor) return;
    
    try {
      // 获取后处理器
      const postProcessor = this.spaceship.gameEngine.postProcessor;
      
      // 激活扭曲效果
      if (typeof postProcessor.addTemporaryEffect === 'function') {
        postProcessor.addTemporaryEffect('warpDistortion', 1.0, 1500);
      }
      
      // 如果后处理器没有addTemporaryEffect方法，我们可以创建简单的视觉效果
      // 在画面四周创建光线拉伸效果
      const scene = this.spaceship.gameEngine.scene || this.spaceship.gameEngine.gameState?.currentScene;
      if (!scene) return;
      
      // 创建星光拉伸效果
      const starsCount = 50;
      const starGroup = new THREE.Group();
      starGroup.name = "warpStars";
      
      for (let i = 0; i < starsCount; i++) {
        const length = 20 + Math.random() * 80; // 随机长度
        const geometry = new THREE.BoxGeometry(0.2, 0.2, length);
        
        // 随机颜色: 蓝、白、青
        const colorChoice = Math.random();
        let color;
        if (colorChoice < 0.33) {
          color = 0x0088ff; // 蓝
        } else if (colorChoice < 0.66) {
          color = 0xffffff; // 白
        } else {
          color = 0x00ffff; // 青
        }
        
        const material = new THREE.MeshBasicMaterial({
          color: color,
          transparent: true,
          opacity: 0.7
        });
        
        const star = new THREE.Mesh(geometry, material);
        
        // 随机位置，保持在相机前方
        star.position.set(
          (Math.random() - 0.5) * 100,
          (Math.random() - 0.5) * 100,
          this.spaceship.position.z - 50 - Math.random() * 200
        );
        
        // 朝向飞船前进方向
        star.lookAt(this.spaceship.position);
        starGroup.add(star);
      }
      
      scene.add(starGroup);
      
      // 1.5秒后移除效果
      setTimeout(() => {
        scene.remove(starGroup);
        starGroup.children.forEach(star => {
          star.geometry.dispose();
          star.material.dispose();
        });
      }, 1500);
    } catch (error) {
      console.error('创建扭曲效果失败:', error);
    }
  }
  
  // 检查行星接近度
  checkPlanetProximity(position) {
    if (!this.currentStarSystem || !this.currentStarSystem.planets) return;
    
    // 寻找最近的行星
    let nearestPlanet = null;
    let nearestDistance = Infinity;
    
    for (const planet of this.currentStarSystem.planets) {
      if (!planet.position) continue;
      
      const distance = position.distanceTo(planet.position);
      
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestPlanet = planet;
      }
    }
    
    // 接近行星时提示
    if (nearestPlanet && nearestDistance < 50) {
      // 更新最近行星信息
      this.nearestPlanet = nearestPlanet;
      this.nearestPlanetDistance = nearestDistance;
      
      // 显示通知
      if (this.spaceship.gameEngine && this.spaceship.gameEngine.uiManager) {
        const uiManager = this.spaceship.gameEngine.uiManager;
        uiManager.addNotification(
          `超空间跃出点接近行星 ${nearestPlanet.name || '未知行星'}，距离: ${nearestDistance.toFixed(1)}光秒`,
          'info',
          5000
        );
        
        // 可以在这里添加行星信息到HUD
        if (typeof uiManager.showPlanetInfo === 'function') {
          uiManager.showPlanetInfo(nearestPlanet);
        }
      }
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
  
  // 更新引擎粒子效果
  updateEngineParticles(deltaTime) {
    if (!this.engineParticles || !this.engineParticles.length) return;
    
    // 更新每个粒子位置和生命周期
    for (let i = this.engineParticles.length - 1; i >= 0; i--) {
      const particle = this.engineParticles[i];
      
      // 更新位置
      if (particle && particle.userData && particle.userData.velocity) {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
        
        // 更新生命周期
        particle.userData.life -= deltaTime;
        
        // 更新大小和透明度
        const lifeRatio = particle.userData.life;
        particle.scale.set(lifeRatio, lifeRatio, lifeRatio);
        
        if (particle.material) {
          particle.material.opacity = lifeRatio * 0.7;
        }
      }
    }
  }
  
  // 更新加速时的视觉效果
  updateSpeedEffects(deltaTime) {
    if (!this.spaceship || !this.spaceship.gameEngine || !this.spaceship.gameEngine.scene) return;
    
    // 获取当前速度
    const currentSpeed = this.spaceship.velocity.length();
    const maxNormalSpeed = 50; // 正常最大速度
    const boostThreshold = 70; // 加速时的阈值
    
    // 如果速度超过一定阈值，添加速度线效果
    if (currentSpeed > 30) {
      // 计算速度线的强度，基于当前速度
      const speedLineIntensity = (currentSpeed - 30) / (maxNormalSpeed - 30);
      
      if (!this._speedLinesActive && speedLineIntensity > 0.3) {
        this.createSpeedLines(Math.min(speedLineIntensity, 1.0));
        this._speedLinesActive = true;
        
        // 每2秒更新一次速度线
        if (!this._speedLineTimer) {
          this._speedLineTimer = setInterval(() => {
            if (this.spaceship && this.spaceship.velocity.length() > 30) {
              const newIntensity = (this.spaceship.velocity.length() - 30) / (maxNormalSpeed - 30);
              this.createSpeedLines(Math.min(newIntensity, 1.0));
            } else if (this._speedLineTimer) {
              clearInterval(this._speedLineTimer);
              this._speedLineTimer = null;
              this._speedLinesActive = false;
            }
          }, 2000);
        }
      }
      
      // 加速状态效果增强
      if (currentSpeed > boostThreshold) {
        // 如果是加速状态，创建更明显的视觉效果
        if (this.spaceship.isBoosting && !this._boostEffectActive) {
          this.createBoostEffect();
          this._boostEffectActive = true;
          
          // 激活后处理效果（如果有）
          if (this.spaceship.gameEngine.postProcessor && 
              typeof this.spaceship.gameEngine.postProcessor.addTemporaryEffect === 'function') {
            this.spaceship.gameEngine.postProcessor.addTemporaryEffect('speedBlur', 1.0, 5000);
          }
          
          // 播放加速音效
          if (this.spaceship.gameEngine.audioManager) {
            this.spaceship.gameEngine.audioManager.playSound('boost', 0.3);
          }
        }
      } else {
        this._boostEffectActive = false;
      }
    } else {
      // 速度不够，清除速度线计时器
      if (this._speedLineTimer) {
        clearInterval(this._speedLineTimer);
        this._speedLineTimer = null;
        this._speedLinesActive = false;
      }
      
      this._boostEffectActive = false;
    }
  }
  
  // 创建速度线效果
  createSpeedLines(intensity) {
    if (!this.spaceship || !this.spaceship.gameEngine || !this.spaceship.gameEngine.scene) return;
    
    const scene = this.spaceship.gameEngine.scene;
    const camera = this.spaceship.gameEngine.camera;
    
    if (!camera) return;
    
    // 创建速度线
    const lineCount = Math.floor(10 + intensity * 20); // 10-30条线
    
    for (let i = 0; i < lineCount; i++) {
      // 创建一个线段
      const geometry = new THREE.BufferGeometry();
      
      // 基于相机视锥在前方创建点
      const distance = 50 + Math.random() * 100;
      const spread = 30 + intensity * 30;
      
      // 创建起点和终点
      const start = new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        -distance
      );
      
      // 终点比起点更靠近相机，创造射向相机的效果
      const end = start.clone();
      end.z += 10 + Math.random() * 20;
      
      // 从相机空间转换到世界空间
      const startWorld = start.clone();
      const endWorld = end.clone();
      
      startWorld.applyMatrix4(camera.matrixWorld);
      endWorld.applyMatrix4(camera.matrixWorld);
      
      // 设置顶点
      const vertices = new Float32Array([
        startWorld.x, startWorld.y, startWorld.z,
        endWorld.x, endWorld.y, endWorld.z
      ]);
      
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      
      // 创建线条材质 - 随机蓝色调
      const material = new THREE.LineBasicMaterial({
        color: new THREE.Color(0.5 + Math.random() * 0.3, 0.7 + Math.random() * 0.3, 1.0),
        transparent: true,
        opacity: 0.3 + intensity * 0.5
      });
      
      const line = new THREE.Line(geometry, material);
      scene.add(line);
      
      // 存储速度线以便后续清理
      if (!this._speedLines) this._speedLines = [];
      this._speedLines.push(line);
      
      // 设置自动移除
      setTimeout(() => {
        if (line && scene) {
          scene.remove(line);
          line.geometry.dispose();
          line.material.dispose();
          
          if (this._speedLines) {
            const index = this._speedLines.indexOf(line);
            if (index !== -1) this._speedLines.splice(index, 1);
          }
        }
      }, 1000 + Math.random() * 500); // 1-1.5秒后消失
    }
  }
  
  // 创建加速视觉效果
  createBoostEffect() {
    if (!this.spaceship || !this.spaceship.mesh) return;
    
    try {
      // 移除现有效果
      const existingEffect = this.spaceship.mesh.children.find(child => child.name === 'boostEffect');
      if (existingEffect) {
        this.spaceship.mesh.remove(existingEffect);
        existingEffect.geometry.dispose();
        existingEffect.material.dispose();
      }
      
      // 创建一个拉长的圆锥体表示加速拖尾
      const geometry = new THREE.ConeGeometry(1.5, 10, 16);
      geometry.rotateX(Math.PI); // 旋转使尖端向前
      
      // 使用发光材质
      const material = new THREE.MeshBasicMaterial({
        color: 0x66ffff,
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide
      });
      
      const effect = new THREE.Mesh(geometry, material);
      effect.name = 'boostEffect';
      effect.position.z = -5; // 放在飞船后方
      this.spaceship.mesh.add(effect);
      
      // 添加动画效果
      let scale = 1.0;
      let growing = true;
      
      const animate = () => {
        if (!this.spaceship || !this.spaceship.mesh || !this._boostEffectActive) return;
        
        // 缩放动画
        if (growing) {
          scale += 0.05;
          if (scale >= 1.5) growing = false;
        } else {
          scale -= 0.05;
          if (scale <= 1.0) growing = true;
        }
        
        // 应用缩放
        const boostEffect = this.spaceship.mesh.children.find(child => child.name === 'boostEffect');
        if (boostEffect) {
          boostEffect.scale.set(scale, scale, scale);
        }
        
        // 如果还在加速中，继续动画
        if (this._boostEffectActive) {
          requestAnimationFrame(animate);
        } else if (boostEffect) {
          // 不在加速中，移除效果
          this.spaceship.mesh.remove(boostEffect);
          boostEffect.geometry.dispose();
          boostEffect.material.dispose();
        }
      };
      
      // 启动动画
      animate();
    } catch (error) {
      console.error('创建加速效果失败:', error);
    }
  }
}