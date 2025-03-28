// src/ui/screens/GameHUD.jsx
import React, { useState, useEffect } from 'react';
import ResourceCollectionOverlay from '../components/ResourceCollectionOverlay.jsx';
import '../styles/resourceCollection.css';
import '../styles/gameHud.css';

const GameHUD = ({ gameEngine, onOpenStarMap, onOpenUpgrades, onSaveGame, onReturnToMainMenu }) => {
  const [gameState, setGameState] = useState(null);
  const [showControls, setShowControls] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showPauseMenu, setShowPauseMenu] = useState(false);
  const [nearestPlanet, setNearestPlanet] = useState(null);
  
  useEffect(() => {
    if (gameEngine && gameEngine.gameState) {
      setGameState(gameEngine.gameState);
      
      // 检测初始暂停状态
      setIsPaused(!gameEngine.isRunning);
    }
  }, [gameEngine]);
  
  // 更新HUD数据
  const updateHUD = () => {
    if (gameEngine && gameEngine.gameState) {
      setGameState({...gameEngine.gameState});
    }
  };
  
  // 定期更新HUD数据
  useEffect(() => {
    const interval = setInterval(updateHUD, 500);
    return () => clearInterval(interval);
  }, [gameEngine]);
  
  // 切换暂停状态
  const handleTogglePause = () => {
    if (!gameEngine) return;
    
    if (gameEngine.isRunning) {
      gameEngine.pause();
      setIsPaused(true);
    } else {
      gameEngine.resume();
      setIsPaused(false);
    }
  };
  
  // 显示/隐藏控制帮助
  const toggleControls = () => {
    setShowControls(!showControls);
  };
  
  // 如果游戏已暂停，显示暂停菜单
  if (isPaused) {
    return (
      <div className="pause-menu">
        <div className="pause-menu-container">
          <h2 className="pause-title">游戏已暂停</h2>
          
          <div className="pause-buttons">
            <button className="hud-button primary-button" onClick={() => {
              gameEngine.resume();
              setIsPaused(false);
            }}>
              继续游戏
            </button>
            
            <button className="hud-button" onClick={onOpenStarMap}>
              星图导航
            </button>
            
            <button className="hud-button" onClick={onOpenUpgrades}>
              飞船升级
            </button>
            
            <button className="hud-button" onClick={onSaveGame}>
              保存游戏
            </button>
            
            <button className="hud-button danger-button" onClick={onReturnToMainMenu}>
              返回主菜单
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // 游戏运行中的HUD界面
  return (
    <div className="game-hud">
      {/* 顶部状态栏 */}
      <div className="hud-top-bar">
        <div className="location-info">
          <div>
            <span className="location-label">星系:</span>
            <span className="location-value">
              {gameState?.player?.currentStarSystem?.name || '未知'}
            </span>
          </div>
          
          <div>
            <span className="location-label">坐标:</span>
            <span className="location-value">
              {gameState?.player?.spaceship?.position ? 
                `X:${Math.round(gameState.player.spaceship.position.x)} 
                 Y:${Math.round(gameState.player.spaceship.position.y)} 
                 Z:${Math.round(gameState.player.spaceship.position.z)}` : 
                '未知'}
            </span>
          </div>
        </div>
        
        <div className="navigation-buttons">
          <button className="hud-button" onClick={handleTogglePause}>
            暂停
          </button>
          
          <button className="hud-button" onClick={onOpenStarMap}>
            星图
          </button>
          
          <button className="hud-button" onClick={onOpenUpgrades}>
            升级
          </button>
          
          <button className="hud-button" onClick={toggleControls}>
            {showControls ? '隐藏控制' : '显示控制'}
          </button>
        </div>
      </div>
      
      {/* 底部状态栏 */}
      <div className="hud-bottom-bar">
        <div className="ship-stats">
          <div className="stat-item">
            <span className="stat-label">船体完整度:</span>
            <div className="progress-bar">
              <div className="progress-fill health-fill" 
                style={{width: `${gameState?.player?.spaceship?.health / gameState?.player?.spaceship?.maxHealth * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.health || 0)}/{Math.round(gameState?.player?.spaceship?.maxHealth || 0)}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">能量:</span>
            <div className="progress-bar">
              <div className="progress-fill energy-fill" 
                style={{width: `${gameState?.player?.spaceship?.energy / gameState?.player?.spaceship?.maxEnergy * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.energy || 0)}/{Math.round(gameState?.player?.spaceship?.maxEnergy || 0)}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">护盾:</span>
            <div className="progress-bar">
              <div className="progress-fill shield-fill" 
                style={{width: `${gameState?.player?.spaceship?.shields?.strength / 100 * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.shields?.strength || 0)}%
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">等级:</span>
            <span className="stat-value">
              {gameState?.player?.level || 1}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">经验:</span>
            <span className="stat-value">
              {gameState?.player?.experience || 0}
            </span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">信用点:</span>
            <span className="stat-value">
              {gameState?.player?.credits || 0} CR
            </span>
          </div>
        </div>
      </div>
      
      {/* 资源面板 */}
      <div className="resources-panel">
        <h3>物资清单</h3>
        <div className="resources-list">
          {gameState?.player?.resources && Object.entries(gameState.player.resources).length > 0 ? (
            Object.entries(gameState.player.resources).map(([resourceId, amount]) => (
              <div key={resourceId} className="resource-item">
                <span className="resource-name">{resourceId}</span>
                <span className="resource-amount">{amount}</span>
              </div>
            ))
          ) : (
            <div className="empty-message">空仓</div>
          )}
        </div>
      </div>
      
      {/* 控制帮助面板 */}
      <div className={`controls-help ${showControls ? 'visible' : ''}`}>
        <h3>控制指南</h3>
        <div className="control-item">
          <span className="key">W/S</span>
          <span className="action">推进/减速</span>
        </div>
        <div className="control-item">
          <span className="key">A/D</span>
          <span className="action">左转/右转</span>
        </div>
        <div className="control-item">
          <span className="key">Q/E</span>
          <span className="action">侧移</span>
        </div>
        <div className="control-item">
          <span className="key">↑/↓</span>
          <span className="action">上仰/俯冲</span>
        </div>
        <div className="control-item">
          <span className="key">空格</span>
          <span className="action">增压引擎</span>
        </div>
        <div className="control-item">
          <span className="key">E</span>
          <span className="action">交互/收集</span>
        </div>
        <div className="control-item">
          <span className="key">TAB</span>
          <span className="action">星图</span>
        </div>
        <div className="control-item">
          <span className="key">ESC</span>
          <span className="action">暂停</span>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;