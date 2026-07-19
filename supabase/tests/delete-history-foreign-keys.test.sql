begin;

create extension if not exists pgtap;

select plan(5);

select is(
  (
    select confdeltype::text
    from pg_constraint
    where conname = 'credit_transactions_ad_id_fkey'
      and conrelid = 'public.credit_transactions'::regclass
  ),
  'n',
  'listing deletion clears the legacy credit transaction ad reference'
);

select is(
  (
    select confdeltype::text
    from pg_constraint
    where conname = 'credit_transactions_user_id_fkey'
      and conrelid = 'public.credit_transactions'::regclass
  ),
  'n',
  'account deletion preserves legacy credit transaction history'
);

select is(
  (
    select confdeltype::text
    from pg_constraint
    where conname = 'stripe_webhook_logs_user_id_fkey'
      and conrelid = 'public.stripe_webhook_logs'::regclass
  ),
  'n',
  'account deletion preserves Stripe webhook audit history'
);

select is(
  (
    select confdeltype::text
    from pg_constraint
    where conname = 'inquiries_qualified_by_fkey'
      and conrelid = 'public.inquiries'::regclass
  ),
  'n',
  'account deletion clears inquiry qualification attribution'
);

select is(
  (
    select confdeltype::text
    from pg_constraint
    where conname = 'ads_sale_confirmed_by_fkey'
      and conrelid = 'public.ads'::regclass
  ),
  'n',
  'account deletion clears listing sale-confirmation attribution'
);

select * from finish();

rollback;
