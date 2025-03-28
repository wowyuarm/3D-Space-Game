// src/universe/Universe.js
import * as THREE from 'three';
import { Galaxy } from './Galaxy';

export class Universe {
  constructor() {
    this.galaxies = [];
    this.seed = Math.floor(Math.random() * 10000);
    this.universeSize = 1000000; // Size of the universe in arbitrary units
    this.isInitialized = false;
  }

  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Universe already initialized');
      return this;
    }

    console.log('Initializing Universe...');

    // Apply configuration options
    if (options.seed !== undefined) this.seed = options.seed;
    if (options.universeSize) this.universeSize = options.universeSize;

    // Create galaxies
    const numGalaxies = options.numGalaxies || 1;
    const galaxySize = options.galaxySize || 1000;

    for (let i = 0; i < numGalaxies; i++) {
      // Generate a position for the galaxy within the universe
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * this.universeSize,
        (Math.random() - 0.5) * this.universeSize * 0.2, // Flatter on y-axis
        (Math.random() - 0.5) * this.universeSize
      );

      // Create and initialize the galaxy
      const galaxy = new Galaxy().initialize({
        position,
        size: galaxySize,
        seed: this.seed + i,
        numStarSystems: 50 + Math.floor(Math.random() * 50) // 50-100 star systems
      });

      this.galaxies.push(galaxy);
    }

    this.isInitialized = true;
    return this;
  }

  getGalaxyById(id) {
    return this.galaxies.find(galaxy => galaxy.id === id);
  }

  getStarSystemById(systemId) {
    for (const galaxy of this.galaxies) {
      const system = galaxy.getStarSystemById(systemId);
      if (system) return system;
    }
    return null;
  }

  getPlanetById(planetId) {
    for (const galaxy of this.galaxies) {
      const planet = galaxy.getPlanetById(planetId);
      if (planet) return planet;
    }
    return null;
  }

  update(deltaTime) {
    // Update all galaxies
    this.galaxies.forEach(galaxy => {
      galaxy.update(deltaTime);
    });
  }

  serialize() {
    return {
      seed: this.seed,
      universeSize: this.universeSize,
      galaxies: this.galaxies.map(galaxy => galaxy.serialize())
    };
  }

  deserialize(data) {
    if (!data) return this;

    this.seed = data.seed || this.seed;
    this.universeSize = data.universeSize || this.universeSize;

    // Clear existing galaxies
    this.galaxies = [];

    // Recreate galaxies from saved data
    if (data.galaxies && Array.isArray(data.galaxies)) {
      data.galaxies.forEach(galaxyData => {
        const galaxy = new Galaxy().deserialize(galaxyData);
        this.galaxies.push(galaxy);
      });
    }

    this.isInitialized = true;
    return this;
  }

  dispose() {
    // Clean up resources
    this.galaxies.forEach(galaxy => {
      galaxy.dispose();
    });

    this.galaxies = [];
    this.isInitialized = false;
    return this;
  }
}

export default Universe;