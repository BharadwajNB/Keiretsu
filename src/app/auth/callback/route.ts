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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Wait a brief moment to ensure Postgres Trigger has seeded the profile
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('college, github_url')
          .eq('user_id', user.id)
          .single();

        if (profile && (!profile.college || !profile.github_url)) {
          return NextResponse.redirect(`${origin}/profile/edit?welcome=true`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth error — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
