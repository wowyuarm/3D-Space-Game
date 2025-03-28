 // src/game/PlanetGenerator.js
import * as THREE from 'three';

/**
 * 行星生成器 - 负责生成丰富多样的行星环境
 */
export class PlanetGenerator {
  constructor() {
    // 行星类型及其特性
    this.planetTypes = {
      // 岩石类行星
      rocky: {
        colors: [
          new THREE.Color(0x8B4513), // 棕色
          new THREE.Color(0xA0522D), // 赭石色
          new THREE.Color(0xCD853F), // 秘鲁色
          new THREE.Color(0xD2691E)  // 巧克力色
        ],
        resources: ['iron', 'titanium', 'silicon', 'carbon'],
        atmosphereDensity: 0.2,
        roughness: 0.8,
        maxSize: 15
      },
      
      // 冰冻类行星
      icy: {
        colors: [
          new THREE.Color(0xE0FFFF), // 浅蓝色
          new THREE.Color(0xADD8E6), // 淡蓝色
          new THREE.Color(0xB0E0E6), // 粉蓝色
          new THREE.Color(0x87CEEB)  // 天空蓝
        ],
        resources: ['water', 'methane', 'nitrogen', 'hydrogen'],
        atmosphereDensity: 0.3,
        roughness: 0.4,
        maxSize: 18
      },
      
      // 气态巨行星
      gas: {
        colors: [
          new THREE.Color(0xFFA07A), // 浅鲑鱼色
          new THREE.Color(0xE9967A), // 深鲑鱼色
          new THREE.Color(0xFA8072), // 鲑鱼色
          new THREE.Color(0xF08080)  // 浅珊瑚色
        ],
        resources: ['hydrogen', 'helium', 'ammonia', 'methane'],
        atmosphereDensity: 0.9,
        roughness: 0.1,
        maxSize: 25
      },
      
      // 熔岩类行星
      lava: {
        colors: [
          new THREE.Color(0xFF4500), // 橙红色
          new THREE.Color(0xFF6347), // 番茄色
          new THREE.Color(0xFF7F50), // 珊瑚色
          new THREE.Color(0xFF8C00)  // 深橙色
        ],
        resources: ['sulfur', 'iron', 'platinum', 'tungsten'],
        atmosphereDensity: 0.5,
        roughness: 0.7,
        maxSize: 14
      },
      
      // 荒漠类行星
      desert: {
        colors: [
          new THREE.Color(0xF5DEB3), // 小麦色
          new THREE.Color(0xDEB887), // 实木色
          new THREE.Color(0xD2B48C), // 棕褐色
          new THREE.Color(0xBC8F8F)  // 玫瑰褐色
        ],
        resources: ['silica', 'titanium', 'gold', 'copper'],
        atmosphereDensity: 0.1,
        roughness: 0.6,
        maxSize: 16
      },
      
      // 有机类行星(类地行星)
      organic: {
        colors: [
          new THREE.Color(0x32CD32), // 酸橙绿
          new THREE.Color(0x3CB371), // 中海蓝
          new THREE.Color(0x228B22), // 森林绿
          new THREE.Color(0x008000)  // 绿色
        ],
        resources: ['oxygen', 'carbon', 'nitrogen', 'water'],
        atmosphereDensity: 0.8,
        roughness: 0.5,
        maxSize: 20
      }
    };
    
    // 资源类型和它们的价值(1-10)
    this.resourceValues = {
      iron: 2,
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
      oxygen: 6
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
    
    // 创建行星几何体
    const geometry = new THREE.SphereGeometry(size, 64, 64);
    
    // 创建行星材质
    const material = this.createPlanetMaterial(type);
    
    // 创建行星网格
    const planet = new THREE.Mesh(geometry, material);
    planet.position.copy(position);
    
    // 如果是气态行星，添加大气环
    if (type === 'gas' || planetType.atmosphereDensity > 0.6) {
      const atmosphere = this.createAtmosphere(size, type);
      planet.add(atmosphere);
    }
    
    // 如果是有机行星，添加云层效果
    if (type === 'organic') {
      const clouds = this.createClouds(size * 1.02);
      planet.add(clouds);
    }
    
    // 创建行星环(5%的几率，主要是气态行星)
    if (type === 'gas' && Math.random() < 0.5) {
      const rings = this.createPlanetaryRings(size);
      planet.add(rings);
    }
    
    // 为行星添加随机旋转
    planet.rotation.x = Math.random() * Math.PI;
    planet.rotation.y = Math.random() * Math.PI;
    planet.rotation.z = Math.random() * Math.PI;
    
    // 添加行星元数据
    planet.userData = {
      type: type,
      size: size,
      name: this.generatePlanetName(),
      resources: this.generatePlanetResources(type),
      description: this.generatePlanetDescription(type),
      orbitSpeed: 0.001 + Math.random() * 0.002, // 轨道速度
      rotationSpeed: 0.003 + Math.random() * 0.005, // 自转速度
      inhabited: type === 'organic' && Math.random() < 0.3 // 有机行星有30%几率有生命存在
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
    
    // 创建基础材质
    const material = new THREE.MeshStandardMaterial({
      color: baseColor,
      roughness: planetType.roughness,
      metalness: type === 'rocky' || type === 'lava' ? 0.5 : 0.1,
      flatShading: type === 'rocky' || type === 'desert'
    });
    
    // 创建纹理
    if (type === 'rocky' || type === 'desert') {
      // 添加凹凸纹理
      const bumpTexture = this.generateNoiseTexture(512, 0.7);
      material.bumpMap = bumpTexture;
      material.bumpScale = 0.5;
    } else if (type === 'icy') {
      // 添加反光效果
      material.specular = new THREE.Color(0xffffff);
      material.shininess = 100;
    } else if (type === 'gas') {
      // 气态行星使用有条纹的纹理
      const stripeTexture = this.generateGasGiantTexture(1024);
      material.map = stripeTexture;
      material.opacity = 0.9;
      material.transparent = true;
    } else if (type === 'lava') {
      // 熔岩行星使用发光纹理
      material.emissive = new THREE.Color(0xff2200);
      material.emissiveIntensity = 0.5;
      
      const glowTexture = this.generateLavaTexture(512);
      material.emissiveMap = glowTexture;
    } else if (type === 'organic') {
      // 有机行星(类地行星)添加地表纹理
      const landTexture = this.generateLandTexture(1024);
      material.map = landTexture;
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
   * 创建大气层效果
   * @param {Number} radius - 行星半径
   * @param {String} type - 行星类型
   * @returns {THREE.Mesh} 大气层网格
   */
  createAtmosphere(radius, type) {
    // 大气层稍大于行星本身
    const atmosphereRadius = radius * 1.1;
    const geometry = new THREE.SphereGeometry(atmosphereRadius, 64, 64);
    
    // 根据行星类型设置大气层颜色
    let color;
    
    switch (type) {
      case 'gas':
        color = new THREE.Color(0xFFFACD);
        break;
      case 'organic':
        color = new THREE.Color(0x87CEEB);
        break;
      case 'lava':
        color = new THREE.Color(0xFF4500);
        break;
      default:
        color = new THREE.Color(0xAAAAAA);
    }
    
    // 创建半透明材质
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.2,
      side: THREE.BackSide
    });
    
    return new THREE.Mesh(geometry, material);
  }
  
  /**
   * 创建云层效果
   * @param {Number} radius - 云层半径
   * @returns {THREE.Mesh} 云层网格
   */
  createClouds(radius) {
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    
    // 生成云层纹理
    const cloudTexture = this.generateCloudTexture(512);
    
    const material = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    
    return new THREE.Mesh(geometry, material);
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
   * @param {Number} planetRadius - 行星半径
   * @returns {THREE.Mesh} 行星环网格
   */
  createPlanetaryRings(planetRadius) {
    // 内半径和外半径
    const innerRadius = planetRadius * 1.3;
    const outerRadius = planetRadius * 2.0;
    
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 64);
    
    // 设置UV坐标，以便纹理能够正确映射
    const pos = geometry.attributes.position;
    const v3 = new THREE.Vector3();
    const uv = [];
    
    for (let i = 0; i < pos.count; i++) {
      v3.fromBufferAttribute(pos, i);
      const len = v3.length();
      const u = (len - innerRadius) / (outerRadius - innerRadius);
      const v = Math.atan2(v3.y, v3.x) / (Math.PI * 2) + 0.5;
      
      uv.push(u, v);
    }
    
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    
    // 生成行星环纹理
    const ringTexture = this.generateRingTexture(512);
    
    const material = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    
    const ring = new THREE.Mesh(geometry, material);
    
    // 稍微倾斜行星环
    ring.rotation.x = Math.PI / 4;
    
    return ring;
  }
  
  /**
   * 生成行星环纹理
   * @param {Number} size - 纹理尺寸
   * @returns {THREE.Texture} 生成的纹理
   */
  generateRingTexture(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext('2d');
    
    // 生成条纹
    for (let i = 0; i < size; i++) {
      // 条纹密度随机变化
      if (Math.random() > 0.5) {
        const alpha = 0.3 + Math.random() * 0.7;
        context.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        context.fillRect(0, i, size, 1 + Math.random() * 3);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.repeat.set(1, 3);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return texture;
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
}

export default PlanetGenerator;