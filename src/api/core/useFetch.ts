import { useCallback, useEffect, useState } from 'react';
import { APIOptions } from './cachedFetch.types';
import { CachedFetch } from './cachedFetch';

const cachedFetch = new CachedFetch({
  cacheValidFor: 5 * 60 * 1000, // 5 minutes
  retry: { attempts: 3, delay: 1000 },
});

export function useFetch<R>(input: RequestInfo | URL, options: Omit<APIOptions, 'queryType'>) {
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [data, setData] = useState<R>();

  const fetchData = useCallback(
    (skipCache = false) => {
      setIsInitialized(true);
      if (data == null) {
        setIsLoading(true);
        setIsFetching(true);
      } else {
        setIsFetching(true);
      }

      cachedFetch
        .fetch(input, { ...options, queryType: 'fetch', cacheConfig: { ...options.cacheConfig, skipCache } })
        .then(resp => {
          setError(null);
          setIsError(false);
          if (options.transform) {
            setData(options.transform(resp) as R);
          } else {
            setData(resp as R);
          }
          if (options.onSuccess) {
            options.onSuccess(resp);
          }
        })
        .catch(err => {
          setIsError(true);
          setError(err);
          if (options.onError) {
            options.onError(err);
          }
        })
        .finally(() => {
          setIsLoading(false);
          setIsFetching(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, options],
  );

  useEffect(() => {
    fetchData();
  }, [input, options, fetchData]);

  return { isLoading, isFetching, isError, isInitialized, data, error, refetch: () => fetchData(true) };
}

export default useFetch;

useFetch.setDefaultCacheSettings = cachedFetch.updateCacheConfig;
