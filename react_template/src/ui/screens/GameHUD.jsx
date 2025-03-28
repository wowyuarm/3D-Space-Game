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
  
  // 暂停游戏的快捷键处理
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleTogglePause();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameEngine]);
  
  // 如果游戏已暂停，显示暂停菜单
  if (isPaused) {
    return (
      <div className="pause-menu">
        <div className="pause-menu-container">
          <h2 className="pause-title">游戏已暂停</h2>
          
          <div className="pause-buttons">
            <button className="hud-button primary-button" onClick={() => {
              gameEngine?.resume();
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
      {/* 顶部状态栏 - 简化，仅显示关键信息 */}
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
          
          <button className="hud-button" onClick={toggleControls}>
            {showControls ? '隐藏控制' : '显示控制'}
          </button>
        </div>
      </div>
      
      {/* 底部状态栏 - 精简，更透明 */}
      <div className="hud-bottom-bar">
        <div className="ship-stats">
          {/* 健康度 */}
          <div className="stat-item">
            <span className="stat-label">船体:</span>
            <div className="progress-bar">
              <div className="progress-fill health-fill" 
                style={{width: `${gameState?.player?.spaceship?.health / gameState?.player?.spaceship?.maxHealth * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.health || 0)}
            </span>
          </div>
          
          {/* 能量 */}
          <div className="stat-item">
            <span className="stat-label">能量:</span>
            <div className="progress-bar">
              <div className="progress-fill energy-fill" 
                style={{width: `${gameState?.player?.spaceship?.energy / gameState?.player?.spaceship?.maxEnergy * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.energy || 0)}
            </span>
          </div>
          
          {/* 护盾 */}
          <div className="stat-item">
            <span className="stat-label">护盾:</span>
            <div className="progress-bar">
              <div className="progress-fill shield-fill" 
                style={{width: `${gameState?.player?.spaceship?.shields?.strength / gameState?.player?.spaceship?.shields?.maxStrength * 100 || 0}%`}}>
              </div>
            </div>
            <span className="stat-value">
              {Math.round(gameState?.player?.spaceship?.shields?.strength || 0)}
            </span>
          </div>
          
          <div className="stat-item credits-display">
            <span className="stat-label">信用点:</span>
            <span className="stat-value credits-value">
              {gameState?.player?.credits || 0} CR
            </span>
          </div>
        </div>
      </div>
      
      {/* 资源面板 - 移至右侧，不遮挡游戏中央区域 */}
      <div className="resources-panel">
        <h3>物资清单</h3>
        <div className="resources-list">
          {gameState?.player?.inventory?.items && gameState.player.inventory.items.length > 0 ? (
            gameState.player.inventory.items.map((item, index) => (
              <div key={index} className="resource-item">
                <span className="resource-name">{item.name}</span>
                <span className="resource-amount">{item.quantity || 1}</span>
              </div>
            ))
          ) : (
            <div className="empty-message">空仓</div>
          )}
        </div>
      </div>
      
      {/* 控制帮助面板 - 更明显的显示/隐藏 */}
      <div className={`controls-help ${showControls ? 'visible' : ''}`}>
        <h3>飞船控制指南</h3>
        <div className="control-item">
          <span className="key">W</span>
          <span className="action">引擎加速 (高速推进)</span>
        </div>
        <div className="control-item">
          <span className="key">S</span>
          <span className="action">反向推进</span>
        </div>
        <div className="control-item">
          <span className="key">A/D</span>
          <span className="action">飞船左右转向</span>
        </div>
        <div className="control-item">
          <span className="key">Q/E</span>
          <span className="action">飞船滚转</span>
        </div>
        <div className="control-item">
          <span className="key">I/K</span>
          <span className="action">飞船俯仰(上下)</span>
        </div>
        <div className="control-item">
          <span className="key">Shift</span>
          <span className="action">引擎加速器(消耗能量)</span>
        </div>
        <div className="control-item highlight">
          <span className="key">空格</span>
          <span className="action">超空间跃迁/星球降落</span>
        </div>
        <div className="control-item">
          <span className="key">ESC</span>
          <span className="action">暂停游戏</span>
        </div>
        
        <div className="tips-section">
          <h4>飞行技巧:</h4>
          <ul>
            <li>使用<b>W</b>快速前进，<b>空格</b>超空间跃迁</li>
            <li>靠近星球时按<b>空格</b>可以降落</li>
            <li>使用<b>Shift</b>加速器可大幅提升速度</li>
            <li>组合使用转向和加速可实现复杂飞行动作</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default GameHUD;