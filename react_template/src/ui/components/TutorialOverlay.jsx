import React, { useState, useEffect, useRef } from 'react';

/**
 * 游戏教程覆盖层组件
 * 用于向玩家展示游戏操作指南和教程步骤
 * 
 * @param {Object} props 
 * @param {boolean} props.isVisible - 控制教程是否可见
 * @param {Object} props.currentStep - 当前教程步骤信息对象
 * @param {Function} props.onNext - 下一步回调函数
 * @param {Function} props.onPrevious - 上一步回调函数
 * @param {Function} props.onComplete - 完成教程回调函数
 * @param {Function} props.onSkip - 跳过教程回调函数
 */
const TutorialOverlay = ({ 
  isVisible, 
  currentStep, 
  onNext, 
  onPrevious, 
  onComplete, 
  onSkip 
}) => {
  const [animation, setAnimation] = useState('fade-in');
  const highlightRef = useRef(null);

  // 如果教程不可见，返回null
  if (!isVisible || !currentStep) return null;

  // 处理动画效果
  useEffect(() => {
    if (isVisible) {
      setAnimation('fade-in');
    } else {
      setAnimation('fade-out');
    }
  }, [isVisible]);

  // 计算高亮元素位置
  useEffect(() => {
    if (!currentStep || !currentStep.highlightSelector) return;

    try {
      const element = document.querySelector(currentStep.highlightSelector);
      if (element && highlightRef.current) {
        const rect = element.getBoundingClientRect();
        highlightRef.current.style.top = `${rect.top}px`;
        highlightRef.current.style.left = `${rect.left}px`;
        highlightRef.current.style.width = `${rect.width}px`;
        highlightRef.current.style.height = `${rect.height}px`;
        highlightRef.current.style.display = 'block';
      }
    } catch (error) {
      console.error('高亮元素定位错误', error);
    }
  }, [currentStep]);

  // 是否是最后一步
  const isLastStep = currentStep.isLastStep;
  
  // 是否是第一步
  const isFirstStep = currentStep.isFirstStep;

  return (
    <div className={`tutorial-overlay ${animation}`}>
      {/* 半透明背景 */}
      <div className="tutorial-backdrop"></div>
      
      {/* 高亮区域 */}
      {currentStep.highlightSelector && (
        <div ref={highlightRef} className="tutorial-highlight"></div>
      )}
      
      {/* 教程内容 */}
      <div className="tutorial-content" style={currentStep.contentPosition || {}}>
        <div className="tutorial-header">
          <h3>{currentStep.title || '游戏教程'}</h3>
          <button className="close-button" onClick={onSkip}>×</button>
        </div>
        
        <div className="tutorial-body">
          <p>{currentStep.description}</p>
          
          {currentStep.image && (
            <img 
              src={currentStep.image} 
              alt={currentStep.title} 
              className="tutorial-image" 
            />
          )}
        </div>
        
        <div className="tutorial-footer">
          {!isFirstStep && (
            <button 
              className="tutorial-button previous-button" 
              onClick={onPrevious}
            >
              上一步
            </button>
          )}
          
          <button 
            className="tutorial-button skip-button" 
            onClick={onSkip}
          >
            跳过教程
          </button>
          
          {isLastStep ? (
            <button 
              className="tutorial-button complete-button" 
              onClick={onComplete}
            >
              完成
            </button>
          ) : (
            <button 
              className="tutorial-button next-button" 
              onClick={onNext}
            >
              下一步
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorialOverlay; 