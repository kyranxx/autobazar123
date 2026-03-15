-- Performance indexes for legacy tables.
-- Guard each statement so fresh resets can run before the later full-schema migration.

do $$
begin
  if to_regclass('public.ads') is not null then
    execute 'create index if not exists idx_ads_status on public.ads(status)';
    execute 'create index if not exists idx_ads_brand_model on public.ads(brand_id, model_id)';
    execute 'create index if not exists idx_ads_price on public.ads(price_eur)';
    execute 'create index if not exists idx_ads_created on public.ads(created_at desc)';
    execute 'create index if not exists idx_ads_seller on public.ads(seller_id)';
    execute 'create index if not exists idx_ads_active_recent on public.ads(status, created_at desc) where status = ''active''';
    execute 'create index if not exists idx_ads_featured on public.ads(is_top_ad, is_highlighted, created_at desc)';
  end if;

  if to_regclass('public.saved_ads') is not null then
    execute 'create index if not exists idx_saved_ads_user on public.saved_ads(user_id)';
  end if;

  if to_regclass('public.messages') is not null then
    execute 'create index if not exists idx_messages_recipient on public.messages(recipient_id, created_at desc)';
  end if;

  if to_regclass('public.profiles') is not null then
    execute 'create index if not exists idx_profiles_role on public.profiles(role)';
  end if;
end
$$;
