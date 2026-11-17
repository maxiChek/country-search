import { mapCountryResponse, type RawCountry } from '../src/mapCountryResponse';

function makeRaw(overrides: Partial<RawCountry> = {}): RawCountry {
  return {
    name: { common: 'Spain' },
    flags: { svg: 'flag.svg', png: 'flag.png' },
    capital: ['Madrid'],
    region: 'Europe',
    population: 47351567,
    languages: { spa: 'Spanish' },
    ...overrides,
  };
}

describe('mapCountryResponse', () => {
  it('maps all fields into a country card', () => {
    const card = mapCountryResponse(makeRaw());
    expect(card).toEqual({
      name: 'Spain',
      flag: 'flag.svg',
      capital: 'Madrid',
      region: 'Europe',
      population: 47351567,
      languages: ['Spanish'],
    });
  });

  it('uses an em dash when capital is missing', () => {
    const card = mapCountryResponse(makeRaw({ capital: undefined }));
    expect(card.capital).toBe('—');
  });

  it('uses an empty array when languages are missing', () => {
    const card = mapCountryResponse(makeRaw({ languages: undefined }));
    expect(card.languages).toEqual([]);
  });

  it('falls back to png flag when svg is missing', () => {
    const card = mapCountryResponse(makeRaw({ flags: { svg: '', png: 'flag.png' } }));
    expect(card.flag).toBe('flag.png');
  });
});
