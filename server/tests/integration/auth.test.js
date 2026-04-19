/**
 * Integration tests for auth endpoints.
 * Mocks external dependencies (Prisma, GitHub API) so tests run without real infra.
 */

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_client_id';
process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const request = require('supertest');

const mockUser = {
  id: 'user_123',
  githubId: '456',
  username: 'testuser',
  email: 'test@example.com',
  avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  accessToken: Buffer.alloc(32, 'a').toString('base64'), // encrypted placeholder
};

const mockSession = {
  id: 'sess_abc',
  token: 'valid_session_token',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  user: mockUser,
};

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
      session: {
        findUnique: jest.fn().mockResolvedValue(mockSession),
        delete: jest.fn().mockResolvedValue(mockSession),
        create: jest.fn().mockResolvedValue(mockSession),
      },
      user: {
        upsert: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      repository: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        delete: jest.fn(),
      },
      commit: {
        findMany: jest.fn().mockResolvedValue([]),
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    })),
  };
});

const app = require('../../src/app');

describe('GET /api/v1/auth/me', () => {
  it('returns 401 without session cookie', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('returns user data with valid session cookie', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', 'session=valid_session_token');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('testuser');
    expect(res.body.data.connectedRepo).toBeNull();
  });
});

describe('GET /api/v1/auth/github', () => {
  it('redirects to GitHub OAuth', async () => {
    const res = await request(app).get('/api/v1/auth/github');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/github\.com\/login\/oauth\/authorize/);
    expect(res.headers.location).toContain('client_id=test_client_id');
    expect(res.headers.location).toContain('scope=');
    // Should set the state cookie
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

describe('POST /api/v1/auth/logout', () => {
  it('returns 401 if not authenticated', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(401);
  });

  it('clears session cookie on logout', async () => {
    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', 'session=valid_session_token');
    expect(res.status).toBe(200);
    // Cookie should be cleared (maxAge=0 or expires in past)
    const cookies = res.headers['set-cookie'] || [];
    const sessionCookie = cookies.find((c) => c.startsWith('session='));
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie).toMatch(/expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });
});

describe('Rate limiting on auth endpoints', () => {
  it('returns 429 after exceeding auth rate limit', async () => {
    // Auth limit is 20/15min per IP
    const requests = Array.from({ length: 22 }, () =>
      request(app).get('/api/v1/auth/github')
    );
    const responses = await Promise.all(requests);
    const tooMany = responses.filter((r) => r.status === 429);
    expect(tooMany.length).toBeGreaterThan(0);
  });
});
