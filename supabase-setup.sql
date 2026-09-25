create extension if not exists "uuid-ossp";
create table if not exists public.festas(
 id uuid primary key default gen_random_uuid(),
 nome_aniversariante text not null, idade integer not null check(idade between 1 and 120), tema text not null,
 data date not null, horario text not null, horario_fim text, responsavel text not null, telefone text not null,
 convidados integer not null check(convidados>=1), observacoes text, tipo text not null check(tipo in('buffet','domicilio','outro')),
 endereco_festa jsonb, outro_espaco jsonb, concluida boolean not null default false, criado_em timestamptz not null default now()
);
create index if not exists idx_festas_data on public.festas(data);
alter table public.festas enable row level security;
revoke all on public.festas from anon;
grant select,insert,update,delete on public.festas to authenticated;
drop policy if exists authenticated_select on public.festas;
drop policy if exists authenticated_insert on public.festas;
drop policy if exists authenticated_update on public.festas;
drop policy if exists authenticated_delete on public.festas;
create policy authenticated_select on public.festas for select to authenticated using ((select auth.uid()) is not null);
create policy authenticated_insert on public.festas for insert to authenticated with check ((select auth.uid()) is not null);
create policy authenticated_update on public.festas for update to authenticated using ((select auth.uid()) is not null) with check ((select auth.uid()) is not null);
create policy authenticated_delete on public.festas for delete to authenticated using ((select auth.uid()) is not null);
