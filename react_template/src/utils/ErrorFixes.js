/**
 * 游戏引擎错误修复工具
 * 提供各种工具函数来修复游戏引擎初始化和运行过程中的常见错误
 */

// 常见错误列表和修复方法
const knownErrors = {
  'animatePlanets': 'updatePlanetAnimations', // 方法名错误
  'Howler.pause': '应该使用单独暂停各音频对象', // Howler API错误
  'e.unload is not a function': '对象没有unload方法', // 资源清理错误
  'e.dispose is not a function': '对象没有dispose方法', // 资源清理错误
};

/**
 * 应用游戏引擎错误修复 - 在初始化游戏之前调用
 * @param {Object} gameEngine 游戏引擎实例
 * @returns {Object} 修复后的游戏引擎实例
 */
export function applyErrorFixes(gameEngine) {
  if (!gameEngine) return null;
  
  console.log('应用游戏引擎错误修复...');
  
  try {
    // 1. 修复GameState中使用animatePlanets的问题
    if (gameEngine.gameState && !gameEngine.gameState.animatePlanets && 
        typeof gameEngine.gameState.updatePlanetAnimations === 'function') {
      gameEngine.gameState.animatePlanets = gameEngine.gameState.updatePlanetAnimations;
      console.log('已修复: animatePlanets方法映射到updatePlanetAnimations');
    }
    
    // 2. 确保AudioManager的方法安全
    if (gameEngine.audioManager) {
      // 安全的暂停方法
      const originalPauseAll = gameEngine.audioManager.pauseAll;
      gameEngine.audioManager.pauseAll = function() {
        try {
          // 如果原方法可用，则调用
          if (typeof originalPauseAll === 'function') {
            originalPauseAll.call(gameEngine.audioManager);
          } else {
            // 否则使用安全的替代实现
            console.log('使用安全的音频暂停替代实现');
            
            // 暂停所有音效
            if (gameEngine.audioManager.sounds instanceof Map) {
              gameEngine.audioManager.sounds.forEach(sound => {
                if (sound && typeof sound.pause === 'function') {
                  sound.pause();
                }
              });
            }
            
            // 暂停所有音乐
            if (gameEngine.audioManager.music instanceof Map) {
              gameEngine.audioManager.music.forEach(music => {
                if (music && typeof music.pause === 'function') {
                  music.pause();
                }
              });
            }
          }
        } catch (error) {
          console.error('错误修复器: 音频暂停出错', error);
        }
      };
      
      // 安全的dispose方法
      const originalDispose = gameEngine.audioManager.dispose;
      gameEngine.audioManager.dispose = function() {
        try {
          // 如果原方法可用，则调用
          if (typeof originalDispose === 'function') {
            originalDispose.call(gameEngine.audioManager);
          } else {
            console.log('使用安全的音频资源释放替代实现');
            
            // 停止所有音效
            if (gameEngine.audioManager.sounds instanceof Map) {
              gameEngine.audioManager.sounds.forEach(sound => {
                if (sound && typeof sound.stop === 'function') {
                  sound.stop();
                }
              });
              gameEngine.audioManager.sounds.clear();
            }
            
            // 停止所有音乐
            if (gameEngine.audioManager.music instanceof Map) {
              gameEngine.audioManager.music.forEach(music => {
                if (music && typeof music.stop === 'function') {
                  music.stop();
                }
              });
              gameEngine.audioManager.music.clear();
            }
            
            gameEngine.audioManager.currentMusic = null;
          }
        } catch (error) {
          console.error('错误修复器: 音频资源释放出错', error);
        }
      };
      
      console.log('已修复: AudioManager方法安全包装');
    }
    
    // 3. 确保游戏引擎dispose方法安全
    const originalEngineDispose = gameEngine.dispose;
    gameEngine.dispose = function() {
      try {
        console.log('安全释放游戏引擎资源...');
        
        // 停止游戏引擎
        if (typeof gameEngine.pause === 'function') {
          gameEngine.pause();
        }
        
        // 安全释放各组件资源
        const components = [
          'renderer', 'audioManager', 'inputManager', 
          'physicsSystem', 'gameState', 'uiManager',
          'postProcessor', 'resourceManager'
        ];
        
        components.forEach(componentName => {
          const component = gameEngine[componentName];
          if (component && typeof component.dispose === 'function') {
            try {
              component.dispose();
              console.log(`成功释放 ${componentName} 资源`);
            } catch (err) {
              console.warn(`释放 ${componentName} 资源出错:`, err);
            }
          }
        });
        
        // 清除THREE.js场景资源
        if (gameEngine.scene) {
          try {
            disposeScene(gameEngine.scene);
          } catch (err) {
            console.warn('释放场景资源出错:', err);
          }
        }
        
        // 清空所有引用
        components.forEach(componentName => {
          gameEngine[componentName] = null;
        });
        
        gameEngine.scene = null;
        gameEngine.camera = null;
        gameEngine.stars = null;
        gameEngine.isInitialized = false;
        
        console.log('所有游戏引擎资源已安全释放');
        
        // 如果原始方法可用，则尝试调用
        if (typeof originalEngineDispose === 'function') {
          // 防止重复执行，这里不调用原始方法
          // originalEngineDispose.call(gameEngine);
        }
      } catch (error) {
        console.error('错误修复器: 游戏引擎资源释放出错', error);
      }
      
      return gameEngine;
    };
    
    console.log('已修复: GameEngine资源释放方法');
  } catch (error) {
    console.error('应用错误修复失败:', error);
  }
  
  console.log('错误修复完成');
  return gameEngine;
}

/**
 * 安全地释放THREE.js场景资源
 * @param {THREE.Scene} scene 要释放的场景
 */
function disposeScene(scene) {
  if (!scene) return;
  
  try {
    // 递归处理所有子对象
    scene.traverse(object => {
      // 释放几何体
      if (object.geometry && typeof object.geometry.dispose === 'function') {
        object.geometry.dispose();
      }
      
      // 释放材质
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => {
            if (material && typeof material.dispose === 'function') {
              material.dispose();
            }
          });
        } else if (typeof object.material.dispose === 'function') {
          object.material.dispose();
        }
      }
    });
    
    // 清空场景
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    
    console.log('场景资源已释放');
  } catch (error) {
    console.error('释放场景资源时出错:', error);
  }
} 