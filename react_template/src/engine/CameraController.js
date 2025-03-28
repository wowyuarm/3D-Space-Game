import * as THREE from 'three';

/**
 * 相机控制器，负责相机的跟随、平滑移动和视角切换
 */
export class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.target = null;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Quaternion();
    this.offset = new THREE.Vector3(0, 5, -15); // 默认跟随偏移
    this.lookAtOffset = new THREE.Vector3(0, 0, 10); // 默认看向的偏移
    this.damping = 0.05; // 阻尼系数，控制相机跟随平滑度
    this.rotationDamping = 0.1; // 旋转阻尼系数
    this.currentMode = 'follow'; // 'follow', 'firstPerson', 'orbit'
    this.minDistance = 5;
    this.maxDistance = 50;
    this.isInitialized = false;
    
    // 轨道查看的参数
    this.orbitRadius = 20;
    this.orbitSpeed = 0.01;
    this.orbitAngle = 0;
    this.orbitHeight = 5;
    
    // 抖动效果
    this.shakeEnabled = false;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.shakeTimer = 0;
    this.shakeDecay = 1; // 每秒衰减的幅度百分比
  }
  
  /**
   * 初始化相机控制器
   * @returns {CameraController} this
   */
  init() {
    if (this.isInitialized) {
      console.warn('CameraController already initialized');
      return this;
    }
    
    console.log('Initializing CameraController...');
    
    if (!this.camera) {
      console.error('Camera is required for CameraController');
      return this;
    }
    
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 设置跟随目标
   * @param {THREE.Object3D} target 目标对象
   */
  setTarget(target) {
    this.target = target;
    
    // 如果目标有userData.isPlanet，我们自动调整为更远的视角
    if (target && target.userData && target.userData.isPlanet) {
      const planetSize = target.userData.radius || 1;
      this.offset.set(0, planetSize * 2, -planetSize * 5);
      this.lookAtOffset.set(0, 0, 0);
    }
  }
  
  /**
   * 设置相机位置偏移
   * @param {THREE.Vector3} offset 相对于目标的偏移向量
   */
  setOffset(offset) {
    this.offset.copy(offset);
  }
  
  /**
   * 设置相机看向的点的偏移
   * @param {THREE.Vector3} offset 看向点相对于目标的偏移向量
   */
  setLookAtOffset(offset) {
    this.lookAtOffset.copy(offset);
  }
  
  /**
   * 切换相机模式
   * @param {string} mode 模式名称：'follow', 'firstPerson', 'orbit'
   */
  setMode(mode) {
    if (mode === this.currentMode) return;
    
    this.currentMode = mode;
    
    switch (mode) {
      case 'follow':
        this.offset.set(0, 5, -15);
        this.lookAtOffset.set(0, 0, 10);
        break;
        
      case 'firstPerson':
        this.offset.set(0, 2, 5);
        this.lookAtOffset.set(0, 2, 20);
        break;
        
      case 'orbit':
        this.orbitAngle = 0;
        this.updateOrbitPosition();
        break;
        
      default:
        console.warn(`Unknown camera mode: ${mode}`);
        this.currentMode = 'follow';
        break;
    }
  }
  
  /**
   * 更新轨道视角位置
   */
  updateOrbitPosition() {
    if (!this.target) return;
    
    // 计算轨道位置
    const x = Math.cos(this.orbitAngle) * this.orbitRadius;
    const z = Math.sin(this.orbitAngle) * this.orbitRadius;
    
    this.offset.set(x, this.orbitHeight, z);
    this.lookAtOffset.set(0, 0, 0);
  }
  
  /**
   * 相机抖动效果，用于冲击、爆炸等
   * @param {number} intensity 抖动强度
   * @param {number} duration 持续时间（秒）
   */
  shake(intensity, duration) {
    this.shakeEnabled = true;
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTimer = 0;
  }
  
  /**
   * 应用相机抖动效果
   * @param {number} deltaTime 时间增量
   */
  applyShake(deltaTime) {
    if (!this.shakeEnabled || this.shakeIntensity <= 0) return;
    
    this.shakeTimer += deltaTime;
    
    if (this.shakeTimer >= this.shakeDuration) {
      this.shakeEnabled = false;
      return;
    }
    
    // 计算剩余强度（随时间衰减）
    const remainingIntensity = this.shakeIntensity * 
      (1 - (this.shakeTimer / this.shakeDuration));
    
    // 应用随机抖动
    const shakeOffsetX = (Math.random() * 2 - 1) * remainingIntensity;
    const shakeOffsetY = (Math.random() * 2 - 1) * remainingIntensity;
    const shakeOffsetZ = (Math.random() * 2 - 1) * remainingIntensity * 0.5;
    
    this.camera.position.x += shakeOffsetX;
    this.camera.position.y += shakeOffsetY;
    this.camera.position.z += shakeOffsetZ;
  }
  
  /**
   * 更新相机位置和朝向
   * @param {number} deltaTime 时间增量
   */
  update(deltaTime) {
    if (!this.camera || !this.isInitialized) return;
    
    try {
      // 如果没有目标，不更新相机位置
      if (!this.target) return;
      
      // 获取目标位置和朝向
      this.targetPosition.setFromMatrixPosition(this.target.matrixWorld);
      
      if (this.target.quaternion) {
        this.targetRotation.copy(this.target.quaternion);
      }
      
      // 根据不同模式更新相机
      switch (this.currentMode) {
        case 'follow':
          this.updateFollowCamera(deltaTime);
          break;
          
        case 'firstPerson':
          this.updateFirstPersonCamera(deltaTime);
          break;
          
        case 'orbit':
          this.updateOrbitCamera(deltaTime);
          break;
      }
      
      // 应用相机抖动
      this.applyShake(deltaTime);
      
    } catch (error) {
      console.error(`Error in camera controller update: ${error.message}`);
    }
  }
  
  /**
   * 更新跟随模式相机
   * @param {number} deltaTime 时间增量
   */
  updateFollowCamera(deltaTime) {
    // 计算目标的全局变换
    const targetMatrix = new THREE.Matrix4();
    targetMatrix.makeRotationFromQuaternion(this.targetRotation);
    targetMatrix.setPosition(this.targetPosition);
    
    // 根据目标的朝向计算相机位置
    const offsetInWorldSpace = this.offset.clone().applyMatrix4(targetMatrix);
    
    // 使用阻尼平滑相机移动
    const currentPosition = this.camera.position.clone();
    const targetCameraPosition = offsetInWorldSpace;
    
    // 计算相机新位置
    const newPosition = currentPosition.lerp(targetCameraPosition, this.damping);
    this.camera.position.copy(newPosition);
    
    // 计算相机看向的点
    const lookAtPosition = this.targetPosition.clone().add(
      this.lookAtOffset.clone().applyQuaternion(this.targetRotation)
    );
    
    this.camera.lookAt(lookAtPosition);
  }
  
  /**
   * 更新第一人称模式相机
   * @param {number} deltaTime 时间增量
   */
  updateFirstPersonCamera(deltaTime) {
    // 计算目标的全局变换
    const targetMatrix = new THREE.Matrix4();
    targetMatrix.makeRotationFromQuaternion(this.targetRotation);
    targetMatrix.setPosition(this.targetPosition);
    
    // 根据目标的朝向计算相机位置
    const offsetInWorldSpace = this.offset.clone().applyMatrix4(targetMatrix);
    
    // 直接设置相机位置
    this.camera.position.copy(offsetInWorldSpace);
    
    // 计算相机看向的点
    const lookAtPosition = this.targetPosition.clone().add(
      this.lookAtOffset.clone().applyQuaternion(this.targetRotation)
    );
    
    this.camera.lookAt(lookAtPosition);
  }
  
  /**
   * 更新轨道模式相机
   * @param {number} deltaTime 时间增量
   */
  updateOrbitCamera(deltaTime) {
    // 更新轨道角度
    this.orbitAngle += this.orbitSpeed;
    if (this.orbitAngle > Math.PI * 2) {
      this.orbitAngle -= Math.PI * 2;
    }
    
    // 更新轨道位置
    this.updateOrbitPosition();
    
    // 计算相机位置
    const cameraPosition = this.targetPosition.clone().add(this.offset);
    
    // 使用阻尼平滑相机移动
    const currentPosition = this.camera.position.clone();
    const newPosition = currentPosition.lerp(cameraPosition, this.damping);
    this.camera.position.copy(newPosition);
    
    // 相机始终看向目标
    this.camera.lookAt(this.targetPosition);
  }
  
  /**
   * 设置缩放级别（只在轨道模式下有效）
   * @param {number} zoomLevel 缩放级别，1为最近，0为最远
   */
  setZoom(zoomLevel) {
    // 规范化缩放级别
    zoomLevel = Math.max(0, Math.min(1, zoomLevel));
    
    // 计算新的轨道半径
    this.orbitRadius = this.maxDistance - (this.maxDistance - this.minDistance) * zoomLevel;
    
    // 如果在轨道模式下，立即更新位置
    if (this.currentMode === 'orbit') {
      this.updateOrbitPosition();
    }
  }
  
  /**
   * 调整轨道观察的高度
   * @param {number} heightOffset 高度偏移
   */
  adjustOrbitHeight(heightOffset) {
    this.orbitHeight += heightOffset;
    this.orbitHeight = Math.max(-this.orbitRadius, Math.min(this.orbitRadius, this.orbitHeight));
    
    if (this.currentMode === 'orbit') {
      this.updateOrbitPosition();
    }
  }
} 