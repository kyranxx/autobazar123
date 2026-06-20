begin;

create extension if not exists pgtap;

select plan(2);

do $$
declare
  v_user_id uuid := '10000000-0000-4000-8000-000000000001';
  v_ad_id uuid := '20000000-0000-4000-8000-000000000001';
  v_checkout_id uuid := '30000000-0000-4000-8000-000000000001';
begin
  insert into auth.users (id, email)
  values (v_user_id, 'billing-atomicity@example.com')
  on conflict (id) do nothing;

  insert into public.profiles (id, email, full_name)
  values (v_user_id, 'billing-atomicity@example.com', 'Billing Atomicity')
  on conflict (id) do nothing;

  insert into public.ads (
    id,
    seller_id,
    brand,
    model,
    year,
    price_eur,
    mileage_km,
    fuel,
    transmission,
    body_style,
    status,
    location_city,
    description
  ) values (
    v_ad_id,
    v_user_id,
    'Skoda',
    'Octavia',
    2020,
    12000,
    100000,
    'petrol',
    'manual',
    'sedan',
    'sold',
    'Bratislava',
    'Sold fixture ad for failed prolong checkout atomicity.'
  );

  insert into public.billing_checkout_sessions (
    id,
    actor_user_id,
    actor_type,
    checkout_kind,
    target_ad_id,
    operation_type,
    status,
    resolved_price_cents,
    metadata
  ) values (
    v_checkout_id,
    v_user_id,
    'private',
    'private_listing_action',
    v_ad_id,
    'prolong_top',
    'created',
    999,
    '{}'::jsonb
  );
end $$;

do $$
declare
  v_checkout_id uuid := '30000000-0000-4000-8000-000000000001';
begin
  perform public.apply_billing_checkout_session(
    v_checkout_id,
    'cs_atomicity_failure',
    'pi_atomicity_failure',
    null
  );
exception
  when others then
    null;
end $$;

select is(
  (
    select count(*)::integer
    from public.billing_transactions
    where stripe_session_id = 'cs_atomicity_failure'
  ),
  0,
  'failed private listing checkout apply does not leave a billing transaction'
);

select is(
  (
    select status
    from public.billing_checkout_sessions
    where id = '30000000-0000-4000-8000-000000000001'
  ),
  'created',
  'failed private listing checkout apply does not mark checkout paid'
);

select * from finish();

rollback;
