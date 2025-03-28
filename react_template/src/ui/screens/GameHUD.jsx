// src/ui/screens/GameHUD.jsx
import React, { useState, useEffect } from 'react';
import ResourceCollectionOverlay from '../components/ResourceCollectionOverlay.jsx';
import '../styles/resourceCollection.css';
import '../styles/gameHud.css';

const GameHUD = ({ gameEngine, onOpenStarMap, onOpenUpgrades, onSaveGame, onReturnToMainMenu }) => {
  const [playerData, setPlayerData] = useState({
    shipHealth: 100,
    shipEnergy: 100,
    credits: 1000,
    velocity: 0,
    location: 'Unknown Region',
    level: 1
  });
  
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [nearestPlanet, setNearestPlanet] = useState(null);
  
  // Update player data from game engine
  useEffect(() => {
    const updateInterval = setInterval(() => {
      if (gameEngine && gameEngine.gameState && gameEngine.gameState.player) {
        const player = gameEngine.gameState.player;
        const spaceship = player.spaceship;
        
        if (spaceship) {
          const velocity = spaceship.velocity ? 
            Math.sqrt(
              spaceship.velocity.x * spaceship.velocity.x + 
              spaceship.velocity.y * spaceship.velocity.y + 
              spaceship.velocity.z * spaceship.velocity.z
            ) : 0;
            
          setPlayerData({
            shipHealth: spaceship.health || 100,
            shipEnergy: spaceship.energy || 100,
            credits: player.credits || 0,
            velocity: Math.floor(velocity * 10) / 10,
            location: player.currentStarSystem ? 
                      player.currentStarSystem.name : 'Unknown Region',
            level: player.level || 1
          });
          
          // 更新最近的行星信息
          setNearestPlanet(player.nearestPlanet);
        }
      }
    }, 250); // Update 4 times per second
    
    return () => clearInterval(updateInterval);
  }, [gameEngine]);
  
  // Handle keyboard events for pause menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        togglePauseMenu();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPaused]);
  
  const togglePauseMenu = () => {
    const newPauseState = !showPauseMenu;
    setShowPauseMenu(newPauseState);
    
    // Pause or resume game engine
    if (gameEngine) {
      if (newPauseState) {
        gameEngine.pause();
        setIsPaused(true);
      } else {
        gameEngine.resume();
        setIsPaused(false);
      }
    }
  };
  
  // 格式化行星信息
  const getPlanetInfoText = () => {
    if (!nearestPlanet || !nearestPlanet.userData) return null;
    
    const planetData = nearestPlanet.userData;
    const planetName = planetData.name || 'Unknown Planet';
    const planetType = planetData.type || 'unknown';
    
    let resourcesText = '';
    if (planetData.resources) {
      const resourceCount = Object.keys(planetData.resources).filter(r => planetData.resources[r] > 0).length;
      resourcesText = resourceCount > 0 ? ` [${resourceCount} resources]` : ' [No resources]';
    }
    
    return `Nearby: ${planetName} (${planetType})${resourcesText}`;
  };
  
  return (
    <div className="game-hud">
      {/* Main HUD display */}
      <div className="hud-top-bar">
        <div className="player-info">
          <span className="player-level">LVL {playerData.level}</span>
          <span className="player-credits">{playerData.credits} CR</span>
        </div>
        
        <div className="location-info">
          <span>{playerData.location}</span>
        </div>
        
        <div className="hud-buttons">
          <button onClick={togglePauseMenu} className="hud-button">
            {isPaused ? 'Resume' : 'Pause'}
          </button>
          
          <button onClick={onOpenStarMap} className="hud-button star-map-button">
            Star Map
          </button>
          
          <button onClick={onOpenUpgrades} className="hud-button upgrade-button">
            Upgrades
          </button>
        </div>
      </div>
      
      {/* Ship status indicators */}
      <div className="ship-status">
        <div className="status-bar-container">
          <label>Hull</label>
          <div className="status-bar">
            <div 
              className="status-bar-fill health-bar" 
              style={{ width: `${playerData.shipHealth}%` }}
            ></div>
          </div>
          <span>{playerData.shipHealth}%</span>
        </div>
        
        <div className="status-bar-container">
          <label>Energy</label>
          <div className="status-bar">
            <div 
              className="status-bar-fill energy-bar" 
              style={{ width: `${playerData.shipEnergy}%` }}
            ></div>
          </div>
          <span>{playerData.shipEnergy}%</span>
        </div>
      </div>
      
      {/* 行星信息显示 */}
      {nearestPlanet && (
        <div className="planet-proximity-info">
          {getPlanetInfoText()}
          {nearestPlanet.userData && gameEngine && gameEngine.gameState && 
           gameEngine.gameState.resourceCollector && 
           gameEngine.gameState.resourceCollector.canCollectFrom(nearestPlanet) && (
            <span className="collect-hint">Press E to collect resources</span>
          )}
        </div>
      )}
      
      {/* Ship velocity indicator */}
      <div className="velocity-indicator">
        <span className="velocity-value">{playerData.velocity}</span>
        <span className="velocity-unit">u/s</span>
      </div>
      
      {/* 资源收集界面 */}
      <ResourceCollectionOverlay gameEngine={gameEngine} />
      
      {/* Pause menu overlay */}
      {showPauseMenu && (
        <div className="pause-menu-overlay">
          <div className="pause-menu">
            <h2>Game Paused</h2>
            
            <div className="pause-menu-buttons">
              <button onClick={togglePauseMenu}>
                Resume Game
              </button>
              
              <button onClick={onSaveGame}>
                Save Game
              </button>
              
              <button onClick={onOpenStarMap}>
                View Star Map
              </button>
              
              <button onClick={onOpenUpgrades}>
                Ship Upgrades
              </button>
              
              <button onClick={onReturnToMainMenu}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Controls reminder */}
      <div className="controls-reminder">
        <div>W/S - Thrust | A/D - Turn | Q/E - Roll | Arrow Keys - Pitch/Yaw</div>
        <div>Shift - Boost | Space - Brake | E - Interact | ESC - Pause</div>
      </div>
    </div>
  );
};

export default GameHUD;