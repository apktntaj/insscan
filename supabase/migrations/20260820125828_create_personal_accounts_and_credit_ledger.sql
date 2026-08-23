-- Personal accounts and prepaid usage ledger for Pesisir.
-- All exposed tables use RLS; authenticated clients only receive read access
-- to rows they own. Balance-changing writes remain server-controlled.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.credit_accounts (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users (id) on delete cascade,
  balance bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credit_accounts_balance_nonnegative check (balance >= 0)
);

create table public.credit_ledger (
  id bigint generated always as identity primary key,
  credit_account_id bigint not null references public.credit_accounts (id) on delete cascade,
  amount bigint not null,
  entry_type text not null,
  idempotency_key text,
  description text,
  created_at timestamptz not null default now(),
  constraint credit_ledger_amount_nonzero check (amount <> 0),
  constraint credit_ledger_entry_type_valid check (
    entry_type in ('topup', 'usage', 'refund', 'bonus', 'adjustment')
  )
);

create unique index credit_ledger_idempotency_key_idx
  on public.credit_ledger (idempotency_key)
  where idempotency_key is not null;
create index credit_ledger_account_created_at_idx
  on public.credit_ledger (credit_account_id, created_at desc);

create table public.usage_records (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  request_id uuid not null,
  feature text not null,
  requested_item_count integer not null,
  billable_item_count integer not null default 0,
  credits_charged bigint not null default 0,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint usage_records_user_request_unique unique (user_id, request_id),
  constraint usage_records_feature_valid check (
    feature in ('cek_lartas', 'hs_finder')
  ),
  constraint usage_records_requested_count_positive check (requested_item_count > 0),
  constraint usage_records_billable_count_valid check (
    billable_item_count >= 0 and billable_item_count <= requested_item_count
  ),
  constraint usage_records_credits_nonnegative check (credits_charged >= 0),
  constraint usage_records_status_valid check (
    status in ('pending', 'completed', 'failed', 'refunded')
  ),
  constraint usage_records_completion_consistent check (
    (status = 'pending' and completed_at is null)
    or (status <> 'pending' and completed_at is not null)
  )
);

create index usage_records_user_created_at_idx
  on public.usage_records (user_id, created_at desc);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger credit_accounts_set_updated_at
before update on public.credit_accounts
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', '')
    ),
    nullif(new.raw_user_meta_data ->> 'avatar_url', '')
  )
  on conflict (id) do nothing;

  insert into public.credit_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Backfill accounts when the migration is applied to a project that already has users.
insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(
    nullif(raw_user_meta_data ->> 'full_name', ''),
    nullif(raw_user_meta_data ->> 'name', '')
  ),
  nullif(raw_user_meta_data ->> 'avatar_url', '')
from auth.users
on conflict (id) do nothing;

insert into public.credit_accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

alter table public.profiles enable row level security;
alter table public.credit_accounts enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.usage_records enable row level security;

create policy profiles_select_own
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy credit_accounts_select_own
on public.credit_accounts
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy credit_ledger_select_own
on public.credit_ledger
for select
to authenticated
using (
  exists (
    select 1
    from public.credit_accounts
    where credit_accounts.id = credit_ledger.credit_account_id
      and credit_accounts.user_id = (select auth.uid())
  )
);

create policy usage_records_select_own
on public.usage_records
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.credit_accounts from anon, authenticated;
revoke all on table public.credit_ledger from anon, authenticated;
revoke all on table public.usage_records from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name, avatar_url) on table public.profiles to authenticated;
grant select on table public.credit_accounts to authenticated;
grant select on table public.credit_ledger to authenticated;
grant select on table public.usage_records to authenticated;
