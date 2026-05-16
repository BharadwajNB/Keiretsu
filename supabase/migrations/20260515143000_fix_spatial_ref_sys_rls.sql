-- ================================================
-- FIX: Revoke API access to PostGIS system table spatial_ref_sys
-- Resolves Supabase lint: "RLS Disabled in Public Entity: public.spatial_ref_sys"
--
-- We cannot enable RLS directly (table is owned by supabase_admin).
-- Instead, revoke anon/authenticated access so PostgREST cannot expose it.
-- PostGIS functions still work — they access spatial_ref_sys at the C level.
-- ================================================

REVOKE ALL ON public.spatial_ref_sys FROM anon, authenticated;
