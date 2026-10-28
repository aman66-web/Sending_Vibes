-- Each time the AI writes or changes a card for someone, so each account has a daily
-- allowance (see src/lib/allowance.ts). Only the server reads and writes it, with the
-- secret key: RLS is on with no policies.
create table if not exists public.ai_usage (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('card', 'change')),
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_time on public.ai_usage (user_id, kind, created_at desc);

alter table public.ai_usage enable row level security;
