/**
 * Seed script for demo mode data.
 * Inserts a synthetic "demo" user + repository + 30 days of realistic commits
 * sourced from a snapshot of facebook/react activity patterns.
 *
 * Run: node prisma/seed.js
 */

const { PrismaClient } = require('@prisma/client');
const { encrypt } = require('../src/utils/crypto');

const prisma = new PrismaClient();

const DEMO_USER = {
  id: 'demo_user_id',
  githubId: '0',
  username: 'demo',
  email: 'demo@devtrack.io',
  avatarUrl: 'https://avatars.githubusercontent.com/u/69631?v=4',
  accessToken: 'demo_token_not_real',
};

const DEMO_REPO = {
  id: 'demo_repo_id',
  userId: 'demo_user_id',
  githubRepoId: '10270250',
  name: 'react',
  fullName: 'facebook/react',
  private: false,
  archived: false,
};

function generateCommits(repoId) {
  const commits = [];
  const now = new Date();
  const authors = ['acdlite', 'sebmarkbage', 'gaearon', 'rickhanlonii', 'eps1lon'];
  const messages = [
    'fix: resolve hydration mismatch on concurrent renders',
    'feat: add useFormStatus hook',
    'refactor: simplify reconciler fiber work loop',
    'test: add regression tests for suspense boundary',
    'docs: update concurrent features guide',
    'chore: upgrade bundler dependencies',
    'fix: correct effect cleanup ordering',
    'perf: reduce allocations in hot path',
    'feat: implement startTransition improvements',
    'fix: handle null ref in forwardRef',
  ];

  // Generate commits spread over last 30 days (2–8 per day, realistic)
  for (let day = 0; day < 30; day++) {
    const commitsPerDay = Math.floor(Math.random() * 7) + 2;
    for (let c = 0; c < commitsPerDay; c++) {
      const ts = new Date(now);
      ts.setDate(ts.getDate() - day);
      ts.setHours(Math.floor(Math.random() * 16) + 8); // 8am–midnight
      ts.setMinutes(Math.floor(Math.random() * 60));

      const sha = Math.random().toString(36).slice(2, 9) +
                  Math.random().toString(36).slice(2, 9);

      commits.push({
        repoId,
        sha,
        message: messages[Math.floor(Math.random() * messages.length)],
        authorLogin: authors[Math.floor(Math.random() * authors.length)],
        timestamp: ts,
        url: `https://github.com/facebook/react/commit/${sha}`,
      });
    }
  }
  return commits;
}

async function main() {
  console.log('Seeding demo data...');

  const encryptedToken = encrypt(DEMO_USER.accessToken);

  await prisma.user.upsert({
    where: { id: DEMO_USER.id },
    update: {},
    create: {
      id: DEMO_USER.id,
      githubId: DEMO_USER.githubId,
      username: DEMO_USER.username,
      email: DEMO_USER.email,
      avatarUrl: DEMO_USER.avatarUrl,
      accessToken: encryptedToken,
    },
  });

  await prisma.repository.upsert({
    where: { id: DEMO_REPO.id },
    update: {},
    create: DEMO_REPO,
  });

  // Clear existing demo commits to make seed idempotent
  await prisma.commit.deleteMany({ where: { repoId: DEMO_REPO.id } });

  const commits = generateCommits(DEMO_REPO.id);
  await prisma.commit.createMany({ data: commits, skipDuplicates: true });

  console.log(`Seeded ${commits.length} demo commits for facebook/react.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
