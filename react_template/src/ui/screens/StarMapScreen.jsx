// src/ui/screens/StarMapScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import './StarMapScreen.css'; // 添加样式引用

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
  const handleTravelToSystem = (instantTravel = false) => {
    if (!selectedSystem || !gameEngine || !gameEngine.gameState) return;
    
    // 检查是否是当前所在星系
    const currentSystem = gameEngine.gameState.player && 
                          gameEngine.gameState.player.currentStarSystem;
    
    if (currentSystem && currentSystem.id === selectedSystem.id) {
      alert('你已经在该星系中');
      return;
    }
    
    // 计算距离
    const distance = calculateDistance(selectedSystem);
    
    // 尝试旅行到选定星系
    if (gameEngine.gameState.travelToStarSystem) {
      const success = gameEngine.gameState.travelToStarSystem(selectedSystem, instantTravel);
      
      if (success) {
        // 关闭星图界面返回游戏
        onClose();
      } else {
        // 如果失败但选择了立即传送，显示不同提示
        if (instantTravel) {
          alert('无法传送到该星系，请检查是否有足够的能量或传送装置');
        } else {
          alert('无法前往该星系，可能超出航行范围');
        }
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
    
    // 计算距离
    const distance = calculateDistance(selectedSystem);
    const isLongDistance = distance > 100; // 假设超过100光年为长距离
    
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
            {selectedSystem.explored && selectedSystem.planets 
              ? selectedSystem.planets.length 
              : '未知'}
          </span>
        </div>
        
        <div className="detail-row distance-row">
          <span className="detail-label">距离:</span>
          <span className={`detail-value ${isLongDistance ? 'long-distance' : ''}`}>
            {distance} 光年
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
          {isCurrentSystem(selectedSystem) ? (
            <button 
              className="current-location-button"
              disabled={true}
            >
              当前位置
            </button>
          ) : (
            <>
              <button 
                className="travel-button"
                onClick={() => handleTravelToSystem(false)}
              >
                常规航行
              </button>
              <button 
                className="warp-button"
                onClick={() => handleTravelToSystem(true)}
                title="直接跃迁到目标星系"
              >
                超空间跃迁
              </button>
            </>
          )}
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
  
  // 添加CSS样式
  const styles = {
    starMapContainer: {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    },
    header: {
      padding: '10px 20px',
      borderBottom: '1px solid #2a4d6e',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      background: 'linear-gradient(to right, #0a2342, #123b70)'
    },
    title: {
      color: '#00ccff',
      margin: 0,
      fontWeight: 'bold',
      textShadow: '0 0 15px rgba(0, 204, 255, 0.7)'
    },
    closeButton: {
      background: 'none',
      border: '1px solid #00ccff',
      color: '#00ccff',
      padding: '5px 15px',
      cursor: 'pointer',
      borderRadius: '4px',
      transition: 'all 0.3s ease'
    },
    content: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    systemsPanel: {
      width: '250px',
      backgroundColor: 'rgba(16, 24, 40, 0.9)',
      borderRight: '1px solid #2a4d6e',
      padding: '15px',
      overflowY: 'auto'
    },
    systemsList: {
      listStyle: 'none',
      padding: 0,
      margin: 0
    },
    systemItem: {
      padding: '8px 12px',
      borderBottom: '1px solid rgba(42, 77, 110, 0.5)',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    systemName: {
      color: '#fff'
    },
    selected: {
      backgroundColor: 'rgba(0, 128, 255, 0.3)',
      borderLeft: '3px solid #00ccff'
    },
    systemStatus: {
      display: 'inline-block',
      width: '12px',
      height: '12px',
      borderRadius: '50%',
      marginLeft: '8px'
    },
    visitedIndicator: {
      backgroundColor: '#00cc66'
    },
    unvisitedIndicator: {
      backgroundColor: '#ff9900'
    },
    mapView: {
      flex: 1,
      position: 'relative'
    },
    mapContainer: {
      width: '100%',
      height: '100%'
    },
    infoPanel: {
      width: '300px',
      backgroundColor: 'rgba(16, 24, 40, 0.9)',
      borderLeft: '1px solid #2a4d6e',
      padding: '15px',
      overflowY: 'auto'
    },
    detailsHeading: {
      color: '#00ccff',
      borderBottom: '1px solid #2a4d6e',
      paddingBottom: '10px',
      marginTop: 0
    },
    detailRow: {
      margin: '10px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    detailLabel: {
      color: '#88aace',
      fontWeight: 'bold'
    },
    detailValue: {
      color: '#ffffff'
    },
    longDistance: {
      color: '#ff9900',
      fontWeight: 'bold'
    },
    explored: {
      color: '#00cc66'
    },
    unexplored: {
      color: '#ff9900'
    },
    planetList: {
      marginTop: '15px',
      maxHeight: '200px',
      overflowY: 'auto',
      border: '1px solid #2a4d6e',
      borderRadius: '4px',
      padding: '8px'
    },
    planetItem: {
      padding: '8px',
      borderBottom: '1px solid rgba(42, 77, 110, 0.5)',
      marginBottom: '8px'
    },
    planetName: {
      color: '#ffffff',
      fontWeight: 'bold',
      marginBottom: '4px'
    },
    planetType: {
      color: '#88aace',
      fontSize: '0.9em',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    habitableBadge: {
      backgroundColor: '#00aa44',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '0.8em'
    },
    planetResources: {
      color: '#6699cc',
      fontSize: '0.85em',
      marginTop: '4px',
      fontStyle: 'italic'
    },
    systemActions: {
      marginTop: '20px',
      display: 'flex',
      gap: '10px',
      flexDirection: 'column'
    },
    travelButton: {
      backgroundColor: '#2a4d6e',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    warpButton: {
      backgroundColor: '#704e93',
      backgroundImage: 'linear-gradient(45deg, #704e93, #3a1c6e)',
      color: 'white',
      border: 'none',
      padding: '10px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      textShadow: '0 0 8px rgba(255, 255, 255, 0.5)',
      boxShadow: '0 0 15px rgba(112, 78, 147, 0.5)'
    },
    currentLocationButton: {
      backgroundColor: '#333',
      color: '#999',
      border: 'none',
      padding: '10px',
      borderRadius: '4px',
      cursor: 'not-allowed'
    },
    loadingText: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      color: '#00ccff',
      fontSize: '1.5em'
    }
  };

  return (
    <div style={styles.starMapContainer}>
      <div style={styles.header}>
        <h2 style={styles.title}>星际导航系统</h2>
        <button style={styles.closeButton} onClick={onClose}>关闭</button>
      </div>
      
      <div style={styles.content}>
        <div style={styles.systemsPanel}>
          <h3 style={styles.detailsHeading}>星系列表</h3>
          {loading ? (
            <p>加载星系数据...</p>
          ) : (
            <ul style={styles.systemsList}>
              {systems.map((system) => (
                <li
                  key={system.id}
                  style={{
                    ...styles.systemItem,
                    ...(selectedSystem && selectedSystem.id === system.id ? styles.selected : {})
                  }}
                  onClick={() => handleSelectSystem(system)}
                >
                  <span style={styles.systemName}>{system.name}</span>
                  <span
                    style={{
                      ...styles.systemStatus,
                      ...(system.explored ? styles.visitedIndicator : styles.unvisitedIndicator)
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
        
        <div style={styles.mapView}>
          {loading ? (
            <div style={styles.loadingText}>正在生成星图...</div>
          ) : (
            <div ref={mapContainerRef} style={styles.mapContainer}></div>
          )}
        </div>
        
        <div style={styles.infoPanel}>
          <h3 style={styles.detailsHeading}>星系详情</h3>
          {renderSystemInfo()}
        </div>
      </div>
    </div>
  );
};

export default StarMapScreen;