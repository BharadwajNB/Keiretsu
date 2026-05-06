import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/profile/edit';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if profile exists
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (!profile) {
          // Auto-create profile from OAuth metadata
          const meta = user.user_metadata;
          await supabase.from('profiles').insert({
            user_id: user.id,
            name: meta.full_name || meta.name || meta.user_name || 'User',
            avatar_url: meta.avatar_url || meta.picture || '',
            college: '',
            year: 1,
            github_url: meta.user_name
              ? `https://github.com/${meta.user_name}`
              : '',
          });
          // New user → go to profile edit to complete setup
          return NextResponse.redirect(`${origin}/profile/edit?welcome=true`);
        }

        // Existing user → check if profile is complete
        const { data: fullProfile } = await supabase
          .from('profiles')
          .select('college, github_url')
          .eq('user_id', user.id)
          .single();

        if (fullProfile && (!fullProfile.college || !fullProfile.github_url)) {
          return NextResponse.redirect(`${origin}/profile/edit?complete=true`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
