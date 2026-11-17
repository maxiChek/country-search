import { mapCountryResponse } from './mapCountryResponse.js';
export function createSearchController(deps) {
    let currentController = null;
    let currentTimeout = null;
    let debounceTimer = null;
    let requestId = 0;
    let disposed = false;
    function cancelDebounce() {
        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
    }
    function cancelInFlight() {
        if (currentController !== null) {
            currentController.abort();
            currentController = null;
        }
        if (currentTimeout !== null) {
            clearTimeout(currentTimeout);
            currentTimeout = null;
        }
    }
    async function run(query) {
        if (disposed)
            return;
        const myId = ++requestId;
        const controller = new AbortController();
        currentController = controller;
        const timeoutId = setTimeout(() => {
            controller.abort(new DOMException('Request timed out', 'TimeoutError'));
        }, deps.timeoutMs);
        currentTimeout = timeoutId;
        try {
            const raw = await deps.searchFn(query, controller.signal);
            if (disposed || myId !== requestId)
                return;
            deps.onResults(raw.map(mapCountryResponse));
            deps.onLoadingChange(false);
        }
        catch (err) {
            if (disposed || myId !== requestId)
                return;
            const isAbort = err instanceof Error && err.name === 'AbortError';
            if (isAbort) {
                const reason = controller.signal.reason;
                if (reason instanceof DOMException && reason.name === 'TimeoutError') {
                    deps.onError(err);
                    deps.onLoadingChange(false);
                }
                return;
            }
            deps.onError(err);
            deps.onLoadingChange(false);
        }
        finally {
            if (currentTimeout === timeoutId) {
                clearTimeout(timeoutId);
                currentTimeout = null;
            }
            if (currentController === controller) {
                currentController = null;
            }
        }
    }
    function search(query) {
        if (disposed)
            return;
        cancelInFlight();
        cancelDebounce();
        deps.onLoadingChange(true);
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            void run(query);
        }, deps.debounceMs);
    }
    function dispose() {
        disposed = true;
        cancelDebounce();
        cancelInFlight();
        requestId++;
    }
    return { search, dispose };
}
