export interface DefaultCacheConfig {
  /**
   * Time in milliseconds that the cache should be valid for, default: 5 minutes
   */
  cacheValidFor?: number;
  /**
   * Custom function to generate a cache key for a given request.
   * Defaults to a combination of the request URL and options.
   */
  generateCacheKey?: (input: RequestInfo | URL, options: APIOptions) => string;
  /**
   * Retry if the fetch requests fail
   */
  retry?: {
    attempts: number;
    delay: number;
  };
}

export interface CacheConfig extends DefaultCacheConfig {
  skipCache?: boolean;
}

export interface APIOptions extends RequestInit {
  /**
   * Fetch: APIs can be cached based on the cacheConfig
   * Mutate: APIs will not be cached
   */
  queryType: 'fetch' | 'mutate';

  /**
   * Cache configuration/override global config for the individual API
   */
  cacheConfig?: CacheConfig;
  /**
   * Resolve the response to a specific type. Defaults to 'json'
   */
  resolve?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  /**
   * Function to transform the response before it is set in the cache
   */
  transform?: (response: unknown) => unknown;
  /**
   * Function to do something on success
   */
  onSuccess?: (response: unknown) => void;
  /**
   * Function to do something on error
   */
  onError?: (error: unknown) => void;
}
