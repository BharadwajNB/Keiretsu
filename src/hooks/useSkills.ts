'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Skill } from '@/lib/types';

export function useSkills() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('skills')
        .select('*')
        .order('category')
        .order('name');

      setSkills(data || []);
      setLoading(false);
    };

    fetchSkills();
  }, []);

  return { skills, loading };
}
