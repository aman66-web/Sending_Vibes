-- Payments. A card is saved unpaid when it goes in the basket, and only opens
-- for the person it's for once an order containing it has been paid.
alter table public.cards add column if not exists paid_at timestamptz;

-- Cards made before checkout existed were free, so they stay open.
update public.cards set paid_at = created_at where paid_at is null;

-- Orders are only read and written by the server with the secret key, so RLS
-- is on with no policies: the publishable key can't see or touch them.
create table if not exists public.orders (
  id text primary key,
  status text not null default 'pending' check (status in ('pending', 'paid', 'expired')),
  currency text not null check (currency in ('gbp', 'usd')),
  locale text not null,
  site text not null,
  items jsonb not null,
  stripe_session_id text unique,
  buyer_email text,
  amount_total integer,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  emailed_at timestamptz
);

alter table public.orders enable row level security;

-- get_card now also says whether the card has been paid for.
create or replace function public.get_card(card_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select data || jsonb_build_object('paid', paid_at is not null) from public.cards where id = card_id;
$$;
