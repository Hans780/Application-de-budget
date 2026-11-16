-- ============================================================================
-- Notre Budget · Migration 001 · Socle
-- Tables, sécurité par lignes (RLS), fonctions et catégories par défaut.
-- À coller tel quel dans l'éditeur SQL de Supabase (voir docs/00-installation.md).
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.couples (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null default 'Notre budget',
  invite_code          text not null unique
                         default upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8)),
  split_mode           text not null default 'equal' check (split_mode in ('equal', 'income')),
  default_total_budget numeric(12, 2) not null default 0 check (default_total_budget >= 0),
  created_at           timestamptz not null default now()
);

create table if not exists public.profiles (
  id             uuid primary key references auth.users (id) on delete cascade,
  couple_id      uuid references public.couples (id) on delete set null,
  display_name   text not null,
  monthly_income numeric(12, 2) not null default 0 check (monthly_income >= 0),
  created_at     timestamptz not null default now()
);

create index if not exists profiles_couple_idx on public.profiles (couple_id);

create table if not exists public.categories (
  id               uuid primary key default gen_random_uuid(),
  couple_id        uuid not null references public.couples (id) on delete cascade,
  name             text not null,
  emoji            text not null default '🏷️',
  color            text not null default '#64748b',
  sort_order       int not null default 0,
  default_envelope numeric(12, 2) not null default 0 check (default_envelope >= 0),
  carry_over       boolean not null default false,
  is_fixed_charges boolean not null default false,
  archived         boolean not null default false,
  created_at       timestamptz not null default now()
);

create index if not exists categories_couple_idx on public.categories (couple_id);

create table if not exists public.monthly_budgets (
  id           uuid primary key default gen_random_uuid(),
  couple_id    uuid not null references public.couples (id) on delete cascade,
  month        date not null check (month = date_trunc('month', month)::date),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_at   timestamptz not null default now(),
  unique (couple_id, month)
);

create table if not exists public.envelopes (
  id                uuid primary key default gen_random_uuid(),
  couple_id         uuid not null references public.couples (id) on delete cascade,
  monthly_budget_id uuid not null references public.monthly_budgets (id) on delete cascade,
  category_id       uuid not null references public.categories (id) on delete cascade,
  amount            numeric(12, 2) not null default 0 check (amount >= 0),
  unique (monthly_budget_id, category_id)
);

create index if not exists envelopes_couple_idx on public.envelopes (couple_id);

create table if not exists public.expenses (
  id                uuid primary key default gen_random_uuid(),
  couple_id         uuid not null references public.couples (id) on delete cascade,
  paid_by           uuid not null references public.profiles (id),
  category_id       uuid references public.categories (id) on delete set null,
  amount            numeric(12, 2) not null check (amount > 0),
  -- expense : dépense · income : rentrée d'argent · refund : remboursement
  kind              text not null default 'expense' check (kind in ('expense', 'income', 'refund')),
  -- shared : commune (compte dans le budget du couple) · personal : personnelle
  scope             text not null default 'shared' check (scope in ('shared', 'personal')),
  merchant          text,
  note              text,
  occurred_at       timestamptz not null default now(),
  source            text not null default 'manual' check (source in ('manual', 'webhook', 'recurring')),
  card_name         text,
  refund_of         uuid references public.expenses (id) on delete set null,
  -- Répartition forcée sur cette dépense (null = règle du couple)
  split_mode        text check (split_mode in ('equal', 'income', 'custom')),
  split_payer_share numeric(5, 4) check (split_payer_share between 0 and 1),
  -- Identifiant généré sur le téléphone : évite les doublons en mode hors ligne
  client_id         uuid unique,
  created_by        uuid references public.profiles (id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists expenses_couple_month_idx on public.expenses (couple_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- updated_at automatique
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profil créé automatiquement à l'inscription
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Couple de l'utilisateur connecté (utilisé par toutes les règles RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_couple_id()
returns uuid language sql stable security definer set search_path = public as $$
  select couple_id from public.profiles where id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Sécurité par lignes : chacun ne voit que les données de son couple
-- ---------------------------------------------------------------------------

alter table public.couples         enable row level security;
alter table public.profiles        enable row level security;
alter table public.categories      enable row level security;
alter table public.monthly_budgets enable row level security;
alter table public.envelopes       enable row level security;
alter table public.expenses        enable row level security;

drop policy if exists couples_select on public.couples;
create policy couples_select on public.couples for select
  using (id = public.current_couple_id());
drop policy if exists couples_update on public.couples;
create policy couples_update on public.couples for update
  using (id = public.current_couple_id())
  with check (id = public.current_couple_id());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select
  using (id = auth.uid() or (couple_id is not null and couple_id = public.current_couple_id()));
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert
  with check (id = auth.uid());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists categories_all on public.categories;
create policy categories_all on public.categories for all
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists monthly_budgets_all on public.monthly_budgets;
create policy monthly_budgets_all on public.monthly_budgets for all
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists envelopes_all on public.envelopes;
create policy envelopes_all on public.envelopes for all
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

drop policy if exists expenses_all on public.expenses;
create policy expenses_all on public.expenses for all
  using (couple_id = public.current_couple_id())
  with check (couple_id = public.current_couple_id());

-- ---------------------------------------------------------------------------
-- Catégories par défaut
-- ---------------------------------------------------------------------------

create or replace function public.seed_default_categories(p_couple uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.categories (couple_id, name, emoji, color, sort_order, is_fixed_charges) values
    (p_couple, 'Courses',       '🛒', '#16a34a', 10, false),
    (p_couple, 'Restaurants',   '🍽️', '#ea580c', 20, false),
    (p_couple, 'Transport',     '🚗', '#2563eb', 30, false),
    (p_couple, 'Loisirs',       '🎉', '#9333ea', 40, false),
    (p_couple, 'Santé',         '💊', '#dc2626', 50, false),
    (p_couple, 'Shopping',      '🛍️', '#db2777', 60, false),
    (p_couple, 'Logement',      '🏠', '#0891b2', 70, false),
    (p_couple, 'Charges fixes', '📄', '#475569', 80, true),
    (p_couple, 'Autre',         '📦', '#64748b', 90, false);
end $$;

-- ---------------------------------------------------------------------------
-- Créer un espace couple / rejoindre avec un code d'invitation
-- ---------------------------------------------------------------------------

create or replace function public.create_couple(p_name text default 'Notre budget')
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_couple uuid;
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Vous faites déjà partie d''un espace couple';
  end if;

  insert into public.couples (name)
  values (coalesce(nullif(trim(p_name), ''), 'Notre budget'))
  returning id into v_couple;

  update public.profiles set couple_id = v_couple where id = auth.uid();
  perform public.seed_default_categories(v_couple);
  return v_couple;
end $$;

create or replace function public.join_couple(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_couple uuid;
  v_members int;
begin
  if auth.uid() is null then
    raise exception 'Non connecté';
  end if;
  if (select couple_id from public.profiles where id = auth.uid()) is not null then
    raise exception 'Vous faites déjà partie d''un espace couple';
  end if;

  select id into v_couple from public.couples
  where invite_code = upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if v_couple is null then
    raise exception 'Code d''invitation inconnu';
  end if;

  select count(*) into v_members from public.profiles where couple_id = v_couple;
  if v_members >= 2 then
    raise exception 'Cet espace couple est déjà complet';
  end if;

  update public.profiles set couple_id = v_couple where id = auth.uid();
  return v_couple;
end $$;

create or replace function public.regenerate_invite_code()
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
begin
  update public.couples
  set invite_code = upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 8))
  where id = public.current_couple_id()
  returning invite_code into v_code;
  return v_code;
end $$;

-- ---------------------------------------------------------------------------
-- Aujourd'hui, en heure de Paris
-- ---------------------------------------------------------------------------

create or replace function public.paris_today()
returns date language sql stable as $$
  select (now() at time zone 'Europe/Paris')::date;
$$;

-- ---------------------------------------------------------------------------
-- Créer le mois s'il n'existe pas (budget global + enveloppes)
-- Appelée à chaque ouverture de l'application et par le webhook.
-- L'étape 3 l'enrichira avec les charges fixes récurrentes.
-- ---------------------------------------------------------------------------

create or replace function public.ensure_month(p_month date default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_couple   uuid := public.current_couple_id();
  v_month    date := date_trunc('month', coalesce(p_month, public.paris_today()))::date;
  v_prev     date := (v_month - interval '1 month')::date;
  v_budget   uuid;
  v_default  numeric(12, 2);
  v_cat      record;
  v_amount   numeric(12, 2);
  v_prev_env numeric(12, 2);
  v_prev_spent numeric(12, 2);
begin
  if v_couple is null then
    raise exception 'Aucun espace couple';
  end if;

  select id into v_budget from public.monthly_budgets
  where couple_id = v_couple and month = v_month;

  if v_budget is null then
    select default_total_budget into v_default from public.couples where id = v_couple;
    insert into public.monthly_budgets (couple_id, month, total_amount)
    values (v_couple, v_month, coalesce(v_default, 0))
    on conflict (couple_id, month) do update set couple_id = excluded.couple_id
    returning id into v_budget;
  end if;

  -- Une enveloppe par catégorie active
  for v_cat in
    select c.id, c.default_envelope, c.carry_over
    from public.categories c
    where c.couple_id = v_couple and not c.archived
  loop
    v_amount := v_cat.default_envelope;

    if v_cat.carry_over then
      select e.amount into v_prev_env
      from public.envelopes e
      join public.monthly_budgets mb on mb.id = e.monthly_budget_id
      where mb.couple_id = v_couple and mb.month = v_prev and e.category_id = v_cat.id;

      select coalesce(sum(case when x.kind = 'expense' then x.amount else -x.amount end), 0)
      into v_prev_spent
      from public.expenses x
      where x.couple_id = v_couple and x.scope = 'shared' and x.category_id = v_cat.id
        and (x.occurred_at at time zone 'Europe/Paris')::date >= v_prev
        and (x.occurred_at at time zone 'Europe/Paris')::date < v_month;

      if v_prev_env is not null and v_prev_env - v_prev_spent > 0 then
        v_amount := v_amount + (v_prev_env - v_prev_spent);
      end if;
    end if;

    insert into public.envelopes (couple_id, monthly_budget_id, category_id, amount)
    values (v_couple, v_budget, v_cat.id, v_amount)
    on conflict (monthly_budget_id, category_id) do nothing;
  end loop;

  return v_budget;
end $$;

-- ---------------------------------------------------------------------------
-- Vue d'ensemble du mois : reste à dépenser, reste par jour, par catégorie
-- Calculée côté base pour que les deux téléphones affichent le même chiffre.
-- ---------------------------------------------------------------------------

create or replace function public.month_overview(p_month date default null)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare
  v_couple    uuid := public.current_couple_id();
  v_month     date := date_trunc('month', coalesce(p_month, public.paris_today()))::date;
  v_next      date := (v_month + interval '1 month')::date;
  v_today     date := public.paris_today();
  v_total     numeric(12, 2);
  v_spent     numeric(12, 2);
  v_credits   numeric(12, 2);
  v_days_left int;
  v_cats      jsonb;
begin
  if v_couple is null then
    return null;
  end if;

  select mb.total_amount into v_total
  from public.monthly_budgets mb
  where mb.couple_id = v_couple and mb.month = v_month;

  select
    coalesce(sum(case when x.kind = 'expense' then x.amount else 0 end), 0),
    coalesce(sum(case when x.kind <> 'expense' then x.amount else 0 end), 0)
  into v_spent, v_credits
  from public.expenses x
  where x.couple_id = v_couple and x.scope = 'shared'
    and (x.occurred_at at time zone 'Europe/Paris')::date >= v_month
    and (x.occurred_at at time zone 'Europe/Paris')::date < v_next;

  if v_today < v_month then
    v_days_left := (v_next - v_month);
  elsif v_today >= v_next then
    v_days_left := 0;
  else
    v_days_left := (v_next - v_today);
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'emoji', c.emoji,
      'color', c.color,
      'is_fixed_charges', c.is_fixed_charges,
      'envelope', coalesce(e.amount, 0),
      'spent', coalesce(s.net, 0),
      'remaining', coalesce(e.amount, 0) - coalesce(s.net, 0)
    ) order by c.sort_order, c.name), '[]'::jsonb)
  into v_cats
  from public.categories c
  left join public.monthly_budgets mb on mb.couple_id = c.couple_id and mb.month = v_month
  left join public.envelopes e on e.monthly_budget_id = mb.id and e.category_id = c.id
  left join lateral (
    select sum(case when x.kind = 'expense' then x.amount else -x.amount end) as net
    from public.expenses x
    where x.couple_id = v_couple and x.scope = 'shared' and x.category_id = c.id
      and (x.occurred_at at time zone 'Europe/Paris')::date >= v_month
      and (x.occurred_at at time zone 'Europe/Paris')::date < v_next
  ) s on true
  where c.couple_id = v_couple and not c.archived;

  return jsonb_build_object(
    'month', v_month,
    'today', v_today,
    'total', coalesce(v_total, 0),
    'spent', v_spent,
    'credits', v_credits,
    'remaining', coalesce(v_total, 0) - v_spent + v_credits,
    'days_left', v_days_left,
    'per_day', case when v_days_left > 0
                 then round((coalesce(v_total, 0) - v_spent + v_credits) / v_days_left, 2)
                 else 0 end,
    'categories', v_cats
  );
end $$;

-- ---------------------------------------------------------------------------
-- Temps réel : diffusion des changements aux deux téléphones
-- ---------------------------------------------------------------------------

alter table public.expenses        replica identity full;
alter table public.envelopes       replica identity full;
alter table public.monthly_budgets replica identity full;
alter table public.categories      replica identity full;
alter table public.couples         replica identity full;
alter table public.profiles        replica identity full;

do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

do $$
declare t text;
begin
  foreach t in array array['expenses', 'envelopes', 'monthly_budgets', 'categories', 'couples', 'profiles']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Droits d'exécution
-- ---------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to authenticated;
grant execute on function public.create_couple(text)          to authenticated;
grant execute on function public.join_couple(text)            to authenticated;
grant execute on function public.regenerate_invite_code()     to authenticated;
grant execute on function public.ensure_month(date)           to authenticated;
grant execute on function public.month_overview(date)         to authenticated;
grant execute on function public.current_couple_id()          to authenticated;
grant execute on function public.paris_today()                to anon, authenticated;
revoke execute on function public.seed_default_categories(uuid) from public;
