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
    
    // Flight control variables
    const thrustForce = 20.0 * this.spaceship.thrustPower;
    const turnSpeed = 1.5 * this.spaceship.maneuverability;
    const maxRotationRate = 2.0;
    let thrust = 0;
    const rotation = new THREE.Vector3(0, 0, 0);
    
    // Forward/backward thrust
    if (inputManager.isKeyPressed('KeyW')) {
      thrust = thrustForce;
    } else if (inputManager.isKeyPressed('KeyS')) {
      thrust = -thrustForce * 0.5; // Reverse is slower
    }
    
    // Turning controls
    if (inputManager.isKeyPressed('KeyA')) {
      rotation.y = turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('KeyD')) {
      rotation.y = -turnSpeed * deltaTime;
    }
    
    // Pitch control
    if (inputManager.isKeyPressed('ArrowUp')) {
      rotation.x = this.invertY ? -turnSpeed * deltaTime : turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('ArrowDown')) {
      rotation.x = this.invertY ? turnSpeed * deltaTime : -turnSpeed * deltaTime;
    }
    
    // Roll control
    if (inputManager.isKeyPressed('KeyQ')) {
      rotation.z = turnSpeed * deltaTime;
    }
    
    if (inputManager.isKeyPressed('KeyE')) {
      rotation.z = -turnSpeed * deltaTime;
    }
    
    // Apply controls to spaceship
    this.spaceship.setThrust(thrust);
    this.spaceship.rotate(rotation);
    
    // Boost (temporary speed increase)
    if (inputManager.isKeyPressed('ShiftLeft') && this.spaceship.energy > 0) {
      this.spaceship.boost(deltaTime);
    }
    
    // Brake (rapid deceleration)
    if (inputManager.isKeyPressed('Space')) {
      this.spaceship.brake(deltaTime);
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
    if (!planet || !planet.canLand) return false;
    
    this.currentPlanet = planet;
    this.isLanded = true;
    
    // Stop ship movement
    if (this.spaceship) {
      this.spaceship.setThrust(0);
      this.spaceship.velocity.set(0, 0, 0);
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