// src/ui/screens/TutorialOverlay.jsx
import React, { useState, useEffect } from 'react';

/**
 * 教程覆盖组件，用于显示游戏指导和教程步骤
 * 
 * @param {Object} step - 当前教程步骤数据
 * @param {number} currentStepIndex - 当前步骤索引
 * @param {number} totalSteps - 总步骤数量
 * @param {Function} onNext - 下一步回调
 * @param {Function} onPrevious - 上一步回调
 * @param {Function} onSkip - 跳过教程回调
 */
const TutorialOverlay = ({ 
  step, 
  currentStepIndex, 
  totalSteps, 
  onNext, 
  onPrevious, 
  onSkip 
}) => {
  // 状态用于控制高亮元素的效果
  const [highlightPosition, setHighlightPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    height: 0
  });
  
  // 根据步骤中指定的元素ID查找并设置高亮位置
  useEffect(() => {
    if (step && step.highlight) {
      // 找到需要高亮的元素
      const element = document.querySelector(`.${step.highlight}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        
        // 更新高亮位置
        setHighlightPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      }
    }
  }, [step]);
  
  // 如果没有步骤数据，不渲染任何内容
  if (!step) return null;
  
  // 计算教程框的位置类
  const getPositionClass = () => {
    switch (step.position) {
      case 'top': return 'position-top';
      case 'right': return 'position-right';
      case 'bottom': return 'position-bottom';
      case 'left': return 'position-left';
      default: return 'position-center';
    }
  };
  
  return (
    <div className="tutorial-overlay">
      {/* 半透明背景 */}
      <div className="tutorial-backdrop"></div>
      
      {/* 高亮区域 */}
      {step.highlight && (
        <div 
          className="tutorial-highlight"
          style={{
            top: `${highlightPosition.top}px`,
            left: `${highlightPosition.left}px`,
            width: `${highlightPosition.width}px`,
            height: `${highlightPosition.height}px`
          }}
        ></div>
      )}
      
      {/* 教程内容框 */}
      <div className={`tutorial-content ${getPositionClass()}`}>
        <h3>{step.title}</h3>
        <p>{step.content}</p>
        
        {/* 按钮区域 */}
        <div className="tutorial-controls">
          {/* 步骤指示器 */}
          <div className="tutorial-progress">
            {currentStepIndex + 1} / {totalSteps}
          </div>
          
          {/* 导航按钮 */}
          <div className="tutorial-buttons">
            {currentStepIndex > 0 && (
              <button className="tutorial-button" onClick={onPrevious}>
                上一步
              </button>
            )}
            
            <button className="tutorial-button" onClick={onNext}>
              {currentStepIndex < totalSteps - 1 ? '下一步' : '完成'}
            </button>
            
            <button className="tutorial-button tutorial-skip" onClick={onSkip}>
              跳过教程
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay;