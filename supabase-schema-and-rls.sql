-- QuoteCraft App schema + RLS draft
-- Target: Supabase Postgres

create extension if not exists pgcrypto;

-- -----------------------------------------------------
-- users profile
-- -----------------------------------------------------

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email varchar(255) not null unique,
  plan_type varchar(50) not null default 'free',
  project_limit integer not null default 3,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_plan_type_check
    check (plan_type in ('free', 'pro'))
);

-- -----------------------------------------------------
-- projects
-- -----------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title varchar(255) not null,
  client_name varchar(255) not null,
  client_company varchar(255),
  project_type varchar(100) not null,
  industry varchar(100),
  contact_name varchar(100),
  contact_phone varchar(100),
  summary text,
  background text,
  goal text,
  scope text,
  raw_requirement text,
  duration varchar(100),
  delivery_note text,
  remark text,
  template_type varchar(50) not null default 'simple',
  total_price numeric(12, 2) not null default 0,
  status varchar(50) not null default 'draft',
  share_token varchar(255),
  last_exported_at timestamptz,
  last_shared_at timestamptz,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_template_type_check
    check (template_type in ('simple', 'full')),
  constraint projects_status_check
    check (status in ('draft', 'generated', 'shared'))
);

create unique index if not exists idx_projects_share_token
  on public.projects(share_token)
  where share_token is not null;

create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_updated_at on public.projects(updated_at desc);

-- -----------------------------------------------------
-- quote_items
-- -----------------------------------------------------

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name varchar(255) not null,
  description text,
  category varchar(50) not null default 'other',
  unit_price numeric(12, 2) not null default 0,
  quantity integer not null default 1,
  unit varchar(50),
  subtotal numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  is_preset boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_items_category_check
    check (category in ('design', 'frontend', 'backend', 'testing', 'ops', 'other')),
  constraint quote_items_quantity_check
    check (quantity >= 0)
);

create index if not exists idx_quote_items_project_id
  on public.quote_items(project_id);

-- -----------------------------------------------------
-- share_visits
-- -----------------------------------------------------

create table if not exists public.share_visits (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  share_token varchar(255) not null,
  visited_at timestamptz not null default now(),
  user_agent text,
  ip_hash varchar(255)
);

create index if not exists idx_share_visits_project_id
  on public.share_visits(project_id);

create index if not exists idx_share_visits_token
  on public.share_visits(share_token);

-- -----------------------------------------------------
-- ai_logs
-- -----------------------------------------------------

create table if not exists public.ai_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  action varchar(50) not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  output_text text not null,
  created_at timestamptz not null default now(),
  constraint ai_logs_action_check
    check (action in ('generate_summary', 'generate_scope'))
);

create index if not exists idx_ai_logs_user_id
  on public.ai_logs(user_id);

create index if not exists idx_ai_logs_project_id
  on public.ai_logs(project_id);

-- -----------------------------------------------------
-- triggers
-- -----------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_user_profiles_updated_at on public.user_profiles;
create trigger trg_user_profiles_updated_at
before update on public.user_profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute procedure public.set_updated_at();

drop trigger if exists trg_quote_items_updated_at on public.quote_items;
create trigger trg_quote_items_updated_at
before update on public.quote_items
for each row execute procedure public.set_updated_at();

create or replace function public.recalculate_project_total(target_project_id uuid)
returns void
language plpgsql
as $$
begin
  update public.projects
  set total_price = coalesce((
    select sum(subtotal)::numeric(12, 2)
    from public.quote_items
    where project_id = target_project_id
  ), 0)
  where id = target_project_id;
end;
$$;

create or replace function public.quote_items_sync_subtotal()
returns trigger
language plpgsql
as $$
begin
  new.subtotal = round((coalesce(new.unit_price, 0) * coalesce(new.quantity, 0))::numeric, 2);
  return new;
end;
$$;

drop trigger if exists trg_quote_items_sync_subtotal on public.quote_items;
create trigger trg_quote_items_sync_subtotal
before insert or update on public.quote_items
for each row execute procedure public.quote_items_sync_subtotal();

create or replace function public.quote_items_refresh_project_total()
returns trigger
language plpgsql
as $$
begin
  perform public.recalculate_project_total(coalesce(new.project_id, old.project_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_quote_items_refresh_total_after_insert on public.quote_items;
create trigger trg_quote_items_refresh_total_after_insert
after insert on public.quote_items
for each row execute procedure public.quote_items_refresh_project_total();

drop trigger if exists trg_quote_items_refresh_total_after_update on public.quote_items;
create trigger trg_quote_items_refresh_total_after_update
after update on public.quote_items
for each row execute procedure public.quote_items_refresh_project_total();

drop trigger if exists trg_quote_items_refresh_total_after_delete on public.quote_items;
create trigger trg_quote_items_refresh_total_after_delete
after delete on public.quote_items
for each row execute procedure public.quote_items_refresh_project_total();

create or replace function public.bump_project_version()
returns trigger
language plpgsql
as $$
begin
  new.version = old.version + 1;
  return new;
end;
$$;

drop trigger if exists trg_projects_bump_version on public.projects;
create trigger trg_projects_bump_version
before update on public.projects
for each row execute procedure public.bump_project_version();

-- -----------------------------------------------------
-- RLS
-- -----------------------------------------------------

alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.quote_items enable row level security;
alter table public.share_visits enable row level security;
alter table public.ai_logs enable row level security;

-- user_profiles
drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
on public.user_profiles
for select
using (auth.uid() = id);

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
on public.user_profiles
for insert
with check (auth.uid() = id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
on public.user_profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- projects
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
on public.projects
for select
using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
on public.projects
for delete
using (auth.uid() = user_id);

-- quote_items
drop policy if exists "quote_items_select_own_project" on public.quote_items;
create policy "quote_items_select_own_project"
on public.quote_items
for select
using (
  exists (
    select 1
    from public.projects p
    where p.id = quote_items.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_insert_own_project" on public.quote_items;
create policy "quote_items_insert_own_project"
on public.quote_items
for insert
with check (
  exists (
    select 1
    from public.projects p
    where p.id = quote_items.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_update_own_project" on public.quote_items;
create policy "quote_items_update_own_project"
on public.quote_items
for update
using (
  exists (
    select 1
    from public.projects p
    where p.id = quote_items.project_id
      and p.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.projects p
    where p.id = quote_items.project_id
      and p.user_id = auth.uid()
  )
);

drop policy if exists "quote_items_delete_own_project" on public.quote_items;
create policy "quote_items_delete_own_project"
on public.quote_items
for delete
using (
  exists (
    select 1
    from public.projects p
    where p.id = quote_items.project_id
      and p.user_id = auth.uid()
  )
);

-- ai_logs
drop policy if exists "ai_logs_select_own" on public.ai_logs;
create policy "ai_logs_select_own"
on public.ai_logs
for select
using (auth.uid() = user_id);

drop policy if exists "ai_logs_insert_own" on public.ai_logs;
create policy "ai_logs_insert_own"
on public.ai_logs
for insert
with check (auth.uid() = user_id);

-- share_visits
-- direct client access is not needed; keep locked down by default

-- -----------------------------------------------------
-- public share helper view
-- -----------------------------------------------------

create or replace view public.shared_project_view as
select
  p.id,
  p.title,
  p.client_name,
  p.client_company,
  p.project_type,
  p.summary,
  p.background,
  p.goal,
  p.scope,
  p.duration,
  p.delivery_note,
  p.remark,
  p.template_type,
  p.total_price,
  p.status,
  p.share_token,
  p.last_shared_at
from public.projects p
where p.share_token is not null;

-- Note:
-- share page query should still go through server-side API,
-- and server should fetch projects + quote_items by share_token.
