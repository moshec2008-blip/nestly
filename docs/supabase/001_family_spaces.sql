-- Nestly Family Spaces foundation draft.
-- Review and run through Supabase migrations before production use.

create extension if not exists pgcrypto;

create table if not exists public.family_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by_user_id uuid not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  default_locale text not null default 'he',
  default_currency text not null default 'ILS',
  timezone text not null default 'Asia/Jerusalem',
  plan text,
  settings jsonb not null default '{}'::jsonb,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_memberships (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references public.family_spaces(id) on delete cascade,
  user_id uuid not null,
  linked_family_member_id text,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  status text not null default 'active' check (status in ('active', 'pending', 'suspended', 'left')),
  invited_by_user_id uuid,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_space_id, user_id)
);

create table if not exists public.family_invitations (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references public.family_spaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  invited_by_user_id uuid not null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  expires_at timestamptz not null,
  accepted_by_user_id uuid,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.family_records (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references public.family_spaces(id) on delete cascade,
  kind text not null,
  visibility text not null default 'family' check (visibility in ('private', 'family', 'selected_members')),
  owner_user_id uuid,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.family_audit_events (
  id uuid primary key default gen_random_uuid(),
  family_space_id uuid not null references public.family_spaces(id) on delete cascade,
  actor_user_id uuid,
  action text not null,
  target_type text not null,
  target_id text,
  safe_metadata jsonb not null default '{}'::jsonb,
  request_id text,
  status text not null default 'success',
  created_at timestamptz not null default now()
);

create index if not exists idx_family_memberships_user
  on public.family_memberships(user_id, status);

create index if not exists idx_family_records_space_kind
  on public.family_records(family_space_id, kind)
  where deleted_at is null;

alter table public.family_spaces enable row level security;
alter table public.family_memberships enable row level security;
alter table public.family_invitations enable row level security;
alter table public.family_records enable row level security;
alter table public.family_audit_events enable row level security;

-- RLS policies must be reviewed with the final auth.uid() mapping before use.
-- The intended rule is: a user may only access rows for Family Spaces where they
-- have an active membership and the required capability.
