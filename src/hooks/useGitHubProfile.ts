'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---- Types -------------------------------------------------------------------
export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
  fork: boolean;
}

export interface GitHubLanguage {
  name: string;
  percentage: number;
  color: string;
}

export interface GitHubProfileData {
  login: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  topLanguages: GitHubLanguage[];
  pinnedRepos: GitHubRepo[];
  recentActivityDays: number;
  loading: boolean;
  error: string | null;
}

// ---- Language Colors (GitHub's official palette subset) ----------------------
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Lua: '#000080',
  Scala: '#c22d40',
  R: '#198CE7',
  Jupyter: '#DA5B0B',
  Vue: '#41b883',
  Svelte: '#ff3e00',
};

const CACHE_KEY_PREFIX = 'keiretsu_gh_';
const CACHE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

// ---- Helpers ----------------------------------------------------------------
function extractUsername(githubUrl: string): string | null {
  if (!githubUrl) return null;
  // Handle formats: "https://github.com/user", "github.com/user", "user"
  const match = githubUrl.match(/(?:github\.com\/)?([a-zA-Z0-9\-]+)\/?$/);
  return match ? match[1] : null;
}

interface CachedData {
  data: Omit<GitHubProfileData, 'loading' | 'error'>;
  timestamp: number;
}

function getCached(username: string): CachedData | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY_PREFIX}${username}`);
    if (!raw) return null;
    const parsed: CachedData = JSON.parse(raw);
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
      sessionStorage.removeItem(`${CACHE_KEY_PREFIX}${username}`);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function setCache(username: string, data: Omit<GitHubProfileData, 'loading' | 'error'>) {
  try {
    sessionStorage.setItem(
      `${CACHE_KEY_PREFIX}${username}`,
      JSON.stringify({ data, timestamp: Date.now() })
    );
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

// ---- Hook -------------------------------------------------------------------
/**
 * Fetches public GitHub profile data for a given GitHub URL or username.
 * Caches results in sessionStorage for 30 minutes.
 */
export function useGitHubProfile(githubUrl: string | undefined | null): GitHubProfileData {
  const [state, setState] = useState<GitHubProfileData>({
    login: '',
    avatar_url: '',
    bio: null,
    public_repos: 0,
    followers: 0,
    following: 0,
    topLanguages: [],
    pinnedRepos: [],
    recentActivityDays: 0,
    loading: true,
    error: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async (username: string) => {
    // Check cache first
    const cached = getCached(username);
    if (cached) {
      setState({ ...cached.data, loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const headers: HeadersInit = { Accept: 'application/vnd.github.v3+json' };
      const signal = controller.signal;

      // Parallel fetch: user profile + repos + events
      const [userRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers, signal }),
        fetch(`https://api.github.com/users/${username}/repos?sort=pushed&per_page=20`, { headers, signal }),
        fetch(`https://api.github.com/users/${username}/events/public?per_page=30`, { headers, signal }),
      ]);

      if (!userRes.ok) {
        if (userRes.status === 403) throw new Error('GitHub API rate limit reached. Try again later.');
        if (userRes.status === 404) throw new Error('GitHub user not found.');
        throw new Error(`GitHub API error: ${userRes.status}`);
      }

      const user = await userRes.json();
      const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
      const events: Array<{ created_at: string }> = eventsRes.ok ? await eventsRes.json() : [];

      // Compute top languages from repos (exclude forks)
      const langCounts: Record<string, number> = {};
      const ownRepos = repos.filter((r) => !r.fork);
      ownRepos.forEach((repo) => {
        if (repo.language) {
          langCounts[repo.language] = (langCounts[repo.language] || 0) + 1;
        }
      });

      const totalLangRepos = Object.values(langCounts).reduce((a, b) => a + b, 0);
      const topLanguages: GitHubLanguage[] = Object.entries(langCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          percentage: Math.round((count / totalLangRepos) * 100),
          color: LANGUAGE_COLORS[name] || '#8b8b8b',
        }));

      // Pinned repos: top 3 non-fork repos sorted by stars
      const pinnedRepos = [...ownRepos]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 3);

      // Recent activity: count unique days with events in the last 30 events
      const uniqueDays = new Set(events.map((e) => e.created_at?.slice(0, 10)));
      const recentActivityDays = uniqueDays.size;

      const result: Omit<GitHubProfileData, 'loading' | 'error'> = {
        login: user.login,
        avatar_url: user.avatar_url,
        bio: user.bio,
        public_repos: user.public_repos,
        followers: user.followers,
        following: user.following,
        topLanguages,
        pinnedRepos,
        recentActivityDays,
      };

      setCache(username, result);
      setState({ ...result, loading: false, error: null });
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      setState((prev) => ({
        ...prev,
        loading: false,
        error: (err as Error).message || 'Failed to fetch GitHub data',
      }));
    }
  }, []);

  useEffect(() => {
    const username = extractUsername(githubUrl || '');
    if (!username) {
      setState((prev) => ({ ...prev, loading: false, error: null }));
      return;
    }
    fetchData(username);
    return () => abortRef.current?.abort();
  }, [githubUrl, fetchData]);

  return state;
}

/**
 * Extracts detected languages from GitHub repos as skill suggestions.
 * Maps GitHub language names to Keiretsu skill names.
 */
export function getSkillSuggestionsFromGitHub(
  topLanguages: GitHubLanguage[]
): string[] {
  const GITHUB_TO_SKILL: Record<string, string[]> = {
    JavaScript: ['JavaScript', 'Node.js'],
    TypeScript: ['TypeScript', 'Node.js'],
    Python: ['Python'],
    Java: ['Java'],
    'C++': ['C++'],
    C: ['C'],
    Go: ['Go'],
    Rust: ['Rust'],
    Ruby: ['Ruby'],
    PHP: ['PHP'],
    Swift: ['Swift', 'iOS'],
    Kotlin: ['Kotlin', 'Android'],
    Dart: ['Flutter'],
    HTML: ['HTML/CSS'],
    CSS: ['HTML/CSS'],
    Shell: ['Linux'],
  };

  const suggestions = new Set<string>();
  topLanguages.forEach((lang) => {
    const mapped = GITHUB_TO_SKILL[lang.name];
    if (mapped) mapped.forEach((s) => suggestions.add(s));
  });
  return Array.from(suggestions);
}
