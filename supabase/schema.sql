create extension if not exists pgcrypto;

create table if not exists public.participants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 70),
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.answers (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references public.participants(id) on delete restrict,
  question_id text not null check (question_id in ('q1', 'q2', 'q3', 'q4', 'q5')),
  answer text not null,
  created_at timestamptz not null default now(),
  unique (participant_id, question_id)
);

create index if not exists answers_question_id_idx on public.answers(question_id);
create index if not exists answers_participant_id_idx on public.answers(participant_id);

create or replace function public.owns_participant(participant_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.participants
    where id = participant_uuid and owner_id = auth.uid()
  );
$$;

revoke all on function public.owns_participant(uuid) from public;
grant execute on function public.owns_participant(uuid) to anon, authenticated;

alter table public.participants enable row level security;
alter table public.answers enable row level security;

grant select, insert on public.participants to anon, authenticated;
grant select, insert, update on public.answers to anon, authenticated;

drop policy if exists "Event visitors can read participants" on public.participants;
create policy "Event visitors can read participants"
  on public.participants for select to anon, authenticated using (true);

drop policy if exists "Event visitors can add participants" on public.participants;
create policy "Event visitors can add participants"
  on public.participants for insert to anon, authenticated with check (owner_id = auth.uid());

drop policy if exists "Event visitors can read answers" on public.answers;
create policy "Event visitors can read answers"
  on public.answers for select to anon, authenticated using (true);

drop policy if exists "Event visitors can add answers" on public.answers;
create policy "Event visitors can add answers"
  on public.answers for insert to anon, authenticated with check (public.owns_participant(participant_id));

drop policy if exists "Event visitors can update answers" on public.answers;
create policy "Event visitors can update answers"
  on public.answers for update to anon, authenticated
  using (public.owns_participant(participant_id))
  with check (public.owns_participant(participant_id));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'participants'
  ) then
    alter publication supabase_realtime add table public.participants;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'answers'
  ) then
    alter publication supabase_realtime add table public.answers;
  end if;
end;
$$;