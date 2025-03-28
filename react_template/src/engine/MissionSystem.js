/**
 * 任务系统，负责管理游戏中的各种任务，包括主线任务和支线任务
 */
export class MissionSystem {
  constructor(gameEngine) {
    this.gameEngine = gameEngine;
    this.missions = new Map();
    this.activeMissions = new Set();
    this.completedMissions = new Set();
    this.missionHistory = [];
    this.isInitialized = false;
    
    // 任务类型定义
    this.missionTypes = {
      EXPLORATION: 'exploration',
      COLLECTION: 'collection',
      COMBAT: 'combat',
      ESCORT: 'escort',
      RESCUE: 'rescue',
      DELIVERY: 'delivery'
    };
  }
  
  /**
   * 初始化任务系统
   * @returns {MissionSystem} this
   */
  init() {
    if (this.isInitialized) {
      console.warn('MissionSystem already initialized');
      return this;
    }
    
    console.log('Initializing MissionSystem...');
    
    // 创建初始任务
    this.createTutorialMissions();
    
    this.isInitialized = true;
    return this;
  }
  
  /**
   * 创建教程任务
   */
  createTutorialMissions() {
    try {
      // 任务1: 基础控制
      const controlTutorial = {
        id: 'tutorial_controls',
        title: 'Basic Controls',
        description: 'Learn the basic controls of your ship',
        type: 'tutorial',
        objectives: [
          { id: 'move_forward', description: 'Press W to move forward', completed: false },
          { id: 'move_backward', description: 'Press S to move backward', completed: false },
          { id: 'turn_left', description: 'Press A to turn left', completed: false },
          { id: 'turn_right', description: 'Press D to turn right', completed: false }
        ],
        rewards: {
          experience: 50
        },
        isActive: false,
        isCompleted: false,
        isHidden: false,
        progress: 0
      };
      
      // 任务2: 资源收集
      const resourceTutorial = {
        id: 'tutorial_resources',
        title: 'Resource Collection',
        description: 'Learn how to scan and collect resources from planets',
        type: 'tutorial',
        prerequisites: ['tutorial_controls'],
        objectives: [
          { id: 'approach_planet', description: 'Approach a planet', completed: false },
          { id: 'scan_planet', description: 'Press F to scan a planet', completed: false },
          { id: 'collect_minerals', description: 'Collect some minerals', completed: false }
        ],
        rewards: {
          experience: 100,
          resources: {
            minerals: 10
          }
        },
        isActive: false,
        isCompleted: false,
        isHidden: true,
        progress: 0
      };
      
      // 任务3: 星系探索
      const explorationTutorial = {
        id: 'tutorial_exploration',
        title: 'Galaxy Exploration',
        description: 'Learn how to navigate between star systems',
        type: 'tutorial',
        prerequisites: ['tutorial_resources'],
        objectives: [
          { id: 'open_starmap', description: 'Open the Star Map (M)', completed: false },
          { id: 'select_system', description: 'Select another star system', completed: false },
          { id: 'warp_to_system', description: 'Warp to the selected system', completed: false }
        ],
        rewards: {
          experience: 150,
          resources: {
            fuel: 20
          }
        },
        isActive: false,
        isCompleted: false,
        isHidden: true,
        progress: 0
      };
      
      // 添加任务到系统
      this.addMission(controlTutorial);
      this.addMission(resourceTutorial);
      this.addMission(explorationTutorial);
      
      // 激活第一个任务
      this.activateMission('tutorial_controls');
      
    } catch (error) {
      console.error('Error creating tutorial missions:', error);
    }
  }
  
  /**
   * 添加任务到系统
   * @param {Object} mission 任务对象
   * @returns {boolean} 成功添加返回true
   */
  addMission(mission) {
    if (!mission || !mission.id) {
      console.warn('Invalid mission object');
      return false;
    }
    
    try {
      // 检查任务是否已存在
      if (this.missions.has(mission.id)) {
        console.warn(`Mission with id ${mission.id} already exists`);
        return false;
      }
      
      // 添加任务
      this.missions.set(mission.id, mission);
      console.log(`Added mission: ${mission.title}`);
      return true;
    } catch (error) {
      console.error(`Error adding mission: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 激活任务
   * @param {string} missionId 任务ID
   * @returns {boolean} 成功激活返回true
   */
  activateMission(missionId) {
    try {
      const mission = this.missions.get(missionId);
      if (!mission) {
        console.warn(`Mission with id ${missionId} not found`);
        return false;
      }
      
      // 检查前置条件
      if (mission.prerequisites && mission.prerequisites.length > 0) {
        for (const prereqId of mission.prerequisites) {
          if (!this.completedMissions.has(prereqId)) {
            console.warn(`Prerequisite mission ${prereqId} not completed`);
            return false;
          }
        }
      }
      
      // 激活任务
      mission.isActive = true;
      mission.isHidden = false;
      this.activeMissions.add(missionId);
      
      // 任务激活通知
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `New mission: ${mission.title}`,
          'mission',
          5000
        );
        
        // 播放音效
        if (this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSound('alert');
        }
      }
      
      console.log(`Activated mission: ${mission.title}`);
      return true;
    } catch (error) {
      console.error(`Error activating mission: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 更新任务状态
   * @param {string} missionId 任务ID
   * @param {string} objectiveId 目标ID
   * @returns {boolean} 成功更新返回true
   */
  updateObjective(missionId, objectiveId) {
    try {
      const mission = this.missions.get(missionId);
      if (!mission || !mission.isActive) {
        return false;
      }
      
      // 查找并更新目标
      const objective = mission.objectives.find(obj => obj.id === objectiveId);
      if (!objective) {
        console.warn(`Objective ${objectiveId} not found in mission ${missionId}`);
        return false;
      }
      
      // 如果目标已完成，不需要再次更新
      if (objective.completed) {
        return true;
      }
      
      // 标记目标为已完成
      objective.completed = true;
      
      // 更新任务进度
      const completedCount = mission.objectives.filter(obj => obj.completed).length;
      mission.progress = (completedCount / mission.objectives.length) * 100;
      
      // 通知UI更新
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `Objective completed: ${objective.description}`,
          'objective',
          3000
        );
      }
      
      // 检查任务是否完成
      if (completedCount === mission.objectives.length) {
        this.completeMission(missionId);
      }
      
      return true;
    } catch (error) {
      console.error(`Error updating objective: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 完成任务
   * @param {string} missionId 任务ID
   * @returns {boolean} 成功完成返回true
   */
  completeMission(missionId) {
    try {
      const mission = this.missions.get(missionId);
      if (!mission || mission.isCompleted) {
        return false;
      }
      
      // 标记任务为已完成
      mission.isCompleted = true;
      mission.isActive = false;
      this.activeMissions.delete(missionId);
      this.completedMissions.add(missionId);
      this.missionHistory.push({
        id: missionId,
        title: mission.title,
        completedAt: new Date().toISOString()
      });
      
      // 发放奖励
      this.grantRewards(mission);
      
      // 通知UI
      if (this.gameEngine && this.gameEngine.uiManager) {
        this.gameEngine.uiManager.addNotification(
          `Mission completed: ${mission.title}`,
          'mission_complete',
          5000
        );
        
        // 播放音效
        if (this.gameEngine.audioManager) {
          this.gameEngine.audioManager.playSound('upgrade_complete');
        }
      }
      
      // 检查是否有新任务可以激活
      this.checkForNewMissions();
      
      console.log(`Completed mission: ${mission.title}`);
      return true;
    } catch (error) {
      console.error(`Error completing mission: ${error.message}`);
      return false;
    }
  }
  
  /**
   * 检查有没有新任务可以激活
   */
  checkForNewMissions() {
    // 遍历所有任务
    this.missions.forEach(mission => {
      // 跳过已激活或已完成的任务
      if (mission.isActive || mission.isCompleted) {
        return;
      }
      
      // 检查前置条件
      if (mission.prerequisites && mission.prerequisites.length > 0) {
        const allPrereqsMet = mission.prerequisites.every(prereqId => 
          this.completedMissions.has(prereqId)
        );
        
        if (allPrereqsMet) {
          this.activateMission(mission.id);
        }
      }
    });
  }
  
  /**
   * 发放任务奖励
   * @param {Object} mission 任务对象
   */
  grantRewards(mission) {
    if (!mission || !mission.rewards) return;
    
    try {
      const { rewards } = mission;
      
      // 经验奖励
      if (rewards.experience && this.gameEngine && this.gameEngine.player) {
        this.gameEngine.player.addExperience(rewards.experience);
      }
      
      // 资源奖励
      if (rewards.resources && this.gameEngine && this.gameEngine.resourceManager) {
        const resourceManager = this.gameEngine.resourceManager;
        Object.entries(rewards.resources).forEach(([type, amount]) => {
          resourceManager.addResource(type, amount);
        });
      }
      
      // 其他奖励类型...
      
    } catch (error) {
      console.error(`Error granting rewards: ${error.message}`);
    }
  }
  
  /**
   * 获取活跃任务列表
   * @returns {Array} 活跃任务数组
   */
  getActiveMissions() {
    const activeMissions = [];
    this.activeMissions.forEach(id => {
      const mission = this.missions.get(id);
      if (mission) {
        activeMissions.push(mission);
      }
    });
    return activeMissions;
  }
  
  /**
   * 获取可用任务列表（未激活但可见的）
   * @returns {Array} 可用任务数组
   */
  getAvailableMissions() {
    const availableMissions = [];
    this.missions.forEach(mission => {
      if (!mission.isActive && !mission.isCompleted && !mission.isHidden) {
        availableMissions.push(mission);
      }
    });
    return availableMissions;
  }
  
  /**
   * 获取已完成任务列表
   * @returns {Array} 已完成任务数组
   */
  getCompletedMissions() {
    const completedMissions = [];
    this.completedMissions.forEach(id => {
      const mission = this.missions.get(id);
      if (mission) {
        completedMissions.push(mission);
      }
    });
    return completedMissions;
  }
  
  /**
   * 处理玩家输入事件，用于更新任务状态
   * @param {string} inputType 输入类型
   * @param {any} data 相关数据
   */
  handlePlayerInput(inputType, data) {
    // 处理各种输入事件，更新相关任务
    switch (inputType) {
      case 'movement':
        // 更新移动相关的教程目标
        if (data.forward) this.updateObjective('tutorial_controls', 'move_forward');
        if (data.backward) this.updateObjective('tutorial_controls', 'move_backward');
        if (data.left) this.updateObjective('tutorial_controls', 'turn_left');
        if (data.right) this.updateObjective('tutorial_controls', 'turn_right');
        break;
        
      case 'scan':
        // 更新扫描相关的教程目标
        this.updateObjective('tutorial_resources', 'scan_planet');
        break;
        
      case 'collect_resource':
        // 更新资源收集相关的教程目标
        if (data.type === 'minerals') {
          this.updateObjective('tutorial_resources', 'collect_minerals');
        }
        break;
        
      case 'open_map':
        // 更新地图相关的教程目标
        this.updateObjective('tutorial_exploration', 'open_starmap');
        break;
        
      case 'select_system':
        // 更新系统选择相关的教程目标
        this.updateObjective('tutorial_exploration', 'select_system');
        break;
        
      case 'warp':
        // 更新跃迁相关的教程目标
        this.updateObjective('tutorial_exploration', 'warp_to_system');
        break;
        
      default:
        // 其他输入类型...
        break;
    }
  }
  
  /**
   * 更新任务系统
   * @param {number} deltaTime 时间增量
   */
  update(deltaTime) {
    // 处理可能需要随时间更新的任务
    if (!this.isInitialized) return;
    
    try {
      // 更新活跃任务...
      
    } catch (error) {
      console.error('Error updating mission system:', error);
    }
  }
} 