// src/universe/Planet.js
import * as THREE from 'three';
import { generateSeededRandom } from '../utils/MathUtils';

export class Planet {
  constructor() {
    this.id = `planet_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    this.name = 'Unnamed Planet';
    this.type = 'terrestrial'; // terrestrial, gas giant, ice, desert, lava, etc.
    this.size = 1.0; // Size multiplier
    this.orbitalDistance = 10; // Distance from star
    this.orbitalPeriod = 365; // Days to orbit star
    this.rotationPeriod = 24; // Hours to rotate
    this.orbitAngle = 0; // Current angle in orbit
    this.orbitIncline = 0; // Orbital inclination
    this.orbitIndex = 0; // Index in the star system
    this.hasAtmosphere = false;
    this.hasWater = false;
    this.habitability = 0; // 0-10 rating
    this.dangerLevel = 0; // 0-10 rating
    this.systemId = null;
    this.resources = {
      minerals: 0,
      gases: 0,
      organics: 0,
      rareElements: 0
    };
    this.landmarks = [];
    this.explored = false;
    this.canLand = false;
    this.seed = 0;
    this.randomGen = Math.random; // Will be replaced with seeded random
    
    // Visual representation
    this.mesh = null;
    this.isInitialized = false;
  }

  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Planet already initialized');
      return this;
    }

    console.log('Initializing Planet...');

    // Apply configuration options
    if (options.orbitalDistance !== undefined) this.orbitalDistance = options.orbitalDistance;
    if (options.orbitIndex !== undefined) this.orbitIndex = options.orbitIndex;
    if (options.systemId) this.systemId = options.systemId;
    if (options.seed !== undefined) this.seed = options.seed;
    
    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);
    
    // Generate planet properties
    this.generatePlanetType(options.starType || 'yellow');
    this.generatePlanetName();
    this.generatePlanetProperties();
    this.generateResources();
    
    this.isInitialized = true;
    return this;
  }

  generatePlanetType(starType) {
    const distanceFactor = this.orbitIndex + 1;
    const typeRoll = this.randomGen();
    
    // Different probabilities based on distance from star and star type
    if (distanceFactor <= 2) {
      // Inner planets
      if (typeRoll < 0.5) {
        this.type = 'rocky';
      } else if (typeRoll < 0.7) {
        this.type = 'lava';
      } else if (typeRoll < 0.9) {
        this.type = 'desert';
      } else {
        this.type = 'terrestrial';
      }
    } else if (distanceFactor <= 4) {
      // Habitable zone (more likely for yellow stars)
      const habitableBonus = starType === 'yellow' ? 0.2 : 0;
      
      if (typeRoll < 0.3 - habitableBonus) {
        this.type = 'rocky';
      } else if (typeRoll < 0.6) {
        this.type = 'terrestrial';
      } else if (typeRoll < 0.7 + habitableBonus) {
        this.type = 'oceanic';
      } else {
        this.type = 'desert';
      }
    } else {
      // Outer planets
      if (typeRoll < 0.4) {
        this.type = 'gas giant';
      } else if (typeRoll < 0.7) {
        this.type = 'ice';
      } else if (typeRoll < 0.9) {
        this.type = 'rocky';
      } else {
        this.type = 'barren';
      }
    }
    
    // Adjust size based on type
    switch (this.type) {
      case 'gas giant':
        this.size = 5.0 + this.randomGen() * 7.0; // 5-12x earth size
        break;
      case 'terrestrial':
      case 'oceanic':
        this.size = 0.5 + this.randomGen() * 1.5; // 0.5-2x earth size
        break;
      case 'rocky':
      case 'desert':
      case 'barren':
        this.size = 0.3 + this.randomGen() * 1.2; // 0.3-1.5x earth size
        break;
      case 'ice':
        this.size = 0.8 + this.randomGen() * 2.2; // 0.8-3x earth size
        break;
      case 'lava':
        this.size = 0.4 + this.randomGen() * 1.0; // 0.4-1.4x earth size
        break;
      default:
        this.size = 0.5 + this.randomGen() * 1.0; // Default 0.5-1.5x earth size
    }
  }

  generatePlanetName() {
    const prefixes = ['New', 'Alpha', 'Beta', 'Proxima', 'Nova', 'Omega', 'Sigma', 'Terra', 'Kepler', 'Gliese'];
    const middles = ['Horizon', 'Haven', 'Prime', 'Centauri', 'Zenith', 'Nadir', 'Aegis', 'Vega', 'Nexus', 'Vertex'];
    const suffixes = [' I', ' II', ' III', ' IV', ' V', ' VI', ' VII', ' VIII', ' IX', ' X'];
    
    let name;
    
    // 40% chance of simple name
    if (this.randomGen() < 0.4) {
      const simpleNames = ['Osiris', 'Thalos', 'Kronos', 'Arcadia', 'Elysium', 'Hyperion', 'Io', 'Europa', 'Ganymede', 
                         'Callisto', 'Oberon', 'Triton', 'Titan', 'Rhea', 'Iapetus', 'Tethys', 'Dione', 'Mimas', 'Enceladus', 'Phoebe'];
      name = simpleNames[Math.floor(this.randomGen() * simpleNames.length)];
    } else {
      // 60% chance of compound name
      const prefix = prefixes[Math.floor(this.randomGen() * prefixes.length)];
      const middle = middles[Math.floor(this.randomGen() * middles.length)];
      name = `${prefix} ${middle}`;
    }
    
    // Add suffix based on orbit index
    if (this.orbitIndex < suffixes.length) {
      name += suffixes[this.orbitIndex];
    }
    
    this.name = name;
  }

  generatePlanetProperties() {
    // Set orbital properties
    // Orbital period increases with distance
    this.orbitalPeriod = Math.floor(this.orbitalDistance * this.orbitalDistance * (20 + this.randomGen() * 10)); // Days
    
    // Rotation period varies by planet type
    switch (this.type) {
      case 'gas giant':
        this.rotationPeriod = 10 + this.randomGen() * 20; // 10-30 hours
        break;
      case 'terrestrial':
      case 'oceanic':
      case 'desert':
        this.rotationPeriod = 18 + this.randomGen() * 12; // 18-30 hours
        break;
      default:
        this.rotationPeriod = 15 + this.randomGen() * 35; // 15-50 hours
    }
    
    // Start at random position in orbit
    this.orbitAngle = this.randomGen() * Math.PI * 2;
    
    // Orbital inclination
    this.orbitIncline = this.randomGen() * Math.PI * 0.2 - Math.PI * 0.1; // -0.1π to 0.1π
    
    // Set atmosphere and water
    this.hasAtmosphere = (['terrestrial', 'oceanic', 'gas giant'].includes(this.type)) 
      || (this.type === 'desert' && this.randomGen() > 0.5);
      
    this.hasWater = this.type === 'oceanic' 
      || (this.type === 'terrestrial' && this.randomGen() > 0.3);
    
    // Set habitability
    if (this.type === 'terrestrial' && this.hasAtmosphere && this.hasWater) {
      this.habitability = 5 + Math.floor(this.randomGen() * 6); // 5-10
    } else if (this.type === 'oceanic' && this.hasAtmosphere) {
      this.habitability = 4 + Math.floor(this.randomGen() * 5); // 4-8
    } else if (this.type === 'desert' && this.hasAtmosphere) {
      this.habitability = 2 + Math.floor(this.randomGen() * 4); // 2-5
    } else {
      this.habitability = Math.floor(this.randomGen() * 3); // 0-2
    }
    
    // Set danger level
    this.dangerLevel = Math.floor(this.randomGen() * 10) + 1; // 1-10
    
    // Can player land?
    this.canLand = this.type !== 'gas giant' && this.type !== 'lava' && this.dangerLevel < 9; // Extremely dangerous planets can't be landed on
  }

  generateResources() {
    // Base values
    this.resources = {
      minerals: Math.floor(this.randomGen() * 10) + 1,
      gases: Math.floor(this.randomGen() * 10) + 1,
      organics: Math.floor(this.randomGen() * 10) + 1,
      rareElements: Math.floor(this.randomGen() * 6) + 1 // Rare elements are rarer
    };
    
    // Adjust based on planet type
    switch (this.type) {
      case 'rocky':
      case 'barren':
        this.resources.minerals += 3;
        this.resources.gases -= 2;
        this.resources.organics -= 3;
        break;
      case 'terrestrial':
        this.resources.organics += 3;
        this.resources.minerals += 1;
        break;
      case 'oceanic':
        this.resources.organics += 4;
        this.resources.minerals -= 2;
        this.resources.gases += 2;
        break;
      case 'gas giant':
        this.resources.gases += 5;
        this.resources.minerals -= 5;
        this.resources.rareElements += 2;
        break;
      case 'ice':
        this.resources.gases += 3;
        this.resources.minerals += 1;
        break;
      case 'desert':
        this.resources.minerals += 2;
        this.resources.organics -= 2;
        break;
      case 'lava':
        this.resources.minerals += 4;
        this.resources.rareElements += 3;
        this.resources.organics = 0;
        break;
    }
    
    // Clamp values
    this.resources.minerals = Math.max(0, Math.min(10, this.resources.minerals));
    this.resources.gases = Math.max(0, Math.min(10, this.resources.gases));
    this.resources.organics = Math.max(0, Math.min(10, this.resources.organics));
    this.resources.rareElements = Math.max(0, Math.min(10, this.resources.rareElements));
  }

  update(deltaTime) {
    // Update orbit position
    const orbitSpeed = 2 * Math.PI / (this.orbitalPeriod * 24); // Convert days to hours for consistent time scale
    this.orbitAngle += orbitSpeed * deltaTime;
    
    // Keep angle between 0-2π
    if (this.orbitAngle >= Math.PI * 2) {
      this.orbitAngle -= Math.PI * 2;
    }
    
    // Update mesh position if it exists
    if (this.mesh) {
      const x = Math.cos(this.orbitAngle) * this.orbitalDistance;
      const z = Math.sin(this.orbitAngle) * this.orbitalDistance;
      const y = Math.sin(this.orbitAngle) * Math.sin(this.orbitIncline) * this.orbitalDistance;
      
      this.mesh.position.set(x, y, z);
      
      // Rotate planet
      const rotationSpeed = 2 * Math.PI / this.rotationPeriod;
      this.mesh.rotation.y += rotationSpeed * deltaTime;
    }
  }

  createPlanetMesh() {
    if (this.mesh) return this.mesh;
    
    // Create planet geometry
    const planetGeometry = new THREE.SphereGeometry(this.size, 32, 32);
    
    // Determine planet color and texture based on type
    let planetColor;
    switch (this.type) {
      case 'rocky':
      case 'barren':
        planetColor = new THREE.Color(0x996644);
        break;
      case 'terrestrial':
        planetColor = new THREE.Color(0x44aa55);
        break;
      case 'oceanic':
        planetColor = new THREE.Color(0x4466cc);
        break;
      case 'gas giant':
        planetColor = new THREE.Color(0xddbb66);
        break;
      case 'ice':
        planetColor = new THREE.Color(0xaaddee);
        break;
      case 'desert':
        planetColor = new THREE.Color(0xddcc66);
        break;
      case 'lava':
        planetColor = new THREE.Color(0xdd4422);
        break;
      default:
        planetColor = new THREE.Color(0xaaaaaa);
    }
    
    const planetMaterial = new THREE.MeshLambertMaterial({
      color: planetColor
    });
    
    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);
    
    // Set initial position
    const x = Math.cos(this.orbitAngle) * this.orbitalDistance;
    const z = Math.sin(this.orbitAngle) * this.orbitalDistance;
    const y = Math.sin(this.orbitAngle) * Math.sin(this.orbitIncline) * this.orbitalDistance;
    
    planetMesh.position.set(x, y, z);
    
    // Create orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    
    const orbitSegments = 64;
    for (let i = 0; i <= orbitSegments; i++) {
      const theta = (i / orbitSegments) * Math.PI * 2;
      const xOrbit = Math.cos(theta) * this.orbitalDistance;
      const zOrbit = Math.sin(theta) * this.orbitalDistance;
      const yOrbit = Math.sin(theta) * Math.sin(this.orbitIncline) * this.orbitalDistance;
      orbitPoints.push(xOrbit, yOrbit, zOrbit);
    }
    
    orbitGeometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(orbitPoints, 3)
    );
    
    const orbitMaterial = new THREE.LineBasicMaterial({
      color: 0x666666,
      transparent: true,
      opacity: 0.3
    });
    
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    
    // Create planet group
    this.mesh = new THREE.Group();
    this.mesh.add(planetMesh);
    this.mesh.add(orbitLine);
    
    return this.mesh;
  }

  markExplored() {
    this.explored = true;
    return this;
  }

  addLandmark(landmark) {
    if (!landmark || !landmark.name) return false;
    
    this.landmarks.push(landmark);
    return true;
  }

  getResourceRichness() {
    return (
      this.resources.minerals +
      this.resources.gases +
      this.resources.organics +
      this.resources.rareElements * 2
    ) / 4; // Average on a scale of 0-10
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      systemId: this.systemId,
      type: this.type,
      size: this.size,
      orbitalDistance: this.orbitalDistance,
      orbitalPeriod: this.orbitalPeriod,
      rotationPeriod: this.rotationPeriod,
      orbitAngle: this.orbitAngle,
      orbitIncline: this.orbitIncline,
      orbitIndex: this.orbitIndex,
      hasAtmosphere: this.hasAtmosphere,
      hasWater: this.hasWater,
      habitability: this.habitability,
      dangerLevel: this.dangerLevel,
      resources: { ...this.resources },
      explored: this.explored,
      canLand: this.canLand,
      landmarks: [...this.landmarks],
      seed: this.seed
    };
  }

  deserialize(data) {
    if (!data) return this;
    
    this.id = data.id || this.id;
    this.name = data.name || this.name;
    this.systemId = data.systemId || this.systemId;
    this.type = data.type || this.type;
    this.size = data.size || this.size;
    this.orbitalDistance = data.orbitalDistance || this.orbitalDistance;
    this.orbitalPeriod = data.orbitalPeriod || this.orbitalPeriod;
    this.rotationPeriod = data.rotationPeriod || this.rotationPeriod;
    this.orbitAngle = data.orbitAngle || this.orbitAngle;
    this.orbitIncline = data.orbitIncline || this.orbitIncline;
    this.orbitIndex = data.orbitIndex || this.orbitIndex;
    this.hasAtmosphere = data.hasAtmosphere || false;
    this.hasWater = data.hasWater || false;
    this.habitability = data.habitability || 0;
    this.dangerLevel = data.dangerLevel || 0;
    this.explored = data.explored || false;
    this.canLand = data.canLand || false;
    this.seed = data.seed || this.seed;
    
    if (data.resources) {
      this.resources = { ...this.resources, ...data.resources };
    }
    
    if (data.landmarks && Array.isArray(data.landmarks)) {
      this.landmarks = [...data.landmarks];
    }
    
    // Set up seeded random number generator
    this.randomGen = generateSeededRandom(this.seed);
    
    this.isInitialized = true;
    return this;
  }

  dispose() {
    if (this.mesh) {
      // Remove from parent if it has one
      if (this.mesh.parent) {
        this.mesh.parent.remove(this.mesh);
      }
      
      // Dispose of all child geometries and materials
      this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
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

export default Planet;
