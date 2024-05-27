import { MemCache } from '@surjit/cache';
import { APIOptions, CacheConfig, DefaultCacheConfig } from './cachedFetch.types';

fetch;
export class CachedFetch {
  static defaultCacheValidity = 5 * 60 * 1000;
  private cacheConfig: DefaultCacheConfig;

  private cache = new MemCache();

  constructor(defaultCacheConfig: DefaultCacheConfig) {
    this.cacheConfig = this.updateCacheConfig(defaultCacheConfig);
  }

  public async fetch(input: RequestInfo | URL, options: APIOptions): Promise<unknown> {
    const affectiveCacheConfig = this.updateCacheConfig(options.cacheConfig ?? {});

    if (options.queryType === 'mutate' || affectiveCacheConfig.skipCache) {
      return await this._fetch(input, options);
    }

    const cacheKey = affectiveCacheConfig.generateCacheKey!(input, options);
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }
    let response: unknown;
    if (affectiveCacheConfig.retry) {
      response = await this.fetchWithRetry(input, options, affectiveCacheConfig.retry);
    }
    response = await this._fetch(input, options);
    this.cache.put(cacheKey, response, affectiveCacheConfig.cacheValidFor);
    return response;
  }

  private async fetchWithRetry(input: RequestInfo | URL, options: APIOptions, retry: CacheConfig['retry']): Promise<unknown> {
    let delay = retry?.delay;
    const attempts = retry?.attempts ?? 0;

    if ((delay ?? 0) < 1000) {
      delay = 1000;
    }
    try {
      // Try calling the api and get the response
      return await this._fetch(input, options);
    } catch (err) {
      // API failed, time to retry
      if (attempts <= 0) {
        // if we're out of retry attempts, throw the error
        throw err;
      } else {
        // retry after the delay
        return new Promise(resolve => {
          setTimeout(() => {
            resolve(this.fetchWithRetry(input, options, { attempts: attempts - 1, delay: delay! }));
          }, delay);
        });
      }
    }
  }

  private async _fetch(input: RequestInfo | URL, options: APIOptions): Promise<unknown> {
    const resp = await fetch(input, options);
    if (resp.ok) {
      const resolver = resp[options.resolve ?? 'json'] ?? resp.json;
      return await resolver();
    }
    throw resp;
  }

  private generateCacheKey(input: RequestInfo | URL, options: APIOptions): string {
    const tokens: string[] = [];
    tokens.push(options.method ?? 'GET');
    tokens.push(input.toString());
    if (typeof options.body === 'string') {
      tokens.push(options.body);
    } else if (options.body) {
      tokens.push(JSON.stringify(options.body));
    }
    return tokens.join('-');
  }

  public updateCacheConfig(cacheConfig: CacheConfig): CacheConfig {
    return { ...this.cacheConfig, cacheValidFor: CachedFetch.defaultCacheValidity, generateCacheKey: this.generateCacheKey, ...cacheConfig };
  }

  public get cachedKeys() {
    return this.cache.keys();
  }

  public getCachedData(key: string): null | Response {
    return this.cache.get(key);
  }
}
