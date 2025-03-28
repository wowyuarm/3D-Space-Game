// src/universe/StarSystem.js
import * as THREE from 'three';
import { Planet } from './Planet';
import { generateSeededRandom } from '../utils/MathUtils';

export class StarSystem {
  constructor() {
    this.id = `system_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = 'Unnamed System';
    this.position = new THREE.Vector3(0, 0, 0);
    this.galaxyId = null;
    this.starType = 'yellow'; // blue, white, yellow, orange, red, binary
    this.starSize = 1.0; // Size multiplier
    this.planets = [];
    this.resources = {
      minerals: 0, // 0-10 rating
      gases: 0,
      organics: 0,
      rareElements: 0
    };
    this.explored = false;
    this.hostileLevel = 0; // 0-10 rating for danger level
    this.seed = 0;
    this.randomGen = Math.random; // Will be replaced with seeded random
    
    this.isInitialized = false;
    
    // Visual representation
    this.mesh = null;
  }

  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('StarSystem already initialized');
      return this;
    }

    console.log('Initializing Star System...');

    // Apply configuration options
    if (options.position) this.position.copy(options.position);
    if (options.seed !== undefined) this.seed = options.seed;
    if (options.galaxyId) this.galaxyId = options.galaxyId;

    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);

    // Generate star system properties
    this.generateStarProperties();
    this.generateSystemName();
    this.generateResources();
    this.hostileLevel = Math.floor(this.randomGen() * 10);

    // Generate planets
    const planetCount = this.determineNumberOfPlanets();
    this.generatePlanets(planetCount);

    this.isInitialized = true;
    return this;
  }

  generateStarProperties() {
    // Determine star type probabilities
    const starTypeProbability = this.randomGen();
    
    if (starTypeProbability < 0.10) {
      this.starType = 'blue';
      this.starSize = 1.2 + this.randomGen() * 0.8; // 1.2-2.0
    } else if (starTypeProbability < 0.25) {
      this.starType = 'white';
      this.starSize = 1.0 + this.randomGen() * 0.5; // 1.0-1.5
    } else if (starTypeProbability < 0.60) {
      this.starType = 'yellow';
      this.starSize = 0.8 + this.randomGen() * 0.4; // 0.8-1.2
    } else if (starTypeProbability < 0.85) {
      this.starType = 'orange';
      this.starSize = 0.7 + this.randomGen() * 0.5; // 0.7-1.2
    } else if (starTypeProbability < 0.95) {
      this.starType = 'red';
      this.starSize = 0.5 + this.randomGen() * 0.4; // 0.5-0.9
    } else {
      this.starType = 'binary';
      this.starSize = 1.5 + this.randomGen() * 0.5; // 1.5-2.0
    }
  }

  generateSystemName() {
    const prefixes = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta', 'Sigma', 'Omega'];
    const middles = ['Centauri', 'Cygni', 'Eridani', 'Persei', 'Tauri', 'Orionis', 'Draconis', 'Lyrae', 'Hydrae', 'Pavonis'];
    const suffixes = ['-Prime', '-Major', '-Minor', '', '', '', '', '', '', ''];
    
    const prefix = prefixes[Math.floor(this.randomGen() * prefixes.length)];
    const middle = middles[Math.floor(this.randomGen() * middles.length)];
    const suffix = suffixes[Math.floor(this.randomGen() * suffixes.length)];
    
    // Add a number for uniqueness
    const number = Math.floor(this.randomGen() * 999) + 1;
    
    this.name = `${prefix} ${middle}${suffix} ${number}`;
  }

  determineNumberOfPlanets() {
    // Different star types tend to have different numbers of planets
    let basePlanets;
    
    switch (this.starType) {
      case 'blue':
        basePlanets = 1 + Math.floor(this.randomGen() * 4); // 1-4
        break;
      case 'white':
        basePlanets = 2 + Math.floor(this.randomGen() * 4); // 2-5
        break;
      case 'yellow':
        basePlanets = 3 + Math.floor(this.randomGen() * 5); // 3-7
        break;
      case 'orange':
        basePlanets = 2 + Math.floor(this.randomGen() * 5); // 2-6
        break;
      case 'red':
        basePlanets = 1 + Math.floor(this.randomGen() * 3); // 1-3
        break;
      case 'binary':
        basePlanets = 2 + Math.floor(this.randomGen() * 7); // 2-8
        break;
      default:
        basePlanets = 2 + Math.floor(this.randomGen() * 5); // 2-6
    }
    
    return basePlanets;
  }

  generateResources() {
    // Generate resource levels
    this.resources = {
      minerals: Math.floor(this.randomGen() * 10) + 1,
      gases: Math.floor(this.randomGen() * 10) + 1,
      organics: Math.floor(this.randomGen() * 10) + 1,
      rareElements: Math.floor(this.randomGen() * 10) + 1
    };
    
    // Adjust resources based on star type
    switch (this.starType) {
      case 'blue':
        // Blue stars tend to have more minerals and rare elements
        this.resources.minerals = Math.min(10, this.resources.minerals + 2);
        this.resources.rareElements = Math.min(10, this.resources.rareElements + 3);
        this.resources.organics = Math.max(1, this.resources.organics - 2);
        break;
      case 'yellow':
        // Yellow stars like our sun tend to have balanced resources
        this.resources.organics = Math.min(10, this.resources.organics + 2);
        break;
      case 'red':
        // Red dwarf stars tend to have fewer resources
        this.resources.minerals = Math.max(1, this.resources.minerals - 1);
        break;
      case 'binary':
        // Binary stars are chaotic and resource-rich
        this.resources.gases = Math.min(10, this.resources.gases + 3);
        this.resources.rareElements = Math.min(10, this.resources.rareElements + 2);
        break;
    }
  }

  generatePlanets(count) {
    for (let i = 0; i < count; i++) {
      // Distance increases with each planet
      const orbitMultiplier = 2 + i * 1.5;
      
      // Create planet with unique seed derived from star system seed and index
      const planetSeed = this.seed * 100 + i;
      const planet = new Planet().initialize({
        orbitalDistance: orbitMultiplier,
        orbitIndex: i,
        systemId: this.id,
        starType: this.starType,
        seed: planetSeed
      });
      
      this.planets.push(planet);
    }
    
    // Sort planets by orbital distance
    this.planets.sort((a, b) => a.orbitalDistance - b.orbitalDistance);
  }

  getPlanetById(planetId) {
    return this.planets.find(planet => planet.id === planetId);
  }

  update(deltaTime) {
    // Update planet orbits and rotations
    this.planets.forEach(planet => {
      try {
        if (planet && typeof planet.update === 'function') {
          planet.update(deltaTime);
        }
      } catch (error) {
        console.error(`Error updating planet: ${error.message}`);
      }
    });
  }

  createStarSystemVisualization(scene) {
    if (this.mesh) return this.mesh;
    
    // Create star
    const starGeometry = new THREE.SphereGeometry(this.starSize, 32, 32);
    
    // Determine star color
    let starColor;
    switch (this.starType) {
      case 'blue':
        starColor = 0x6688ff;
        break;
      case 'white':
        starColor = 0xffffff;
        break;
      case 'yellow':
        starColor = 0xffff99;
        break;
      case 'orange':
        starColor = 0xff9966;
        break;
      case 'red':
        starColor = 0xff6644;
        break;
      case 'binary':
        starColor = 0xffaacc; // A pinkish color for binary
        break;
      default:
        starColor = 0xffffcc;
    }
    
    const starMaterial = new THREE.MeshBasicMaterial({
      color: starColor,
      emissive: starColor,
      emissiveIntensity: 1.0
    });
    
    const starMesh = new THREE.Mesh(starGeometry, starMaterial);
    
    // Create star glow
    const starLight = new THREE.PointLight(starColor, 1.0, 100);
    starMesh.add(starLight);
    
    // Create system group
    this.mesh = new THREE.Group();
    this.mesh.add(starMesh);
    
    // Add planets to the visualization
    this.planets.forEach(planet => {
      try {
        if (planet && planet.isInitialized) {
          const planetMesh = planet.createPlanetMesh();
          if (planetMesh && planetMesh instanceof THREE.Object3D) {
            this.mesh.add(planetMesh);
          } else {
            console.warn(`Failed to add planet mesh for ${planet.name}: not a valid THREE.Object3D`);
          }
        }
      } catch (error) {
        console.error(`Error adding planet mesh: ${error.message}`);
      }
    });
    
    // Position the system
    this.mesh.position.copy(this.position);
    
    if (scene) {
      scene.add(this.mesh);
    }
    
    return this.mesh;
  }

  markExplored() {
    this.explored = true;
    return this;
  }

  getResourceRichness() {
    // Calculate total resource richness
    return (
      this.resources.minerals +
      this.resources.gases +
      this.resources.organics +
      this.resources.rareElements * 2 // Rare elements are worth double
    ) / 4; // Average on a scale of 0-10
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      galaxyId: this.galaxyId,
      position: {
        x: this.position.x,
        y: this.position.y,
        z: this.position.z
      },
      starType: this.starType,
      starSize: this.starSize,
      resources: { ...this.resources },
      explored: this.explored,
      hostileLevel: this.hostileLevel,
      seed: this.seed,
      planets: this.planets.map(planet => planet.serialize())
    };
  }

  deserialize(data) {
    if (!data) return this;

    this.id = data.id || this.id;
    this.name = data.name || this.name;
    this.galaxyId = data.galaxyId || this.galaxyId;
    this.starType = data.starType || this.starType;
    this.starSize = data.starSize || this.starSize;
    this.explored = data.explored || false;
    this.hostileLevel = data.hostileLevel || 0;
    this.seed = data.seed || this.seed;
    
    if (data.position) {
      this.position.set(
        data.position.x || 0,
        data.position.y || 0,
        data.position.z || 0
      );
    }
    
    if (data.resources) {
      this.resources = { ...this.resources, ...data.resources };
    }
    
    // Clear existing planets
    this.planets = [];
    
    // Recreate planets from saved data
    if (data.planets && Array.isArray(data.planets)) {
      data.planets.forEach(planetData => {
        const planet = new Planet().deserialize(planetData);
        this.planets.push(planet);
      });
    }
    
    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);
    
    this.isInitialized = true;
    return this;
  }

  dispose() {
    // Clean up resources
    if (this.mesh) {
      // Remove from parent if it has one
      if (this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
      
      // Dispose of all child geometries and materials
      this.mesh.traverse(child => {
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
        
        if (child instanceof THREE.Light) {
          // Handle lights if needed
        }
      });
    }
    
    this.planets.forEach(planet => {
      planet.dispose();
    });
    
    this.planets = [];
    this.isInitialized = false;
    return this;
  }
}

export default StarSystem;