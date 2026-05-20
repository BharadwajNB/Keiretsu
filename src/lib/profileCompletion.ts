'use client';

import type { Profile } from '@/lib/types';

interface ProfileCompletionResult {
  percentage: number;
  missingFields: string[];
  isComplete: boolean;
}

/**
 * Computes profile completion percentage from a Profile object.
 *
 * Weights:
 *   Name:     20%
 *   College:  20%
 *   GitHub:   15%
 *   Bio:      10%
 *   Skills:   20%
 *   Location: 15%
 */
export function getProfileCompletion(profile: Profile | null): ProfileCompletionResult {
  if (!profile) return { percentage: 0, missingFields: ['all'], isComplete: false };

  const checks: Array<{ field: string; weight: number; filled: boolean }> = [
    { field: 'Name', weight: 20, filled: !!profile.name?.trim() },
    { field: 'College', weight: 20, filled: !!profile.college?.trim() },
    { field: 'GitHub', weight: 15, filled: !!profile.github_url?.trim() },
    { field: 'Bio', weight: 10, filled: !!profile.bio?.trim() },
    { field: 'Skills', weight: 20, filled: (profile.skills?.length || 0) > 0 },
    { field: 'Location', weight: 15, filled: !!profile.latitude },
  ];

  let earned = 0;
  const missingFields: string[] = [];

  checks.forEach(({ field, weight, filled }) => {
    if (filled) {
      earned += weight;
    } else {
      missingFields.push(field);
    }
  });

  return {
    percentage: earned,
    missingFields,
    isComplete: earned >= 100,
  };
}
