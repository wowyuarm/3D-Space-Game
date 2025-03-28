import React, { useState, useEffect } from 'react';

/**
 * 资源收集覆盖界面组件
 * 显示资源收集过程中的进度和反馈
 *
 * @param {Object} props
 * @param {Object} props.gameEngine - 游戏引擎实例
 */
const ResourceCollectionOverlay = ({ gameEngine }) => {
  const [isCollecting, setIsCollecting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [planetName, setPlanetName] = useState('');
  const [collectedResources, setCollectedResources] = useState([]);

  // 定期检查资源收集状态
  useEffect(() => {
    if (!gameEngine) return;

    const checkCollectionStatus = () => {
      const resourceCollector = gameEngine.gameState?.resourceCollector;
      if (!resourceCollector) return;

      // 检查是否正在收集资源
      const collecting = resourceCollector.isCollecting();
      setIsCollecting(collecting);

      if (collecting) {
        // 更新进度
        setProgress(resourceCollector.getCollectionProgress());

        // 获取行星名称
        const planet = resourceCollector.getCurrentPlanet();
        if (planet && planet.userData) {
          setPlanetName(planet.userData.name || '未知行星');
        }

        // 获取已收集资源
        if (resourceCollector.collectedResources) {
          setCollectedResources([...resourceCollector.collectedResources]);
        }
      } else {
        // 重置状态
        setProgress(0);
        setPlanetName('');
        setCollectedResources([]);
      }
    };

    // 每100毫秒检查一次状态
    const interval = setInterval(checkCollectionStatus, 100);

    // 清理函数
    return () => clearInterval(interval);
  }, [gameEngine]);

  // 如果没有正在收集资源，不显示界面
  if (!isCollecting) return null;

  // 计算进度条宽度
  const progressWidth = `${progress * 100}%`;

  return (
    <div className="resource-collection-overlay">
      <div className="collection-container">
        <h3>正在收集资源</h3>
        <p className="planet-name">{planetName}</p>

        {/* 进度条 */}
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: progressWidth }}
          ></div>
        </div>

        {/* 按E键取消的提示 */}
        <p className="cancel-hint">按 E 键取消收集</p>

        {/* 已收集资源列表 */}
        {collectedResources.length > 0 && (
          <div className="collected-resources">
            <h4>已收集资源:</h4>
            <ul>
              {collectedResources.map((resource, index) => (
                <li key={index} className="resource-item">
                  <span className="resource-type">{resource.type}</span>
                  <span className="resource-amount">x{resource.amount.toFixed(1)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 粒子动画背景 */}
      <div className="collection-particles"></div>
    </div>
  );
};

export default ResourceCollectionOverlay; 