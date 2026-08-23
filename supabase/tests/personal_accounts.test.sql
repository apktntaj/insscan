begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'satu@example.test',
    '{"full_name":"Pengguna Satu","avatar_url":"https://example.test/avatar.png"}',
    now(),
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'dua@example.test',
    '{"full_name":"Pengguna Dua"}',
    now(),
    now()
  );

select is(
  (
    select count(*)::integer
    from public.profiles
    where id in (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    )
  ),
  2,
  'trigger creates one profile per auth user'
);
select is(
  (
    select count(*)::integer
    from public.credit_accounts
    where user_id in (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    )
  ),
  2,
  'trigger creates one credit account per auth user'
);
select is(
  (select display_name from public.profiles where id = '00000000-0000-0000-0000-000000000001'),
  'Pengguna Satu',
  'profile copies the Google display name'
);
select is(
  (select balance from public.credit_accounts where user_id = '00000000-0000-0000-0000-000000000001'),
  0::bigint,
  'new credit account starts at zero'
);

insert into public.credit_ledger (credit_account_id, amount, entry_type, idempotency_key)
select id, 5, 'bonus', 'test:bonus:user-one'
from public.credit_accounts
where user_id = '00000000-0000-0000-0000-000000000001';

insert into public.usage_records (
  user_id,
  request_id,
  feature,
  requested_item_count,
  billable_item_count,
  credits_charged,
  status,
  completed_at
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    'cek_lartas',
    15,
    15,
    2,
    'completed',
    now()
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000002',
    'cek_lartas',
    10,
    10,
    1,
    'completed',
    now()
  );

select ok(
  has_table_privilege('authenticated', 'public.profiles', 'SELECT'),
  'authenticated users may select profiles through RLS'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'),
  'authenticated users may update their display name through RLS'
);
select ok(
  not has_table_privilege('authenticated', 'public.credit_accounts', 'UPDATE'),
  'authenticated users cannot change balances directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.credit_ledger', 'INSERT'),
  'authenticated users cannot insert ledger entries directly'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select is(
  (select count(*)::integer from public.profiles),
  1,
  'profile RLS only exposes the current user'
);
select is(
  (select count(*)::integer from public.credit_accounts),
  1,
  'credit account RLS only exposes the current user'
);
select is(
  (select count(*)::integer from public.credit_ledger),
  1,
  'ledger RLS only exposes entries owned by the current user'
);
select is(
  (select count(*)::integer from public.usage_records),
  1,
  'usage RLS only exposes records owned by the current user'
);

select * from finish();
rollback;
