// src/App.jsx
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameEngine } from './engine/GameEngine';
import { UIManagerComponent } from './ui/UIManager.jsx';
import './index.css';
import './ui/styles/tutorial.css';
import './ui/styles/notifications.css';
import './ui/styles/resourceCollection.css';
import './ui/styles/gameHud.css';

function App() {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const [engineInitialized, setEngineInitialized] = useState(false);

  // Initialize the game engine on component mount
  useEffect(() => {
    if (!canvasRef.current || gameEngineRef.current) return;

    // Create and initialize game engine
    const gameEngine = new GameEngine();
    gameEngineRef.current = gameEngine;

    // Wait for the next frame to ensure canvas is properly in the DOM
    requestAnimationFrame(() => {
      gameEngine.initialize(canvasRef.current);
      setEngineInitialized(true);
      
      // Handle window resize events
      const handleResize = () => {
        if (gameEngine.renderer) {
          gameEngine.renderer.setResolution(window.innerWidth, window.innerHeight);
        }
      };
      window.addEventListener('resize', handleResize);
      
      // Add keyboard event listener to show/hide controls help
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
    });
    
    return () => {
      // Clean up game engine if component unmounts
      if (gameEngineRef.current) {
        // Any cleanup needed for the game engine
      }
    };
  }, []);

  return (
    <div className="game-container">
      {/* 3D Rendering Canvas */}
      <canvas
        ref={canvasRef}
        className="game-canvas"
      />
      
      {/* UI Layer */}
      {engineInitialized && gameEngineRef.current && (
        <UIManagerComponent gameEngine={gameEngineRef.current} />
      )}
    </div>
  );
}

export default App;