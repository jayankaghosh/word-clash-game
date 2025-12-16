class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.dictionaryLoaded = false;
    this.dictionaryWords = null;
    this.listeners = new Set();
    this.dictionaryListeners = new Set();
    this.STORAGE_KEY = 'wordClashDictionary';
    this.VERSION_KEY = 'wordClashDictionaryVersion';
    this.CURRENT_VERSION = '1.0';
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
    
    // Check dictionary status on initialization
    this.checkDictionaryStatus();
  }
  
  async checkDictionaryStatus() {
    try {
      // Check if dictionary exists in localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const version = localStorage.getItem(this.VERSION_KEY);
      
      if (stored && version === this.CURRENT_VERSION) {
        // Load from localStorage into memory
        this.dictionaryWords = JSON.parse(stored);
        this.dictionaryLoaded = true;
        this.notifyDictionaryListeners();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking dictionary status:', error);
      return false;
    }
  }
  
  async loadDictionary(onProgress) {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    
    try {
      // First, check if already in memory
      if (this.dictionaryWords) {
        if (onProgress) onProgress(100);
        return true;
      }
      
      // Try to load from localStorage
      const stored = localStorage.getItem(this.STORAGE_KEY);
      const version = localStorage.getItem(this.VERSION_KEY);
      
      if (stored && version === this.CURRENT_VERSION) {
        if (onProgress) onProgress(50);
        this.dictionaryWords = JSON.parse(stored);
        this.dictionaryLoaded = true;
        this.notifyDictionaryListeners();
        if (onProgress) onProgress(100);
        return true;
      }
      
      // Not in localStorage, fetch from network
      if (onProgress) onProgress(10);
      
      const response = await fetch(`${socketUrl}/api/dictionary`);
      if (!response.ok) {
        throw new Error('Failed to fetch dictionary');
      }
      
      if (onProgress) onProgress(50);
      
      const words = await response.json();
      this.dictionaryWords = words;
      
      if (onProgress) onProgress(80);
      
      // Save to localStorage for future use
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(words));
        localStorage.setItem(this.VERSION_KEY, this.CURRENT_VERSION);
      } catch (storageError) {
        console.warn('Failed to save dictionary to localStorage:', storageError);
        // Continue anyway - dictionary is loaded in memory
      }
      
      this.dictionaryLoaded = true;
      this.notifyDictionaryListeners();
      if (onProgress) onProgress(100);
      return true;
      
    } catch (error) {
      console.error('Error loading dictionary:', error);
      this.dictionaryLoaded = false;
      this.notifyDictionaryListeners();
      return false;
    }
  }
  
  getDictionary() {
    return this.dictionaryWords;
  }
  
  isDictionaryLoaded() {
    return this.dictionaryLoaded;
  }
  
  getOnlineStatus() {
    return this.isOnline;
  }
  
  onStatusChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
  
  onDictionaryChange(callback) {
    this.dictionaryListeners.add(callback);
    return () => this.dictionaryListeners.delete(callback);
  }
  
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.isOnline));
  }
  
  notifyDictionaryListeners() {
    this.dictionaryListeners.forEach(callback => callback(this.dictionaryLoaded));
  }
}

export default new OfflineManager();
