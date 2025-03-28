// src/ui/UIManager.jsx
import React, { useState, useEffect } from 'react';
import MainMenuScreen from './screens/MainMenuScreen.jsx';
import GameHUD from './screens/GameHUD.jsx';
import StarMapScreen from './screens/StarMapScreen.jsx';
import UpgradeScreen from './screens/UpgradeScreen.jsx';
import TutorialOverlay from './screens/TutorialOverlay.jsx';
// 导入新创建的组件供以后使用
import GameHUDNew from './components/GameHUD.jsx';
import TutorialOverlayNew from './components/TutorialOverlay.jsx';

// UIManager class that handles UI state and rendering
export class UIManager {
  constructor() {
    this.uiState = {
      currentScreen: 'mainMenu', // mainMenu, game, starMap, upgrade, settings, etc.
      isGamePaused: false,
      showHUD: true,
      showDialog: false,
      dialogData: null,
      notifications: [],
      tutorialState: {
        active: false,
        currentStep: 0,
        completed: false,
        steps: [
          {
            id: 'welcome',
            title: '欢迎来到太空探险',
            content: '准备好探索浩瀚宇宙了吗？本教程将指导你了解基本控制和游戏机制。',
            position: 'center'
          },
          {
            id: 'movement',
            title: '飞船控制',
            content: '使用WASD键控制飞船方向，空格键加速，Shift键减速。',
            position: 'bottom',
            highlight: 'controls-reminder'
          },
          {
            id: 'starmap',
            title: '星图导航',
            content: '按Tab键打开星图，在不同星系之间导航。探索未知星系可以获得奖励！',
            position: 'top',
            highlight: 'star-map-button'
          },
          {
            id: 'resources',
            title: '资源收集',
            content: '接近行星时可以扫描和收集资源。这些资源可用于升级你的飞船能力。',
            position: 'right',
            highlight: 'resource-display'
          },
          {
            id: 'upgrades',
            title: '飞船升级',
            content: '使用收集的资源升级你的飞船。更强的引擎、更大的货仓和更好的防护罩都能帮助你探索更远的星系。',
            position: 'left',
            highlight: 'upgrade-button'
          },
          {
            id: 'completion',
            title: '准备就绪！',
            content: '现在你已经了解了基本知识，开始你的太空探险吧！有问题随时按H键查看帮助。',
            position: 'center'
          }
        ]
      }
    };
    
    this.gameState = null;
    this.audioManager = null;
    this.isInitialized = false;
  }
  
  /**
   * Initialize the UI manager - wrapper for backward compatibility
   * @returns {boolean} Success status
   */
  init() {
    // Call the existing initialize method for backward compatibility
    this.initialize();
    return true;
  }
  
  initialize() {
    if (this.isInitialized) {
      console.warn('UIManager already initialized');
      return this;
    }
    
    console.log('Initializing UIManager...');
    
    this.isInitialized = true;
    return this;
  }
  
  setGameState(gameState) {
    this.gameState = gameState;
    return this;
  }
  
  setAudioManager(audioManager) {
    this.audioManager = audioManager;
    return this;
  }
  
  showScreen(screenName) {
    if (this.uiState.currentScreen === screenName) return;
    
    // Handle transitions between screens
    const prevScreen = this.uiState.currentScreen;
    this.uiState.currentScreen = screenName;
    
    // Special handling for certain screen transitions
    if (screenName === 'game') {
      this.uiState.showHUD = true;
      this.uiState.isGamePaused = false;
      
      // 在第一次进入游戏时显示教程
      if (prevScreen === 'mainMenu' && !this.uiState.tutorialState.completed) {
        this.startTutorial();
      }
    }
    
    if (screenName === 'mainMenu') {
      this.uiState.showHUD = false;
      this.uiState.isGamePaused = true;
    }
    
    // Play UI sound if audio manager is available
    if (this.audioManager) {
      this.audioManager.playSound('button_click');
    }
    
    console.log(`UI switched from ${prevScreen} to ${screenName}`);
    return this.uiState.currentScreen;
  }
  
  // 教程系统新增方法
  startTutorial() {
    this.uiState.tutorialState.active = true;
    this.uiState.tutorialState.currentStep = 0;
    
    // 播放教程音效
    if (this.audioManager) {
      this.audioManager.playSound('alert');
    }
    
    console.log('Tutorial started');
    return this;
  }
  
  nextTutorialStep() {
    const { currentStep, steps } = this.uiState.tutorialState;
    
    if (currentStep < steps.length - 1) {
      this.uiState.tutorialState.currentStep = currentStep + 1;
      
      // 播放进度音效
      if (this.audioManager) {
        this.audioManager.playSound('button_click');
      }
    } else {
      this.completeTutorial();
    }
    
    return this;
  }
  
  previousTutorialStep() {
    const { currentStep } = this.uiState.tutorialState;
    
    if (currentStep > 0) {
      this.uiState.tutorialState.currentStep = currentStep - 1;
      
      // 播放音效
      if (this.audioManager) {
        this.audioManager.playSound('button_click');
      }
    }
    
    return this;
  }
  
  completeTutorial() {
    this.uiState.tutorialState.active = false;
    this.uiState.tutorialState.completed = true;
    
    // 添加完成通知
    this.addNotification('教程完成！按H键随时查看帮助。', 'success', 5000);
    
    // 播放完成音效
    if (this.audioManager) {
      this.audioManager.playSound('upgrade_complete');
    }
    
    console.log('Tutorial completed');
    return this;
  }
  
  skipTutorial() {
    this.uiState.tutorialState.active = false;
    this.uiState.tutorialState.completed = true;
    
    this.addNotification('教程已跳过。按H键随时查看帮助。', 'info', 3000);
    
    console.log('Tutorial skipped');
    return this;
  }
  
  togglePause() {
    this.uiState.isGamePaused = !this.uiState.isGamePaused;
    
    if (this.uiState.isGamePaused) {
      // Handle pause game logic
      if (this.audioManager) {
        this.audioManager.playSound('button_click');
      }
    } else {
      // Handle resume game logic
      if (this.audioManager) {
        this.audioManager.playSound('button_click');
      }
    }
    
    return this.uiState.isGamePaused;
  }
  
  showDialog(dialogData) {
    this.uiState.showDialog = true;
    this.uiState.dialogData = dialogData;
    
    // Play alert sound for dialog
    if (this.audioManager) {
      this.audioManager.playSound('alert');
    }
    
    return this;
  }
  
  hideDialog() {
    this.uiState.showDialog = false;
    this.uiState.dialogData = null;
    
    // Play UI sound
    if (this.audioManager) {
      this.audioManager.playSound('button_click');
    }
    
    return this;
  }
  
  addNotification(message, type = 'info', duration = 3000) {
    const notification = {
      id: Date.now(),
      message,
      type,
      duration
    };
    
    this.uiState.notifications.push(notification);
    
    // Auto-remove notification after duration
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, duration);
    
    return notification.id;
  }
  
  removeNotification(id) {
    this.uiState.notifications = this.uiState.notifications.filter(
      notification => notification.id !== id
    );
    
    return this;
  }
  
  updateHUD(gameState) {
    // This method would be called from the game loop to update HUD data
    // In React, this would trigger a state update in the HUD component
    
    // Implementation handled by React component
  }
}

// React component wrapper for UIManager
export function UIManagerComponent({ gameEngine }) {
  const [uiState, setUiState] = useState({
    currentScreen: 'mainMenu',
    isGamePaused: false,
    showHUD: false,
    showDialog: false,
    dialogData: null,
    notifications: [],
    tutorialState: {
      active: false,
      currentStep: 0,
      completed: false,
      steps: []
    }
  });
  
  // Functions to interact with the UI
  const handleStartGame = () => {
    // Initialize or reset game state
    if (gameEngine && gameEngine.gameState) {
      if (!gameEngine.isRunning) {
        gameEngine.start();
      } else if (gameEngine.gameState.isNewGame) {
        gameEngine.gameState.resetGame();
      }
    }
    
    // Play game start sound
    if (gameEngine && gameEngine.audioManager) {
      try {
        const audioManager = gameEngine.audioManager;
        // 增加错误处理，确保即使音频文件加载失败也不会阻塞游戏流程
        const musicId = 'main_theme';
        
        // 检查音频是否可用，不可用时不尝试播放
        if (audioManager.isInitialized && 
            (!audioManager.knownBrokenAudio || !audioManager.knownBrokenAudio.has(musicId))) {
          gameEngine.audioManager.playMusic(musicId, true, true);
        } else {
          console.log(`Skipping music ${musicId} as it appears to be unavailable`);
        }
      } catch (error) {
        console.warn('Failed to play main theme music, continuing without audio:', error);
      }
    }
    
    // Switch to game screen
    setUiState(prev => ({
      ...prev,
      currentScreen: 'game',
      showHUD: true,
      isGamePaused: false,
      tutorialState: {
        ...prev.tutorialState,
        active: !prev.tutorialState.completed
      }
    }));
  };
  
  const handleOpenStarMap = () => {
    // Pause game while viewing star map
    if (gameEngine) {
      gameEngine.pause();
    }
    
    setUiState(prev => ({
      ...prev,
      currentScreen: 'starMap',
      isGamePaused: true
    }));
  };
  
  const handleOpenUpgrades = () => {
    // Pause game while viewing upgrades
    if (gameEngine) {
      gameEngine.pause();
    }
    
    setUiState(prev => ({
      ...prev,
      currentScreen: 'upgrade',
      isGamePaused: true
    }));
  };
  
  const handleReturnToGame = () => {
    // Resume game
    if (gameEngine) {
      gameEngine.resume();
    }
    
    setUiState(prev => ({
      ...prev,
      currentScreen: 'game',
      isGamePaused: false
    }));
  };
  
  const handleReturnToMainMenu = () => {
    // Switch to main menu
    setUiState(prev => ({
      ...prev,
      currentScreen: 'mainMenu',
      showHUD: false,
      isGamePaused: true
    }));
    
    // Change music
    if (gameEngine && gameEngine.audioManager) {
      try {
        const audioManager = gameEngine.audioManager;
        // 增加错误处理，确保即使音频文件加载失败也不会阻塞游戏流程
        const musicId = 'main_theme';
        
        // 检查音频是否可用，不可用时不尝试播放
        if (audioManager.isInitialized && 
            (!audioManager.knownBrokenAudio || !audioManager.knownBrokenAudio.has(musicId))) {
          gameEngine.audioManager.playMusic(musicId, true, true);
        } else {
          console.log(`Skipping music ${musicId} as it appears to be unavailable`);
        }
      } catch (error) {
        console.warn('Failed to play main theme music, continuing without audio:', error);
      }
    }
  };
  
  const handleSaveGame = () => {
    if (gameEngine && gameEngine.gameState) {
      const success = gameEngine.gameState.saveGame();
      
      // Show notification
      if (success) {
        addNotification("游戏已保存", "success", 3000);
      } else {
        addNotification("保存失败", "error", 3000);
      }
    }
  };
  
  const handleLoadGame = () => {
    if (gameEngine && gameEngine.gameState) {
      const success = gameEngine.gameState.loadGame();
      
      if (success) {
        // Switch to game and notify
        setUiState(prev => ({
          ...prev,
          currentScreen: 'game',
          showHUD: true,
          isGamePaused: false
        }));
        
        addNotification("游戏已加载", "success", 3000);
        
        if (gameEngine.audioManager) {
          try {
            const audioManager = gameEngine.audioManager;
            // 增加错误处理，确保即使音频文件加载失败也不会阻塞游戏流程
            const musicId = 'space_ambient';
            
            // 检查音频是否可用，不可用时不尝试播放
            if (audioManager.isInitialized && 
                (!audioManager.knownBrokenAudio || !audioManager.knownBrokenAudio.has(musicId))) {
              audioManager.playMusic(musicId, true, true);
            } else {
              console.log(`Skipping music ${musicId} as it appears to be unavailable`);
            }
          } catch (error) {
            console.warn('Failed to play space ambient music, continuing without audio:', error);
          }
        }
      } else {
        addNotification("没有找到存档", "warning", 3000);
      }
    }
  };
  
  // 新增教程相关函数
  const handleNextTutorialStep = () => {
    setUiState(prev => {
      const { currentStep, steps } = prev.tutorialState;
      
      if (currentStep < steps.length - 1) {
        return {
          ...prev,
          tutorialState: {
            ...prev.tutorialState,
            currentStep: currentStep + 1
          }
        };
      } else {
        return {
          ...prev,
          tutorialState: {
            ...prev.tutorialState,
            active: false,
            completed: true
          }
        };
      }
    });
    
    // 播放UI声音
    if (gameEngine && gameEngine.audioManager) {
      gameEngine.audioManager.playSound('button_click');
    }
  };
  
  const handlePrevTutorialStep = () => {
    setUiState(prev => {
      const { currentStep } = prev.tutorialState;
      
      if (currentStep > 0) {
        return {
          ...prev,
          tutorialState: {
            ...prev.tutorialState,
            currentStep: currentStep - 1
          }
        };
      }
      return prev;
    });
    
    // 播放UI声音
    if (gameEngine && gameEngine.audioManager) {
      gameEngine.audioManager.playSound('button_click');
    }
  };
  
  const handleSkipTutorial = () => {
    setUiState(prev => ({
      ...prev,
      tutorialState: {
        ...prev.tutorialState,
        active: false,
        completed: true
      }
    }));
    
    addNotification("教程已跳过。按H键随时查看帮助。", "info", 3000);
  };
  
  // 通知系统
  const addNotification = (message, type = 'info', duration = 3000) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      duration
    };
    
    setUiState(prev => ({
      ...prev,
      notifications: [...prev.notifications, notification]
    }));
    
    // 自动移除通知
    setTimeout(() => {
      removeNotification(notification.id);
    }, duration);
    
    return notification.id;
  };
  
  const removeNotification = (id) => {
    setUiState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(note => note.id !== id)
    }));
  };
  
  // 同步UIManager
  useEffect(() => {
    if (gameEngine && gameEngine.uiManager) {
      // 更新UIManager的状态以匹配React组件
      gameEngine.uiManager.uiState = uiState;
      
      // 添加通知方法
      gameEngine.uiManager.addNotification = addNotification;
    }
  }, [gameEngine, uiState]);
  
  // 渲染当前UI界面
  const renderCurrentScreen = () => {
    switch (uiState.currentScreen) {
      case 'game':
        return (
          <GameHUD 
            gameEngine={gameEngine}
            onOpenStarMap={handleOpenStarMap}
            onOpenUpgrades={handleOpenUpgrades}
            onSaveGame={handleSaveGame}
            onReturnToMainMenu={handleReturnToMainMenu}
          />
        );
        
      case 'starMap':
        return (
          <StarMapScreen 
            gameEngine={gameEngine}
            onClose={handleReturnToGame}
          />
        );
        
      case 'upgrade':
        return (
          <UpgradeScreen 
            gameEngine={gameEngine}
            onClose={handleReturnToGame}
          />
        );
        
      case 'mainMenu':
      default:
        return (
          <MainMenuScreen 
            onStartGame={handleStartGame}
            onLoadGame={handleLoadGame}
          />
        );
    }
  };
  
  // 渲染通知
  const renderNotifications = () => {
    return (
      <div className="notifications-container">
        {uiState.notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`notification notification-${notification.type}`}
          >
            {notification.message}
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="ui-container">
      {renderCurrentScreen()}
      {renderNotifications()}
      
      {/* 教程覆盖层 */}
      {uiState.tutorialState.active && (
        <TutorialOverlay
          step={uiState.tutorialState.steps[uiState.tutorialState.currentStep]}
          currentStepIndex={uiState.tutorialState.currentStep}
          totalSteps={uiState.tutorialState.steps.length}
          onNext={handleNextTutorialStep}
          onPrevious={handlePrevTutorialStep}
          onSkip={handleSkipTutorial}
        />
      )}
    </div>
  );
}

export default UIManagerComponent;