-- The site talks to Supabase with the publishable key only. These functions are
-- the only way in: create a card, or fetch one by its exact ID. Nothing can list
-- or change existing cards.
create or replace function public.create_card(card_id text, card jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if card_id !~ '^[A-Za-z0-9]{12}$' then
    raise exception 'invalid card id';
  end if;
  if octet_length(card::text) > 100000 then
    raise exception 'card too large';
  end if;
  insert into public.cards (id, data) values (card_id, card);
end;
$$;

create or replace function public.get_card(card_id text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select data from public.cards where id = card_id;
$$;

revoke all on function public.create_card(text, jsonb) from public;
revoke all on function public.get_card(text) from public;
grant execute on function public.create_card(text, jsonb) to anon, authenticated;
grant execute on function public.get_card(text) to anon, authenticated;

-- Insert-only: photos can be uploaded but not listed, overwritten or deleted.
create policy "Anyone can upload card photos"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'photos');
