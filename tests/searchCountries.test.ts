import { searchCountries, clearSearchCache } from '../src/searchCountries.js';
import { HttpError } from '../src/HttpError.js';
import type { RawCountry } from '../src/mapCountryResponse.js';

function makeRaw(): RawCountry {
  return {
    name: { common: 'Spain' },
    flags: { svg: 'flag.svg', png: 'flag.png' },
    capital: ['Madrid'],
    region: 'Europe',
    population: 47351567,
    languages: { spa: 'Spanish' },
  };
}

function mockResponse(init: { ok: boolean; status: number; body?: unknown }): Response {
  return {
    ok: init.ok,
    status: init.status,
    json: async () => init.body,
  } as unknown as Response;
}

describe('searchCountries', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    clearSearchCache();
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it('returns parsed countries on 200', async () => {
    const raw = makeRaw();
    fetchMock.mockResolvedValue(mockResponse({ ok: true, status: 200, body: [raw] }));

    const controller = new AbortController();
    const result = await searchCountries('Spain', controller.signal);

    expect(result).toEqual([raw]);
  });

  it('returns an empty array on 404', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: false, status: 404 }));

    const controller = new AbortController();
    const result = await searchCountries('Nowhere', controller.signal);

    expect(result).toEqual([]);
  });

  it('throws HttpError on 5xx', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: false, status: 500 }));

    const controller = new AbortController();
    await expect(searchCountries('Spain', controller.signal)).rejects.toBeInstanceOf(HttpError);
  });

  it('includes the status code in HttpError', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: false, status: 503 }));

    const controller = new AbortController();
    try {
      await searchCountries('Spain', controller.signal);
      throw new Error('expected rejection');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(503);
    }
  });

  it('passes the signal to fetch', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, status: 200, body: [] }));

    const controller = new AbortController();
    await searchCountries('Spain', controller.signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, options] = fetchMock.mock.calls[0];
    expect(options.signal).toBe(controller.signal);
  });

  it('encodes the query in the URL', async () => {
    fetchMock.mockResolvedValue(mockResponse({ ok: true, status: 200, body: [] }));

    const controller = new AbortController();
    await searchCountries('New Zealand', controller.signal);

    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toContain('New%20Zealand');
  });

  it('propagates AbortError without wrapping it', async () => {
    fetchMock.mockImplementation((_url, options) => {
      const signal = (options as RequestInit).signal as AbortSignal;
      if (signal.aborted) {
        const err = new Error('The operation was aborted');
        err.name = 'AbortError';
        return Promise.reject(err);
      }
      return new Promise(() => {});
    });

    const controller = new AbortController();
    controller.abort();

    await expect(searchCountries('Spain', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
