export interface RawCountry {
  name: string | { common: string }; // Supports both string and object
  flags: { svg: string; png: string };
  capital?: string | string[]; // Supports both string and array
  region: string;
  population: number;
  languages?: Record<string, string>;
}

export interface CountryCard {
  name: string;
  flag: string;
  capital: string;
  region: string;
  population: number;
  languages: string[];
}

export function mapCountryResponse(raw: RawCountry): CountryCard {
  // Handle both API and test data formats
  const name = typeof raw.name === 'string' ? raw.name : raw.name.common;
  const capital = Array.isArray(raw.capital) ? raw.capital[0] : raw.capital;

  return {
    name,
    flag: raw.flags?.svg || raw.flags?.png || '',
    capital: capital ?? '—',
    region: raw.region,
    population: raw.population,
    languages: raw.languages ? Object.values(raw.languages) : [],
  };
}
