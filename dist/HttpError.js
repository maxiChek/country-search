export class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message ?? `HTTP error ${status}`);
        this.name = 'HttpError';
        this.status = status;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}
