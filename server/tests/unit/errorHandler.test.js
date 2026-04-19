process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_id';
process.env.GITHUB_CLIENT_SECRET = 'test_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const errorHandler = require('../../src/middleware/errorHandler');
const { AppError } = require('../../src/utils/response');

function makeRes(requestId = 'req_test') {
  const res = {
    locals: { requestId },
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  return res;
}

const req = { path: '/test', method: 'GET', user: { id: 'u_1' } };
const next = jest.fn();

describe('errorHandler middleware', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns operational AppError with its status and code', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND');
    const res = makeRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toBe('Not found');
    expect(res.body.success).toBe(false);
    expect(res.body.requestId).toBe('req_test');
  });

  it('returns 500 INTERNAL_ERROR for non-operational errors', () => {
    const err = new Error('something unexpected');
    const res = makeRes();
    errorHandler(err, req, res, next);
    expect(res.statusCode).toBe(500);
    expect(res.body.code).toBe('INTERNAL_ERROR');
    expect(res.body.message).toBe('An unexpected error occurred');
  });

  it('does not leak internal error details in the response body', () => {
    const err = new Error('db password is hunter2');
    const res = makeRes();
    errorHandler(err, req, res, next);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
  });
});
