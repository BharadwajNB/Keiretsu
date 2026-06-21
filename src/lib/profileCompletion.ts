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
 *   Name:     35%
 *   College:  35%
 *   Location: 30%
 */
export function getProfileCompletion(profile: Profile | null): ProfileCompletionResult {
  if (!profile) return { percentage: 0, missingFields: ['all'], isComplete: false };

  const checks: Array<{ field: string; weight: number; filled: boolean }> = [
    { field: 'Name', weight: 35, filled: !!profile.name?.trim() },
    { field: 'College', weight: 35, filled: !!profile.college?.trim() },
    { field: 'Location', weight: 30, filled: !!profile.latitude },
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
