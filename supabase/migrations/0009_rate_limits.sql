-- Limits that hold across every server (see src/lib/rate-limit.ts): how often an address
-- can upload photos, save cards or ask for sign-in codes. Keys are hashed by the server
-- first, so no IP or email address is stored here. Only the server touches this, with the
-- secret key: RLS is on with no policies.
create table if not exists public.rate_hits (
  id bigint generated always as identity primary key,
  key text not null,
  at timestamptz not null default now()
);

create index if not exists rate_hits_key_at on public.rate_hits (key, at desc);
create index if not exists rate_hits_at on public.rate_hits (at);

alter table public.rate_hits enable row level security;
revoke all on table public.rate_hits from anon, authenticated;

-- Counts one hit for k if it's under every limit (max_hits[i] within window_seconds[i]),
-- and says whether it was. The lock means two requests at once can't both take the last
-- place. Windows are a day at most: anything older than two days is tidied away.
create or replace function public.rate_hit(k text, window_seconds integer[], max_hits integer[])
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  i integer;
  hits integer;
  longest integer := 0;
begin
  if k is null or length(k) > 200 or coalesce(cardinality(window_seconds), 0) = 0
     or cardinality(window_seconds) <> coalesce(cardinality(max_hits), 0) then
    raise exception 'rate_hit: bad arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('rate:' || k, 0));

  for i in 1 .. cardinality(window_seconds) loop
    select count(*) into hits
      from public.rate_hits h
      where h.key = k and h.at > now() - make_interval(secs => window_seconds[i]);
    if hits >= max_hits[i] then
      return false;
    end if;
    longest := greatest(longest, window_seconds[i]);
  end loop;

  insert into public.rate_hits (key) values (k);

  -- Tidy as we go: this key's hits too old to matter, and now and then everyone's.
  delete from public.rate_hits h where h.key = k and h.at < now() - make_interval(secs => longest);
  if random() < 0.01 then
    delete from public.rate_hits h where h.at < now() - interval '2 days';
  end if;
  return true;
end;
$$;

-- The AI allowance (src/lib/allowance.ts) checked and spent in one step, so two requests
-- at once can't both use the last one. Returns the new use's id (null when there's none
-- left) and how many had been used in all and in the last day, before this one.
create or replace function public.spend_ai(uid uuid, k text, total integer, per_day integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  ever integer;
  today integer;
  new_id bigint;
begin
  if uid is null or k is null or k not in ('card', 'change') then
    raise exception 'spend_ai: bad arguments';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('ai:' || uid::text || ':' || k, 0));

  select count(*), count(*) filter (where u.created_at >= now() - interval '24 hours')
    into ever, today
    from public.ai_usage u
    where u.user_id = uid and u.kind = k;

  if ever < total and today < per_day then
    insert into public.ai_usage (user_id, kind) values (uid, k) returning id into new_id;
  end if;
  return jsonb_build_object('id', new_id, 'ever', ever, 'today', today);
end;
$$;

-- Supabase grants new functions to everyone by default; these are for the server only.
revoke all on function public.rate_hit(text, integer[], integer[]) from public, anon, authenticated;
revoke all on function public.spend_ai(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.rate_hit(text, integer[], integer[]) to service_role;
grant execute on function public.spend_ai(uuid, text, integer, integer) to service_role;
