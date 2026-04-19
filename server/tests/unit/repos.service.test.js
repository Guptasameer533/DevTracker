process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_id';
process.env.GITHUB_CLIENT_SECRET = 'test_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const mockRepoFindFirst = jest.fn();
const mockRepoFindUnique = jest.fn();
const mockRepoCreate = jest.fn();
const mockRepoDelete = jest.fn();
const mockCommitCreateMany = jest.fn().mockResolvedValue({ count: 0 });

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    repository: {
      findFirst: mockRepoFindFirst,
      findUnique: mockRepoFindUnique,
      create: mockRepoCreate,
      delete: mockRepoDelete,
    },
    commit: { createMany: mockCommitCreateMany, deleteMany: jest.fn() },
  })),
}));

// Mock crypto so decrypt returns a predictable token
jest.mock('../../src/utils/crypto', () => ({
  encrypt: jest.fn().mockReturnValue('encrypted_token'),
  decrypt: jest.fn().mockReturnValue('gho_decrypted_token'),
}));

// Mock github.service
jest.mock('../../src/services/github.service', () => ({
  listUserRepos: jest.fn(),
  fetchCommits: jest.fn().mockResolvedValue([]),
}));

const githubService = require('../../src/services/github.service');
const { AppError } = require('../../src/utils/response');
const reposService = require('../../src/services/repos.service');

const mockUser = {
  id: 'u_1',
  accessToken: 'encrypted_token',
};

const mockAvailableRepos = [
  { githubRepoId: '111', name: 'cool-project', fullName: 'user/cool-project', private: false, updatedAt: new Date().toISOString() },
  { githubRepoId: '222', name: 'other-project', fullName: 'user/other-project', private: true, updatedAt: new Date().toISOString() },
];

describe('repos.service.getConnectedRepo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null when no repo is connected', async () => {
    mockRepoFindFirst.mockResolvedValue(null);
    const repo = await reposService.getConnectedRepo('u_1');
    expect(repo).toBeNull();
  });

  it('returns the connected repo', async () => {
    const mockRepo = { id: 'r_1', fullName: 'user/cool-project' };
    mockRepoFindFirst.mockResolvedValue(mockRepo);
    const repo = await reposService.getConnectedRepo('u_1');
    expect(repo).toBe(mockRepo);
  });
});

describe('repos.service.connectRepo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws REPO_LIMIT_REACHED if user already has a repo', async () => {
    mockRepoFindFirst.mockResolvedValue({ id: 'existing_repo' });
    await expect(reposService.connectRepo(mockUser, '111', 'req_x'))
      .rejects.toMatchObject({ code: 'REPO_LIMIT_REACHED' });
  });

  it('throws REPO_ALREADY_CONNECTED if repo taken by another user', async () => {
    mockRepoFindFirst.mockResolvedValue(null);
    mockRepoFindUnique.mockResolvedValue({ id: 'other_users_repo' });
    await expect(reposService.connectRepo(mockUser, '111', 'req_x'))
      .rejects.toMatchObject({ code: 'REPO_ALREADY_CONNECTED' });
  });

  it('throws REPO_ACCESS_DENIED if repo not in user available list', async () => {
    mockRepoFindFirst.mockResolvedValue(null);
    mockRepoFindUnique.mockResolvedValue(null);
    githubService.listUserRepos.mockResolvedValue(mockAvailableRepos);
    await expect(reposService.connectRepo(mockUser, '999', 'req_x'))
      .rejects.toMatchObject({ code: 'REPO_ACCESS_DENIED' });
  });

  it('creates repo record and runs backfill on success', async () => {
    mockRepoFindFirst.mockResolvedValue(null);
    mockRepoFindUnique.mockResolvedValue(null);
    githubService.listUserRepos.mockResolvedValue(mockAvailableRepos);
    const newRepo = { id: 'r_new', ...mockAvailableRepos[0] };
    mockRepoCreate.mockResolvedValue(newRepo);

    const result = await reposService.connectRepo(mockUser, '111', 'req_x');

    expect(mockRepoCreate).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ fullName: 'user/cool-project' }) })
    );
    expect(githubService.fetchCommits).toHaveBeenCalledTimes(1);
    expect(result).toBe(newRepo);
  });
});

describe('repos.service.disconnectRepo', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws REPO_NOT_FOUND if no repo to disconnect', async () => {
    mockRepoFindFirst.mockResolvedValue(null);
    await expect(reposService.disconnectRepo('u_1', 'req_x'))
      .rejects.toMatchObject({ code: 'REPO_NOT_FOUND' });
  });

  it('deletes the repo on success', async () => {
    const mockRepo = { id: 'r_1', fullName: 'user/cool-project' };
    mockRepoFindFirst.mockResolvedValue(mockRepo);
    mockRepoDelete.mockResolvedValue(mockRepo);
    await reposService.disconnectRepo('u_1', 'req_x');
    expect(mockRepoDelete).toHaveBeenCalledWith({ where: { id: 'r_1' } });
  });
});
