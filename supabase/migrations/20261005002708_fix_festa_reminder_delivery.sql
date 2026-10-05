-- Reservas internas de envio; nunca disponíveis ao navegador.
create table public.festa_reminder_deliveries (
  festa_id uuid not null references public.festas(id) on delete cascade,
  scheduled_start timestamptz not null,
  token_id uuid not null references public.device_tokens(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  primary key (festa_id, scheduled_start, token_id)
);
alter table public.festa_reminder_deliveries enable row level security;
revoke all on public.festa_reminder_deliveries from public, anon, authenticated;
grant select, insert, update, delete on public.festa_reminder_deliveries to service_role;

create function public.claim_festa_reminders(
  p_festa_id uuid, p_scheduled_start timestamptz, p_token_ids uuid[]
) returns table (token_id uuid)
language sql security invoker set search_path = '' as $$
  insert into public.festa_reminder_deliveries as delivery
    (festa_id, scheduled_start, token_id, claimed_at)
  select p_festa_id, p_scheduled_start, requested.id, now()
  from (select distinct unnest(p_token_ids) as id) as requested
  on conflict (festa_id, scheduled_start, token_id) do update
    set claimed_at = excluded.claimed_at
    where delivery.sent_at is null
      and delivery.claimed_at < now() - interval '2 minutes'
  returning delivery.token_id;
$$;
revoke all on function public.claim_festa_reminders(uuid,timestamptz,uuid[]) from public, anon, authenticated;
grant execute on function public.claim_festa_reminders(uuid,timestamptz,uuid[]) to service_role;
