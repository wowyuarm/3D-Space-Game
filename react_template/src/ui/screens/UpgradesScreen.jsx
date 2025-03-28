import React, { useState, useEffect } from 'react';

const UpgradesScreen = ({ gameEngine, onClose }) => {
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableUpgrades, setAvailableUpgrades] = useState([]);
  const [playerResources, setPlayerResources] = useState({});
  
  useEffect(() => {
    if (!gameEngine || !gameEngine.gameState) return;
    
    // 获取升级类别
    const upgradeCategories = ['飞船', '武器', '防御', '引擎', '探测器', '采集器'];
    setCategories(upgradeCategories);
    setSelectedCategory(upgradeCategories[0]);
    
    // 初始化玩家资源
    updatePlayerResources();
    
    // 监听资源变化
    const handleResourceChanged = () => {
      updatePlayerResources();
    };
    
    gameEngine.eventBus.on('resourceChanged', handleResourceChanged);
    
    return () => {
      gameEngine.eventBus.off('resourceChanged', handleResourceChanged);
    };
  }, [gameEngine]);
  
  // 更新玩家资源
  const updatePlayerResources = () => {
    if (!gameEngine || !gameEngine.gameState || !gameEngine.gameState.player) return;
    
    const resources = gameEngine.gameState.player.resources || {};
    setPlayerResources(resources);
  };
  
  // 当选择类别变化时，更新可用升级列表
  useEffect(() => {
    if (!selectedCategory || !gameEngine || !gameEngine.gameState) return;
    
    // 模拟获取可用升级列表
    const upgrades = getUpgradesByCategory(selectedCategory, gameEngine);
    setAvailableUpgrades(upgrades);
  }, [selectedCategory, gameEngine]);
  
  // 根据类别获取升级列表
  const getUpgradesByCategory = (category, gameEngine) => {
    // 这里应该从游戏引擎获取真实的升级数据
    // 暂时模拟一些升级数据用于演示
    
    const player = gameEngine.gameState.player;
    const playerLevel = player?.level || 1;
    
    // 基于玩家等级和类别生成升级列表
    let upgrades = [];
    
    switch(category) {
      case '飞船':
        upgrades = [
          {
            id: 'ship_hull',
            name: '船体强化',
            description: '增强飞船的整体结构，提高最大生命值',
            level: player?.shipUpgrades?.hull || 0,
            maxLevel: 5,
            stats: [
              { name: '生命值', value: '+20%', color: '#4caf50' },
              { name: '重量', value: '+5%', color: '#ff9800' }
            ],
            costs: {
              credits: 1000 * (player?.shipUpgrades?.hull + 1 || 1),
              metal: 50 * (player?.shipUpgrades?.hull + 1 || 1),
              crystal: 20 * (player?.shipUpgrades?.hull + 1 || 1)
            },
            effect: (player) => {
              if (!player.shipUpgrades) player.shipUpgrades = {};
              player.shipUpgrades.hull = (player.shipUpgrades.hull || 0) + 1;
              player.maxHealth += 20;
            },
            available: playerLevel >= 1
          },
          {
            id: 'ship_cargo',
            name: '货舱扩展',
            description: '扩大飞船的货物容量，可以携带更多资源',
            level: player?.shipUpgrades?.cargo || 0,
            maxLevel: 5,
            stats: [
              { name: '货舱容量', value: '+30%', color: '#4caf50' },
              { name: '速度', value: '-3%', color: '#f44336' }
            ],
            costs: {
              credits: 800 * (player?.shipUpgrades?.cargo + 1 || 1),
              metal: 40 * (player?.shipUpgrades?.cargo + 1 || 1)
            },
            effect: (player) => {
              if (!player.shipUpgrades) player.shipUpgrades = {};
              player.shipUpgrades.cargo = (player.shipUpgrades.cargo || 0) + 1;
              player.maxCargo += 100;
            },
            available: playerLevel >= 1
          },
          {
            id: 'ship_shield',
            name: '护盾发生器',
            description: '安装高级护盾发生器，提供额外的防护层',
            level: player?.shipUpgrades?.shield || 0,
            maxLevel: 5,
            stats: [
              { name: '护盾强度', value: '+25%', color: '#4caf50' },
              { name: '能量消耗', value: '+10%', color: '#f44336' }
            ],
            costs: {
              credits: 1500 * (player?.shipUpgrades?.shield + 1 || 1),
              crystal: 50 * (player?.shipUpgrades?.shield + 1 || 1),
              plasma: 10 * (player?.shipUpgrades?.shield + 1 || 1)
            },
            effect: (player) => {
              if (!player.shipUpgrades) player.shipUpgrades = {};
              player.shipUpgrades.shield = (player.shipUpgrades.shield || 0) + 1;
              player.maxShield += 25;
            },
            available: playerLevel >= 2
          }
        ];
        break;
        
      case '武器':
        upgrades = [
          {
            id: 'weapon_laser',
            name: '激光武器升级',
            description: '提高激光武器的功率和精准度',
            level: player?.weaponUpgrades?.laser || 0,
            maxLevel: 5,
            stats: [
              { name: '伤害', value: '+15%', color: '#4caf50' },
              { name: '射程', value: '+10%', color: '#4caf50' }
            ],
            costs: {
              credits: 1200 * (player?.weaponUpgrades?.laser + 1 || 1),
              metal: 30 * (player?.weaponUpgrades?.laser + 1 || 1),
              crystal: 45 * (player?.weaponUpgrades?.laser + 1 || 1)
            },
            effect: (player) => {
              if (!player.weaponUpgrades) player.weaponUpgrades = {};
              player.weaponUpgrades.laser = (player.weaponUpgrades.laser || 0) + 1;
            },
            available: playerLevel >= 2
          },
          {
            id: 'weapon_missile',
            name: '导弹系统',
            description: '安装可追踪的导弹系统，对大型目标有效',
            level: player?.weaponUpgrades?.missile || 0,
            maxLevel: 3,
            stats: [
              { name: '爆炸伤害', value: '+25%', color: '#4caf50' },
              { name: '装填时间', value: '3秒', color: '#ff9800' }
            ],
            costs: {
              credits: 2000 * (player?.weaponUpgrades?.missile + 1 || 1),
              metal: 60 * (player?.weaponUpgrades?.missile + 1 || 1),
              plasma: 20 * (player?.weaponUpgrades?.missile + 1 || 1)
            },
            effect: (player) => {
              if (!player.weaponUpgrades) player.weaponUpgrades = {};
              player.weaponUpgrades.missile = (player.weaponUpgrades.missile || 0) + 1;
            },
            available: playerLevel >= 3
          }
        ];
        break;
        
      case '防御':
        upgrades = [
          {
            id: 'defense_armor',
            name: '装甲强化',
            description: '使用先进材料强化飞船装甲，减少受到的伤害',
            level: player?.defenseUpgrades?.armor || 0,
            maxLevel: 5,
            stats: [
              { name: '伤害减免', value: '+10%', color: '#4caf50' },
              { name: '重量', value: '+7%', color: '#ff9800' }
            ],
            costs: {
              credits: 1100 * (player?.defenseUpgrades?.armor + 1 || 1),
              metal: 70 * (player?.defenseUpgrades?.armor + 1 || 1)
            },
            effect: (player) => {
              if (!player.defenseUpgrades) player.defenseUpgrades = {};
              player.defenseUpgrades.armor = (player.defenseUpgrades.armor || 0) + 1;
            },
            available: playerLevel >= 1
          },
          {
            id: 'defense_shield_regen',
            name: '护盾再生',
            description: '提高护盾恢复速率，在战斗中更具生存能力',
            level: player?.defenseUpgrades?.shieldRegen || 0,
            maxLevel: 3,
            stats: [
              { name: '护盾恢复', value: '+15%/秒', color: '#4caf50' },
              { name: '能量消耗', value: '+8%', color: '#f44336' }
            ],
            costs: {
              credits: 1800 * (player?.defenseUpgrades?.shieldRegen + 1 || 1),
              crystal: 60 * (player?.defenseUpgrades?.shieldRegen + 1 || 1),
              plasma: 15 * (player?.defenseUpgrades?.shieldRegen + 1 || 1)
            },
            effect: (player) => {
              if (!player.defenseUpgrades) player.defenseUpgrades = {};
              player.defenseUpgrades.shieldRegen = (player.defenseUpgrades.shieldRegen || 0) + 1;
            },
            available: playerLevel >= 3
          }
        ];
        break;
        
      case '引擎':
        upgrades = [
          {
            id: 'engine_speed',
            name: '引擎推力增强',
            description: '提高引擎的最大输出功率，增加飞船的最高速度',
            level: player?.engineUpgrades?.speed || 0,
            maxLevel: 5,
            stats: [
              { name: '最高速度', value: '+12%', color: '#4caf50' },
              { name: '燃料消耗', value: '+5%', color: '#f44336' }
            ],
            costs: {
              credits: 1000 * (player?.engineUpgrades?.speed + 1 || 1),
              metal: 40 * (player?.engineUpgrades?.speed + 1 || 1),
              plasma: 10 * (player?.engineUpgrades?.speed + 1 || 1)
            },
            effect: (player) => {
              if (!player.engineUpgrades) player.engineUpgrades = {};
              player.engineUpgrades.speed = (player.engineUpgrades.speed || 0) + 1;
            },
            available: playerLevel >= 1
          },
          {
            id: 'engine_efficiency',
            name: '燃料效率',
            description: '优化引擎燃料消耗，降低航行和加速时的能源需求',
            level: player?.engineUpgrades?.efficiency || 0,
            maxLevel: 4,
            stats: [
              { name: '燃料消耗', value: '-8%', color: '#4caf50' }
            ],
            costs: {
              credits: 900 * (player?.engineUpgrades?.efficiency + 1 || 1),
              crystal: 30 * (player?.engineUpgrades?.efficiency + 1 || 1)
            },
            effect: (player) => {
              if (!player.engineUpgrades) player.engineUpgrades = {};
              player.engineUpgrades.efficiency = (player.engineUpgrades.efficiency || 0) + 1;
            },
            available: playerLevel >= 2
          }
        ];
        break;
        
      case '探测器':
        upgrades = [
          {
            id: 'scanner_range',
            name: '扫描范围',
            description: '增加探测器的范围，可以从更远距离探测资源和危险',
            level: player?.scannerUpgrades?.range || 0,
            maxLevel: 4,
            stats: [
              { name: '扫描范围', value: '+25%', color: '#4caf50' }
            ],
            costs: {
              credits: 800 * (player?.scannerUpgrades?.range + 1 || 1),
              crystal: 25 * (player?.scannerUpgrades?.range + 1 || 1)
            },
            effect: (player) => {
              if (!player.scannerUpgrades) player.scannerUpgrades = {};
              player.scannerUpgrades.range = (player.scannerUpgrades.range || 0) + 1;
            },
            available: playerLevel >= 1
          },
          {
            id: 'scanner_precision',
            name: '扫描精度',
            description: '提高探测器的精确度，显示更详细的资源信息',
            level: player?.scannerUpgrades?.precision || 0,
            maxLevel: 3,
            stats: [
              { name: '探测精度', value: '+30%', color: '#4caf50' },
              { name: '能量消耗', value: '+5%', color: '#f44336' }
            ],
            costs: {
              credits: 1200 * (player?.scannerUpgrades?.precision + 1 || 1),
              crystal: 40 * (player?.scannerUpgrades?.precision + 1 || 1),
              plasma: 5 * (player?.scannerUpgrades?.precision + 1 || 1)
            },
            effect: (player) => {
              if (!player.scannerUpgrades) player.scannerUpgrades = {};
              player.scannerUpgrades.precision = (player.scannerUpgrades.precision || 0) + 1;
            },
            available: playerLevel >= 2
          }
        ];
        break;
        
      case '采集器':
        upgrades = [
          {
            id: 'collector_speed',
            name: '采集速度',
            description: '提高资源采集的速度，减少采集时间',
            level: player?.collectorUpgrades?.speed || 0,
            maxLevel: 5,
            stats: [
              { name: '采集速度', value: '+20%', color: '#4caf50' },
              { name: '能量消耗', value: '+10%', color: '#f44336' }
            ],
            costs: {
              credits: 900 * (player?.collectorUpgrades?.speed + 1 || 1),
              metal: 35 * (player?.collectorUpgrades?.speed + 1 || 1)
            },
            effect: (player) => {
              if (!player.collectorUpgrades) player.collectorUpgrades = {};
              player.collectorUpgrades.speed = (player.collectorUpgrades.speed || 0) + 1;
            },
            available: playerLevel >= 1
          },
          {
            id: 'collector_yield',
            name: '采集产量',
            description: '增加每次采集获得的资源量，提高采集效率',
            level: player?.collectorUpgrades?.yield || 0,
            maxLevel: 4,
            stats: [
              { name: '资源产量', value: '+15%', color: '#4caf50' }
            ],
            costs: {
              credits: 1100 * (player?.collectorUpgrades?.yield + 1 || 1),
              metal: 25 * (player?.collectorUpgrades?.yield + 1 || 1),
              crystal: 30 * (player?.collectorUpgrades?.yield + 1 || 1)
            },
            effect: (player) => {
              if (!player.collectorUpgrades) player.collectorUpgrades = {};
              player.collectorUpgrades.yield = (player.collectorUpgrades.yield || 0) + 1;
            },
            available: playerLevel >= 2
          },
          {
            id: 'collector_range',
            name: '采集范围',
            description: '增加资源采集器的工作范围，可以从更远距离采集资源',
            level: player?.collectorUpgrades?.range || 0,
            maxLevel: 3,
            stats: [
              { name: '采集范围', value: '+30%', color: '#4caf50' },
              { name: '精度', value: '-5%', color: '#f44336' }
            ],
            costs: {
              credits: 1300 * (player?.collectorUpgrades?.range + 1 || 1),
              metal: 40 * (player?.collectorUpgrades?.range + 1 || 1),
              crystal: 20 * (player?.collectorUpgrades?.range + 1 || 1)
            },
            effect: (player) => {
              if (!player.collectorUpgrades) player.collectorUpgrades = {};
              player.collectorUpgrades.range = (player.collectorUpgrades.range || 0) + 1;
            },
            available: playerLevel >= 3
          }
        ];
        break;
        
      default:
        upgrades = [];
    }
    
    // 根据玩家等级过滤可用升级
    return upgrades.filter(upgrade => upgrade.available);
  };
  
  // 处理选择类别
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
  };
  
  // 处理购买升级
  const handlePurchaseUpgrade = (upgrade) => {
    if (!gameEngine || !gameEngine.gameState || !gameEngine.gameState.player) return;
    
    const player = gameEngine.gameState.player;
    
    // 检查资源是否足够
    let canAfford = true;
    
    for (const [resource, amount] of Object.entries(upgrade.costs)) {
      const playerAmount = player.resources[resource] || 0;
      if (playerAmount < amount) {
        canAfford = false;
        break;
      }
    }
    
    if (!canAfford) {
      // 显示资源不足提示
      gameEngine.audioManager?.playSound('ui_error');
      gameEngine.uiManager?.showNotification('资源不足，无法购买升级', 'error');
      return;
    }
    
    // 扣除资源
    for (const [resource, amount] of Object.entries(upgrade.costs)) {
      player.resources[resource] = (player.resources[resource] || 0) - amount;
    }
    
    // 应用升级效果
    if (typeof upgrade.effect === 'function') {
      upgrade.effect(player);
    }
    
    // 更新UI
    updatePlayerResources();
    
    // 刷新升级列表
    const updatedUpgrades = getUpgradesByCategory(selectedCategory, gameEngine);
    setAvailableUpgrades(updatedUpgrades);
    
    // 播放升级音效
    gameEngine.audioManager?.playSound('upgrade_purchased');
    
    // 显示升级成功提示
    gameEngine.uiManager?.showNotification(`成功购买升级: ${upgrade.name}`, 'success');
    
    // 触发升级事件
    gameEngine.eventBus.emit('playerUpgraded', { 
      upgradeId: upgrade.id,
      category: selectedCategory,
      newLevel: upgrade.level + 1
    });
  };
  
  // 检查是否可以购买升级
  const canPurchaseUpgrade = (upgrade) => {
    if (!gameEngine || !gameEngine.gameState || !gameEngine.gameState.player) return false;
    
    // 检查是否已达到最大等级
    if (upgrade.level >= upgrade.maxLevel) return false;
    
    // 检查资源是否足够
    for (const [resource, amount] of Object.entries(upgrade.costs)) {
      const playerAmount = playerResources[resource] || 0;
      if (playerAmount < amount) return false;
    }
    
    return true;
  };
  
  // 渲染资源显示
  const renderResourceDisplay = () => {
    return (
      <div className="resource-display">
        <div className="resource-item">
          <span className="resource-label">信用点:</span>
          <span className="resource-value">{playerResources.credits || 0}</span>
        </div>
        <div className="resource-item">
          <span className="resource-label">金属:</span>
          <span className="resource-value">{playerResources.metal || 0}</span>
        </div>
        <div className="resource-item">
          <span className="resource-label">晶体:</span>
          <span className="resource-value">{playerResources.crystal || 0}</span>
        </div>
        <div className="resource-item">
          <span className="resource-label">等离子:</span>
          <span className="resource-value">{playerResources.plasma || 0}</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="upgrades-screen">
      <div className="upgrades-header">
        <h2>飞船升级中心</h2>
        
        {renderResourceDisplay()}
        
        <button className="return-button" onClick={onClose}>
          返回游戏
        </button>
      </div>
      
      <div className="upgrade-categories">
        <h3>升级类别</h3>
        
        <div className="categories-list">
          {categories.map((category, index) => (
            <div 
              key={index}
              className={`category-item ${selectedCategory === category ? 'selected' : ''}`}
              onClick={() => handleCategorySelect(category)}
            >
              {category}
            </div>
          ))}
        </div>
      </div>
      
      <div className="upgrade-details">
        <h3>{selectedCategory}升级</h3>
        
        {availableUpgrades.length === 0 ? (
          <div className="no-upgrades">
            <p>当前没有可用的升级</p>
          </div>
        ) : (
          <div className="upgrades-list">
            {availableUpgrades.map((upgrade, index) => (
              <div key={index} className="upgrade-item">
                <div className="upgrade-header">
                  <h4 className="upgrade-title">{upgrade.name}</h4>
                  <div className="upgrade-level">
                    等级 {upgrade.level}/{upgrade.maxLevel}
                  </div>
                </div>
                
                <p className="upgrade-description">{upgrade.description}</p>
                
                <div className="upgrade-stats">
                  {upgrade.stats.map((stat, statIndex) => (
                    <div 
                      key={statIndex} 
                      className="stat-item"
                      style={{ backgroundColor: `${stat.color}20`, borderColor: `${stat.color}40` }}
                    >
                      <span className="stat-name">{stat.name}</span>
                      <span className="stat-value" style={{ color: stat.color }}>{stat.value}</span>
                    </div>
                  ))}
                </div>
                
                <div className="upgrade-cost">
                  <div className="cost-title">升级费用:</div>
                  <div className="cost-items">
                    {Object.entries(upgrade.costs).map(([resource, amount], costIndex) => {
                      const playerAmount = playerResources[resource] || 0;
                      const isAffordable = playerAmount >= amount;
                      
                      return (
                        <div 
                          key={costIndex} 
                          className={`cost-item ${isAffordable ? 'cost-sufficient' : 'cost-insufficient'}`}
                        >
                          <span className="cost-label">{resource}:</span>
                          <span className="cost-value">
                            {amount} / {playerAmount}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <button
                  className={`upgrade-button ${upgrade.level >= upgrade.maxLevel ? 'max-level' : ''}`}
                  onClick={() => handlePurchaseUpgrade(upgrade)}
                  disabled={!canPurchaseUpgrade(upgrade)}
                >
                  {upgrade.level >= upgrade.maxLevel 
                    ? '已达最高等级' 
                    : canPurchaseUpgrade(upgrade) 
                      ? '购买升级' 
                      : '资源不足'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradesScreen; 