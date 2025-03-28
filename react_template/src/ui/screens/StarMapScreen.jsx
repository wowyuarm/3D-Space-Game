// src/ui/screens/StarMapScreen.jsx
import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const StarMapScreen = ({ gameEngine, onClose }) => {
  const [mapMode, setMapMode] = useState('galaxy'); // galaxy, system, planet
  const [selectedSystem, setSelectedSystem] = useState(null);
  const [selectedPlanet, setSelectedPlanet] = useState(null);
  const [systemInfo, setSystemInfo] = useState({});
  const [playerPosition, setPlayerPosition] = useState({ x: 0, y: 0, z: 0 });
  
  const mapContainerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const starsRef = useRef([]);
  
  // Initialize 3D star map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    // Set up scene and camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    sceneRef.current = scene;
    
    const width = mapContainerRef.current.clientWidth;
    const height = mapContainerRef.current.clientHeight;
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 50, 100);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Set up renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mapContainerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x333344, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);
    
    // Load player data and universe
    if (gameEngine && gameEngine.gameState) {
      const player = gameEngine.gameState.player;
      if (player && player.spaceship) {
        setPlayerPosition({
          x: player.spaceship.position.x,
          y: player.spaceship.position.y,
          z: player.spaceship.position.z
        });
      }
      
      // Load star systems if universe exists
      if (gameEngine.gameState.universe) {
        createStarSystems(gameEngine.gameState.universe);
      }
    }
    
    // Animation loop
    const animate = () => {
      const animationId = requestAnimationFrame(animate);
      
      // Rotate the map slightly for visual effect
      if (sceneRef.current) {
        sceneRef.current.rotation.y += 0.0005;
      }
      
      // Update star system visuals
      starsRef.current.forEach(star => {
        if (star.animationMixer) {
          star.animationMixer.update(0.016);
        }
      });
      
      renderer.render(scene, camera);
      
      return () => cancelAnimationFrame(animationId);
    };
    
    animate();
    
    // Handle window resize
    const handleResize = () => {
      if (!mapContainerRef.current) return;
      
      const width = mapContainerRef.current.clientWidth;
      const height = mapContainerRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      // Clean up
      window.removeEventListener('resize', handleResize);
      if (mapContainerRef.current && renderer.domElement) {
        mapContainerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [gameEngine]);
  
  // Create star systems in 3D space
  const createStarSystems = (universe) => {
    if (!universe || !universe.galaxies || !universe.galaxies[0]) return;
    
    const scene = sceneRef.current;
    const galaxy = universe.galaxies[0]; // Use first galaxy for now
    
    // Clear existing star systems
    starsRef.current.forEach(star => {
      if (star.object) {
        scene.remove(star.object);
      }
    });
    
    starsRef.current = [];
    
    // Create star systems
    galaxy.starSystems.forEach(system => {
      // Create star material based on star type
      let starColor = 0xffffcc; // Default yellow
      
      switch(system.starType) {
        case 'blue': starColor = 0x6688ff; break;
        case 'white': starColor = 0xffffff; break;
        case 'yellow': starColor = 0xffff99; break;
        case 'orange': starColor = 0xff9966; break;
        case 'red': starColor = 0xff6644; break;
        case 'binary': starColor = 0xffaacc; break;
      }
      
      // Create star geometry
      const starSize = system.starSize || 1;
      const starGeometry = new THREE.SphereGeometry(starSize, 16, 16);
      const starMaterial = new THREE.MeshStandardMaterial({ 
        color: starColor,
        emissive: starColor,
        emissiveIntensity: 0.8
      });
      
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      starMesh.position.set(
        system.position.x,
        system.position.y,
        system.position.z
      );
      
      // Create star glow
      const glowGeometry = new THREE.SphereGeometry(starSize * 1.5, 16, 16);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.2
      });
      
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      starMesh.add(glowMesh);
      
      // Store the system data with the mesh for selection
      starMesh.userData.systemData = system;
      
      scene.add(starMesh);
      
      // Store reference to star
      starsRef.current.push({ 
        object: starMesh, 
        data: system
      });
    });
  };
  
  const handleSystemClick = (system) => {
    setSelectedSystem(system);
    setSystemInfo({
      name: system.name,
      starType: system.starType,
      planets: system.planets ? system.planets.length : 0,
      resources: system.resources || 'Unknown',
      explored: system.explored ? 'Yes' : 'No'
    });
    
    if (system.planets && system.planets.length > 0) {
      setMapMode('system');
    }
  };
  
  const handlePlanetClick = (planet) => {
    setSelectedPlanet(planet);
    setMapMode('planet');
  };
  
  const handleBackToGalaxy = () => {
    setSelectedSystem(null);
    setSelectedPlanet(null);
    setMapMode('galaxy');
  };
  
  const handleBackToSystem = () => {
    setSelectedPlanet(null);
    setMapMode('system');
  };
  
  const handleTravelTo = () => {
    if (!gameEngine || !selectedSystem) return;
    
    // Implement travel to star system
    if (gameEngine.gameState && gameEngine.gameState.player) {
      gameEngine.gameState.player.enterStarSystem(selectedSystem);
      onClose(); // Close the star map
    }
  };
  
  // Render different views based on map mode
  const renderMapContent = () => {
    switch(mapMode) {
      case 'system':
        return (
          <div className="system-view">
            <div className="system-info-panel">
              <h3>{systemInfo.name} System</h3>
              <div className="system-details">
                <div>Star Type: {systemInfo.starType}</div>
                <div>Planets: {systemInfo.planets}</div>
                <div>Resources: {systemInfo.resources}</div>
                <div>Explored: {systemInfo.explored}</div>
              </div>
              
              <div className="planet-list">
                <h4>Planets</h4>
                {selectedSystem && selectedSystem.planets && selectedSystem.planets.map((planet, index) => (
                  <div 
                    key={index} 
                    className="planet-item"
                    onClick={() => handlePlanetClick(planet)}
                  >
                    {planet.name}
                  </div>
                ))}
              </div>
              
              <div className="map-buttons">
                <button onClick={handleBackToGalaxy}>
                  Back to Galaxy
                </button>
                <button onClick={handleTravelTo}>
                  Travel to System
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'planet':
        return (
          <div className="planet-view">
            <div className="planet-info-panel">
              <h3>{selectedPlanet?.name}</h3>
              
              <div className="planet-details">
                <div>Type: {selectedPlanet?.type || 'Unknown'}</div>
                <div>Size: {selectedPlanet?.size || 'Unknown'}</div>
                <div>Atmosphere: {selectedPlanet?.hasAtmosphere ? 'Yes' : 'No'}</div>
                <div>Resources: {selectedPlanet?.resources || 'Unknown'}</div>
                <div>Danger Level: {selectedPlanet?.dangerLevel || 'Low'}</div>
              </div>
              
              <div className="map-buttons">
                <button onClick={handleBackToSystem}>
                  Back to System View
                </button>
                <button onClick={handleTravelTo} disabled={!selectedPlanet?.canLand}>
                  {selectedPlanet?.canLand ? 'Land on Planet' : 'Cannot Land'}
                </button>
              </div>
            </div>
          </div>
        );
        
      case 'galaxy':
      default:
        return (
          <div className="galaxy-info-panel">
            <h3>Galaxy Map</h3>
            <div className="galaxy-navigation">
              <div className="coordinate-display">
                Player Position: 
                X: {Math.floor(playerPosition.x)}, 
                Y: {Math.floor(playerPosition.y)}, 
                Z: {Math.floor(playerPosition.z)}
              </div>
            </div>
            {selectedSystem && (
              <div className="selected-system-info">
                <h4>{systemInfo.name}</h4>
                <div>Star Type: {systemInfo.starType}</div>
                <div>Planets: {systemInfo.planets}</div>
                <button onClick={() => handleSystemClick(selectedSystem)}>
                  View System
                </button>
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="star-map-screen">
      <div className="star-map-header">
        <h2>Star Map</h2>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
      
      <div className="star-map-content">
        <div className="map-container" ref={mapContainerRef}>
          {/* 3D Star Map renders here */}
        </div>
        
        <div className="map-controls">
          {renderMapContent()}
        </div>
      </div>
    </div>
  );
};

export default StarMapScreen;