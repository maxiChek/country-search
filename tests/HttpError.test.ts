import { HttpError } from '../src/HttpError';

describe('HttpError', () => {
  it('is an instance of Error and HttpError', () => {
    const err = new HttpError(500);
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(HttpError);
  });

  it('stores the status code', () => {
    const err = new HttpError(404);
    expect(err.status).toBe(404);
  });

  it('has name "HttpError"', () => {
    const err = new HttpError(500);
    expect(err.name).toBe('HttpError');
  });

  it('uses a default message when none is provided', () => {
    const err = new HttpError(503);
    expect(err.message).toBe('HTTP error 503');
  });

  it('keeps a custom message when provided', () => {
    const err = new HttpError(500, 'Server exploded');
    expect(err.message).toBe('Server exploded');
  });
});
