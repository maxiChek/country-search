export function mapCountryResponse(raw) {
    // Handle name (string or object)
    const name = typeof raw.name === 'string' ? raw.name : raw.name.common;
    // Handle capital (string or array)
    const capital = Array.isArray(raw.capital) ? raw.capital[0] : raw.capital;
    // Handle languages (array of objects, object of strings, object of objects)
    let languages = [];
    if (raw.languages) {
        if (Array.isArray(raw.languages)) {
            // If it's an array: [{ name: "English" }, { name: "Spanish" }]
            languages = raw.languages.map((l) => (typeof l === 'string' ? l : l.name));
        }
        else {
            // If it's an object: { eng: "English" } OR { eng: { name: "English" } }
            languages = Object.values(raw.languages).map((l) => typeof l === 'string' ? l : l.name);
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
