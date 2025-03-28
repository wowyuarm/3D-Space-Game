// src/engine/PhysicsSystem.js
import * as THREE from 'three';

/**
 * 物理系统，负责处理游戏中的物理计算，包括碰撞检测、力的作用等
 */
export class PhysicsSystem {
  constructor() {
    this.gravity = new THREE.Vector3(0, 0, 0); // 通常太空中没有重力
    this.objects = new Map(); // 物理对象映射表
    this.colliders = []; // 碰撞体列表
    this.simulationSpeed = 1.0; // 物理模拟速度倍率
    this.maxStepSize = 1/60; // 最大时间步长，防止不稳定
    this.timeAccumulator = 0; // 时间累加器，用于固定步长物理更新
    this.isInitialized = false;
  }
  
  /**
   * 初始化物理系统
   * @returns {PhysicsSystem} this
   */
  init() {
    if (this.isInitialized) {
      console.warn('PhysicsSystem already initialized');
      return this;
    }
    
    console.log('Initializing PhysicsSystem...');
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 添加物理对象到系统
   * @param {string} id 对象ID
   * @param {Object} object 物理对象
   * @returns {boolean} 是否成功添加
   */
  addObject(id, object) {
    if (!id || !object) {
      console.warn('Invalid object or ID provided to PhysicsSystem');
      return false;
    }
    
    try {
      // 检查对象是否已存在
      if (this.objects.has(id)) {
        console.warn(`Object with ID ${id} already exists in PhysicsSystem`);
        return false;
      }
      
      // 设置默认的物理属性
      if (!object.velocity) object.velocity = new THREE.Vector3();
      if (!object.acceleration) object.acceleration = new THREE.Vector3();
      if (!object.forces) object.forces = [];
      if (!object.mass) object.mass = 1;
      if (!object.drag) object.drag = 0.01;
      if (object.position === undefined) {
        object.position = new THREE.Vector3();
        console.warn(`Object ${id} has no position, defaulting to origin`);
      }
      
      // 添加到对象集合
      this.objects.set(id, object);
      
      // 如果有碰撞器，添加到碰撞列表
      if (object.collider) {
        this.addCollider(id, object);
      }
      
      return true;
    } catch (error) {
      console.error(`Error adding physics object: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 从系统中移除物理对象
   * @param {string} id 对象ID
   * @returns {boolean} 是否成功移除
   */
  removeObject(id) {
    if (!id || !this.objects.has(id)) {
      return false;
    }
    
    try {
      // 移除碰撞器
      this.removeCollider(id);
      
      // 移除物理对象
      this.objects.delete(id);
      
      return true;
    } catch (error) {
      console.error(`Error removing physics object: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 添加碰撞器
   * @param {string} id 对象ID
   * @param {Object} object 物理对象
   */
  addCollider(id, object) {
    // 简单实现，仅添加到碰撞器列表
    this.colliders.push({
      id,
      object,
      type: object.collider.type || 'sphere',
      radius: object.collider.radius || 1,
      position: object.position,
      lastPosition: object.position.clone()
    });
  }
  
  /**
   * 移除碰撞器
   * @param {string} id 对象ID
   */
  removeCollider(id) {
    const index = this.colliders.findIndex(c => c.id === id);
    if (index !== -1) {
      this.colliders.splice(index, 1);
    }
  }
  
  /**
   * 应用力到物理对象
   * @param {string} id 对象ID
   * @param {THREE.Vector3} force 力向量
   * @param {number} duration 力的持续时间（秒），0表示瞬时力
   */
  applyForce(id, force, duration = 0) {
    const object = this.objects.get(id);
    if (!object) return;
    
    try {
      if (duration <= 0) {
        // 瞬时力，直接修改加速度
        const acceleration = force.clone().divideScalar(object.mass);
        object.acceleration.add(acceleration);
      } else {
        // 持续力，添加到力列表
        object.forces.push({
          vector: force.clone(),
          duration,
          remaining: duration
        });
      }
    } catch (error) {
      console.error(`Error applying force: ${error.message}`);
    }
  }
  
  /**
   * 更新物理模拟
   * @param {number} deltaTime 时间增量
   */
  update(deltaTime) {
    if (!this.isInitialized) return;
    
    try {
      // 限制时间步长，防止不稳定
      const dt = Math.min(deltaTime, this.maxStepSize) * this.simulationSpeed;
      
      // 更新所有物理对象
      this.objects.forEach((object, id) => {
        if (!object) return;
        
        // 保存上一帧位置
        if (object.lastPosition) {
          object.lastPosition.copy(object.position);
        } else {
          object.lastPosition = object.position.clone();
        }
        
        // 计算持续力的合力
        const totalForce = new THREE.Vector3();
        
        // 更新持续力
        if (object.forces && object.forces.length > 0) {
          for (let i = object.forces.length - 1; i >= 0; i--) {
            const force = object.forces[i];
            
            // 累加力
            totalForce.add(force.vector);
            
            // 更新剩余时间
            force.remaining -= dt;
            
            // 移除过期的力
            if (force.remaining <= 0) {
              object.forces.splice(i, 1);
            }
          }
        }
        
        // 计算合加速度
        const acceleration = totalForce.clone().divideScalar(object.mass);
        
        // 添加已有加速度
        acceleration.add(object.acceleration);
        
        // 添加全局重力
        acceleration.add(this.gravity);
        
        // 更新速度 (v = v0 + a*t)
        object.velocity.add(acceleration.clone().multiplyScalar(dt));
        
        // 应用阻力
        if (object.drag > 0) {
          const dragForce = object.velocity.clone().multiplyScalar(-object.drag);
          object.velocity.add(dragForce);
        }
        
        // 更新位置 (p = p0 + v*t)
        if (object.velocity.lengthSq() > 0) {
          const displacement = object.velocity.clone().multiplyScalar(dt);
          object.position.add(displacement);
        }
        
        // 重置瞬时加速度
        object.acceleration.set(0, 0, 0);
      });
      
      // 检测碰撞
      this.detectCollisions();
      
    } catch (error) {
      console.error(`Error in physics update: ${error.message}`);
    }
  }
  
  /**
   * 检测碰撞
   */
  detectCollisions() {
    if (this.colliders.length < 2) return;
    
    try {
      // 简单的O(n²)碰撞检测
      for (let i = 0; i < this.colliders.length; i++) {
        const colliderA = this.colliders[i];
        
        for (let j = i + 1; j < this.colliders.length; j++) {
          const colliderB = this.colliders[j];
          
          // 检查是否碰撞
          if (this.checkCollision(colliderA, colliderB)) {
            this.resolveCollision(colliderA, colliderB);
          }
        }
      }
    } catch (error) {
      console.error(`Error detecting collisions: ${error.message}`);
    }
  }
  
  /**
   * 检查两个碰撞体是否碰撞
   * @param {Object} colliderA 碰撞体A
   * @param {Object} colliderB 碰撞体B
   * @returns {boolean} 是否碰撞
   */
  checkCollision(colliderA, colliderB) {
    // 简单的球-球碰撞检测
    const distance = colliderA.position.distanceTo(colliderB.position);
    const minDistance = colliderA.radius + colliderB.radius;
    
    return distance < minDistance;
  }
  
  /**
   * 解决碰撞
   * @param {Object} colliderA 碰撞体A
   * @param {Object} colliderB 碰撞体B
   */
  resolveCollision(colliderA, colliderB) {
    const objectA = this.objects.get(colliderA.id);
    const objectB = this.objects.get(colliderB.id);
    
    if (!objectA || !objectB) return;
    
    try {
      // 计算碰撞法线
      const normal = new THREE.Vector3()
        .subVectors(colliderB.position, colliderA.position)
        .normalize();
      
      // 计算相对速度
      const relativeVelocity = new THREE.Vector3()
        .subVectors(objectB.velocity, objectA.velocity);
      
      // 计算相对速度在碰撞法线上的投影
      const velocityAlongNormal = relativeVelocity.dot(normal);
      
      // 如果物体正在分离，不需要解决碰撞
      if (velocityAlongNormal > 0) return;
      
      // 计算弹性系数 (取两个物体弹性系数的平均值)
      const restitution = ((objectA.restitution || 0.5) + (objectB.restitution || 0.5)) / 2;
      
      // 计算冲量
      let j = -(1 + restitution) * velocityAlongNormal;
      j /= (1 / objectA.mass) + (1 / objectB.mass);
      
      // 应用冲量
      const impulse = normal.clone().multiplyScalar(j);
      objectA.velocity.sub(impulse.clone().divideScalar(objectA.mass));
      objectB.velocity.add(impulse.clone().divideScalar(objectB.mass));
      
      // 分离物体，避免持续碰撞
      const overlap = (colliderA.radius + colliderB.radius) - colliderA.position.distanceTo(colliderB.position);
      if (overlap > 0) {
        const separation = normal.clone().multiplyScalar(overlap / 2);
        objectA.position.sub(separation);
        objectB.position.add(separation);
      }
      
      // 触发碰撞回调
      if (objectA.onCollision) {
        objectA.onCollision(objectB);
      }
      
      if (objectB.onCollision) {
        objectB.onCollision(objectA);
      }
    } catch (error) {
      console.error(`Error resolving collision: ${error.message}`);
    }
  }
}