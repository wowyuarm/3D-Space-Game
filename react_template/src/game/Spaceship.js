// src/game/Spaceship.js
import * as THREE from 'three';

export class Spaceship {
  constructor() {
    // Basic ship properties
    this.name = 'Scout Ship';
    this.type = 'scout';
    this.mesh = null;
    this.model = null;
    
    // Physics properties
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Quaternion();
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.forces = [];
    this.mass = 100;
    this.drag = 0.1;
    
    // Ship stats
    this.health = 100;
    this.maxHealth = 100;
    this.energy = 100;
    this.maxEnergy = 100;
    this.energyRegenRate = 5; // Per second
    this.thrustPower = 1.0;
    this.maneuverability = 1.0;
    this.cargoCapacity = 20;
    
    // Ship systems
    this.weapons = [];
    this.shields = {
      enabled: false,
      strength: 0,
      maxStrength: 50,
      rechargeRate: 5
    };
    
    // Upgrades
    this.upgrades = [];
    
    // State variables
    this.isBoosting = false;
    this.boostEnergyCost = 20; // Per second
    this.boostMultiplier = 2.0;
    this.braking = false;
    
    // Components
    this.lights = [];
    this.engineGlow = null;
    
    this.gameEngine = null;
    this.isInitialized = false;
  }
  
  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Spaceship already initialized');
      return this;
    }
    
    console.log('Initializing Spaceship...');
    
    // Apply options
    if (options.position) this.position.copy(options.position);
    if (options.type) this.type = options.type;
    if (options.gameEngine) this.gameEngine = options.gameEngine;
    
    // Customize ship based on type
    this.customizeShipByType();
    
    // Create ship mesh
    this.createShipMesh();
    
    this.isInitialized = true;
    return this;
  }
  
  customizeShipByType() {
    switch (this.type) {
      case 'scout':
        this.name = 'Scout Ship';
        this.mass = 80;
        this.thrustPower = 1.2;
        this.maneuverability = 1.3;
        this.cargoCapacity = 15;
        this.maxHealth = 80;
        this.health = 80;
        this.maxEnergy = 100;
        this.energy = 100;
        break;
        
      case 'fighter':
        this.name = 'Fighter Ship';
        this.mass = 100;
        this.thrustPower = 1.5;
        this.maneuverability = 1.6;
        this.cargoCapacity = 10;
        this.maxHealth = 120;
        this.health = 120;
        this.maxEnergy = 120;
        this.energy = 120;
        break;
        
      case 'hauler':
        this.name = 'Cargo Hauler';
        this.mass = 200;
        this.thrustPower = 0.8;
        this.maneuverability = 0.6;
        this.cargoCapacity = 50;
        this.maxHealth = 150;
        this.health = 150;
        this.maxEnergy = 80;
        this.energy = 80;
        break;
        
      case 'explorer':
        this.name = 'Explorer Ship';
        this.mass = 120;
        this.thrustPower = 1.0;
        this.maneuverability = 1.0;
        this.cargoCapacity = 25;
        this.maxHealth = 100;
        this.health = 100;
        this.maxEnergy = 150;
        this.energy = 150;
        break;
    }
  }
  
  createShipMesh() {
    // Create a simple geometric ship model
    const shipGeometry = new THREE.ConeGeometry(0.5, 2, 8);
    shipGeometry.rotateX(Math.PI / 2); // Rotate to point forward
    
    const shipMaterial = new THREE.MeshStandardMaterial({
      color: 0x44aaff,
      emissive: 0x112233,
      roughness: 0.3,
      metalness: 0.7
    });
    
    // Create ship mesh
    const shipMesh = new THREE.Mesh(shipGeometry, shipMaterial);
    shipMesh.castShadow = true;
    shipMesh.receiveShadow = true;
    
    // Create wings
    const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.8);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x3388ff,
      emissive: 0x112244,
      roughness: 0.3,
      metalness: 0.8
    });
    
    const wings = new THREE.Mesh(wingGeometry, wingMaterial);
    wings.position.set(0, 0, 0);
    wings.castShadow = true;
    wings.receiveShadow = true;
    
    // Create engine glow
    const engineGlowGeometry = new THREE.CircleGeometry(0.3, 16);
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ffff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide
    });
    
    this.engineGlow = new THREE.Mesh(engineGlowGeometry, engineGlowMaterial);
    this.engineGlow.position.set(0, 0, -1.1);
    
    // 添加发光效果
    const glowGeometry = new THREE.SphereGeometry(0.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.scale.multiplyScalar(1.2);
    
    // Create ship group
    this.mesh = new THREE.Group();
    this.mesh.add(shipMesh);
    this.mesh.add(wings);
    this.mesh.add(this.engineGlow);
    this.mesh.add(glow);
    
    // Set position
    this.mesh.position.copy(this.position);
    
    // Store reference to the spaceship instance
    this.mesh.userData.spaceship = this;
    
    // Add collision properties
    this.mesh.userData.collider = {
      type: 'sphere',
      radius: 1.0
    };
  }
  
  update(deltaTime) {
    if (!this.isInitialized) return;
    
    // Update position and rotation from physics
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      
      // Create quaternion from Euler angles
      const euler = new THREE.Euler(
        this.mesh.rotation.x,
        this.mesh.rotation.y,
        this.mesh.rotation.z
      );
      this.rotation.setFromEuler(euler);
    }
    
    // Update energy
    if (this.isBoosting && this.energy > 0) {
      // Consume energy while boosting
      this.energy = Math.max(0, this.energy - this.boostEnergyCost * deltaTime);
    } else {
      // Regenerate energy
      this.energy = Math.min(this.maxEnergy, this.energy + this.energyRegenRate * deltaTime);
    }
    
    // Update shield
    if (this.shields.enabled && this.shields.strength < this.shields.maxStrength) {
      this.shields.strength = Math.min(
        this.shields.maxStrength,
        this.shields.strength + this.shields.rechargeRate * deltaTime
      );
    }
    
    // Update engine glow based on thrust
    this.updateEngineGlow();
  }
  
  updateEngineGlow() {
    if (!this.engineGlow) return;
    
    // Calculate engine glow intensity based on thrust and boost
    const speed = this.velocity.length();
    const maxSpeed = 20; // Arbitrary max speed for visual effects
    const baseIntensity = 0.5 + (speed / maxSpeed) * 0.5;
    
    // Pulse effect
    const time = Date.now() / 1000;
    const pulse = Math.sin(time * 10) * 0.1 + 0.9;
    
    // Apply boost effect
    const boostMultiplier = this.isBoosting ? 1.5 : 1.0;
    const finalIntensity = baseIntensity * pulse * boostMultiplier;
    
    // Update engine glow color and size
    if (this.engineGlow.material) {
      this.engineGlow.material.opacity = Math.min(0.8, finalIntensity);
      
      // Change color based on boost state
      if (this.isBoosting) {
        this.engineGlow.material.color.setHex(0xaaddff);
      } else {
        this.engineGlow.material.color.setHex(0x66aaff);
      }
      
      // Scale based on intensity
      this.engineGlow.scale.set(
        0.8 + finalIntensity * 0.4,
        0.8 + finalIntensity * 0.4,
        1
      );
    }
  }
  
  /**
   * 获取飞船的前向方向
   * @returns {THREE.Vector3} 归一化的前向方向向量
   */
  getDirection() {
    // 默认前向方向是z轴负方向 (THREE.js中的"前向")
    const direction = new THREE.Vector3(0, 0, -1);
    
    // 应用飞船的旋转，将局部方向转换为世界方向
    direction.applyQuaternion(this.rotation);
    
    return direction.normalize();
  }
  
  setThrust(thrustAmount) {
    if (!this.isInitialized) return;
    
    // Calculate thrust direction (ship's forward vector)
    const thrustDirection = this.getDirection();
    
    // Apply thrust as a force (F = m * a)
    const thrustVector = thrustDirection.clone().multiplyScalar(thrustAmount);
    
    // Apply boosting if active
    if (this.isBoosting && this.energy > 0) {
      thrustVector.multiplyScalar(this.boostMultiplier);
    }
    
    // Add thrust to forces
    if (this.forces) {
      // Clear previous thrust forces
      this.forces = this.forces.filter(force => force.userData?.type !== 'thrust');
      
      // Add new thrust force if non-zero
      if (thrustAmount !== 0) {
        thrustVector.userData = { type: 'thrust' };
        this.forces.push(thrustVector);
      }
    }
  }
  
  rotate(rotation) {
    if (!this.mesh) return;
    
    // Apply rotation to ship mesh
    this.mesh.rotation.x += rotation.x;
    this.mesh.rotation.y += rotation.y;
    this.mesh.rotation.z += rotation.z;
  }
  
  boost(deltaTime) {
    if (this.energy <= 0) {
      this.isBoosting = false;
      return;
    }
    
    this.isBoosting = true;
  }
  
  stopBoost() {
    this.isBoosting = false;
  }
  
  brake(deltaTime) {
    if (!this.isInitialized) return;
    
    // Apply braking force opposite to velocity
    if (this.velocity.lengthSq() > 0.01) {
      const brakeForce = this.velocity.clone().normalize().multiplyScalar(-10 * this.thrustPower);
      
      // Add brake force
      brakeForce.userData = { type: 'brake' };
      this.forces.push(brakeForce);
      
      this.braking = true;
      
      // Use some energy for braking
      this.energy = Math.max(0, this.energy - 5 * deltaTime);
    } else {
      // If almost stopped, just zero out velocity
      this.velocity.set(0, 0, 0);
      this.braking = false;
    }
  }
  
  takeDamage(amount) {
    // Check for shields
    if (this.shields.enabled && this.shields.strength > 0) {
      const shieldDamage = Math.min(amount, this.shields.strength);
      this.shields.strength -= shieldDamage;
      amount -= shieldDamage;
      
      // If shield depleted, disable it
      if (this.shields.strength <= 0) {
        this.shields.enabled = false;
      }
    }
    
    // Apply remaining damage to hull
    if (amount > 0) {
      this.health = Math.max(0, this.health - amount);
    }
    
    // Check if destroyed
    if (this.health <= 0) {
      this.onDestroyed();
    }
    
    return this.health;
  }
  
  repair(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    return this.health;
  }
  
  onDestroyed() {
    console.log('Ship destroyed!');
    // Trigger explosion effect, game over, etc.
  }
  
  installUpgrade(upgradeId) {
    if (this.upgrades.includes(upgradeId)) {
      console.log(`Upgrade ${upgradeId} already installed`);
      return false;
    }
    
    // Add upgrade to installed list
    this.upgrades.push(upgradeId);
    
    // Apply upgrade effects
    switch(upgradeId) {
      // Engine upgrades
      case 'eng1':
        this.thrustPower *= 1.2;
        break;
      case 'eng2':
        this.thrustPower *= 1.35;
        break;
      case 'eng3':
        this.thrustPower *= 1.6;
        break;
        
      // Hull upgrades
      case 'hull1':
        this.maxHealth *= 1.25;
        this.health = this.maxHealth;
        break;
      case 'hull2':
        this.shields.enabled = true;
        this.shields.maxStrength = 50;
        this.shields.strength = 50;
        break;
      case 'hull3':
        this.maxHealth *= 1.5;
        this.health = this.maxHealth;
        // Add damage resistance
        break;
        
      // Energy upgrades
      case 'nrg1':
        this.maxEnergy *= 1.2;
        this.energy = this.maxEnergy;
        break;
      case 'nrg2':
        this.energyRegenRate *= 1.3;
        break;
      case 'nrg3':
        this.maxEnergy *= 1.5;
        this.energyRegenRate *= 1.5;
        this.energy = this.maxEnergy;
        break;
        
      // Cargo upgrades
      case 'crg1':
        this.cargoCapacity += 5;
        break;
      case 'crg2':
        this.cargoCapacity += 10;
        break;
      case 'crg3':
        this.cargoCapacity += 20;
        break;
        
      // Weapon systems
      case 'wpn1':
        if (!this.weapons.includes('mining_laser')) {
          this.weapons.push('mining_laser');
        }
        break;
      case 'wpn2':
        if (!this.weapons.includes('defense_turret')) {
          this.weapons.push('defense_turret');
        }
        break;
      case 'wpn3':
        if (!this.weapons.includes('pulse_cannon')) {
          this.weapons.push('pulse_cannon');
        }
        break;
    }
    
    return true;
  }
  
  serialize() {
    return {
      name: this.name,
      type: this.type,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      rotation: {
        x: this.mesh ? this.mesh.rotation.x : 0,
        y: this.mesh ? this.mesh.rotation.y : 0,
        z: this.mesh ? this.mesh.rotation.z : 0
      },
      velocity: {
        x: this.velocity.x,
        y: this.velocity.y,
        z: this.velocity.z
      },
      health: this.health,
      maxHealth: this.maxHealth,
      energy: this.energy,
      maxEnergy: this.maxEnergy,
      energyRegenRate: this.energyRegenRate,
      thrustPower: this.thrustPower,
      maneuverability: this.maneuverability,
      cargoCapacity: this.cargoCapacity,
      weapons: [...this.weapons],
      shields: {
        ...this.shields
      },
      upgrades: [...this.upgrades]
    };
  }
  
  deserialize(data) {
    if (!data) return this;
    
    // Restore ship properties
    this.name = data.name || this.name;
    this.type = data.type || this.type;
    
    if (data.position) {
      this.position.set(
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      );
    }
    
    if (this.mesh && data.rotation) {
      this.mesh.rotation.set(
        data.rotation.x || 0,
        data.rotation.y || 0,
        data.rotation.z || 0
      );
    }
    
    if (data.velocity) {
      this.velocity.set(
        data.velocity.x || 0,
        data.velocity.y || 0,
        data.velocity.z || 0
      );
    }
    
    // Restore ship stats
    this.health = data.health !== undefined ? data.health : this.health;
    this.maxHealth = data.maxHealth || this.maxHealth;
    this.energy = data.energy !== undefined ? data.energy : this.energy;
    this.maxEnergy = data.maxEnergy || this.maxEnergy;
    this.energyRegenRate = data.energyRegenRate || this.energyRegenRate;
    this.thrustPower = data.thrustPower || this.thrustPower;
    this.maneuverability = data.maneuverability || this.maneuverability;
    this.cargoCapacity = data.cargoCapacity || this.cargoCapacity;
    
    // Restore weapons
    if (data.weapons && Array.isArray(data.weapons)) {
      this.weapons = [...data.weapons];
    }
    
    // Restore shields
    if (data.shields) {
      this.shields = {
        ...this.shields,
        ...data.shields
      };
    }
    
    // Restore upgrades
    if (data.upgrades && Array.isArray(data.upgrades)) {
      this.upgrades = [...data.upgrades];
    }
    
    return this;
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    // Clean up mesh and geometry
    if (this.mesh) {
      // Remove from parent if it has one
      if (this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
      
      // Dispose of child meshes
      this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) child.geometry.dispose();
          
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    }
    
    this.isInitialized = false;
    return this;
  }
}

export default Spaceship;