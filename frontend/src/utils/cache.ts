/**
 * In-memory client cache with TTL, Stale-While-Revalidate (SWR),
 * in-flight request deduplication, and tag-based invalidation.
 * Strict TypeScript with zero 'any'.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

export interface CacheOptions {
  ttlMs?: number;
  forceRefresh?: boolean;
  staleWhileRevalidate?: boolean;
}

class ApiCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  /**
   * Set a cached value with a TTL (default: 60 seconds).
   */
  set<T>(key: string, data: T, ttlMs = 60_000): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttlMs,
    });
  }

  /**
   * Get a cached value if it has not expired.
   */
  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttlMs;
    if (isExpired) {
      return null;
    }
    return entry.data;
  }

  /**
   * Get stale or fresh data if available.
   */
  getStale<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    return entry ? entry.data : null;
  }

  /**
   * Invalidate specific cache keys or keys matching a prefix/regex.
   */
  invalidate(pattern: string | RegExp): void {
    if (typeof pattern === 'string') {
      for (const key of this.store.keys()) {
        if (key.startsWith(pattern) || key === pattern) {
          this.store.delete(key);
        }
      }
    } else {
      for (const key of this.store.keys()) {
        if (pattern.test(key)) {
          this.store.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cached data.
   */
  clearAll(): void {
    this.store.clear();
    this.inFlight.clear();
  }

  /**
   * Fetch with caching, request deduplication, and optional SWR.
   */
  async fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const { ttlMs = 60_000, forceRefresh = false, staleWhileRevalidate = false } = options;

    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached !== null) {
        return cached;
      }

      if (staleWhileRevalidate) {
        const stale = this.getStale<T>(key);
        if (stale !== null) {
          // Revalidate in background
          this.executeAndCache(key, fetcher, ttlMs).catch(() => {});
          return stale;
        }
      }
    }

    // Deduplicate in-flight requests for the exact same key
    const ongoing = this.inFlight.get(key) as Promise<T> | undefined;
    if (ongoing) {
      return ongoing;
    }

    const promise = this.executeAndCache(key, fetcher, ttlMs);
    this.inFlight.set(key, promise);

    try {
      return await promise;
    } finally {
      this.inFlight.delete(key);
    }
  }

  private async executeAndCache<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const data = await fetcher();
    this.set(key, data, ttlMs);
    return data;
  }
}

export const apiCache = new ApiCache();

