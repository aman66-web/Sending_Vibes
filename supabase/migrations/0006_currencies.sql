-- Orders can be in any of the shop's currencies (see src/lib/pricing.ts), not just pounds
-- and dollars. The site checks which; the database keeps it to a three-letter code.
alter table public.orders drop constraint if exists orders_currency_check;
alter table public.orders add constraint orders_currency_check check (currency ~ '^[a-z]{3}$');
