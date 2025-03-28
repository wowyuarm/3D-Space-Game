// src/ui/screens/UpgradeScreen.jsx
import React, { useState, useEffect } from 'react';

const UpgradeScreen = ({ gameEngine, onClose }) => {
  const [playerData, setPlayerData] = useState({
    credits: 0,
    level: 1
  });
  
  const [shipData, setShipData] = useState({
    name: 'Scout Ship',
    hull: 100,
    maxHull: 100,
    energy: 100,
    maxEnergy: 100,
    thrustPower: 1,
    maneuverability: 1,
    cargoCapacity: 20,
    weapons: []
  });
  
  const [selectedCategory, setSelectedCategory] = useState('engines');
  const [upgrades, setUpgrades] = useState({
    engines: [
      { id: 'eng1', name: 'Enhanced Thrusters', cost: 500, effect: 'Thrust +20%', installed: false, available: true },
      { id: 'eng2', name: 'Fusion Drive', cost: 1200, effect: 'Thrust +35%', installed: false, available: true },
      { id: 'eng3', name: 'Quantum Propulsion', cost: 3000, effect: 'Thrust +60%', installed: false, available: false }
    ],
    hull: [
      { id: 'hull1', name: 'Reinforced Plating', cost: 600, effect: 'Hull +25%', installed: false, available: true },
      { id: 'hull2', name: 'Shield Generator', cost: 1500, effect: 'Energy Shield', installed: false, available: true },
      { id: 'hull3', name: 'Adaptive Armor', cost: 2800, effect: 'Hull +50%, Damage Resistance', installed: false, available: false }
    ],
    weapons: [
      { id: 'wpn1', name: 'Mining Laser', cost: 800, effect: 'Mining Capability', installed: false, available: true },
      { id: 'wpn2', name: 'Defense Turret', cost: 1300, effect: 'Basic Combat', installed: false, available: true },
      { id: 'wpn3', name: 'Pulse Cannon', cost: 2500, effect: 'Medium Combat', installed: false, available: false }
    ],
    energy: [
      { id: 'nrg1', name: 'Expanded Battery', cost: 400, effect: 'Energy +20%', installed: false, available: true },
      { id: 'nrg2', name: 'Solar Collectors', cost: 1000, effect: 'Energy Regen +30%', installed: false, available: true },
      { id: 'nrg3', name: 'Fusion Reactor', cost: 2200, effect: 'Energy +50%, Regen +50%', installed: false, available: false }
    ],
    cargo: [
      { id: 'crg1', name: 'Expanded Cargo Hold', cost: 300, effect: 'Capacity +5', installed: false, available: true },
      { id: 'crg2', name: 'Cargo Management System', cost: 700, effect: 'Capacity +10, Sorting', installed: false, available: true },
      { id: 'crg3', name: 'Automated Storage', cost: 1800, effect: 'Capacity +20, Auto-Sorting', installed: false, available: false }
    ]
  });
  
  // Update player and ship data from game engine
  useEffect(() => {
    if (gameEngine && gameEngine.gameState && gameEngine.gameState.player) {
      const player = gameEngine.gameState.player;
      setPlayerData({
        credits: player.credits || 0,
        level: player.level || 1
      });
      
      if (player.spaceship) {
        setShipData({
          name: player.spaceship.name || 'Scout Ship',
          hull: player.spaceship.health || 100,
          maxHull: player.spaceship.maxHealth || 100,
          energy: player.spaceship.energy || 100,
          maxEnergy: player.spaceship.maxEnergy || 100,
          thrustPower: player.spaceship.thrustPower || 1,
          maneuverability: player.spaceship.maneuverability || 1,
          cargoCapacity: player.spaceship.cargoCapacity || 20,
          weapons: player.spaceship.weapons || []
        });
        
        // Update installed upgrades
        if (player.spaceship.upgrades) {
          updateInstalledUpgrades(player.spaceship.upgrades);
        }
      }
    }
  }, [gameEngine]);
  
  // Update the upgrades list to show what's already installed
  const updateInstalledUpgrades = (installedUpgrades) => {
    const updatedUpgrades = {...upgrades};
    
    Object.keys(updatedUpgrades).forEach(category => {
      updatedUpgrades[category].forEach(upgrade => {
        if (installedUpgrades.includes(upgrade.id)) {
          upgrade.installed = true;
        }
      });
    });
    
    setUpgrades(updatedUpgrades);
  };
  
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };
  
  const handleUpgradePurchase = (upgrade) => {
    if (upgrade.installed || !upgrade.available || playerData.credits < upgrade.cost) {
      return false;
    }
    
    // Implement purchase logic
    if (gameEngine && gameEngine.gameState && gameEngine.gameState.player) {
      const player = gameEngine.gameState.player;
      
      // Deduct credits
      const success = player.spendCredits(upgrade.cost);
      
      if (success) {
        // Apply upgrade to ship
        if (player.spaceship) {
          player.spaceship.installUpgrade(upgrade.id);
        }
        
        // Update local state
        const updatedUpgrades = {...upgrades};
        updatedUpgrades[selectedCategory].forEach(item => {
          if (item.id === upgrade.id) {
            item.installed = true;
          }
        });
        
        setUpgrades(updatedUpgrades);
        
        // Update player credits
        setPlayerData({
          ...playerData,
          credits: playerData.credits - upgrade.cost
        });
        
        // Play upgrade sound if audio manager is available
        if (gameEngine.audioManager) {
          gameEngine.audioManager.playSound('upgrade_complete');
        }
        
        return true;
      }
    }
    
    return false;
  };
  
  const renderUpgradeItems = () => {
    const categoryUpgrades = upgrades[selectedCategory] || [];
    
    return categoryUpgrades.map(upgrade => (
      <div 
        key={upgrade.id} 
        className={`upgrade-item ${upgrade.installed ? 'installed' : ''} ${!upgrade.available ? 'unavailable' : ''}`}
        onClick={() => handleUpgradePurchase(upgrade)}
      >
        <div className="upgrade-item-header">
          <span className="upgrade-item-name">{upgrade.name}</span>
          <span className="upgrade-item-cost">
            {upgrade.installed ? 'INSTALLED' : `${upgrade.cost} CR`}
          </span>
        </div>
        
        <div className="upgrade-item-effect">
          {upgrade.effect}
        </div>
        
        <div className="upgrade-status">
          {upgrade.installed ? (
            <span className="installed-label">Installed</span>
          ) : !upgrade.available ? (
            <span className="unavailable-label">Unavailable</span>
          ) : playerData.credits < upgrade.cost ? (
            <span className="insufficient-label">Insufficient Credits</span>
          ) : (
            <span className="available-label">Available</span>
          )}
        </div>
      </div>
    ));
  };
  
  return (
    <div className="upgrade-screen">
      <div className="upgrade-header">
        <h2>Ship Upgrades</h2>
        <div className="player-credits">Credits: {playerData.credits} CR</div>
        <button className="close-button" onClick={onClose}>Close</button>
      </div>
      
      <div className="upgrade-content">
        <div className="ship-info-panel">
          <h3>{shipData.name}</h3>
          
          <div className="ship-stats">
            <div className="ship-stat">
              <label>Hull Integrity:</label>
              <div className="stat-bar">
                <div 
                  className="stat-fill hull-fill" 
                  style={{ width: `${(shipData.hull / shipData.maxHull) * 100}%` }}
                ></div>
              </div>
              <span>{shipData.hull}/{shipData.maxHull}</span>
            </div>
            
            <div className="ship-stat">
              <label>Energy Capacity:</label>
              <div className="stat-bar">
                <div 
                  className="stat-fill energy-fill" 
                  style={{ width: `${(shipData.energy / shipData.maxEnergy) * 100}%` }}
                ></div>
              </div>
              <span>{shipData.energy}/{shipData.maxEnergy}</span>
            </div>
            
            <div className="ship-stat-row">
              <div className="ship-stat-item">
                <label>Thrust Power:</label>
                <span>{shipData.thrustPower.toFixed(2)}</span>
              </div>
              <div className="ship-stat-item">
                <label>Maneuverability:</label>
                <span>{shipData.maneuverability.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="ship-stat-row">
              <div className="ship-stat-item">
                <label>Cargo Capacity:</label>
                <span>{shipData.cargoCapacity} units</span>
              </div>
              <div className="ship-stat-item">
                <label>Weapons:</label>
                <span>{shipData.weapons.length}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="upgrade-selection">
          <div className="upgrade-categories">
            <button 
              className={selectedCategory === 'engines' ? 'active' : ''}
              onClick={() => handleCategoryChange('engines')}
            >
              Engines
            </button>
            <button 
              className={selectedCategory === 'hull' ? 'active' : ''}
              onClick={() => handleCategoryChange('hull')}
            >
              Hull
            </button>
            <button 
              className={selectedCategory === 'weapons' ? 'active' : ''}
              onClick={() => handleCategoryChange('weapons')}
            >
              Weapons
            </button>
            <button 
              className={selectedCategory === 'energy' ? 'active' : ''}
              onClick={() => handleCategoryChange('energy')}
            >
              Energy
            </button>
            <button 
              className={selectedCategory === 'cargo' ? 'active' : ''}
              onClick={() => handleCategoryChange('cargo')}
            >
              Cargo
            </button>
          </div>
          
          <div className="upgrade-items-container">
            {renderUpgradeItems()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeScreen;