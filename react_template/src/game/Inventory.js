// src/game/Inventory.js
import * as THREE from 'three';

export class Inventory {
  constructor() {
    this.capacity = 20; // Default capacity in slots
    this.items = [];    // Array of items
    this.credits = 0;   // Money holder (could also be in Player)
    this.categories = {
      resources: [],
      equipment: [],
      artifacts: [],
      consumables: []
    };
    this.isInitialized = false;
  }
  
  initialize(options = {}) {
    if (this.isInitialized) {
      console.warn('Inventory already initialized');
      return this;
    }
    
    console.log('Initializing Inventory...');
    
    // Apply options
    if (options.capacity) this.capacity = options.capacity;
    
    // Initialize with some starter items if needed
    if (options.startingItems && Array.isArray(options.startingItems)) {
      options.startingItems.forEach(item => this.addItem(item));
    }
    
    this.isInitialized = true;
    return this;
  }
  
  // Add an item to inventory
  addItem(item) {
    if (!item) return false;
    
    // Check if we have capacity
    if (this.items.length >= this.capacity) {
      console.warn('Inventory full, cannot add item:', item.name);
      return false;
    }
    
    // Check if item can be stacked with existing items
    if (item.stackable) {
      const existingItem = this.items.find(i => 
        i.id === item.id && i.stackable && 
        (!i.maxStack || i.quantity < i.maxStack)
      );
      
      if (existingItem) {
        // Calculate how much we can add to the stack
        const maxAdd = existingItem.maxStack ? 
          Math.min(item.quantity, existingItem.maxStack - existingItem.quantity) : 
          item.quantity;
        
        existingItem.quantity += maxAdd;
        
        // If we couldn't add all, create a new stack
        const remaining = item.quantity - maxAdd;
        if (remaining > 0) {
          const newItem = { ...item, quantity: remaining };
          return this.addItem(newItem);
        }
        
        return true;
      }
    }
    
    // Add as a new item
    this.items.push({ ...item });
    
    // Add to appropriate category
    if (item.category && this.categories[item.category]) {
      this.categories[item.category].push(item);
    }
    
    return true;
  }
  
  // Remove an item from inventory
  removeItem(itemId, quantity = 1) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return false;
    
    const item = this.items[itemIndex];
    
    // If stackable item
    if (item.stackable) {
      if (item.quantity > quantity) {
        // Reduce quantity
        item.quantity -= quantity;
        return true;
      } else {
        // Remove item completely
        this.items.splice(itemIndex, 1);
        
        // Remove from category
        if (item.category && this.categories[item.category]) {
          const catIndex = this.categories[item.category].findIndex(i => i.id === itemId);
          if (catIndex !== -1) {
            this.categories[item.category].splice(catIndex, 1);
          }
        }
        
        return true;
      }
    } else {
      // Non-stackable item, just remove it
      this.items.splice(itemIndex, 1);
      
      // Remove from category
      if (item.category && this.categories[item.category]) {
        const catIndex = this.categories[item.category].findIndex(i => i.id === itemId);
        if (catIndex !== -1) {
          this.categories[item.category].splice(catIndex, 1);
        }
      }
      
      return true;
    }
  }
  
  // Check if we have an item
  hasItem(itemId, quantity = 1) {
    const item = this.items.find(item => item.id === itemId);
    if (!item) return false;
    
    if (item.stackable) {
      return item.quantity >= quantity;
    }
    
    return true;
  }
  
  // Get quantity of an item
  getItemQuantity(itemId) {
    const item = this.items.find(item => item.id === itemId);
    if (!item) return 0;
    
    return item.stackable ? item.quantity : 1;
  }
  
  // Get all items in a category
  getItemsByCategory(category) {
    return this.categories[category] || [];
  }
  
  // Check if inventory is full
  isFull() {
    return this.items.length >= this.capacity;
  }
  
  // Get number of free slots
  getFreeSlots() {
    return this.capacity - this.items.length;
  }
  
  // Get total weight (if items have weight property)
  getTotalWeight() {
    return this.items.reduce((total, item) => {
      const itemWeight = item.weight || 0;
      return total + (item.stackable ? itemWeight * item.quantity : itemWeight);
    }, 0);
  }
  
  // Sort inventory by category
  sortByCategory() {
    this.items.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });
  }
  
  // Sort inventory by value
  sortByValue() {
    this.items.sort((a, b) => {
      const aValue = a.value || 0;
      const bValue = b.value || 0;
      return bValue - aValue; // Sort highest to lowest
    });
  }
  
  // Use a consumable item
  useItem(itemId) {
    const item = this.items.find(item => item.id === itemId);
    if (!item) return false;
    
    // Check if item is usable
    if (!item.consumable) {
      console.log(`Item '${item.name}' is not consumable`);
      return false;
    }
    
    // Implement effect logic for consumable items
    console.log(`Using item: ${item.name}`);
    
    // Apply item effects
    if (item.effects) {
      // Handle different effect types
      console.log(`Item effect: ${JSON.stringify(item.effects)}`);
    }
    
    // Remove one of the item
    return this.removeItem(itemId, 1);
  }
  
  // Upgrade inventory capacity
  upgradeCapacity(amount) {
    this.capacity += amount;
    console.log(`Inventory capacity upgraded to ${this.capacity}`);
    return this.capacity;
  }
  
  // Serialize inventory for save/load
  serialize() {
    return {
      capacity: this.capacity,
      items: this.items.map(item => ({ ...item })),
      credits: this.credits
    };
  }
  
  // Deserialize inventory from save data
  deserialize(data) {
    if (!data) return this;
    
    this.capacity = data.capacity || this.capacity;
    this.credits = data.credits || 0;
    
    // Clear current inventory
    this.items = [];
    Object.keys(this.categories).forEach(cat => {
      this.categories[cat] = [];
    });
    
    // Load items
    if (data.items && Array.isArray(data.items)) {
      data.items.forEach(item => {
        this.addItem(item);
      });
    }
    
    return this;
  }
  
  // Clear inventory
  clear() {
    this.items = [];
    Object.keys(this.categories).forEach(cat => {
      this.categories[cat] = [];
    });
  }
  
  // Dispose (cleanup)
  dispose() {
    this.clear();
    this.isInitialized = false;
    return this;
  }
}

export default Inventory;