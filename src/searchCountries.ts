import { HttpError } from './HttpError.js';
import type { RawCountry } from './mapCountryResponse.js';

const BASE_URL = 'https://countries.dev/name';

const cache = new Map<string, RawCountry[]>();
const inFlight = new Map<string, Promise<RawCountry[]>>();

// Export this so tests can clear the cache between runs
export function clearSearchCache(): void {
  cache.clear();
  inFlight.clear();
}

export async function searchCountries(query: string, signal: AbortSignal): Promise<RawCountry[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];

  // 1. If the request was already aborted, throw immediately
  if (signal.aborted) {
    const error = new Error('Aborted');
    error.name = 'AbortError';
    throw error;
  }

  // Use lowercase only for the cache key
  const cacheKey = trimmedQuery.toLowerCase();

  // 2. Return from cache if available
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  // 3. Return existing promise if an identical request is in-flight
  if (inFlight.has(cacheKey)) {
    return inFlight.get(cacheKey)!;
  }

  // 4. Make the network request (using original case for URL)
  const url = `${BASE_URL}/${encodeURIComponent(trimmedQuery)}`;

  const requestPromise = fetch(url, { signal })
    .then(async (response) => {
      if (response.status === 404) {
        return [];
      }
      if (!response.ok) {
        throw new HttpError(response.status);
      }
      return response.json() as Promise<RawCountry[]>;
    })
    .then((data) => {
      if (cache.size >= 50) {
        const firstKey = cache.keys().next().value;
        if (firstKey !== undefined) cache.delete(firstKey);
      }
      cache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, requestPromise);
  return requestPromise;
}
