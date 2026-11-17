export interface RawCountry {
  name: string | { common: string };
  flags: { svg: string; png: string };
  capital?: string | string[];
  region: string;
  population: number;
  // API can return various shapes for languages
  languages?: Record<string, string> | Array<{ name: string }> | Record<string, { name: string }>;
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
  // Handle name (string or object)
  const name = typeof raw.name === 'string' ? raw.name : raw.name.common;

  // Handle capital (string or array)
  const capital = Array.isArray(raw.capital) ? raw.capital[0] : raw.capital;

  // Handle languages (array of objects, object of strings, object of objects)
  let languages: string[] = [];
  if (raw.languages) {
    if (Array.isArray(raw.languages)) {
      // If it's an array: [{ name: "English" }, { name: "Spanish" }]
      languages = raw.languages.map((l) => (typeof l === 'string' ? l : l.name));
    } else {
      // If it's an object: { eng: "English" } OR { eng: { name: "English" } }
      languages = Object.values(raw.languages).map((l) =>
        typeof l === 'string' ? l : (l as { name: string }).name,
      );
    }
  }

  return {
    name,
    flag: raw.flags?.svg || raw.flags?.png || '',
    capital: capital ?? '—',
    region: raw.region,
    population: raw.population,
    languages: languages.filter(Boolean), // Clean up any undefined/null
  };
}
