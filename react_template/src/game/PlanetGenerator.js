// src/game/PlanetGenerator.js
import * as THREE from 'three';

/**
 * 行星生成器 - 负责生成丰富多样的行星环境
 */
export class PlanetGenerator {
  constructor() {
    // 定义不同类型行星的属性
    this.planetTypes = {
      rocky: {
        colors: [0x8b5a2b, 0xa0522d, 0xcd853f, 0xd2691e, 0xbc8f8f, 0xf4a460, 0xdaa520, 0xb8860b],
        maxSize: 8,
        roughness: 0.8,
        atmosphereDensity: 0.2,
        resources: ['iron', 'titanium', 'silicon', 'carbon', 'tungsten']
      },
      icy: {
        colors: [0xe0ffff, 0xafeeee, 0xb0e0e6, 0xadd8e6, 0x87ceeb, 0xb0c4de, 0xbfefff, 0xcae1ff],
        maxSize: 7,
        roughness: 0.3,
        atmosphereDensity: 0.3,
        resources: ['water', 'methane', 'nitrogen', 'hydrogen', 'oxygen']
      },
      gas: {
        colors: [0xe3cf57, 0xffa500, 0xff8c00, 0x4682b4, 0x1e90ff, 0x6495ed, 0xffd700, 0x7b68ee],
        maxSize: 12,
        roughness: 0.1,
        atmosphereDensity: 0.9,
        resources: ['hydrogen', 'helium', 'ammonia', 'methane']
      },
      lava: {
        colors: [0x8b0000, 0xff0000, 0xff4500, 0xff6347, 0xcd5c5c, 0xdc143c, 0xb22222, 0xa52a2a],
        maxSize: 6,
        roughness: 0.7,
        atmosphereDensity: 0.4,
        resources: ['sulfur', 'iron', 'platinum', 'tungsten']
      },
      desert: {
        colors: [0xf5deb3, 0xdeb887, 0xd2b48c, 0xf0e68c, 0xeee8aa, 0xfafad2, 0xf5f5dc, 0xffebcd],
        maxSize: 9,
        roughness: 0.6,
        atmosphereDensity: 0.1,
        resources: ['silica', 'titanium', 'gold', 'copper']
      },
      organic: {
        colors: [0x006400, 0x228b22, 0x32cd32, 0x3cb371, 0x2e8b57, 0x808000, 0x6b8e23, 0x556b2f],
        maxSize: 10,
        roughness: 0.5,
        atmosphereDensity: 0.7,
        resources: ['oxygen', 'carbon', 'nitrogen', 'water']
      },
      // 添加新的行星类型
      oceanic: {
        colors: [0x000080, 0x0000cd, 0x0000ff, 0x1e90ff, 0x00bfff, 0x87ceeb, 0x87cefa, 0x4169e1],
        maxSize: 9,
        roughness: 0.3,
        atmosphereDensity: 0.8,
        resources: ['water', 'oxygen', 'hydrogen', 'nitrogen', 'rare_crystals']
      },
      volcanic: {
        colors: [0x800000, 0x8b0000, 0xa52a2a, 0xb22222, 0xcd5c5c, 0xdc143c, 0xff0000, 0xc71585],
        maxSize: 7,
        roughness: 0.9,
        atmosphereDensity: 0.6,
        resources: ['sulfur', 'iron', 'platinum', 'tungsten', 'uranium']
      },
      crystal: {
        colors: [0x9932cc, 0xba55d3, 0xda70d6, 0xee82ee, 0xdda0dd, 0xe6e6fa, 0xd8bfd8, 0xffe4e1],
        maxSize: 6,
        roughness: 0.2,
        atmosphereDensity: 0.4,
        resources: ['diamonds', 'rare_crystals', 'quantum_particles', 'silica']
      },
      toxic: {
        colors: [0x9acd32, 0x6b8e23, 0x556b2f, 0x808000, 0x6a5acd, 0x7b68ee, 0x9370db, 0x8a2be2],
        maxSize: 8,
        roughness: 0.6,
        atmosphereDensity: 0.7,
        resources: ['methane', 'ammonia', 'sulfur', 'exotic_compounds']
      }
    };
    
    // 定义资源类型及其价值
    this.resourceTypes = {
      iron: 3,
      gold: 8,
      titanium: 6,
      silicon: 4,
      carbon: 3,
      water: 5,
      methane: 4,
      nitrogen: 3,
      hydrogen: 2,
      helium: 7,
      ammonia: 5,
      sulfur: 3,
      platinum: 9,
      tungsten: 8,
      silica: 2,
      gold: 10,
      copper: 4,
      oxygen: 6,
      // 添加更多资源类型
      uranium: 12,
      diamonds: 15,
      rare_crystals: 14,
      exotic_compounds: 18,
      alien_artifacts: 20,
      quantum_particles: 25
    };
    
    // 定义行星后处理材质
    this.shaderMaterials = {};
  }
  
  /**
   * 生成一个随机行星
   * @param {Object} options - 生成选项
   * @param {String} options.type - 行星类型，未指定则随机选择
   * @param {Number} options.size - 行星大小，未指定则基于类型随机生成
   * @param {THREE.Vector3} options.position - 行星位置，未指定则随机生成
   * @returns {Object} 行星对象
   */
  generatePlanet(options = {}) {
    // 确定行星类型
    const type = options.type || this.getRandomPlanetType();
    const planetType = this.planetTypes[type];
    
    // 确定行星大小
    const size = options.size || this.getRandomSize(type);
    
    // 确定行星位置
    const position = options.position || this.getRandomPosition();
    
    // 创建行星几何体 - 增加复杂度
    const detail = Math.max(2, Math.floor(size / 3)); // 基于大小增加细节级别
    const geometry = new THREE.SphereGeometry(size, 32 + detail * 8, 32 + detail * 8);
    
    // 创建行星材质
    const material = this.createPlanetMaterial(type);
    
    // 创建行星网格
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(position);
    
    // 添加大气层效果 - 更加多样化的大气层
    if (Math.random() < planetType.atmosphereDensity) {
      const atmosphere = this.createAtmosphere(size, type);
      planet.add(atmosphere);
    }
    
    // 添加云层效果 - 适用于更多类型的行星
    if ((type === 'organic' || type === 'oceanic' || (type === 'gas' && Math.random() > 0.5) || 
        (type === 'toxic' && Math.random() > 0.7))) {
      const clouds = this.createClouds(size * 1.02, type);
      planet.add(clouds);
    }
    
    // 创建行星环 - 增加出现概率和多样性
    if ((type === 'gas' && Math.random() < 0.7) || 
        (type === 'icy' && Math.random() < 0.4) || 
        (type === 'crystal' && Math.random() < 0.5)) {
      const rings = this.createPlanetaryRings(size, type);
      planet.add(rings);
    }
    
    // 添加表面特征 - 为某些行星类型添加独特特征
    this.addSurfaceFeatures(planet, type, size);
    
    // 为行星添加随机旋转
    planet.rotation.x = Math.random() * Math.PI;
    planet.rotation.y = Math.random() * Math.PI;
    planet.rotation.z = Math.random() * Math.PI * 0.1; // 减小z轴旋转，让行星看起来更自然
    
    // 添加行星元数据
    const name = this.generatePlanetName();
    planet.name = name;
    
    planet.userData = {
      type: type,
      size: size,
      name: name,
      resources: this.generatePlanetResources(type),
      description: this.generatePlanetDescription(type),
      orbitSpeed: 0.001 + Math.random() * 0.002, // 轨道速度
      rotationSpeed: 0.003 + Math.random() * 0.005, // 自转速度
      inhabited: (type === 'organic' || type === 'oceanic') && Math.random() < 0.3, // 有机和水生行星有30%几率有生命
      habitable: this.calculateHabitability(type, size), // 计算宜居性
      canLand: this.canLandOnPlanet(type) // 确定是否可以着陆
    };
    
    return planet;
  }
  
  /**
   * 创建行星材质
   * @param {String} type - 行星类型
   * @returns {THREE.Material} 行星材质
   */
  createPlanetMaterial(type) {
    const planetType = this.planetTypes[type];
    const baseColor = planetType.colors[Math.floor(Math.random() * planetType.colors.length)];
    
    // 创建更高级的材质
    const material = new THREE.MeshPhysicalMaterial({
      color: baseColor,
      roughness: planetType.roughness,
      metalness: type === 'rocky' || type === 'lava' || type === 'crystal' ? 0.5 : 0.1,
      flatShading: type === 'rocky' || type === 'desert' || type === 'volcanic',
      clearcoat: type === 'oceanic' || type === 'icy' || type === 'crystal' ? 0.5 : 0,
      clearcoatRoughness: 0.3,
      reflectivity: type === 'crystal' ? 0.8 : 0.2
    });
    
    // 针对不同类型行星创建特定纹理
    switch(type) {
      case 'rocky':
      case 'desert':
        // 添加凹凸纹理
        const bumpTexture = this.generateNoiseTexture(512, 0.7);
        material.bumpMap = bumpTexture;
        material.bumpScale = 0.5;
        break;
        
      case 'icy':
        // 添加反光效果
        material.specular = new THREE.Color(0xffffff);
        material.shininess = 100;
        material.envMapIntensity = 0.8;
        break;
        
      case 'gas':
        // 气态行星使用有条纹的纹理
        const stripeTexture = this.generateGasGiantTexture(1024);
        material.map = stripeTexture;
        material.opacity = 0.9;
        material.transparent = true;
        break;
        
      case 'lava':
      case 'volcanic':
        // 熔岩行星使用发光纹理
        material.emissive = new THREE.Color(type === 'lava' ? 0xff2200 : 0xdd0000);
        material.emissiveIntensity = 0.5;
        
        const glowTexture = this.generateLavaTexture(512);
        material.emissiveMap = glowTexture;
        break;
        
      case 'organic':
      case 'oceanic':
        // 有机行星(类地行星)添加地表纹理
        const landTexture = this.generateLandTexture(1024);
        material.map = landTexture;
        break;
        
      case 'crystal':
        // 水晶行星特效
        material.transmission = 0.3; // 半透明
        material.metalness = 0.7;
        material.roughness = 0.1;
        material.clearcoat = 0.8;
        break;
        
      case 'toxic':
        // 有毒行星效果
        const toxicTexture = this.generateToxicTexture(512);
        material.map = toxicTexture;
        material.emissive = new THREE.Color(0x448844);
        material.emissiveIntensity = 0.2;
        break;
    }
    
    return material;
  }
  
  /**
   * 生成一个随机行星类型
   * @returns {String} 行星类型
   */
  getRandomPlanetType() {
    const planetTypes = Object.keys(this.planetTypes);
    return planetTypes[Math.floor(Math.random() * planetTypes.length)];
  }
  
  /**
   * 根据行星类型获取随机大小
   * @param {String} type - 行星类型
   * @returns {Number} 行星大小
   */
  getRandomSize(type) {
    const planetType = this.planetTypes[type];
    // 最小值为最大值的30%
    const minSize = planetType.maxSize * 0.3;
    return minSize + Math.random() * (planetType.maxSize - minSize);
  }
  
  /**
   * 获取随机位置
   * @returns {THREE.Vector3} 随机位置向量
   */
  getRandomPosition() {
    const radius = 500 + Math.random() * 1000; // 轨道半径在500-1500之间
    const theta = Math.random() * Math.PI * 2; // 水平角度
    const phi = Math.random() * Math.PI; // 垂直角度
    
    // 根据球坐标系转为笛卡尔坐标系
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);
    
    return new THREE.Vector3(x, y, z);
  }
  
  /**
   * 生成噪声纹理
   * @param {Number} size - 纹理尺寸
   * @param {Number} roughness - 粗糙度
   * @returns {THREE.Texture} 生成的纹理
   */
  generateNoiseTexture(size, roughness) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 生成噪声
    const imageData = context.createImageData(size, size);
    const data = imageData.data;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        
        // 简单噪声
        const noise = Math.random() * 255 * roughness;
        
        data[idx] = noise;
        data[idx + 1] = noise;
        data[idx + 2] = noise;
        data[idx + 3] = 255;
      }
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * 生成气态巨行星的条纹纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateGasGiantTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 生成彩色条纹
    const stripeCount = 10 + Math.floor(Math.random() * 20);
    const stripeHeight = size / stripeCount;
    
    // 选择基础颜色
    const baseHue = Math.random() * 360;
    
    for (let i = 0; i < stripeCount; i++) {
      // 为每个条纹生成稍微不同的颜色
      const hue = (baseHue + i * 10) % 360;
      const saturation = 50 + Math.random() * 50;
      const lightness = 40 + Math.random() * 20;
      
      context.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      context.fillRect(0, i * stripeHeight, size, stripeHeight);
    }
    
    // 添加一些旋涡和斑点
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 5 + Math.random() * 40;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fillStyle = `hsla(${baseHue}, 70%, 60%, 0.5)`;
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * 生成熔岩行星的发光纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateLavaTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 生成熔岩流纹理
    const imageData = context.createImageData(size, size);
    const data = imageData.data;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        
        // 简单柏林噪声模拟
        const scale = 0.01;
        const x = i * scale;
        const y = j * scale;
        
        // 简化的噪声计算
        const noise = Math.sin(x) * Math.sin(y) * 0.5 + 0.5;
        
        // 根据噪声值设置颜色
        const value = Math.pow(noise, 3) * 255;
        
        // 红色和橙色的混合
        data[idx] = 255; // R
        data[idx + 1] = value * 0.5; // G
        data[idx + 2] = 0; // B
        data[idx + 3] = 255; // A
      }
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * 生成有机行星(类地行星)的地表纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateLandTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 大陆颜色
    const landColor = `rgb(34, 139, 34)`;
    
    // 海洋颜色
    const oceanColor = `rgb(0, 105, 148)`;
    
    // 填充海洋
    context.fillStyle = oceanColor;
    context.fillRect(0, 0, size, size);
    
    // 生成大陆
    const continentCount = 3 + Math.floor(Math.random() * 4);
    
    for (let i = 0; i < continentCount; i++) {
      // 大陆的中心点
      const centerX = Math.random() * size;
      const centerY = Math.random() * size;
      
      // 大陆的大小
      const continentSize = 100 + Math.random() * 200;
      
      // 画大陆
      context.fillStyle = landColor;
      context.beginPath();
      
      // 生成不规则的大陆形状
      const points = [];
      const numPoints = 20;
      
      for (let j = 0; j < numPoints; j++) {
        const angle = (j / numPoints) * Math.PI * 2;
        const radius = continentSize * (0.7 + Math.random() * 0.3);
        
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        
        points.push({ x, y });
      }
      
      // 绘制大陆轮廓
      context.moveTo(points[0].x, points[0].y);
      
      for (let j = 1; j < points.length; j++) {
        context.lineTo(points[j].x, points[j].y);
      }
      
      context.closePath();
      context.fill();
    }
    
    // 添加一些云效果
    context.fillStyle = "rgba(255, 255, 255, 0.2)";
    
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 10 + Math.random() * 50;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * 创建大气层
   * @param {Number} planetSize - 行星大小
   * @param {String} planetType - 行星类型
   * @returns {THREE.Mesh} 大气层网格
   */
  createAtmosphere(planetSize, planetType) {
    // 大气层稍大于行星
    const atmosphereSize = planetSize * 1.05;
    const geometry = new THREE.SphereGeometry(atmosphereSize, 32, 32);
    
    // 根据行星类型选择大气颜色
    let color;
    switch(planetType) {
      case 'oceanic':
      case 'organic':
        // 蓝色系大气，类似地球
        color = new THREE.Color(0x6a9fe5);
        break;
      case 'gas':
        // 气态巨行星，金黄色或蓝色大气
        color = Math.random() > 0.5 ? 
          new THREE.Color(0xe5b54e) : 
          new THREE.Color(0x4e8de5);
        break;
      case 'toxic':
        // 有毒行星，绿色或紫色大气
        color = Math.random() > 0.5 ? 
          new THREE.Color(0x88ff88) : 
          new THREE.Color(0xbb55dd);
        break;
      case 'lava':
      case 'volcanic':
        // 火山行星，红色或橙色大气
        color = Math.random() > 0.5 ? 
          new THREE.Color(0xff8866) : 
          new THREE.Color(0xffaa22);
        break;
      case 'icy':
      case 'crystal':
        // 冰冻或水晶行星，淡蓝或淡紫色大气
        color = Math.random() > 0.5 ? 
          new THREE.Color(0xaaddff) : 
          new THREE.Color(0xddaaff);
        break;
      default:
        // 默认淡蓝色大气
        color = new THREE.Color(0x88aaff);
    }
    
    // 创建大气层材质
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2 + Math.random() * 0.3, // 随机不透明度
      side: THREE.BackSide
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * 创建云层
   * @param {Number} planetSize - 行星大小
   * @param {String} planetType - 行星类型
   * @returns {THREE.Mesh} 云层网格
   */
  createClouds(planetSize, planetType = 'organic') {
    const cloudsGeometry = new THREE.SphereGeometry(planetSize, 32, 32);
    
    // 根据行星类型定制云层
    let cloudColor;
    
    switch(planetType) {
      case 'organic':
        cloudColor = 0xffffff; // 白色云彩
        break;
      case 'oceanic':
        cloudColor = 0xf0f8ff; // 略带蓝色的云彩
        break;
      case 'gas':
        cloudColor = Math.random() > 0.5 ? 0xffffcc : 0xddddff; // 黄色或蓝色云层
        break;
      case 'toxic':
        cloudColor = 0xccffcc; // 绿色云层
        break;
      default:
        cloudColor = 0xeeeeee; // 默认白色
    }
    
    // 创建云层材质
    const cloudsMaterial = new THREE.MeshBasicMaterial({
      color: cloudColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.FrontSide
    });
    
    // 为云层添加噪声纹理
    const cloudTexture = this.generateCloudTexture(512, planetType);
    cloudsMaterial.alphaMap = cloudTexture;
    cloudsMaterial.alphaTest = 0.2;
    
    const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    
    // 为云层添加随机旋转
    clouds.rotation.y = Math.random() * Math.PI * 2;
    
    return clouds;
  }
  
  /**
   * 生成云层纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateCloudTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 生成噪声
    const imageData = context.createImageData(size, size);
    const data = imageData.data;
    
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        
        // 简单噪声
        let noise = Math.random();
        
        // 将噪声阈值化，只保留高值部分作为云
        noise = noise > 0.75 ? noise : 0;
        
        const value = noise * 255;
        
        data[idx] = value;
        data[idx + 1] = value;
        data[idx + 2] = value;
        data[idx + 3] = value; // 透明度也与亮度成比例
      }
    }
    
    context.putImageData(imageData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  /**
   * 创建行星环
   * @param {Number} planetSize - 行星大小
   * @param {String} planetType - 行星类型
   * @returns {THREE.Mesh} 行星环网格
   */
  createPlanetaryRings(planetSize, planetType = 'gas') {
    // 确定环的内外半径
    const innerRadius = planetSize * 1.3;
    const outerRadius = planetSize * 2.2;
    
    // 使用更多的环段获得更平滑的效果
    const ringGeometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // 选择环的颜色和特性
    let ringColor, ringOpacity;
    
    switch(planetType) {
      case 'gas':
        // 气态巨行星环，类似土星
        ringColor = Math.random() > 0.5 ? 0xd4c6ad : 0xb5a67e;
        ringOpacity = 0.6 + Math.random() * 0.3;
        break;
      case 'icy':
        // 冰冻行星环，更亮更反光
        ringColor = 0xe0e0ff;
        ringOpacity = 0.4 + Math.random() * 0.3;
        break;
      case 'crystal':
        // 水晶行星环，彩虹色
        ringColor = 0xffffff; // 基础白色，但下面会添加彩虹效果
        ringOpacity = 0.5 + Math.random() * 0.3;
        break;
      default:
        ringColor = 0xbbbbbb;
        ringOpacity = 0.5;
    }
    
    // 创建环的材质
    let ringMaterial;
    
    if (planetType === 'crystal') {
      // 为水晶行星创建彩虹环
      ringMaterial = new THREE.ShaderMaterial({
        uniforms: {
          innerRadius: { value: innerRadius },
          outerRadius: { value: outerRadius }
        },
        vertexShader: `
          varying vec2 vUv;
          
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float innerRadius;
          uniform float outerRadius;
          varying vec2 vUv;
          
          vec3 hsb2rgb(vec3 c) {
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
          }
          
          void main() {
            // 计算当前位置到环中心的距离
            vec2 center = vec2(0.5, 0.5);
            float dist = length(gl_PointCoord.xy - center) * 2.0;
            
            // 归一化当前半径在内外环之间的位置
            float normRadius = distance(vUv, vec2(0.5)) * 2.0;
            
            // 使用半径生成彩虹色
            vec3 color = hsb2rgb(vec3(normRadius, 0.7, 0.8));
            
            gl_FragColor = vec4(color, 0.6);
          }
        `,
        side: THREE.DoubleSide,
        transparent: true,
        blending: THREE.AdditiveBlending
      });
    } else {
      // 标准环材质
      ringMaterial = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: ringOpacity,
        side: THREE.DoubleSide
      });
    }
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // 旋转环使其水平
    ring.rotation.x = Math.PI / 2;
    
    // 有时添加第二个内环
    if (Math.random() < 0.3) {
      const innerRingRadius = planetSize * 1.2;
      const midRingRadius = planetSize * 1.4;
      
      const innerRingGeometry = new THREE.RingGeometry(innerRingRadius, midRingRadius, 64);
      
      const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      });
      
      const innerRing = new THREE.Mesh(innerRingGeometry, innerRingMaterial);
      innerRing.rotation.x = Math.PI / 2;
      
      ring.add(innerRing);
    }
    
    return ring;
  }
  
  /**
   * 为行星生成随机名称
   * @returns {String} 行星名称
   */
  generatePlanetName() {
    const prefixes = [
      'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
      'Kepler', 'Proxima', 'Trappist', 'Gliese', 'HD', 'PSR', 'Sirius',
      'Nova', 'Celeste', 'Stellar', 'Cosmo', 'Astra', 'Astro', 'Lunar',
      'Orbit', 'Solar', 'Nebula', 'Pulsar', 'Quasar', 'Vega', 'Helios'
    ];
    
    const suffixes = [
      'Prime', 'Minor', 'Major', 'Superior', 'Inferior', 'Maximus', 'Minimus',
      'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'A', 'B', 'C', 'D', 'E', 'F', 'G'
    ];
    
    // 数字部分
    const number = Math.floor(Math.random() * 1000);
    
    // 随机决定名称格式
    const nameType = Math.floor(Math.random() * 3);
    
    let name;
    
    switch (nameType) {
      case 0:
        // 前缀 + 数字, e.g. "Kepler-22"
        name = `${prefixes[Math.floor(Math.random() * prefixes.length)]}-${number}`;
        break;
      case 1:
        // 前缀 + 后缀, e.g. "Alpha Prime"
        name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        break;
      case 2:
        // 前缀 + 数字 + 后缀, e.g. "Proxima 431-B"
        name = `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${number}-${suffixes[Math.floor(Math.random() * suffixes.length)]}`;
        break;
    }
    
    return name;
  }
  
  /**
   * 为行星生成资源分布
   * @param {String} type - 行星类型
   * @returns {Object} 资源分布对象
   */
  generatePlanetResources(type) {
    const planetType = this.planetTypes[type];
    const resources = {};
    
    // 为该行星类型的每种可能资源分配丰富度值
    planetType.resources.forEach(resource => {
      // 资源丰富度，0-10
      const abundance = Math.random() * 10;
      resources[resource] = abundance;
    });
    
    return resources;
  }
  
  /**
   * 为行星生成描述文本
   * @param {String} type - 行星类型
   * @returns {String} 行星描述
   */
  generatePlanetDescription(type) {
    const descriptions = {
      rocky: [
        "一个充满岩石的荒凉行星，表面覆盖着陨石坑和峡谷。",
        "这颗行星的地表由坚硬的岩石组成，几乎没有大气层保护。",
        "岩石构成了这颗行星的主要特征，其表面温度变化极大。"
      ],
      
      icy: [
        "这颗冰冷的世界覆盖着厚厚的冰层，温度极低。",
        "永恒的寒冬统治着这颗行星，冰川和冰原遍布整个表面。",
        "表面温度低得惊人，甚至氮气都可能呈液态存在。"
      ],
      
      gas: [
        "一个巨大的气态巨行星，拥有复杂的大气层系统和强风带。",
        "这颗行星主要由氢和氦气体组成，没有固体表面。",
        "强大的风暴系统在这颗气态巨行星的表面不断变化。"
      ],
      
      lava: [
        "炽热的岩浆覆盖了这颗行星的大部分表面，温度极高。",
        "活跃的火山不断喷发，使得行星表面常年被熔岩覆盖。",
        "这是一颗年轻而狂暴的行星，地质活动极其频繁。"
      ],
      
      desert: [
        "干燥贫瘠的表面是这颗荒漠行星的主要特征。",
        "广阔的沙丘和风化的岩石构成了这颗行星的景观。",
        "尽管表面看似荒凉，但这颗行星蕴含着丰富的矿物资源。"
      ],
      
      organic: [
        "这颗类地行星拥有适宜生命存在的条件，表面可能有液态水。",
        "丰富的植被覆盖了行星表面，显示出蓬勃的生机。",
        "大气成分适合呼吸，这颗行星可能支持复杂的生态系统。"
      ]
    };
    
    // 随机选择一个描述
    const descriptionList = descriptions[type];
    return descriptionList[Math.floor(Math.random() * descriptionList.length)];
  }
  
  /**
   * 根据类型创建一组行星
   * @param {Number} count - 行星数量
   * @param {Boolean} randomDistribution - 是否随机分布行星类型
   * @returns {Array} 行星数组
   */
  generatePlanetSystem(count, randomDistribution = true) {
    const planets = [];
    
    if (randomDistribution) {
      // 完全随机生成行星
      for (let i = 0; i < count; i++) {
        planets.push(this.generatePlanet());
      }
    } else {
      // 按照一定的比例生成不同类型的行星
      const typeDistribution = {
        rocky: 0.25,
        icy: 0.2,
        gas: 0.1,
        lava: 0.1,
        desert: 0.15,
        organic: 0.2
      };
      
      for (let i = 0; i < count; i++) {
        // 决定这颗行星的类型
        const rand = Math.random();
        let cumulativeProbability = 0;
        let selectedType;
        
        for (const [type, probability] of Object.entries(typeDistribution)) {
          cumulativeProbability += probability;
          
          if (rand < cumulativeProbability) {
            selectedType = type;
            break;
          }
        }
        
        // 生成指定类型的行星
        planets.push(this.generatePlanet({ type: selectedType }));
      }
    }
    
    return planets;
  }
  
  /**
   * 更新行星系统
   * @param {Array} planets - 行星数组
   * @param {THREE.Vector3} centerPosition - 中心位置
   * @param {Number} deltaTime - 时间增量
   */
  updatePlanetSystem(planets, centerPosition, deltaTime) {
    planets.forEach(planet => {
      if (!planet.userData) return;
      
      // 更新行星旋转(自转)
      planet.rotation.y += planet.userData.rotationSpeed * deltaTime;
      
      // 更新行星公转
      if (centerPosition) {
        // 获取当前到中心的向量
        const currentPos = planet.position.clone().sub(centerPosition);
        
        // 围绕Y轴旋转这个向量
        const angle = planet.userData.orbitSpeed * deltaTime;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        const newX = currentPos.x * cos - currentPos.z * sin;
        const newZ = currentPos.x * sin + currentPos.z * cos;
        
        // 更新行星位置
        planet.position.set(
          newX + centerPosition.x,
          planet.position.y,
          newZ + centerPosition.z
        );
      }
      
      // 如果行星有云层，更新云层旋转
      planet.children.forEach(child => {
        if (child.material && child.material.opacity === 0.6) { // 通过特性识别云层
          child.rotation.y += 0.0005 * deltaTime;
        }
      });
    });
  }
  
  /**
   * 为行星添加表面特征
   * @param {THREE.Mesh} planet - 行星对象
   * @param {String} type - 行星类型
   * @param {Number} size - 行星尺寸
   */
  addSurfaceFeatures(planet, type, size) {
    switch(type) {
      case 'rocky':
        // 添加陨石坑
        this.addCraters(planet, size, 0.7);
        break;
        
      case 'volcanic':
        // 添加火山口 - 暂时使用陨石坑代替
        this.addCraters(planet, size, 0.5);
        break;
        
      case 'crystal':
        // 暂时跳过水晶尖刺，防止非THREE.Object3D错误
        break;
        
      case 'oceanic':
        // 暂时跳过岛屿，防止非THREE.Object3D错误
        break;
    }
  }
  
  /**
   * 添加陨石坑
   * @param {THREE.Mesh} planet - 行星对象
   * @param {Number} size - 行星尺寸
   * @param {Number} density - 陨石坑密度
   */
  addCraters(planet, size, density = 0.5) {
    const craterCount = Math.floor(5 + Math.random() * 10 * density);
    
    for (let i = 0; i < craterCount; i++) {
      // 创建陨石坑几何体
      const craterSize = size * (0.05 + Math.random() * 0.15); // 陨石坑大小
      const craterGeometry = new THREE.CircleGeometry(craterSize, 16);
      
      // 陨石坑材质
      const craterMaterial = new THREE.MeshStandardMaterial({
        color: 0x555555,
        roughness: 0.8,
        metalness: 0.1,
        side: THREE.DoubleSide
      });
      
      const crater = new THREE.Mesh(craterGeometry, craterMaterial);
      
      // 在球面上放置陨石坑
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      
      const x = size * Math.sin(phi) * Math.cos(theta);
      const y = size * Math.sin(phi) * Math.sin(theta);
      const z = size * Math.cos(phi);
      
      crater.position.set(x, y, z);
      
      // 使陨石坑面向行星中心
      crater.lookAt(0, 0, 0);
      
      // 稍微下沉陨石坑
      crater.position.multiplyScalar(0.99);
      
      planet.add(crater);
    }
  }
  
  /**
   * 根据类型计算行星宜居性
   * @param {String} type - 行星类型
   * @param {Number} size - 行星大小
   * @returns {Boolean} 是否宜居
   */
  calculateHabitability(type, size) {
    // 只有有机和海洋行星可能宜居
    if (type !== 'organic' && type !== 'oceanic') {
      return false;
    }
    
    // 大小要适中 - 不能太小也不能太大
    const idealSize = 8;
    const sizeVariance = Math.abs(size - idealSize);
    
    // 基于类型和大小的宜居概率
    const baseChance = type === 'organic' ? 0.3 : 0.2;
    const sizeAdjustment = Math.max(0, 0.2 - sizeVariance * 0.05);
    
    return Math.random() < (baseChance + sizeAdjustment);
  }
  
  /**
   * 判断行星是否可以着陆
   * @param {String} type - 行星类型
   * @returns {Boolean} 是否可以着陆
   */
  canLandOnPlanet(type) {
    // 气态和熔岩行星不能着陆
    if (type === 'gas' || type === 'lava') {
      return false;
    }
    
    // 其他类型行星可着陆
    return true;
  }
  
  /**
   * 添加火山口效果 (未完全实现)
   * @param {THREE.Mesh} planet - 行星对象
   * @param {Number} size - 行星尺寸
   */
  addVolcanoes(planet, size) {
    // 暂时使用红色陨石坑模拟火山口
    const volcanoCount = Math.floor(3 + Math.random() * 5);
    
    for (let i = 0; i < volcanoCount; i++) {
      const volcanoSize = size * (0.08 + Math.random() * 0.12);
      const volcanoGeometry = new THREE.CircleGeometry(volcanoSize, 16);
      
      const volcanoMaterial = new THREE.MeshStandardMaterial({
        color: 0x990000,
        roughness: 0.7,
        metalness: 0.2,
        side: THREE.DoubleSide,
        emissive: 0xff3300,
        emissiveIntensity: 0.5
      });
      
      const volcano = new THREE.Mesh(volcanoGeometry, volcanoMaterial);
      
      // 在球面上放置火山口
      const phi = Math.random() * Math.PI;
      const theta = Math.random() * Math.PI * 2;
      
      const x = size * Math.sin(phi) * Math.cos(theta);
      const y = size * Math.sin(phi) * Math.sin(theta);
      const z = size * Math.cos(phi);
      
      volcano.position.set(x, y, z);
      volcano.lookAt(0, 0, 0);
      volcano.position.multiplyScalar(0.99);
      
      planet.add(volcano);
    }
  }
  
  /**
   * 添加水晶形态 (未完全实现)
   * @param {THREE.Mesh} planet - 行星对象
   * @param {Number} size - 行星尺寸
   */
  addCrystalFormations(planet, size) {
    // 暂时不实现，防止错误
  }
  
  /**
   * 添加岛屿 (未完全实现)
   * @param {THREE.Mesh} planet - 行星对象
   * @param {Number} size - 行星尺寸
   */
  addIslands(planet, size) {
    // 暂时不实现，防止错误
  }
  
  /**
   * 生成有毒行星纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateToxicTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 创建渐变背景
    const gradient = context.createRadialGradient(
      size/2, size/2, 0,
      size/2, size/2, size/2
    );
    
    gradient.addColorStop(0, '#88ff88');
    gradient.addColorStop(0.5, '#66cc66');
    gradient.addColorStop(1, '#225522');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    
    // 添加气泡/斑点效果
    const bubbleCount = 50 + Math.random() * 100;
    
    for (let i = 0; i < bubbleCount; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = 2 + Math.random() * 10;
      
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      
      // 随机气泡颜色
      const r = Math.floor(100 + Math.random() * 155);
      const g = Math.floor(200 + Math.random() * 55);
      const b = Math.floor(100 + Math.random() * 100);
      
      context.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
      context.fill();
    }
    
    return new THREE.CanvasTexture(canvas);
  }
}

export default PlanetGenerator;