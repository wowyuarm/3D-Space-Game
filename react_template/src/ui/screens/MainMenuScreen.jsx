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
  
  // Add entrance animation when component mounts
  useEffect(() => {
    setAnimationClass('fade-in');
    
    // Stars background animation setup
    const canvas = document.getElementById('stars-canvas');
    if (canvas) {
      initStarsBackground(canvas);
    }
    
    return () => {
      // Cleanup animations or event listeners if necessary
    };
  }, []);
  
  // Function to animate stars in background
  const initStarsBackground = (canvas) => {
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Create stars
    const stars = [];
    const numStars = 200;
    
    for (let i = 0; i < numStars; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        color: `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`,
        speed: Math.random() * 0.3
      });
    }
    
    // Animation function
    function animateStars() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(0, 0, 17, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = star.color;
        ctx.fill();
        
        // Move star
        star.y += star.speed;
        
        // Reset if star goes off screen
        if (star.y > canvas.height) {
          star.y = 0;
          star.x = Math.random() * canvas.width;
        }
      });
      
      requestAnimationFrame(animateStars);
    }
    
    animateStars();
    
    // Handle resize
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
  };
  
  const handleMenuChange = (newState) => {
    setAnimationClass('fade-out');
    
    // Wait for fade out animation to complete before changing menu
    setTimeout(() => {
      setMenuState(newState);
      setAnimationClass('fade-in');
    }, 300);
  };
  
  // Render appropriate menu content based on state
  const renderMenuContent = () => {
    switch (menuState) {
      case 'options':
        return (
          <div className={`menu-container ${animationClass}`}>
            <h2>Game Options</h2>
            
            <div className="option-row">
              <label htmlFor="music-volume">Music Volume</label>
              <input 
                type="range" 
                id="music-volume" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.musicVolume}
                onChange={(e) => setSettings({...settings, musicVolume: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="option-row">
              <label htmlFor="sound-volume">Sound Effects</label>
              <input 
                type="range" 
                id="sound-volume" 
                min="0" 
                max="1" 
                step="0.1"
                value={settings.soundVolume}
                onChange={(e) => setSettings({...settings, soundVolume: parseFloat(e.target.value)})}
              />
            </div>
            
            <div className="option-row">
              <label htmlFor="pixelation">Pixelation Effect</label>
              <input 
                type="range" 
                id="pixelation" 
                min="1" 
                max="8" 
                step="1"
                value={settings.pixelationLevel}
                onChange={(e) => setSettings({...settings, pixelationLevel: parseInt(e.target.value)})}
              />
            </div>
            
            <div className="option-row">
              <label htmlFor="difficulty">Difficulty</label>
              <select 
                id="difficulty"
                value={settings.difficulty}
                onChange={(e) => setSettings({...settings, difficulty: e.target.value})}
              >
                <option value="easy">Easy</option>
                <option value="normal">Normal</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button 
              className="menu-button back-button" 
              onClick={() => handleMenuChange('main')}
            >
              Back
            </button>
          </div>
        );
        
      case 'credits':
        return (
          <div className={`menu-container ${animationClass}`}>
            <h2>Credits</h2>
            
            <div className="credits-content">
              <p><strong>Retro Pixel Space Explorer</strong></p>
              <p>A nostalgic journey through procedurally generated galaxies</p>
              <p>&nbsp;</p>
              <p><strong>Development Team</strong></p>
              <p>Game Design - Alex Explorer</p>
              <p>Programming - Cosmo Coder</p>
              <p>Pixel Art - Retro Painter</p>
              <p>Music & Sound - Space Soundsmith</p>
              <p>&nbsp;</p>
              <p><strong>Special Thanks</strong></p>
              <p>To all the classic space games that inspired this adventure</p>
            </div>
            
            <button 
              className="menu-button back-button" 
              onClick={() => handleMenuChange('main')}
            >
              Back
            </button>
          </div>
        );
        
      case 'main':
      default:
        return (
          <div className={`menu-container ${animationClass}`}>
            <h1 className="game-title">Retro Pixel<br />Space Explorer</h1>
            
            <div className="menu-buttons">
              <button 
                className="menu-button primary-button" 
                onClick={onStartGame}
              >
                New Game
              </button>
              
              <button 
                className="menu-button" 
                onClick={onLoadGame}
              >
                Load Game
              </button>
              
              <button 
                className="menu-button" 
                onClick={() => handleMenuChange('options')}
              >
                Options
              </button>
              
              <button 
                className="menu-button" 
                onClick={() => handleMenuChange('credits')}
              >
                Credits
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