// src/ui/screens/MainMenuScreen.jsx
import React, { useState, useEffect } from 'react';
import '../../index.css';

const MainMenuScreen = ({ onStartGame, onLoadGame }) => {
  const [menuState, setMenuState] = useState('main'); // main, options, credits
  const [animationClass, setAnimationClass] = useState('');
  const [settings, setSettings] = useState({
    musicVolume: 0.5,
    soundVolume: 0.8,
    pixelationLevel: 4,
    difficulty: 'normal'
  });
  
  console.log('MainMenuScreen rendered:', menuState);
  
  useEffect(() => {
    console.log('MainMenuScreen mounted');
    setAnimationClass('fade-in');
    
    // 星空背景动画设置
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
      console.log('找到星空画布，初始化星空背景');
      initStarsBackground(canvas);
    } else {
      console.warn('未找到星空画布！');
    }
    
    return () => {
      console.log('MainMenuScreen unmounted');
    };
  }, []);
  
  // 星空背景动画函数
  const initStarsBackground = (canvas) => {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // 创建星星
    const stars = [];
    const numStars = 300; // 增加星星数量
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`,
        speed: Math.random() * 0.3,
        twinkleSpeed: Math.random() * 0.05, // 闪烁速度
        twinkleAmount: Math.random() * 0.3, // 闪烁强度
        twinkleOffset: Math.random() * Math.PI * 2 // 闪烁偏移量
      });
    }
    
    // 创建遥远星云
    const nebulas = [];
    const numNebulas = 3;
    
    const nebulaColors = [
      'rgba(41, 121, 255, 0.1)', // 蓝色星云
      'rgba(255, 61, 87, 0.1)',  // 红色星云
      'rgba(170, 0, 255, 0.1)',  // 紫色星云
      'rgba(0, 212, 250, 0.1)',  // 青色星云
      'rgba(255, 188, 66, 0.1)'  // 黄色星云
    ];
    
    for (let i = 0; i < numNebulas; i++) {
      nebulas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 300 + 200,
        color: nebulaColors[Math.floor(Math.random() * nebulaColors.length)]
      });
    }
    
    // 动画函数
    function animateStars(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 渐变背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(5, 5, 25, 1)');
      gradient.addColorStop(1, 'rgba(15, 10, 50, 1)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // 绘制星云
      nebulas.forEach(nebula => {
        const grd = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, nebula.radius
        );
        grd.addColorStop(0, nebula.color);
        grd.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // 绘制星星
      stars.forEach(star => {
        // 计算闪烁效果
        const twinkle = star.twinkleAmount * Math.sin(time * 0.001 * star.twinkleSpeed + star.twinkleOffset);
        const radius = star.radius * (1 + twinkle);
        const alpha = Math.min(1, star.color.split(',')[3].slice(0, -1) * (1 + twinkle));
        
        ctx.beginPath();
        ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
        
        // 移动星星
        star.y += star.speed;
        
        // 星星超出屏幕时重置
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      
      requestAnimationFrame(animateStars);
    }
    
    animateStars(0);
    
    // 处理窗口大小调整
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  };
  
  const handleMenuChange = (newState) => {
    console.log(`菜单从 ${menuState} 切换至 ${newState}`);
    setAnimationClass('fade-out');
    
    // 等待淡出动画完成后再切换菜单
    setTimeout(() => {
      setMenuState(newState);
      setAnimationClass('fade-in');
    }, 300);
  };
  
  const handleStartClick = () => {
    console.log('点击开始游戏按钮，调用 onStartGame');
    if (typeof onStartGame === 'function') {
      onStartGame();
    } else {
      console.error('onStartGame 不是函数!', onStartGame);
    }
  };
  
  const handleLoadClick = () => {
    console.log('点击加载游戏按钮，调用 onLoadGame');
    if (typeof onLoadGame === 'function') {
      onLoadGame();
    } else {
      console.error('onLoadGame 不是函数!', onLoadGame);
    }
  };
  
  // 根据状态渲染相应的菜单内容
  const renderMenuContent = () => {
    switch (menuState) {
      case 'options':
        return (
          <div className={`menu-container ${animationClass}`}>
            <h2 className="menu-title">游戏设置</h2>
            
            <div className="option-row">
              <label htmlFor="music-volume">音乐音量</label>
              <input 
                type="range" 
                id="music-volume" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => setSettings({...settings, musicVolume: parseFloat(e.target.value)})}
              />
              <span className="option-value">{Math.round(settings.musicVolume * 100)}%</span>
            </div>
            
            <div className="option-row">
              <label htmlFor="sound-volume">音效音量</label>
              <input 
                type="range" 
                id="sound-volume" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => setSettings({...settings, soundVolume: parseFloat(e.target.value)})}
              />
              <span className="option-value">{Math.round(settings.soundVolume * 100)}%</span>
            </div>
            
            <div className="option-row">
              <label htmlFor="pixelation">像素化效果</label>
              <input 
                type="range" 
                id="pixelation" 
                min="1" 
                max="8" 
                step="1"
                value={settings.pixelationLevel}
                onChange={(e) => setSettings({...settings, pixelationLevel: parseInt(e.target.value)})}
              />
              <span className="option-value">{settings.pixelationLevel}</span>
            </div>
            
            <div className="option-row">
              <label htmlFor="difficulty">难度</label>
              <select 
                id="difficulty"
                value={settings.difficulty}
                onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
                className="select-styled"
              >
                <option value="easy">简单</option>
                <option value="normal">中等</option>
                <option value="hard">困难</option>
              </select>
            </div>
            
            <button 
              className="menu-button back-button" 
              onClick={() => handleMenuChange('main')}
            >
              返回
            </button>
          </div>
        );
        
      case 'credits':
        return (
          <div className={`menu-container ${animationClass}`}>
            <h2 className="menu-title">制作团队</h2>
            
            <div className="credits-content">
              <p><strong>像素星际探索者</strong></p>
              <p>一段穿越程序生成星系的怀旧之旅</p>
              <p>&nbsp;</p>
              <p><strong>开发团队</strong></p>
              <p>游戏设计 - 星际探索者</p>
              <p>编程 - 宇宙编码者</p>
              <p>像素艺术 - 复古画师</p>
              <p>音乐与音效 - 太空音匠</p>
              <p>&nbsp;</p>
              <p><strong>特别鸣谢</strong></p>
              <p>感谢所有启发这次冒险的经典太空游戏</p>
            </div>
            
            <button 
              className="menu-button back-button" 
              onClick={() => handleMenuChange('main')}
            >
              返回
            </button>
          </div>
        );
        
      case 'main':
      default:
        return (
          <div className={`menu-container ${animationClass}`}>
            <h1 className="game-title">像素<br />星际探索者</h1>
            
            <div className="menu-buttons">
              <button 
                className="menu-button primary-button" 
                onClick={handleStartClick}
              >
                开始新游戏
              </button>
              
              <button 
                className="menu-button" 
                onClick={handleLoadClick}
              >
                加载游戏
              </button>
              
              <button 
                className="menu-button" 
                onClick={() => handleMenuChange('options')}
              >
                游戏设置
              </button>
              
              <button 
                className="menu-button" 
                onClick={() => handleMenuChange('credits')}
              >
                制作团队
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="main-menu-screen">
      <canvas id="stars-canvas" className="stars-background"></canvas>
      
      {renderMenuContent()}
      
      <div className="version-info">
        v0.1.0 Alpha
      </div>
    </div>
  );
};

export default MainMenuScreen;