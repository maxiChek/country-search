export interface RawCountry {
  name: { common: string };
  flags: { svg: string; png: string };
  capital?: string[];
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
  return {
    name: raw.name.common,
    flag: raw.flags.svg || raw.flags.png,
    capital: raw.capital?.[0] ?? '—',
    region: raw.region,
    population: raw.population,
    languages: raw.languages ? Object.values(raw.languages) : [],
  };
}
