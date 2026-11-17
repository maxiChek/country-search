export function mapCountryResponse(raw) {
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
