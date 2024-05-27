import { APIOptions as BaseAPIOptions } from './cachedFetch.types';

export { useFetch } from './useFetch';
export type { DefaultCacheConfig, CacheConfig } from './cachedFetch.types';
export type APIOptions = Omit<BaseAPIOptions, 'queryType'>;
