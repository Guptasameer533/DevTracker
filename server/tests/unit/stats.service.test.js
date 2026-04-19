const { computeSummary } = require('../../src/services/stats.service');

describe('stats.service.computeSummary', () => {
  it('returns zeros for empty buckets', () => {
    const result = computeSummary([]);
    expect(result).toEqual({
      totalCommits: 0,
      lastCommitDate: null,
      busiestDay: null,
    });
  });

  it('correctly totals commits', () => {
    const buckets = [
      { date: '2024-01-01', count: 3 },
      { date: '2024-01-02', count: 0 },
      { date: '2024-01-03', count: 5 },
    ];
    const result = computeSummary(buckets);
    expect(result.totalCommits).toBe(8);
  });

  it('identifies the busiest day', () => {
    const buckets = [
      { date: '2024-01-01', count: 3 },
      { date: '2024-01-02', count: 7 },
      { date: '2024-01-03', count: 1 },
    ];
    const result = computeSummary(buckets);
    expect(result.busiestDay).toEqual({ date: '2024-01-02', count: 7 });
  });

  it('finds the last commit date (skips zero-count days)', () => {
    const buckets = [
      { date: '2024-01-01', count: 2 },
      { date: '2024-01-02', count: 0 },
      { date: '2024-01-03', count: 0 },
    ];
    const result = computeSummary(buckets);
    expect(result.lastCommitDate).toBe('2024-01-01');
  });

  it('handles all-zero buckets', () => {
    const buckets = [
      { date: '2024-01-01', count: 0 },
      { date: '2024-01-02', count: 0 },
    ];
    const result = computeSummary(buckets);
    expect(result.totalCommits).toBe(0);
    expect(result.lastCommitDate).toBeNull();
    // No commits → no meaningful "busiest day"
    expect(result.busiestDay).toBeNull();
  });
});
