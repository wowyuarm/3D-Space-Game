// src/ui/screens/StarMapScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const StarMapScreen = ({ gameEngine, onClose }) => {
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [systems, setSystems] = useState([]);
  const [currentGalaxy, setCurrentGalaxy] = useState(null);
  const [playerPosition, setPlayerPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const mapContainerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const systemPointsRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // 初始化星图
  useEffect(() => {
    setLoading(true);
    
    // 获取游戏宇宙数据
    if (gameEngine && gameEngine.universe && gameEngine.universe.galaxies) {
      const mainGalaxy = gameEngine.universe.galaxies[0]; // 使用第一个星系
      setCurrentGalaxy(mainGalaxy);
      
      if (mainGalaxy && mainGalaxy.starSystems) {
        setSystems(mainGalaxy.starSystems);
      }
      
      if (gameEngine.gameState && gameEngine.gameState.player) {
        setPlayerPosition(gameEngine.gameState.player.spaceship.position);
      }
    }
    
    setLoading(false);
    
    // 初始化3D星图
    initStarMap();
    
    // 清理函数
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (systemPointsRef.current) {
        systemPointsRef.current.geometry.dispose();
        systemPointsRef.current.material.dispose();
      }
    };
  }, [gameEngine]);
  
  // 初始化3D星图
  const initStarMap = () => {
    if (!mapContainerRef.current) return;
    
    // 创建场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // 创建相机
    const camera = new THREE.PerspectiveCamera(
      60,
      mapContainerRef.current.clientWidth / mapContainerRef.current.clientHeight,
      0.1,
      2000
    );
    camera.position.set(0, 200, 200);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // 创建渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mapContainerRef.current.clientWidth, mapContainerRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mapContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    scene.add(ambientLight);
    
    // 添加平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // 添加星系背景
    createGalaxyBackground(scene);
    
    // 添加网格
    createGrid(scene);
    
    // 添加星系点
    createStarSystemPoints(scene);
    
    // 添加飞船位置指示器
    if (playerPosition) {
      createPlayerMarker(scene, playerPosition);
    }
    
    // 动画循环
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      // 旋转场景
      scene.rotation.y += 0.001;
      
      // 更新星系点的动画效果
      if (systemPointsRef.current) {
        systemPointsRef.current.material.uniforms.time.value += 0.01;
      }
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // 处理窗口大小调整
    const handleResize = () => {
      if (!mapContainerRef.current) return;
      
      camera.aspect = mapContainerRef.current.clientWidth / mapContainerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mapContainerRef.current.clientWidth, mapContainerRef.current.clientHeight);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  };
  
  // 创建星系背景
  const createGalaxyBackground = (scene) => {
    const galaxyGeometry = new THREE.SphereGeometry(700, 64, 64);
    const galaxyMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPos;
        uniform float time;
        
        float noise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 45.543))) * 43758.5453);
        }
        
        void main() {
          float n = noise(vPos * 0.01 + time * 0.1);
          vec3 color = mix(
            vec3(0.05, 0.1, 0.2),
            vec3(0.1, 0.3, 0.6),
            n
          );
          gl_FragColor = vec4(color, 0.4);
        }
      `,
      side: THREE.BackSide,
      transparent: true
    });
    
    const galaxy = new THREE.Mesh(galaxyGeometry, galaxyMaterial);
    scene.add(galaxy);
  };
  
  // 创建网格
  const createGrid = (scene) => {
    const gridHelper = new THREE.GridHelper(400, 20, 0x444466, 0x222244);
    gridHelper.position.y = -100;
    scene.add(gridHelper);
    
    // 创建坐标轴
    const axisLength = 150;
    const axisWidth = 1;
    
    // X轴 - 红色
    const xAxisGeometry = new THREE.BoxGeometry(axisLength, axisWidth, axisWidth);
    const xAxisMaterial = new THREE.MeshBasicMaterial({ color: 0xff6666 });
    const xAxis = new THREE.Mesh(xAxisGeometry, xAxisMaterial);
    xAxis.position.set(axisLength / 2, -99, 0);
    scene.add(xAxis);
    
    // Z轴 - 蓝色
    const zAxisGeometry = new THREE.BoxGeometry(axisWidth, axisWidth, axisLength);
    const zAxisMaterial = new THREE.MeshBasicMaterial({ color: 0x6666ff });
    const zAxis = new THREE.Mesh(zAxisGeometry, zAxisMaterial);
    zAxis.position.set(0, -99, axisLength / 2);
    scene.add(zAxis);
  };
  
  // 创建星系点
  const createStarSystemPoints = (scene) => {
    if (!systems || systems.length === 0) return;
    
    const positions = [];
    const colors = [];
    const sizes = [];
    
    systems.forEach(system => {
      if (!system.position) return;
      
      positions.push(system.position.x, system.position.y, system.position.z);
      
      // 根据星系类型分配颜色
      let color = new THREE.Color();
      switch (system.starType) {
        case 'blue':
          color.set(0x6666ff);
          break;
        case 'red':
          color.set(0xff6666);
          break;
        case 'yellow':
          color.set(0xffff66);
          break;
        case 'white':
          color.set(0xffffff);
          break;
        case 'orange':
          color.set(0xffaa66);
          break;
        default:
          color.set(0xaaaaaa);
      }
      
      colors.push(color.r, color.g, color.b);
      
      // 星系大小根据重要性和是否被探索调整
      const size = system.explored ? 25 : 15;
      sizes.push(size);
    });
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
    
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float time;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // 添加闪烁效果
          float pulse = sin(time * 2.0 + position.x + position.z) * 0.1 + 0.9;
          
          gl_PointSize = size * pulse * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float distanceFromCenter = length(gl_PointCoord - vec2(0.5, 0.5));
          if (distanceFromCenter > 0.5) discard;
          
          // 创建星系光晕效果
          float intensity = 1.0 - distanceFromCenter * 2.0;
          vec3 glow = vColor * pow(intensity, 2.0);
          
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    systemPointsRef.current = points;
    
    // 为星系点添加标签
    systems.forEach((system, index) => {
      if (!system.position) return;
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'star-label';
      nameDiv.textContent = system.name;
      nameDiv.style.position = 'absolute';
      nameDiv.style.color = system.explored ? '#ffffff' : '#888888';
      nameDiv.style.fontSize = system.explored ? '12px' : '10px';
      nameDiv.style.fontWeight = system.explored ? 'bold' : 'normal';
      nameDiv.style.textShadow = '0 0 5px rgba(0,0,0,0.8)';
      nameDiv.style.pointerEvents = 'none';
      nameDiv.style.userSelect = 'none';
      
      // 获取点在屏幕上的位置
      const vector = new THREE.Vector3(
        system.position.x,
        system.position.y,
        system.position.z
      );
      
      // 标签更新函数将在渲染循环中调用
      const updateLabelPosition = () => {
        vector.project(cameraRef.current);
        
        const x = (vector.x * 0.5 + 0.5) * mapContainerRef.current.clientWidth;
        const y = (-vector.y * 0.5 + 0.5) * mapContainerRef.current.clientHeight;
        
        nameDiv.style.left = `${x}px`;
        nameDiv.style.top = `${y + 15}px`; // 向下偏移一点避免遮挡星系点
        
        // 只有在视野内才显示
        if (vector.z < 1) {
          nameDiv.style.display = 'block';
        } else {
          nameDiv.style.display = 'none';
        }
      };
      
      // 首次更新位置
      updateLabelPosition();
      
      mapContainerRef.current.appendChild(nameDiv);
      
      // 添加到渲染循环
      const originalRender = rendererRef.current.render;
      rendererRef.current.render = function(scene, camera) {
        updateLabelPosition();
        originalRender.call(this, scene, camera);
      };
    });
  };
  
  // 创建玩家位置标记
  const createPlayerMarker = (scene, position) => {
    // 创建环形标记
    const ringGeometry = new THREE.RingGeometry(8, 10, 32);
    const ringMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 }
      },
      vertexShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        void main() {
          float pulse = sin(time * 3.0) * 0.2 + 0.8;
          vec3 color = vec3(0.0, 0.8, 1.0) * pulse;
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
      transparent: true
    });
    
    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.position.set(position.x, position.y, position.z);
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    
    // 创建圆点标记
    const dotGeometry = new THREE.SphereGeometry(4, 16, 16);
    const dotMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const dot = new THREE.Mesh(dotGeometry, dotMaterial);
    dot.position.set(position.x, position.y, position.z);
    scene.add(dot);
    
    // 更新动画
    const animate = () => {
      ringMaterial.uniforms.time.value += 0.01;
    };
    
    // 添加到渲染循环
    const originalRender = rendererRef.current.render;
    rendererRef.current.render = function(scene, camera) {
      animate();
      originalRender.call(this, scene, camera);
    };
  };
  
  // 处理点击星系
  const handleSelectSystem = (system) => {
    setSelectedSystem(system);
  };
  
  // 处理旅行到星系
  const handleTravelToSystem = () => {
    if (!selectedSystem || !gameEngine || !gameEngine.gameState) return;
    
    // 检查是否是当前所在星系
    const currentSystem = gameEngine.gameState.player && 
                          gameEngine.gameState.player.currentStarSystem;
    
    if (currentSystem && currentSystem.id === selectedSystem.id) {
      alert('你已经在该星系中');
      return;
    }
    
    // 尝试旅行到选定星系
    if (gameEngine.gameState.travelToStarSystem) {
      const success = gameEngine.gameState.travelToStarSystem(selectedSystem);
      
      if (success) {
        // 关闭星图界面返回游戏
        onClose();
      } else {
        alert('无法前往该星系，可能超出航行范围');
      }
    }
  };
  
  // 渲染星系详情面板
  const renderSystemInfo = () => {
    if (!selectedSystem) {
      return (
        <div className="no-selection">
          <p>请从列表中选择一个星系</p>
          <p>或点击地图上的星系</p>
        </div>
      );
    }
    
    return (
      <div className="system-details">
        <h3 className="system-name">{selectedSystem.name}</h3>
        
        <div className="detail-row">
          <span className="detail-label">星系类型:</span>
          <span className="detail-value">{getStarTypeTranslation(selectedSystem.starType)}</span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">状态:</span>
          <span className={`detail-value ${selectedSystem.explored ? 'explored' : 'unexplored'}`}>
            {selectedSystem.explored ? '已探索' : '未探索'}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">行星数量:</span>
          <span className="detail-value">
            {selectedSystem.planets ? selectedSystem.planets.length : '未知'}
          </span>
        </div>
        
        <div className="detail-row">
          <span className="detail-label">距离:</span>
          <span className="detail-value">
            {calculateDistance(selectedSystem)} 光年
          </span>
        </div>
        
        {selectedSystem.resources && (
          <div className="detail-row">
            <span className="detail-label">资源丰富度:</span>
            <span className="detail-value">
              {getResourceRichness(selectedSystem)}
            </span>
          </div>
        )}
        
        {selectedSystem.explored && selectedSystem.planets && selectedSystem.planets.length > 0 && (
          <div className="planet-list-container">
            <h4>行星列表</h4>
            <div className="planet-list">
              {selectedSystem.planets.map((planet, index) => (
                <div key={index} className="planet-item">
                  <div className="planet-name">{planet.name || `行星 ${index + 1}`}</div>
                  <div className="planet-type">
                    {planet.type || '未知类型'}
                    {planet.habitable && <span className="habitable-badge">宜居</span>}
                  </div>
                  {planet.resources && Object.keys(planet.resources).length > 0 && (
                    <div className="planet-resources">
                      资源: {Object.keys(planet.resources).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="system-actions">
          <button 
            className="travel-button"
            onClick={handleTravelToSystem}
            disabled={isCurrentSystem(selectedSystem)}
          >
            {isCurrentSystem(selectedSystem) ? '当前位置' : '前往该星系'}
          </button>
        </div>
      </div>
    );
  };
  
  // 获取恒星类型中文翻译
  const getStarTypeTranslation = (type) => {
    const translations = {
      'blue': '蓝色恒星',
      'red': '红色恒星',
      'yellow': '黄色恒星',
      'white': '白色恒星',
      'orange': '橙色恒星',
      'neutron': '中子星',
      'binary': '双星系统'
    };
    
    return translations[type] || type || '未知';
  };
  
  // 计算与玩家当前位置的距离
  const calculateDistance = (system) => {
    if (!playerPosition || !system.position) return '未知';
    
    const distance = Math.sqrt(
      Math.pow(system.position.x - playerPosition.x, 2) +
      Math.pow(system.position.y - playerPosition.y, 2) +
      Math.pow(system.position.z - playerPosition.z, 2)
    );
    
    return distance.toFixed(1);
  };
  
  // 获取资源丰富度描述
  const getResourceRichness = (system) => {
    if (!system.resources) return '未知';
    
    const resourceCount = Object.keys(system.resources).length;
    
    if (resourceCount === 0) return '贫瘠';
    if (resourceCount <= 2) return '稀少';
    if (resourceCount <= 4) return '一般';
    if (resourceCount <= 6) return '丰富';
    return '极其丰富';
  };
  
  // 检查是否是当前所在星系
  const isCurrentSystem = (system) => {
    if (!gameEngine || !gameEngine.gameState || !gameEngine.gameState.player) return false;
    
    const currentSystem = gameEngine.gameState.player.currentStarSystem;
    return currentSystem && currentSystem.id === system.id;
  };
  
  // 获取星系颜色
  const getSystemColor = (system) => {
    if (!system) return '#888888';
    
    // 根据星系类型返回颜色
    switch (system.starType) {
      case 'blue': return '#6666ff';
      case 'red': return '#ff6666';
      case 'yellow': return '#ffff66';
      case 'white': return '#ffffff';
      case 'orange': return '#ffaa66';
      case 'neutron': return '#00ffff';
      case 'binary': return '#ff00ff';
      default: return '#aaaaaa';
    }
  };
  
  return (
    <div className="star-map-screen">
      <div className="map-header">
        <h2>星图导航</h2>
        
        <div className="location-info">
          <span className="location-label">当前位置:</span>
          <span className="location-value">
            {gameEngine?.gameState?.player?.currentStarSystem?.name || '未知'}
          </span>
        </div>
        
        <button className="return-button" onClick={onClose}>
          返回游戏
        </button>
      </div>
      
      <div className="systems-list">
        <div className="search-box">
          <input
            type="text"
            placeholder="搜索星系..."
            onChange={(e) => {/* 实现搜索功能 */}}
          />
        </div>
        
        <div className="systems-scroll">
          {systems.map((system, index) => (
            <div
              key={index}
              className={`system-list-item ${system.explored ? 'explored' : ''} ${selectedSystem && selectedSystem.id === system.id ? 'selected' : ''}`}
              onClick={() => handleSelectSystem(system)}
            >
              <div 
                className="system-color-dot"
                style={{ backgroundColor: getSystemColor(system) }}
              ></div>
              <span className="system-list-name">{system.name}</span>
              {isCurrentSystem(system) && <span className="current-location-badge">当前</span>}
            </div>
          ))}
        </div>
      </div>
      
      <div className="map-container" ref={mapContainerRef}>
        {loading && <div className="loading-overlay">加载星图中...</div>}
      </div>
      
      <div className="system-info-panel">
        {renderSystemInfo()}
      </div>
    </div>
  );
};

export default StarMapScreen;