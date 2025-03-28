// src/universe/Galaxy.js
import * as THREE from 'three';
import { StarSystem } from './StarSystem';
import { generateSeededRandom } from '../utils/MathUtils';

export class Galaxy {
  constructor() {
    this.id = `galaxy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = 'Unnamed Galaxy';
    this.type = 'spiral'; // spiral, elliptical, irregular
    this.position = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.size = 1000; // Size in arbitrary units
    this.starSystems = [];
    this.seed = 0;
    this.randomGen = Math.random; // Will be replaced with seeded random
    this.isInitialized = false;
    
    // Galaxy visuals
    this.mesh = null;
    this.particleSystem = null;
  }

  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Galaxy already initialized');
      return this;
    }

    console.log('Initializing Galaxy...');

    // Apply configuration options
    if (options.position) this.position.copy(options.position);
    if (options.size !== undefined) this.size = options.size;
    if (options.seed !== undefined) this.seed = options.seed;
    if (options.type) this.type = options.type;

    // Generate galaxy name
    this.name = this.generateGalaxyName();

    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);

    // Generate star systems
    this.generateStarSystems(options.numStarSystems || 100);

    this.isInitialized = true;
    return this;
  }

  generateGalaxyName() {
    const prefixes = ['Andromeda', 'Triangulum', 'Centaurus', 'Messier', 'NGC', 'Omega', 'Alpha', 'Proxima', 'Canis', 'Orion'];
    const suffixes = ['Galaxy', 'Cluster', 'System', 'Nebula', 'Cloud', 'Major', 'Minor', 'Prime', 'Sector'];
    
    const prefix = prefixes[Math.floor(this.randomGen() * prefixes.length)];
    const suffix = suffixes[Math.floor(this.randomGen() * suffixes.length)];
    const number = Math.floor(this.randomGen() * 9000) + 1000;
    
    return `${prefix} ${suffix} ${number}`;
  }

  generateStarSystems(count) {
    const minDistance = this.size * 0.05; // Minimum distance between star systems

    for (let i = 0; i < count; i++) {
      // Generate position based on galaxy type
      let position;
      
      switch (this.type) {
        case 'spiral':
          position = this.generateSpiralPosition();
          break;
        case 'elliptical':
          position = this.generateEllipticalPosition();
          break;
        case 'irregular':
          position = this.generateIrregularPosition();
          break;
        default:
          position = this.generateSpiralPosition();
      }

      // Ensure minimum distance from other systems
      let tooClose = false;
      for (const existingSystem of this.starSystems) {
        if (position.distanceTo(existingSystem.position) < minDistance) {
          tooClose = true;
          break;
        }
      }

      // If too close, try again (limited times)
      if (tooClose && i < count * 3) {
        i--;
        continue;
      }

      // Create star system with unique seed derived from galaxy seed and index
      const systemSeed = this.seed * 1000 + i;
      const system = new StarSystem().initialize({
        position,
        seed: systemSeed,
        galaxyId: this.id
      });

      this.starSystems.push(system);
    }
  }

  generateSpiralPosition() {
    // Generate a position along a spiral arm
    const armCount = 2 + Math.floor(this.randomGen() * 4); // 2-5 arms
    const armIndex = Math.floor(this.randomGen() * armCount);
    const angle = this.randomGen() * Math.PI * 6 + (Math.PI * 2 * armIndex / armCount);
    const radius = this.randomGen() * this.size * 0.8 + this.size * 0.1;
    
    // Add some randomness to create a more natural spiral
    const angleOffset = (this.randomGen() - 0.5) * 0.5;
    const radiusOffset = (this.randomGen() - 0.5) * this.size * 0.1;
    
    const x = Math.cos(angle + angleOffset) * (radius + radiusOffset);
    const y = (this.randomGen() - 0.5) * this.size * 0.1; // Thin disk
    const z = Math.sin(angle + angleOffset) * (radius + radiusOffset);
    
    return new THREE.Vector3(x, y, z).add(this.position);
  }

  generateEllipticalPosition() {
    // Generate a position in an elliptical distribution
    const u = this.randomGen();
    const v = this.randomGen();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    const radius = this.randomGen() * this.size * 0.9;
    
    // Transform spherical to cartesian coordinates with elliptical scaling
    const xScale = 1.0;
    const yScale = 0.6 + this.randomGen() * 0.4; // Varies the flatness
    const zScale = 0.8 + this.randomGen() * 0.2;
    
    const x = radius * Math.sin(phi) * Math.cos(theta) * xScale;
    const y = radius * Math.sin(phi) * Math.sin(theta) * yScale;
    const z = radius * Math.cos(phi) * zScale;
    
    return new THREE.Vector3(x, y, z).add(this.position);
  }

  generateIrregularPosition() {
    // Generate a position with irregular, clumpy distribution
    const numClumps = 2 + Math.floor(this.randomGen() * 4);
    
    // Choose a random clump
    const clumpIndex = Math.floor(this.randomGen() * numClumps);
    
    // Generate a clump center
    const clumpCenter = new THREE.Vector3(
      (this.randomGen() - 0.5) * this.size,
      (this.randomGen() - 0.5) * this.size * 0.4,
      (this.randomGen() - 0.5) * this.size
    );
    
    // Generate a position within the clump
    const clumpRadius = this.size * (0.1 + this.randomGen() * 0.2);
    const u = this.randomGen();
    const v = this.randomGen();
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    
    const radius = this.randomGen() * clumpRadius;
    
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z).add(clumpCenter).add(this.position);
  }

  getStarSystemById(systemId) {
    return this.starSystems.find(system => system.id === systemId);
  }

  getPlanetById(planetId) {
    for (const system of this.starSystems) {
      const planet = system.getPlanetById(planetId);
      if (planet) return planet;
    }
    return null;
  }

  update(deltaTime) {
    // Update all star systems
    this.starSystems.forEach(system => {
      try {
        if (system && typeof system.update === 'function') {
          system.update(deltaTime);
        }
      } catch (error) {
        console.error(`Error updating star system: ${error.message}`);
      }
    });
  }

  createGalaxyVisualization() {
    // Create a visual representation of the galaxy for the star map
    if (this.mesh) return this.mesh;
    
    const particleCount = Math.min(this.starSystems.length, 5000);
    const particles = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < this.starSystems.length && i < particleCount; i++) {
      const system = this.starSystems[i];
      const i3 = i * 3;
      
      // Position relative to galaxy center
      positions[i3] = system.position.x - this.position.x;
      positions[i3 + 1] = system.position.y - this.position.y;
      positions[i3 + 2] = system.position.z - this.position.z;
      
      // Color based on star type
      let color = new THREE.Color(0xffffff);
      switch (system.starType) {
        case 'blue':
          color = new THREE.Color(0x6688ff);
          break;
        case 'white':
          color = new THREE.Color(0xffffff);
          break;
        case 'yellow':
          color = new THREE.Color(0xffff99);
          break;
        case 'orange':
          color = new THREE.Color(0xff9966);
          break;
        case 'red':
          color = new THREE.Color(0xff6644);
          break;
        case 'binary':
          color = new THREE.Color(0xffaacc);
          break;
      }
      
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }
    
    particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: false
    });
    
    this.particleSystem = new THREE.Points(particles, material);
    
    // Create a container for the galaxy visualization
    this.mesh = new THREE.Group();
    this.mesh.add(this.particleSystem);
    this.mesh.position.copy(this.position);
    
    return this.mesh;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      size: this.size,
      seed: this.seed,
      starSystems: this.starSystems.map(system => system.serialize())
    };
  }

  deserialize(data) {
    if (!data) return this;

    this.id = data.id || this.id;
    this.name = data.name || this.name;
    this.type = data.type || this.type;
    this.size = data.size || this.size;
    this.seed = data.seed || this.seed;
    
    if (data.position) {
      this.position.set(
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      );
    }
    
    // Clear existing star systems
    this.starSystems = [];
    
    // Recreate star systems from saved data
    if (data.starSystems && Array.isArray(data.starSystems)) {
      data.starSystems.forEach(systemData => {
        const system = new StarSystem().deserialize(systemData);
        this.starSystems.push(system);
      });
    }
    
    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);
    
    this.isInitialized = true;
    return this;
  }

  dispose() {
    // Clean up resources
    if (this.particleSystem) {
      if (this.particleSystem.geometry) {
        this.particleSystem.geometry.dispose();
      }
      if (this.particleSystem.material) {
        this.particleSystem.material.dispose();
      }
    }
    
    if (this.mesh && this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    
    this.starSystems.forEach(system => {
      system.dispose();
    });
    
    this.starSystems = [];
    this.isInitialized = false;
    return this;
  }
}

export default Galaxy;