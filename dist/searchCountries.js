import { HttpError } from './HttpError.js';
const BASE_URL = 'https://countries.dev/name';
export async function searchCountries(query, signal) {
    const url = `${BASE_URL}/${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal });
    if (response.status === 404) {
        return [];
    }
    if (!response.ok) {
        throw new HttpError(response.status);
    }
    const data = await response.json();
    return data;
}
