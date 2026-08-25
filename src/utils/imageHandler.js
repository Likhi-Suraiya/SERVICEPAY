// utils/imageHandler.js

/**
 * Save image locally in IndexedDB or localStorage
 */
class ImageStorage {
  constructor() {
    this.dbName = 'HouseKeepingImages';
    this.dbVersion = 1;
    this.db = null;
    this.initDB();
  }

  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'id' });
          store.createIndex('tempId', 'tempId', { unique: false });
          store.createIndex('itemId', 'itemId', { unique: false });
        }
      };
    });
  }

  async saveImage(tempId, itemId, imageFile) {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = {
          id: `${tempId}_${Date.now()}`,
          tempId: tempId,
          itemId: itemId,
          imageData: reader.result,
          createdAt: new Date().toISOString()
        };
        
        const request = store.put(imageData);
        request.onsuccess = () => resolve(imageData);
        request.onerror = () => reject(request.error);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(imageFile);
    });
  }

  async getImage(tempId) {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const index = store.index('tempId');
      const request = index.getAll(tempId);
      
      request.onsuccess = () => {
        resolve(request.result[0] || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllImages() {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(tempId) {
    await this.initDB();
    
    const image = await this.getImage(tempId);
    if (image) {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction(['images'], 'readwrite');
        const store = transaction.objectStore('images');
        const request = store.delete(image.id);
        
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      });
    }
    return false;
  }

  generateImageName(itemId, originalName) {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const sanitizedName = originalName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '_');
    return `${itemId}_${sanitizedName}_${timestamp}_${randomStr}.${extension}`;
  }

  async clearAllImages() {
    await this.initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

export const imageStorage = new ImageStorage();