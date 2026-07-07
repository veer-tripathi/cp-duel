const axios = require('axios');

const CF_BASE = 'https://codeforces.com/api';
const PROBLEM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

let cachedProblems = null;
let cachedProblemsAt = 0;
let problemsFetchPromise = null;

// Fetch all problems from Codeforces
const fetchProblems = async () => {
  const now = Date.now();
  if (cachedProblems && now - cachedProblemsAt < PROBLEM_CACHE_TTL_MS) {
    return cachedProblems;
  }

  if (!problemsFetchPromise) {
    problemsFetchPromise = axios.get(`${CF_BASE}/problemset.problems`)
      .then((res) => {
        if (res.data.status !== 'OK') throw new Error('Codeforces API error');
        cachedProblems = res.data.result.problems;
        cachedProblemsAt = Date.now();
        return cachedProblems;
      })
      .finally(() => {
        problemsFetchPromise = null;
      });
  }

  return problemsFetchPromise;
};

// Fetch user's solved problems (AC submissions)
const fetchSolvedProblems = async (handle) => {
  const res = await axios.get(`${CF_BASE}/user.status`, {
    params: { handle, from: 1, count: 5000 },
  });
  if (res.data.status !== 'OK') throw new Error(`CF API error for handle: ${handle}`);

  const solved = new Set();
  for (const sub of res.data.result) {
    if (sub.verdict === 'OK' && sub.problem) {
      solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
    }
  }
  return solved;
};

// Select a random problem based on average rating, not solved by either player
const selectProblem = async (handle1, handle2, avgRating) => {
  const lo = avgRating - 200;
  const hi = avgRating + 200;

  // Banned tags (special or non-standard problems)
  const BANNED_TAGS = ['*special', 'interactive'];

  const [problems, solved1, solved2] = await Promise.all([
    fetchProblems(),
    fetchSolvedProblems(handle1),
    fetchSolvedProblems(handle2),
  ]);

  // Filter suitable problems
  const candidates = problems.filter((p) => {
    const key = `${p.contestId}-${p.index}`;
    const inRatingRange = p.rating >= lo && p.rating <= hi;
    const notSolvedByEither = !solved1.has(key) && !solved2.has(key);
    const noGym = p.contestId < 100000; // Gym contests have IDs >= 100000
    const noIndex = p.contestId !== undefined && p.index !== undefined;
    const hasTags = p.tags && !p.tags.some((t) => BANNED_TAGS.includes(t));
    return inRatingRange && notSolvedByEither && noGym && noIndex && hasTags;
  });

  if (candidates.length === 0) {
    throw new Error('No suitable problem found in rating range');
  }

  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  return {
    contestId: pick.contestId,
    index: pick.index,
    name: pick.name,
    rating: pick.rating,
    tags: pick.tags || [],
    url: `https://codeforces.com/problemset/problem/${pick.contestId}/${pick.index}`,
  };
};

// Get recent submissions for a handle (last N)
const getRecentSubmissions = async (handle, count = 10) => {
  const res = await axios.get(`${CF_BASE}/user.status`, {
    params: { handle, from: 1, count },
  });
  if (res.data.status !== 'OK') return [];
  return res.data.result;
};

module.exports = { selectProblem, getRecentSubmissions };
