process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/devtrack_test';
process.env.GITHUB_CLIENT_ID = 'gh_client_id';
process.env.GITHUB_CLIENT_SECRET = 'gh_client_secret';
process.env.SESSION_SECRET = 'test_session_secret_must_be_at_least_32_chars_long';
process.env.ENCRYPTION_KEY = Buffer.alloc(32, 'a').toString('base64');
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.NODE_ENV = 'test';

const axios = require('axios');

jest.mock('axios', () => {
  const mockAxios = {
    create: jest.fn(),
    post: jest.fn(),
    get: jest.fn(),
  };
  return mockAxios;
});

const githubService = require('../../src/services/github.service');

describe('github.service.exchangeCodeForToken', () => {
  it('returns access_token on success', async () => {
    axios.post.mockResolvedValueOnce({ data: { access_token: 'gho_token_123' } });
    const token = await githubService.exchangeCodeForToken('auth_code_abc', 'req_x');
    expect(token).toBe('gho_token_123');
    expect(axios.post).toHaveBeenCalledWith(
      'https://github.com/login/oauth/access_token',
      expect.objectContaining({ code: 'auth_code_abc' }),
      expect.any(Object)
    );
  });

  it('throws AppError when GitHub returns no access_token', async () => {
    axios.post.mockResolvedValueOnce({ data: { error: 'bad_verification_code' } });
    const { AppError } = require('../../src/utils/response');
    await expect(githubService.exchangeCodeForToken('bad_code', 'req_x'))
      .rejects.toBeInstanceOf(AppError);
  });
});

describe('github.service.getUser', () => {
  it('returns user profile with primary email', async () => {
    const mockInstance = {
      get: jest.fn()
        .mockResolvedValueOnce({
          data: {
            id: 99,
            login: 'octocat',
            avatar_url: 'https://avatars.githubusercontent.com/u/99',
            email: null,
          },
        })
        .mockResolvedValueOnce({
          data: [
            { email: 'secondary@example.com', primary: false, verified: true },
            { email: 'primary@example.com', primary: true, verified: true },
          ],
        }),
      interceptors: {
        response: { use: jest.fn() },
      },
    };
    axios.create.mockReturnValueOnce(mockInstance);

    const user = await githubService.getUser('gho_token', 'req_x');
    expect(user.githubId).toBe('99');
    expect(user.username).toBe('octocat');
    expect(user.email).toBe('primary@example.com');
  });
});
