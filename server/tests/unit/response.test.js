const { AppError } = require('../../src/utils/response');

describe('AppError', () => {
  it('creates an operational error with correct properties', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND');
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.isOperational).toBe(true);
  });

  it('defaults to 500 INTERNAL_ERROR', () => {
    const err = new AppError('Something broke');
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe('INTERNAL_ERROR');
  });

  it('is an instance of Error', () => {
    expect(new AppError('test')).toBeInstanceOf(Error);
  });
});
