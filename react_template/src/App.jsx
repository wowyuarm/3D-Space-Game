// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine';
import { UIManagerComponent } from './ui/UIManager.jsx';
import { applyErrorFixes } from './utils/ErrorFixes';
import './index.css';
import './ui/styles/tutorial.css';
import './ui/styles/notifications.css';
import './ui/styles/resourceCollection.css';
import './ui/styles/gameHud.css';

function App() {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const [engineInitialized, setEngineInitialized] = useState(false);
  const [initError, setInitError] = useState(null);
  const [initAttempts, setInitAttempts] = useState(0);
  const maxInitAttempts = 3;

  // 初始化游戏引擎，并处理可能的失败情况
  useEffect(() => {
    if (!canvasRef.current || gameEngineRef.current) return;
    
    console.log('App.jsx: 启动游戏引擎初始化流程...');
    
    // 创建游戏引擎实例
    const gameEngine = new GameEngine();
    
    // 应用错误修复
    console.log('App.jsx: 应用错误修复工具...');
    applyErrorFixes(gameEngine);
    
    gameEngineRef.current = gameEngine;
    
    // 强制在window对象上保存gameEngine引用以便调试
    window.gameEngine = gameEngine;

    // 等待下一帧以确保canvas已正确添加到DOM中
    requestAnimationFrame(async () => {
      try {
        console.log('App.jsx: 开始初始化游戏引擎...');
        
        // 初始化引擎，传递Canvas元素
        const initialized = await gameEngine.init(canvasRef.current);
        
        if (initialized) {
          console.log('App.jsx: 游戏引擎初始化成功!');
          setEngineInitialized(true);
          setInitError(null);
          
          // 处理窗口大小变更
          const handleResize = () => {
            if (gameEngine.renderer) {
              gameEngine.renderer.setResolution(window.innerWidth, window.innerHeight);
            }
          };
          window.addEventListener('resize', handleResize);
          
          // 添加键盘事件监听器，显示/隐藏控制帮助
          const controlsHelp = document.querySelector('.controls-help');
          if (controlsHelp) {
            window.addEventListener('keydown', (e) => {
              if (e.key === 'h' || e.key === 'H') {
                controlsHelp.classList.toggle('visible');
              }
            });
          }
          
          return () => {
            window.removeEventListener('resize', handleResize);
          };
        } else {
          console.error("App.jsx: 游戏引擎初始化失败");
          setInitError("引擎初始化失败，请检查控制台以获取详细信息");
          
          // 尝试再次初始化
          if (initAttempts < maxInitAttempts) {
            console.log(`App.jsx: 尝试重新初始化 (${initAttempts + 1}/${maxInitAttempts})`);
            setInitAttempts(prev => prev + 1);
            
            // 销毁当前实例，下一个useEffect循环将创建新实例
            try {
              gameEngineRef.current.dispose();
            } catch (error) {
              console.error('清理游戏引擎资源时出错:', error);
            }
            gameEngineRef.current = null;
          }
        }
      } catch (error) {
        console.error("App.jsx: 游戏引擎初始化过程中发生异常:", error);
        setInitError(`初始化错误: ${error.message}`);
        
        // 尝试再次初始化
        if (initAttempts < maxInitAttempts) {
          console.log(`App.jsx: 尝试重新初始化 (${initAttempts + 1}/${maxInitAttempts})`);
          setInitAttempts(prev => prev + 1);
          
          // 销毁当前实例
          try {
            if (gameEngineRef.current) {
              gameEngineRef.current.dispose();
            }
          } catch (error) {
            console.error('清理游戏引擎资源时出错:', error);
          }
          gameEngineRef.current = null;
        }
      }
    });
    
    return () => {
      // 组件卸载时清理游戏引擎
      if (gameEngineRef.current) {
        console.log('App.jsx: 清理游戏引擎资源');
        try {
          gameEngineRef.current.dispose();
        } catch (error) {
          console.error('清理游戏引擎资源时出错:', error);
        }
        gameEngineRef.current = null;
        window.gameEngine = null;
      }
    };
  }, [initAttempts]);

  // 强制UI层显示，即使引擎未完全初始化
  const forceShowUI = initAttempts >= maxInitAttempts;

  return (
    <div className="game-container">
      {/* 3D渲染画布 */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
      
      {/* 错误消息 */}
      {initError && (
        <div className="init-error">
          <h2>初始化问题</h2>
          <p>{initError}</p>
          {forceShowUI && (
            <p>尝试继续加载UI，但游戏功能可能受限</p>
          )}
        </div>
      )}
      
      {/* UI层 - 即使初始化失败，在最大尝试次数后也显示 */}
      {(engineInitialized || forceShowUI) && gameEngineRef.current && (
        <UIManagerComponent gameEngine={gameEngineRef.current} />
      )}
    </div>
  );
}

export default App;