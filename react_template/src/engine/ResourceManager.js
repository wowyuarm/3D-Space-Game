/**
 * 资源管理器，负责处理游戏中的各种资源，包括收集、存储和消耗
 */
export class ResourceManager {
  constructor() {
    this.resources = new Map();
    this.resourceTypes = [
      'minerals',
      'gases',
      'organics',
      'rareElements'
    ];
    
    // 各类资源的基础值
    this.resourceValues = {
      minerals: 5,
      gases: 7,
      organics: 10,
      rareElements: 25
    };
    
    this.gameEngine = null;
    this.isInitialized = false;
  }
  
  /**
   * 初始化资源管理器
   * @param {Object} config 配置对象
   * @returns {ResourceManager} 资源管理器实例
   */
  init(config = {}) {
    if (this.isInitialized) {
      console.warn('ResourceManager already initialized');
      return this;
    }
    
    console.log('Initializing ResourceManager...');
    
    if (config.gameEngine) {
      this.gameEngine = config.gameEngine;
    }
    
    // 初始化资源Map
    this.resourceTypes.forEach(type => {
      this.resources.set(type, {
        name: this.formatResourceName(type),
        amount: 0,
        totalCollected: 0,
        value: this.resourceValues[type] || 1
      });
    });
    
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 格式化资源名称
   * @param {string} type 资源类型
   * @returns {string} 格式化后的资源名称
   */
  formatResourceName(type) {
    // 将camelCase转换为空格分隔的标题格式
    return type
      .replace(/([A-Z])/g, ' $1') // 在大写字母前添加空格
      .replace(/^./, str => str.toUpperCase()); // 首字母大写
  }
  
  /**
   * Adds a resource to the player's inventory
   * @param {string} type Resource type
   * @param {number} amount Amount to add
   * @returns {boolean} Success status
   */
  addResource(type, amount) {
    if (!this.resourceTypes.includes(type) || amount <= 0) {
      console.warn(`Invalid resource type or amount: ${type}, ${amount}`);
      return false;
    }
    
    try {
      const resource = this.resources.get(type);
      if (!resource) {
        console.warn(`Resource type not initialized: ${type}`);
        return false;
      }
      
      resource.amount += amount;
      resource.totalCollected += amount;
      
      // 播放收集音效
      if (this.gameEngine && this.gameEngine.audioManager) {
        this.gameEngine.audioManager.playSound('resource_collected');
      }
      
      // 显示收集通知
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `Collected ${amount} ${this.formatResourceName(type)}`,
          'success',
          3000
        );
      }
      
      console.log(`Added ${amount} ${type}, new total: ${resource.amount}`);
      return true;
    } catch (error) {
      console.error(`Error adding resource: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 消耗指定类型的资源
   * @param {string} type 资源类型
   * @param {number} amount 消耗数量
   * @returns {boolean} 是否成功消耗资源
   */
  useResource(type, amount) {
    if (!this.resourceTypes.includes(type) || amount <= 0) {
      console.warn(`Invalid resource type or amount: ${type}, ${amount}`);
      return false;
    }
    
    try {
      const resource = this.resources.get(type);
      if (!resource) return false;
      
      // 检查资源是否充足
      if (resource.amount < amount) {
        console.warn(`Insufficient ${type}: have ${resource.amount}, need ${amount}`);
        return false;
      }
      
      resource.amount -= amount;
      console.log(`Used ${amount} ${type}, remaining: ${resource.amount}`);
      return true;
    } catch (error) {
      console.error(`Error using resource: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 获取资源的数量
   * @param {string} type 资源类型
   * @returns {number} 资源数量
   */
  getResourceAmount(type) {
    if (!this.resourceTypes.includes(type)) return 0;
    
    const resource = this.resources.get(type);
    return resource ? resource.amount : 0;
  }
  
  /**
   * 获取所有资源的数量
   * @returns {Object} 资源数量映射表
   */
  getAllResources() {
    const result = {};
    this.resources.forEach((resource, type) => {
      result[type] = resource.amount;
    });
    return result;
  }
  
  /**
   * 获取资源的总价值
   * @returns {number} 资源总价值
   */
  getTotalResourceValue() {
    let total = 0;
    this.resources.forEach((resource) => {
      total += resource.amount * resource.value;
    });
    return total;
  }
  
  /**
   * 检查是否有足够的资源
   * @param {Object} requirements 资源需求表 {type: amount, ...}
   * @returns {boolean} 是否满足需求
   */
  hasEnoughResources(requirements) {
    for (const [type, amount] of Object.entries(requirements)) {
      if (this.getResourceAmount(type) < amount) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * 消耗多种资源
   * @param {Object} requirements 资源需求表 {type: amount, ...}
   * @returns {boolean} 是否成功消耗资源
   */
  useResources(requirements) {
    // 检查资源是否足够
    if (!this.hasEnoughResources(requirements)) {
      return false;
    }
    
    // 消耗资源
    try {
      for (const [type, amount] of Object.entries(requirements)) {
        this.useResource(type, amount);
      }
      return true;
    } catch (error) {
      console.error(`Error using multiple resources: ${error.message}`);
      return false;
    }
  }
} 