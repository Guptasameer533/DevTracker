/**
 * Integration tests for stats endpoints.
 */

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_client_id';
process.env.GITHUB_CLIENT_SECRET = 'test_client_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const request = require('supertest');

const mockRepo = {
  id: 'repo_123',
  userId: 'user_123',
  githubRepoId: '999',
  name: 'my-repo',
  fullName: 'testuser/my-repo',
  private: false,
  archived: false,
};

const mockUser = {
  id: 'user_123',
  githubId: '456',
  username: 'testuser',
  email: 'test@example.com',
  avatarUrl: null,
  accessToken: Buffer.alloc(32, 'a').toString('base64'),
};

const mockSession = {
  id: 'sess_abc',
  token: 'valid_session_token',
  userId: mockUser.id,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  user: mockUser,
};

// Dates within the last 30 days so they fall inside the stats window
const now = new Date();
const d = (daysAgo) => new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

const mockCommits = [
  { sha: 'abc1234', message: 'fix: null check', authorLogin: 'testuser', timestamp: d(2), url: 'https://github.com/t/r/commit/abc1234' },
  { sha: 'def5678', message: 'feat: add feature', authorLogin: 'testuser', timestamp: d(2), url: 'https://github.com/t/r/commit/def5678' },
  { sha: 'ghi9012', message: 'docs: update readme', authorLogin: 'collaborator', timestamp: d(5), url: 'https://github.com/t/r/commit/ghi9012' },
];

// Shared mock functions so any PrismaClient instance uses the same refs
const mockRepoFindFirst = jest.fn().mockResolvedValue(mockRepo);
const mockCommitFindMany = jest.fn().mockResolvedValue(mockCommits);

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      $connect: jest.fn().mockResolvedValue(undefined),
      $disconnect: jest.fn().mockResolvedValue(undefined),
      $queryRaw: jest.fn().mockResolvedValue([]),
      session: {
        findUnique: jest.fn().mockResolvedValue(mockSession),
        delete: jest.fn(),
        create: jest.fn(),
      },
      user: {
        upsert: jest.fn().mockResolvedValue(mockUser),
        findUnique: jest.fn().mockResolvedValue(mockUser),
      },
      repository: {
        findFirst: mockRepoFindFirst,
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn(),
        delete: jest.fn(),
      },
      commit: {
        findMany: mockCommitFindMany,
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
        deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    })),
  };
});

const app = require('../../src/app');

describe('GET /api/v1/stats/commits', () => {
  it('returns 401 without auth', async () => {
    const res = await request(app).get('/api/v1/stats/commits');
    expect(res.status).toBe(401);
  });

  it('returns daily buckets with connected repo', async () => {
    const res = await request(app)
      .get('/api/v1/stats/commits')
      .set('Cookie', 'session=valid_session_token');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.repo).toBeDefined();
    expect(res.body.data.repo.fullName).toBe('testuser/my-repo');
    expect(Array.isArray(res.body.data.buckets)).toBe(true);
    expect(res.body.data.buckets.length).toBe(31); // 30 days + today
    expect(res.body.data.summary).toBeDefined();
    expect(res.body.data.summary.totalCommits).toBe(mockCommits.length);
  });

  it('returns empty state when no repo connected', async () => {
    mockRepoFindFirst.mockResolvedValueOnce(null);

    const res = await request(app)
      .get('/api/v1/stats/commits')
      .set('Cookie', 'session=valid_session_token');

    expect(res.status).toBe(200);
    expect(res.body.data.repo).toBeNull();
    expect(res.body.data.buckets).toEqual([]);
  });

  it('rejects invalid date params', async () => {
    const res = await request(app)
      .get('/api/v1/stats/commits?from=not-a-date')
      .set('Cookie', 'session=valid_session_token');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('GET /api/v1/stats/demo', () => {
  it('returns demo stats without auth', async () => {
    const res = await request(app).get('/api/v1/stats/demo');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.repo).toBeDefined();
    expect(Array.isArray(res.body.data.buckets)).toBe(true);
  });
});
