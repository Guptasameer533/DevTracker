process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'test_id';
process.env.GITHUB_CLIENT_SECRET = 'test_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const mockUser = { id: 'u_1', githubId: '123', username: 'testuser' };
const mockSession = { id: 'sess_1', token: 'tok_abc', userId: 'u_1' };

const mockUpsert = jest.fn().mockResolvedValue(mockUser);
const mockCreate = jest.fn().mockResolvedValue(mockSession);
const mockDelete = jest.fn().mockResolvedValue(mockSession);

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: { upsert: mockUpsert },
    session: { create: mockCreate, delete: mockDelete },
  })),
}));

const authService = require('../../src/services/auth.service');

describe('auth.service', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('upsertUserAndCreateSession', () => {
    it('calls user.upsert with encrypted token and creates session', async () => {
      const profile = {
        githubId: '123',
        username: 'testuser',
        email: 'test@example.com',
        avatarUrl: null,
        accessToken: 'gho_real_token',
      };
      const { user, sessionToken } = await authService.upsertUserAndCreateSession(profile, 'req_x');

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { githubId: '123' },
          create: expect.objectContaining({
            githubId: '123',
            username: 'testuser',
          }),
        })
      );
      // Token in DB should NOT be the plaintext original
      const createCall = mockUpsert.mock.calls[0][0];
      expect(createCall.create.accessToken).not.toBe('gho_real_token');

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(typeof sessionToken).toBe('string');
      expect(sessionToken.length).toBe(64); // 32 bytes hex
      expect(user).toBe(mockUser);
    });
  });

  describe('deleteSession', () => {
    it('deletes the session by token', async () => {
      await authService.deleteSession('tok_abc', 'req_x');
      expect(mockDelete).toHaveBeenCalledWith({ where: { token: 'tok_abc' } });
    });

    it('does not throw if session is already gone', async () => {
      mockDelete.mockRejectedValueOnce(new Error('Record not found'));
      await expect(authService.deleteSession('missing_token', 'req_x')).resolves.not.toThrow();
    });
  });

  describe('generateOAuthState', () => {
    it('returns a hex string of 64 characters', () => {
      const state = authService.generateOAuthState();
      expect(typeof state).toBe('string');
      expect(state).toMatch(/^[0-9a-f]{64}$/);
    });

    it('returns a unique value each call', () => {
      expect(authService.generateOAuthState()).not.toBe(authService.generateOAuthState());
    });
  });
});
