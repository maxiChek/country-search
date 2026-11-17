import { HttpError } from './HttpError.js';
import type { RawCountry } from './mapCountryResponse.js';

const BASE_URL = 'https://countries.dev/name';

export async function searchCountries(query: string, signal: AbortSignal): Promise<RawCountry[]> {
  const url = `${BASE_URL}/${encodeURIComponent(query)}`;
  const response = await fetch(url, { signal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  const data: RawCountry[] = await response.json();
  return data;
}
