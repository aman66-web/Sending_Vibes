-- Cards are stored as a single JSON document. Only the server (service role)
-- reads and writes this table, so RLS is on with no public policies.
create table if not exists public.cards (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.cards enable row level security;

-- Public bucket for card photos. File names are long random strings, so a
-- photo can only be found through the card that links to it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
