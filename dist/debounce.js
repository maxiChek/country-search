export function debounce(fn, delay) {
    let timerId = null;
    return (...args) => {
        if (timerId !== null) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(() => {
            timerId = null;
            fn(...args);
        }, delay);
    };
}
