/**
 * LocalStorage Cache Service
 * 
 * Provides persistent caching using browser localStorage with automatic expiration,
 * fallback to in-memory cache, and comprehensive error handling.
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number; // when data was stored in cache
  expiresAt: number;
  originalFetchTime: number; // when data was originally fetched from API
  isFromAPI: boolean; // true if data came from API, false if from another source
}

interface CacheRetrievalResult<T = any> {
  data: T | null;
  isExpired: boolean;
  originalFetchTime?: number;
  isFromAPI?: boolean;
  cacheTimestamp?: number;
}

interface CacheStats {
  totalEntries: number;
  expiredEntries: number;
  memoryFallbackActive: boolean;
  storageUsed: number; // in bytes (approximate)
}

export class LocalStorageCache {
  private static instance: LocalStorageCache;
  private memoryFallback: Map<string, CacheEntry> = new Map();
  private useMemoryFallback: boolean = false;
  private readonly CACHE_PREFIX = 'beach_driving_cache_';
  private readonly MAX_STORAGE_SIZE = 5 * 1024 * 1024; // 5MB limit
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
  private cleanupTimer: NodeJS.Timeout | null = null;

  public static getInstance(): LocalStorageCache {
    if (!LocalStorageCache.instance) {
      LocalStorageCache.instance = new LocalStorageCache();
    }
    return LocalStorageCache.instance;
  }

  constructor() {
    this.initializeCache();
    this.startPeriodicCleanup();
  }

  /**
   * Initialize cache and check localStorage availability
   */
  private initializeCache(): void {
    try {
      // Test localStorage availability
      const testKey = this.CACHE_PREFIX + 'test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      
      console.log('✅ LocalStorage cache initialized successfully');
      console.log('🧹 Cleaning up expired entries on startup...');
      this.cleanupExpiredEntries();
      
      // Log initial stats
      const stats = this.getStats();
      console.log('📊 Initial cache stats:', stats);
    } catch (error) {
      console.warn('⚠️ LocalStorage not available, falling back to memory cache:', error);
      this.useMemoryFallback = true;
    }
  }

  /**
   * Get cached data with detailed metadata for fallback scenarios
   */
  public getWithMetadata<T = any>(key: string): CacheRetrievalResult<T> {
    const cacheKey = this.CACHE_PREFIX + key;
    const now = Date.now();

    try {
      if (this.useMemoryFallback) {
        return this.getFromMemoryWithMetadata<T>(key);
      }

      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return { data: null, isExpired: false };
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      const isExpired = now > entry.expiresAt;
      
      console.log(`📦 Cache ${isExpired ? 'EXPIRED' : 'HIT'} for key: ${key} (${isExpired ? 'fallback available' : 'fresh'})`);
      
      return {
        data: entry.data,
        isExpired,
        originalFetchTime: entry.originalFetchTime,
        isFromAPI: entry.isFromAPI,
        cacheTimestamp: entry.timestamp
      };
    } catch (error) {
      console.error('Error reading from cache with metadata:', error);
      return this.getFromMemoryWithMetadata<T>(key);
    }
  }

  /**
   * Get cached data if it exists and hasn't expired
   */
  public get<T = any>(key: string): T | null {
    const cacheKey = this.CACHE_PREFIX + key;

    try {
      if (this.useMemoryFallback) {
        return this.getFromMemory<T>(key);
      }

      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if entry has expired
      if (Date.now() > entry.expiresAt) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      console.log(`📦 Cache HIT for key: ${key}`);
      return entry.data;
    } catch (error) {
      console.error('Error reading from cache:', error);
      // Try memory fallback
      return this.getFromMemory<T>(key);
    }
  }

  /**
   * Store data in cache with expiration and source metadata
   */
  public set<T = any>(key: string, data: T, durationMs: number, originalFetchTime?: number, isFromAPI: boolean = true): void {
    const cacheKey = this.CACHE_PREFIX + key;
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + durationMs,
      originalFetchTime: originalFetchTime || now,
      isFromAPI
    };

    try {
      if (this.useMemoryFallback) {
        this.setInMemory(key, entry);
        return;
      }

      const serialized = JSON.stringify(entry);
      
      // Check storage size before setting
      if (this.getStorageSize() + serialized.length > this.MAX_STORAGE_SIZE) {
        console.warn('⚠️ Cache storage limit approaching, cleaning up...');
        this.cleanupExpiredEntries();
        
        // If still too large, remove oldest entries
        if (this.getStorageSize() + serialized.length > this.MAX_STORAGE_SIZE) {
          this.removeOldestEntries(3);
        }
      }

      localStorage.setItem(cacheKey, serialized);
      console.log(`💾 Cache SET for key: ${key} (expires in ${Math.round(durationMs / 1000)}s)`);
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('⚠️ LocalStorage quota exceeded, cleaning up and retrying...');
        this.cleanupExpiredEntries();
        this.removeOldestEntries(5);
        
        try {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('⚠️ Still can\'t store in localStorage, using memory fallback');
          this.setInMemory(key, entry);
        }
      } else {
        console.error('Error storing in cache:', error);
        this.setInMemory(key, entry);
      }
    }
  }

  /**
   * Remove specific cache entry
   */
  public remove(key: string): void {
    const cacheKey = this.CACHE_PREFIX + key;
    
    try {
      if (this.useMemoryFallback) {
        this.memoryFallback.delete(key);
        return;
      }

      localStorage.removeItem(cacheKey);
      console.log(`🗑️ Cache REMOVE for key: ${key}`);
    } catch (error) {
      console.error('Error removing from cache:', error);
      this.memoryFallback.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    try {
      if (this.useMemoryFallback) {
        this.memoryFallback.clear();
        console.log('🧹 Memory cache cleared');
        return;
      }

      // Remove all entries with our prefix
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🧹 LocalStorage cache cleared (${keysToRemove.length} entries)`);
    } catch (error) {
      console.error('Error clearing cache:', error);
      this.memoryFallback.clear();
    }
  }

  /**
   * Get cache statistics
   */
  public getStats(): CacheStats {
    let totalEntries = 0;
    let expiredEntries = 0;
    let storageUsed = 0;

    try {
      if (this.useMemoryFallback) {
        const now = Date.now();
        this.memoryFallback.forEach((entry) => {
          totalEntries++;
          if (now > entry.expiresAt) {
            expiredEntries++;
          }
          storageUsed += JSON.stringify(entry).length;
        });
      } else {
        const now = Date.now();
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.CACHE_PREFIX)) {
            totalEntries++;
            const value = localStorage.getItem(key);
            if (value) {
              storageUsed += value.length;
              try {
                const entry: CacheEntry = JSON.parse(value);
                if (now > entry.expiresAt) {
                  expiredEntries++;
                }
              } catch (e) {
                expiredEntries++; // Count malformed entries as expired
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting cache stats:', error);
    }

    return {
      totalEntries,
      expiredEntries,
      memoryFallbackActive: this.useMemoryFallback,
      storageUsed
    };
  }

  /**
   * Memory fallback methods
   */
  private getFromMemoryWithMetadata<T = any>(key: string): CacheRetrievalResult<T> {
    const entry = this.memoryFallback.get(key);
    if (!entry) {
      return { data: null, isExpired: false };
    }

    const now = Date.now();
    const isExpired = now > entry.expiresAt;

    console.log(`📦 Memory cache ${isExpired ? 'EXPIRED' : 'HIT'} for key: ${key} (${isExpired ? 'fallback available' : 'fresh'})`);
    
    return {
      data: entry.data,
      isExpired,
      originalFetchTime: entry.originalFetchTime,
      isFromAPI: entry.isFromAPI,
      cacheTimestamp: entry.timestamp
    };
  }

  private getFromMemory<T = any>(key: string): T | null {
    const entry = this.memoryFallback.get(key);
    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.memoryFallback.delete(key);
      return null;
    }

    console.log(`📦 Memory cache HIT for key: ${key}`);
    return entry.data;
  }

  private setInMemory<T = any>(key: string, entry: CacheEntry<T>): void {
    this.memoryFallback.set(key, entry);
    console.log(`💾 Memory cache SET for key: ${key}`);
  }

  /**
   * Cleanup expired entries
   */
  private cleanupExpiredEntries(): void {
    try {
      if (this.useMemoryFallback) {
        const now = Date.now();
        let removedCount = 0;
        const keysToDelete: string[] = [];
        this.memoryFallback.forEach((entry, key) => {
          if (now > entry.expiresAt) {
            keysToDelete.push(key);
            removedCount++;
          }
        });
        keysToDelete.forEach(key => this.memoryFallback.delete(key));
        if (removedCount > 0) {
          console.log(`🧹 Cleaned up ${removedCount} expired memory cache entries`);
        }
        return;
      }

      const now = Date.now();
      const keysToRemove: string[] = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const entry: CacheEntry = JSON.parse(value);
              if (now > entry.expiresAt) {
                keysToRemove.push(key);
              }
            } catch (e) {
              // Remove malformed entries
              keysToRemove.push(key);
            }
          }
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (keysToRemove.length > 0) {
        console.log(`🧹 Cleaned up ${keysToRemove.length} expired cache entries`);
      }
    } catch (error) {
      console.error('Error during cache cleanup:', error);
    }
  }

  /**
   * Remove oldest entries to free up space
   */
  private removeOldestEntries(count: number): void {
    try {
      if (this.useMemoryFallback) {
        const entries = Array.from(this.memoryFallback.entries())
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, count);
        
        entries.forEach(([key]) => this.memoryFallback.delete(key));
        console.log(`🗑️ Removed ${entries.length} oldest memory cache entries`);
        return;
      }

      const entries: Array<{ key: string; timestamp: number }> = [];

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            try {
              const entry: CacheEntry = JSON.parse(value);
              entries.push({ key, timestamp: entry.timestamp });
            } catch (e) {
              // Remove malformed entries first
              entries.push({ key, timestamp: 0 });
            }
          }
        }
      }

      // Sort by timestamp (oldest first) and remove the specified count
      entries
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, count)
        .forEach(({ key }) => localStorage.removeItem(key));

      console.log(`🗑️ Removed ${Math.min(count, entries.length)} oldest cache entries`);
    } catch (error) {
      console.error('Error removing oldest entries:', error);
    }
  }

  /**
   * Get approximate storage size in bytes
   */
  private getStorageSize(): number {
    try {
      if (this.useMemoryFallback) {
        let size = 0;
        this.memoryFallback.forEach((entry, key) => {
          size += key.length + JSON.stringify(entry).length;
        });
        return size;
      }

      let size = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.CACHE_PREFIX)) {
          const value = localStorage.getItem(key);
          if (value) {
            size += key.length + value.length;
          }
        }
      }
      return size;
    } catch (error) {
      console.error('Error calculating storage size:', error);
      return 0;
    }
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupExpiredEntries();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop periodic cleanup (for cleanup)
   */
  public destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}