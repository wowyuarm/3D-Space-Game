import React, { useState, useEffect } from 'react';
import ResourceCollectionOverlay from './ResourceCollectionOverlay';
import TutorialOverlay from './TutorialOverlay';

/**
 * 游戏HUD (Heads-Up Display) 组件
 * 整合游戏界面上的各种信息显示和交互元素
 * 
 * @param {Object} props
 * @param {Object} props.gameEngine - 游戏引擎实例
 * @param {Object} props.uiManager - UI管理器实例
 */
const GameHUD = ({ gameEngine, uiManager }) => {
  const [playerHealth, setPlayerHealth] = useState(100);
  const [playerEnergy, setPlayerEnergy] = useState(100);
  const [speed, setSpeed] = useState(0);
  const [currentPlanet, setCurrentPlanet] = useState(null);
  const [resources, setResources] = useState({});
  const [notifications, setNotifications] = useState([]);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(null);

  // 监听游戏状态变化
  useEffect(() => {
    if (!gameEngine) return;

    const updateInterval = setInterval(() => {
      // 获取玩家状态
      const player = gameEngine.gameState?.player;
      if (player) {
        setPlayerHealth(player.health);
        setPlayerEnergy(player.energy);
      }

      // 获取飞船状态
      const spaceship = gameEngine.gameState?.spaceship;
      if (spaceship) {
        setSpeed(spaceship.getSpeed());
      }

      // 获取当前接近的行星
      const universe = gameEngine.gameState?.universe;
      if (universe) {
        const nearbyPlanet = universe.getNearestPlanet();
        setCurrentPlanet(nearbyPlanet);
      }

      // 获取资源状态
      const inventory = gameEngine.gameState?.inventory;
      if (inventory) {
        setResources(inventory.getResources());
      }
    }, 200);

    return () => clearInterval(updateInterval);
  }, [gameEngine]);

  // 监听教程状态
  useEffect(() => {
    if (!uiManager) return;

    const tutorialStatusChanged = (isVisible, step) => {
      setIsTutorialVisible(isVisible);
      setTutorialStep(step);
    };

    uiManager.on('tutorialStatusChanged', tutorialStatusChanged);

    return () => {
      uiManager.off('tutorialStatusChanged', tutorialStatusChanged);
    };
  }, [uiManager]);

  // 监听通知
  useEffect(() => {
    if (!uiManager) return;

    const notificationAdded = (notification) => {
      setNotifications(prev => [...prev, { 
        id: Date.now(), 
        ...notification,
        isNew: true 
      }]);

      // 2秒后移除"新"标记
      setTimeout(() => {
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isNew: false } : n)
        );
      }, 2000);

      // 通知自动消失（如果设置了timeout）
      if (notification.timeout) {
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notification.id));
        }, notification.timeout);
      }
    };

    uiManager.on('notification', notificationAdded);

    return () => {
      uiManager.off('notification', notificationAdded);
    };
  }, [uiManager]);

  // 处理教程导航
  const handleTutorialNext = () => {
    uiManager?.tutorialNext();
  };

  const handleTutorialPrevious = () => {
    uiManager?.tutorialPrevious();
  };

  const handleTutorialComplete = () => {
    uiManager?.completeTutorial();
  };

  const handleTutorialSkip = () => {
    uiManager?.skipTutorial();
  };

  // 关闭通知
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="game-hud">
      {/* 顶部状态栏 */}
      <div className="hud-top-bar">
        <div className="player-stats">
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${playerHealth}%` }}></div>
            <span className="health-text">HP: {playerHealth.toFixed(0)}</span>
          </div>
          <div className="energy-bar">
            <div className="energy-fill" style={{ width: `${playerEnergy}%` }}></div>
            <span className="energy-text">能量: {playerEnergy.toFixed(0)}</span>
          </div>
        </div>
        
        <div className="speed-indicator">
          <span className="speed-value">{speed.toFixed(0)}</span>
          <span className="speed-unit">m/s</span>
        </div>
      </div>
      
      {/* 资源显示 */}
      <div className="resources-panel">
        <h4>资源</h4>
        <ul>
          {Object.entries(resources).map(([type, amount]) => (
            <li key={type} className="resource-item">
              <span className="resource-icon">{getResourceIcon(type)}</span>
              <span className="resource-name">{type}</span>
              <span className="resource-amount">{amount.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </div>
      
      {/* 行星信息 */}
      {currentPlanet && (
        <div className="planet-info">
          <h4>{currentPlanet.userData?.name || '未知行星'}</h4>
          <p>距离: {currentPlanet.userData?.distance.toFixed(0)}m</p>
          <p>类型: {currentPlanet.userData?.type || '未知'}</p>
          {currentPlanet.userData?.canInteract && (
            <div className="interaction-prompt">
              按 <span className="key">E</span> 与行星交互
            </div>
          )}
        </div>
      )}
      
      {/* 通知区域 */}
      <div className="notifications-container">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification ${notification.type || 'info'} ${notification.isNew ? 'new' : ''}`}
          >
            <div className="notification-content">
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
            </div>
            <button 
              className="notification-dismiss" 
              onClick={() => dismissNotification(notification.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* 资源收集覆盖层 */}
      <ResourceCollectionOverlay gameEngine={gameEngine} />
      
      {/* 教程覆盖层 */}
      <TutorialOverlay 
        isVisible={isTutorialVisible}
        currentStep={tutorialStep}
        onNext={handleTutorialNext}
        onPrevious={handleTutorialPrevious}
        onComplete={handleTutorialComplete}
        onSkip={handleTutorialSkip}
      />
    </div>
  );
};

/**
 * 根据资源类型返回对应的图标
 */
function getResourceIcon(type) {
  const icons = {
    metal: '🔧',
    crystal: '💎',
    gas: '💨',
    organic: '🌱',
    exotic: '✨',
    default: '📦'
  };
  
  return icons[type.toLowerCase()] || icons.default;
}

export default GameHUD; 