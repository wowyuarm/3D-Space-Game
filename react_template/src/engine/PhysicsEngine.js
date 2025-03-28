// src/engine/PhysicsEngine.js
import * as THREE from 'three';

export class PhysicsEngine {
  constructor() {
    this.gravity = new THREE.Vector3(0, 0, 0); // No gravity in space by default
    this.objects = [];
    this.colliders = [];
    this.isInitialized = false;
    
    // Physics settings
    this.settings = {
      timeScale: 1.0,
      maxSteps: 5,
      fixedTimeStep: 1/60,
      spaceSize: 10000 // Max coordinate value
    };
  }
  
  initialize(settings = {}) {
    if (this.isInitialized) {
      console.warn('PhysicsEngine already initialized');
      return this;
    }
    
    console.log('Initializing PhysicsEngine...');
    
    // Apply custom settings
    Object.assign(this.settings, settings);
    
    this.isInitialized = true;
    return this;
  }
  
  update(deltaTime) {
    if (!this.isInitialized) return;
    
    const timeStep = Math.min(deltaTime, 0.1) * this.settings.timeScale;
    
    // Update physics objects
    for (const obj of this.objects) {
      if (!obj.isActive) continue;
      
      // Apply velocity to position
      if (obj.velocity) {
        obj.position.x += obj.velocity.x * timeStep;
        obj.position.y += obj.velocity.y * timeStep;
        obj.position.z += obj.velocity.z * timeStep;
        
        // Apply boundary constraints if enabled
        if (obj.boundaryConstrained) {
          this.applyBoundaryConstraints(obj);
        }
      }
      
      // Apply angular velocity to rotation
      if (obj.angularVelocity) {
        obj.rotation.x += obj.angularVelocity.x * timeStep;
        obj.rotation.y += obj.angularVelocity.y * timeStep;
        obj.rotation.z += obj.angularVelocity.z * timeStep;
      }
      
      // Apply forces
      if (obj.forces && obj.forces.length > 0 && obj.mass > 0) {
        const acceleration = new THREE.Vector3();
        
        for (const force of obj.forces) {
          acceleration.add(force.clone().multiplyScalar(1 / obj.mass));
        }
        
        obj.velocity.add(acceleration.multiplyScalar(timeStep));
        
        // Clear forces for next frame
        obj.forces = [];
      }
      
      // Apply drag if specified
      if (obj.drag > 0 && obj.velocity) {
        const dragForce = 1.0 - Math.min(obj.drag * timeStep, 0.99);
        obj.velocity.multiplyScalar(dragForce);
      }
    }
    
    // Check for collisions if we have colliders
    if (this.colliders.length > 0) {
      this.checkCollisions();
    }
  }
  
  addPhysicsObject(object) {
    if (!object) return;
    
    // Ensure object has required physics properties
    if (!object.velocity) {
      object.velocity = new THREE.Vector3();
    }
    
    if (!object.angularVelocity) {
      object.angularVelocity = new THREE.Vector3();
    }
    
    if (!object.forces) {
      object.forces = [];
    }
    
    // Add default physics properties if not present
    if (typeof object.mass !== 'number') {
      object.mass = 1.0;
    }
    
    if (typeof object.drag !== 'number') {
      object.drag = 0.01;
    }
    
    object.isActive = true;
    object.collider = object.collider || null;
    object.boundaryConstrained = object.boundaryConstrained || false;
    
    this.objects.push(object);
    
    // Add to colliders if it has a collider component
    if (object.collider) {
      this.colliders.push(object);
    }
    
    return object;
  }
  
  removePhysicsObject(object) {
    // Remove from physics objects
    const index = this.objects.indexOf(object);
    if (index !== -1) {
      this.objects.splice(index, 1);
    }
    
    // Remove from colliders
    const colliderIndex = this.colliders.indexOf(object);
    if (colliderIndex !== -1) {
      this.colliders.splice(colliderIndex, 1);
    }
  }
  
  applyForce(object, force) {
    if (!object || !object.forces) return;
    
    object.forces.push(force);
  }
  
  applyImpulse(object, impulse) {
    if (!object || !object.velocity || object.mass <= 0) return;
    
    // F = m * a, impulse = change in momentum = m * Δv
    const deltaVelocity = impulse.clone().divideScalar(object.mass);
    object.velocity.add(deltaVelocity);
  }
  
  checkCollisions() {
    for (let i = 0; i < this.colliders.length; i++) {
      const objA = this.colliders[i];
      if (!objA.isActive || !objA.collider) continue;
      
      for (let j = i + 1; j < this.colliders.length; j++) {
        const objB = this.colliders[j];
        if (!objB.isActive || !objB.collider) continue;
        
        // Check collision based on collider type
        const collision = this.testCollision(objA, objB);
        
        if (collision) {
          // Handle collision (call collision handlers on both objects)
          if (objA.onCollision) {
            objA.onCollision(objB, collision);
          }
          
          if (objB.onCollision) {
            objB.onCollision(objA, collision);
          }
          
          // Basic collision response
          this.resolveCollision(objA, objB, collision);
        }
      }
    }
  }
  
  testCollision(objA, objB) {
    // Basic sphere-sphere collision test
    if (objA.collider.type === 'sphere' && objB.collider.type === 'sphere') {
      const distance = objA.position.distanceTo(objB.position);
      const minDistance = objA.collider.radius + objB.collider.radius;
      
      if (distance < minDistance) {
        return {
          distance,
          overlap: minDistance - distance,
          direction: new THREE.Vector3().subVectors(objB.position, objA.position).normalize(),
          type: 'sphere-sphere'
        };
      }
    }
    
    return null;
  }
  
  resolveCollision(objA, objB, collision) {
    // Simple elastic collision response
    if (objA.mass <= 0 || objB.mass <= 0) return;
    
    // Calculate relative velocity
    const relativeVelocity = new THREE.Vector3().subVectors(
      objB.velocity,
      objA.velocity
    );
    
    // Check if objects are moving apart
    const normalVelocity = relativeVelocity.dot(collision.direction);
    if (normalVelocity > 0) return;
    
    // Calculate elasticity/bounciness (average of the two objects)
    const elasticity = ((objA.elasticity || 0.6) + (objB.elasticity || 0.6)) * 0.5;
    
    // Calculate impulse scalar
    const impulseMagnitude = -(1 + elasticity) * normalVelocity / 
                            (1/objA.mass + 1/objB.mass);
    
    // Apply impulses
    const impulse = collision.direction.clone().multiplyScalar(impulseMagnitude);
    
    objA.velocity.sub(impulse.clone().multiplyScalar(1 / objA.mass));
    objB.velocity.add(impulse.clone().multiplyScalar(1 / objB.mass));
    
    // Prevent objects from staying inside each other
    const totalMass = objA.mass + objB.mass;
    const correctionPercent = 0.2; // Penetration correction factor
    
    const correction = collision.direction.clone()
      .multiplyScalar(collision.overlap * correctionPercent);
    
    objA.position.sub(correction.clone().multiplyScalar(objB.mass / totalMass));
    objB.position.add(correction.clone().multiplyScalar(objA.mass / totalMass));
  }
  
  applyBoundaryConstraints(obj) {
    const spaceSize = this.settings.spaceSize;
    
    // Apply boundary constraints to prevent objects from leaving the space
    if (obj.position.x > spaceSize) obj.position.x = spaceSize;
    if (obj.position.x < -spaceSize) obj.position.x = -spaceSize;
    if (obj.position.y > spaceSize) obj.position.y = spaceSize;
    if (obj.position.y < -spaceSize) obj.position.y = -spaceSize;
    if (obj.position.z > spaceSize) obj.position.z = spaceSize;
    if (obj.position.z < -spaceSize) obj.position.z = -spaceSize;
  }
  
  setGravity(x, y, z) {
    this.gravity.set(x, y, z);
    return this;
  }
  
  getGravity() {
    return this.gravity.clone();
  }
  
  dispose() {
    if (!this.isInitialized) return;
    
    this.objects = [];
    this.colliders = [];
    this.isInitialized = false;
    
    return this;
  }
}