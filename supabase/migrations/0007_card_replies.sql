-- Thank-yous sent back from the end of a card to the person who bought it (see
-- src/app/api/cards/[id]/reply). They're emailed to the buyer and kept here so each card
-- can only send a few. Only the server reads and writes them, with the secret key: RLS
-- is on with no policies.
create table if not exists public.card_replies (
  id bigint generated always as identity primary key,
  card_id text not null references public.cards (id) on delete cascade,
  reaction text not null check (reaction in ('love', 'laugh', 'tears', 'party')),
  message text check (char_length(message) <= 300),
  created_at timestamptz not null default now()
);

create index if not exists card_replies_card_id_idx on public.card_replies (card_id);

alter table public.card_replies enable row level security;

-- Finding the paid order a card is in (items @> '[{"cardId": "..."}]'), to know who to tell
-- when it's replied to or opened.
create index if not exists orders_items_idx on public.orders using gin (items jsonb_path_ops);
