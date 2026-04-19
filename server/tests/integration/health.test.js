/**
 * Integration test for the health endpoint.
 * Uses supertest to make real HTTP requests against the Express app.
 *
 * Note: These tests mock Prisma to avoid needing a real database in CI.
 * The auth + stats integration tests (which do need a DB) are gated
 * by a real TEST_DATABASE_URL env var.
 */

// Set required env vars before importing app
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_client_id';
process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const request = require('supertest');

// Mock PrismaClient before importing app
jest.mock('@prisma/client', () => {
  const mockQueryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: mockQueryRaw,
      session: { findUnique: jest.fn(), delete: jest.fn(), create: jest.fn() },
      user: { upsert: jest.fn(), findUnique: jest.fn() },
      repository: { findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
      commit: { findMany: jest.fn(), createMany: jest.fn(), deleteMany: jest.fn() },
    })),
  };
});

const app = require('../../src/app');

describe('GET /api/v1/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('404 handler', () => {
  it('returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/v1/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});

describe('Response headers', () => {
  it('sets X-Request-Id on every response', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^req_/);
  });

  it('sets security headers via Helmet', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
