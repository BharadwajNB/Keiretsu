'use client';

import { useGitHubProfile } from '@/hooks/useGitHubProfile';
import { Star, Flame, ExternalLink } from 'lucide-react';
import styles from './GitHubCard.module.css';

interface GitHubCardProps {
  githubUrl: string;
}

export default function GitHubCard({ githubUrl }: GitHubCardProps) {
  const gh = useGitHubProfile(githubUrl);

  // Don't render if no GitHub URL or loading failed silently
  if (!githubUrl || (!gh.loading && !gh.login && !gh.error)) return null;

  if (gh.loading) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.ghIcon}>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className={styles.cardTitle}>GitHub Activity</span>
        </div>
        <div className={styles.loadingState}>
          <div className="spinner" />
        </div>
      </div>
    );
  }

  if (gh.error) {
    return (
      <div className={styles.card}>
        <div className={styles.cardHeader}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.ghIcon}>
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          <span className={styles.cardTitle}>GitHub Activity</span>
        </div>
        <p className={styles.errorState}>{gh.error}</p>
      </div>
    );
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className={styles.ghIcon}>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
        </svg>
        <span className={styles.cardTitle}>GitHub Activity</span>

        {gh.recentActivityDays > 0 && (
          <span className={styles.streakBadge}>
            <Flame size={13} />
            {gh.recentActivityDays}-day activity
          </span>
        )}
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{gh.public_repos}</span>
          <span className={styles.statLabel}>Repos</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{gh.followers}</span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{gh.following}</span>
          <span className={styles.statLabel}>Following</span>
        </div>
      </div>

      {/* Language Distribution */}
      {gh.topLanguages.length > 0 && (
        <div className={styles.languageSection}>
          <div className={styles.langBar}>
            {gh.topLanguages.map((lang) => (
              <div
                key={lang.name}
                className={styles.langSegment}
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                }}
                title={`${lang.name}: ${lang.percentage}%`}
              />
            ))}
          </div>
          <div className={styles.langLegend}>
            {gh.topLanguages.map((lang) => (
              <span key={lang.name} className={styles.langItem}>
                <span className={styles.langDot} style={{ backgroundColor: lang.color }} />
                {lang.name}
                <span className={styles.langPercent}>{lang.percentage}%</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Pinned Repos */}
      {gh.pinnedRepos.length > 0 && (
        <div className={styles.reposSection}>
          <div className={styles.reposGrid}>
            {gh.pinnedRepos.map((repo) => (
              <a
                key={repo.name}
                href={repo.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.repoCard}
              >
                <div className={styles.repoInfo}>
                  <div className={styles.repoName}>{repo.name}</div>
                  {repo.description && (
                    <div className={styles.repoDesc}>{repo.description}</div>
                  )}
                </div>
                <div className={styles.repoMeta}>
                  {repo.language && (
                    <span className={styles.repoLang}>
                      <span
                        className={styles.langDot}
                        style={{ backgroundColor: LANGUAGE_COLORS[repo.language] || '#8b8b8b', width: 6, height: 6 }}
                      />
                      {repo.language}
                    </span>
                  )}
                  {repo.stargazers_count > 0 && (
                    <span className={styles.repoStars}>
                      <Star size={11} />
                      {repo.stargazers_count}
                    </span>
                  )}
                  <ExternalLink size={12} style={{ opacity: 0.3 }} />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Re-export colors for inline usage
const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Java: '#b07219', 'C++': '#f34b7d', C: '#555555', Go: '#00ADD8',
  Rust: '#dea584', Ruby: '#701516', PHP: '#4F5D95', Swift: '#F05138',
  Kotlin: '#A97BFF', Dart: '#00B4AB', HTML: '#e34c26', CSS: '#563d7c',
  Shell: '#89e051',
};
