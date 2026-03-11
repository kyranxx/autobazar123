begin;

create extension if not exists pgtap;

select plan(10);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Public profiles are viewable by everyone'
      and cmd = 'SELECT'
      and roles @> array['anon'::name]
      and roles @> array['authenticated'::name]
  ),
  'profiles public read policy is explicitly scoped to anon/authenticated'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can insert their own profile'
      and cmd = 'INSERT'
      and roles @> array['authenticated'::name]
  ),
  'profiles insert policy is explicitly authenticated-scoped'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Users can update own profile'
      and cmd = 'UPDATE'
      and roles @> array['authenticated'::name]
  ),
  'profiles update policy is explicitly authenticated-scoped'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ads'
      and policyname = 'Public can view active ads'
      and cmd = 'SELECT'
      and roles @> array['anon'::name]
      and roles @> array['authenticated'::name]
  ),
  'ads public select policy is explicitly scoped to anon/authenticated'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ads'
      and policyname = 'Sellers can manage own ads'
      and cmd = 'ALL'
      and roles @> array['authenticated'::name]
  ),
  'ads seller manage policy is explicitly authenticated-scoped'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_transactions'
      and policyname = 'Users can view own transactions'
      and cmd = 'SELECT'
      and roles @> array['authenticated'::name]
      and not (roles @> array['anon'::name])
  ),
  'credit_transactions read policy is authenticated-only'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'Service role full access to profiles'
      and cmd = 'ALL'
      and roles @> array['service_role'::name]
  ),
  'profiles include explicit service_role full-access policy'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ads'
      and policyname = 'Service role full access to ads'
      and cmd = 'ALL'
      and roles @> array['service_role'::name]
  ),
  'ads include explicit service_role full-access policy'
);

select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'credit_transactions'
      and policyname = 'Service role full access to credit transactions'
      and cmd = 'ALL'
      and roles @> array['service_role'::name]
  ),
  'credit_transactions include explicit service_role full-access policy'
);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'ads', 'credit_transactions')
      and roles = array['public'::name]
  ),
  0,
  'critical tables do not expose policies bound to public role'
);

select * from finish();

rollback;
