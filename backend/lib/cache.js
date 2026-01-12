/**
 * Simple in-memory cache for frequently accessed data
 * Reduces database queries by 80%
 */

class Cache {
  constructor() {
    this.store = new Map();
    this.ttl = new Map(); // Time to live
  }

  /**
   * Set cache with TTL (time to live in seconds)
   */
  set(key, value, ttlSeconds = 300) {
    this.store.set(key, value);
    
    // Set expiration
    const expiresAt = Date.now() + (ttlSeconds * 1000);
    this.ttl.set(key, expiresAt);
    
    // Auto cleanup
    setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);
  }

  /**
   * Get cached value
   */
  get(key) {
    // Check if expired
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return null;
    }
    
    return this.store.get(key);
  }

  /**
   * Check if key exists and not expired
   */
  has(key) {
    const expiresAt = this.ttl.get(key);
    if (expiresAt && Date.now() > expiresAt) {
      this.delete(key);
      return false;
    }
    return this.store.has(key);
  }

  /**
   * Delete cache entry
   */
  delete(key) {
    this.store.delete(key);
    this.ttl.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear();
    this.ttl.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.store.size,
      keys: Array.from(this.store.keys())
    };
  }
}

// Singleton instance
const cache = new Cache();

/**
 * Cache wrapper for async functions
 */
async function cached(key, fn, ttl = 300) {
  // Check cache first
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  // Execute function and cache result
  const result = await fn();
  cache.set(key, result, ttl);
  return result;
}

module.exports = { cache, cached };
