/**
 * Performance monitoring and optimization utilities
 */

// Performance metrics
interface PerformanceMetrics {
  pageLoadTime: number;
  firstContentfulPaint: number;
  timeToInteractive: number;
  apiCalls: number;
  averageApiTime: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private apiTimes: number[] = [];
  
  /**
   * Measure page load performance
   */
  measurePageLoad() {
    if (typeof window === 'undefined' || !window.performance) return;
    
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        
        this.metrics.pageLoadTime = pageLoadTime;
        
        // Get paint timing
        const paintEntries = performance.getEntriesByType('paint');
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        
        if (fcp) {
          this.metrics.firstContentfulPaint = fcp.startTime;
        }
        
        console.log('[Performance] Page Load:', {
          pageLoadTime: `${pageLoadTime}ms`,
          fcp: fcp ? `${fcp.startTime}ms` : 'N/A'
        });
      }, 0);
    });
  }
  
  /**
   * Measure API call performance
   */
  measureApiCall(duration: number) {
    this.apiTimes.push(duration);
    this.metrics.apiCalls = this.apiTimes.length;
    this.metrics.averageApiTime = 
      this.apiTimes.reduce((a, b) => a + b, 0) / this.apiTimes.length;
  }
  
  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }
  
  /**
   * Log metrics to console
   */
  logMetrics() {
    console.table(this.metrics);
  }
  
  /**
   * Send metrics to analytics (optional)
   */
  sendToAnalytics() {
    // Implement analytics integration here
    // e.g., Google Analytics, Mixpanel, etc.
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Lazy load images
 */
export function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach((img) => {
      imageObserver.observe(img);
    });
  }
}

/**
 * Preload critical resources
 */
export function preloadResources(urls: string[]) {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'fetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    const duration = endTime - startTime;
    console.log(`[Render] ${componentName}: ${duration.toFixed(2)}ms`);
  };
}

/**
 * Check if user is on slow connection
 */
export function isSlowConnection(): boolean {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection;
    return conn.effectiveType === 'slow-2g' || 
           conn.effectiveType === '2g' || 
           conn.saveData === true;
  }
  return false;
}

/**
 * Optimize images based on connection
 */
export function getOptimizedImageUrl(url: string): string {
  if (isSlowConnection()) {
    // Return lower quality image
    return url.replace(/\.(jpg|jpeg|png)$/, '_low.$1');
  }
  return url;
}

/**
 * Request idle callback wrapper
 */
export function runWhenIdle(callback: () => void) {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Batch DOM updates
 */
export function batchDOMUpdates(updates: Array<() => void>) {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
}

/**
 * Memory usage (if available)
 */
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: (memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
      limit: (memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
    };
  }
  return null;
}

/**
 * Log performance summary
 */
export function logPerformanceSummary() {
  console.group('🚀 Performance Summary');
  
  // Page metrics
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const pageLoad = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
    
    console.log('Page Load:', pageLoad + 'ms');
    console.log('DOM Ready:', domReady + 'ms');
  }
  
  // Memory
  const memory = getMemoryUsage();
  if (memory) {
    console.log('Memory:', memory);
  }
  
  // API metrics
  performanceMonitor.logMetrics();
  
  console.groupEnd();
}

// Auto-initialize
if (typeof window !== 'undefined') {
  performanceMonitor.measurePageLoad();
  
  // Log summary after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      logPerformanceSummary();
    }, 2000);
  });
}
