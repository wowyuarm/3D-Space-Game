// src/utils/SaveSystem.js
export class SaveSystem {
  constructor() {
    this.saveKey = 'pixel_space_explorer_save';
    this.settingsKey = 'pixel_space_explorer_settings';
  }
  
  saveGame(data) {
    if (!data) {
      console.error('No data provided for saving');
      return false;
    }
    
    try {
      // Add timestamp to save data
      const saveData = {
        ...data,
        timestamp: Date.now(),
        version: data.version || '1.0.0'
      };
      
      // Convert to JSON string and save to localStorage
      const saveString = JSON.stringify(saveData);
      localStorage.setItem(this.saveKey, saveString);
      
      console.log('Game saved successfully');
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }
  
  loadGame() {
    try {
      // Retrieve save data from localStorage
      const saveString = localStorage.getItem(this.saveKey);
      
      if (!saveString) {
        console.log('No saved game found');
        return null;
      }
      
      // Parse the save data
      const saveData = JSON.parse(saveString);
      
      // Validate save data
      if (!this.validateSaveData(saveData)) {
        console.warn('Invalid or corrupt save data');
        return null;
      }
      
      console.log(`Game loaded from save (${new Date(saveData.timestamp).toLocaleString()})`);
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }
  
  saveSettings(settings) {
    if (!settings) return false;
    
    try {
      const settingsString = JSON.stringify(settings);
      localStorage.setItem(this.settingsKey, settingsString);
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }
  
  loadSettings() {
    try {
      const settingsString = localStorage.getItem(this.settingsKey);
      
      if (!settingsString) {
        return null;
      }
      
      return JSON.parse(settingsString);
    } catch (error) {
      console.error('Failed to load settings:', error);
      return null;
    }
  }
  
  deleteSave() {
    try {
      localStorage.removeItem(this.saveKey);
      console.log('Save data deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete save:', error);
      return false;
    }
  }
  
  validateSaveData(saveData) {
    // Basic validation checks
    if (!saveData) return false;
    
    // Check for required fields
    const requiredFields = ['player', 'universe', 'timestamp', 'version'];
    for (const field of requiredFields) {
      if (saveData[field] === undefined) {
        console.warn(`Save data missing required field: ${field}`);
        return false;
      }
    }
    
    // Version compatibility check could go here
    
    return true;
  }
  
  exportSave() {
    try {
      const saveString = localStorage.getItem(this.saveKey);
      
      if (!saveString) {
        return null;
      }
      
      // Create a downloadable blob
      const blob = new Blob([saveString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `pixel_space_explorer_save_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('Failed to export save:', error);
      return false;
    }
  }
  
  importSave(saveString) {
    try {
      if (!saveString) {
        console.error('No save data provided for import');
        return false;
      }
      
      // Parse the save data to validate it
      const saveData = JSON.parse(saveString);
      
      if (!this.validateSaveData(saveData)) {
        console.warn('Invalid import save data');
        return false;
      }
      
      // Save the imported data
      localStorage.setItem(this.saveKey, saveString);
      console.log('Save data imported successfully');
      return true;
    } catch (error) {
      console.error('Failed to import save:', error);
      return false;
    }
  }
}

export default SaveSystem;