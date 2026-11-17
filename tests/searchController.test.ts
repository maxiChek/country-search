import { createSearchController, type SearchControllerDeps } from '../src/searchController';
import type { RawCountry } from '../src/mapCountryResponse';
import { HttpError } from '../src/HttpError';

function makeRaw(common: string): RawCountry {
  return {
    name: { common },
    flags: { svg: 's.svg', png: 'p.png' },
    capital: ['C'],
    region: 'R',
    population: 1,
    languages: { l: 'L' },
  };
}

const flushMicrotasks = (): Promise<void> => Promise.resolve().then(() => Promise.resolve());

function makeDeps(overrides: Partial<SearchControllerDeps> = {}): SearchControllerDeps {
  return {
    searchFn: jest.fn(async () => [] as RawCountry[]),
    onResults: jest.fn(),
    onError: jest.fn(),
    onLoadingChange: jest.fn(),
    debounceMs: 300,
    timeoutMs: 60000,
    ...overrides,
  };
}

describe('createSearchController', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('delivers mapped results after debounce and fetch', async () => {
    const deps = makeDeps({ searchFn: jest.fn(async () => [makeRaw('Spain')]) });
    const ctrl = createSearchController(deps);

    ctrl.search('Spain');
    expect(deps.onLoadingChange).toHaveBeenCalledWith(true);

    await jest.advanceTimersByTimeAsync(300);
    await flushMicrotasks();

    expect(deps.onResults).toHaveBeenCalledTimes(1);
    expect((deps.onResults as jest.Mock).mock.calls[0][0][0].name).toBe('Spain');
    expect(deps.onLoadingChange).toHaveBeenLastCalledWith(false);
  });

  it('discards a stale response when a newer search resolves first', async () => {
    const resolvers: Array<(v: RawCountry[]) => void> = [];
    const searchFn = jest.fn(() => new Promise<RawCountry[]>((r) => resolvers.push(r)));
    const deps = makeDeps({ searchFn });
    const ctrl = createSearchController(deps);

    ctrl.search('a');
    await jest.advanceTimersByTimeAsync(300);

    ctrl.search('b');
    await jest.advanceTimersByTimeAsync(300);

    expect(resolvers).toHaveLength(2);

    resolvers[1]([makeRaw('B')]);
    await flushMicrotasks();
    resolvers[0]([makeRaw('A')]);
    await flushMicrotasks();

    expect(deps.onResults).toHaveBeenCalledTimes(1);
    expect((deps.onResults as jest.Mock).mock.calls[0][0][0].name).toBe('B');
  });

  it('aborts the previous in-flight request when a new search starts', async () => {
    const signals: AbortSignal[] = [];
    const searchFn = jest.fn((_q: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<RawCountry[]>(() => {});
    });
    const ctrl = createSearchController(makeDeps({ searchFn }));

    ctrl.search('a');
    await jest.advanceTimersByTimeAsync(300);

    ctrl.search('b');
    await jest.advanceTimersByTimeAsync(300);

    expect(signals).toHaveLength(2);
    expect(signals[0].aborted).toBe(true);
    expect(signals[1].aborted).toBe(false);
  });

  it('dispose aborts the in-flight request and suppresses delivery', async () => {
    const signals: AbortSignal[] = [];
    const resolvers: Array<(v: RawCountry[]) => void> = [];
    const searchFn = jest.fn((_q: string, signal: AbortSignal) => {
      signals.push(signal);
      return new Promise<RawCountry[]>((r) => resolvers.push(r));
    });
    const deps = makeDeps({ searchFn });
    const ctrl = createSearchController(deps);

    ctrl.search('a');
    await jest.advanceTimersByTimeAsync(300);
    expect(signals[0].aborted).toBe(false);

    ctrl.dispose();
    expect(signals[0].aborted).toBe(true);

    resolvers[0]([makeRaw('A')]);
    await flushMicrotasks();

    expect(deps.onResults).not.toHaveBeenCalled();
  });

  it('calls onError with the thrown error on failure', async () => {
    const err = new HttpError(500);
    const deps = makeDeps({
      searchFn: jest.fn(async () => {
        throw err;
      }),
    });
    const ctrl = createSearchController(deps);

    ctrl.search('Spain');
    await jest.advanceTimersByTimeAsync(300);
    await flushMicrotasks();

    expect(deps.onError).toHaveBeenCalledWith(err);
    expect(deps.onResults).not.toHaveBeenCalled();
  });

  it('swallows user-initiated abort without calling onError', async () => {
    const searchFn = jest.fn((_q: string, signal: AbortSignal) => {
      return new Promise<RawCountry[]>((_r, reject) => {
        signal.addEventListener('abort', () => {
          const e = new Error('The operation was aborted');
          e.name = 'AbortError';
          reject(e);
        });
      });
    });
    const deps = makeDeps({ searchFn });
    const ctrl = createSearchController(deps);

    ctrl.search('a');
    await jest.advanceTimersByTimeAsync(300);

    ctrl.search('b');
    await flushMicrotasks();

    expect(deps.onError).not.toHaveBeenCalled();
  });
});
