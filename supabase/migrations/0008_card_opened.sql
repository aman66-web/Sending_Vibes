-- The first time a paid card is opened, so its buyer can be told once (see
-- src/app/api/cards/[id]/opened) and see it on their account page. Only the time is kept:
-- nothing about who opened it or where.
alter table public.cards add column if not exists opened_at timestamptz;

-- Cards already paid for may well have been opened, and there's no way to tell. Mark them
-- unknown (-infinity), so nobody is told about an opening that could be weeks old and the
-- account page doesn't claim one. Cards still waiting for a scheduled email haven't gone
-- out yet, so they're left to be noted when they're opened.
update public.cards c
set opened_at = '-infinity'
where c.paid_at is not null
  and c.opened_at is null
  and not exists (
    select 1
    from public.orders o, jsonb_array_elements(o.items) i
    where o.status = 'paid'
      and i ->> 'cardId' = c.id
      and (i ->> 'sendAt')::timestamptz > now()
  );
