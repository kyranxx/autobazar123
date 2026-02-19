-- =====================================================
-- Fix legacy dealer-only constraint on credit_transactions
-- User-based transactions (top-ups and spending) rely on user_id and
-- must be allowed when dealer_id is not present.
-- =====================================================

ALTER TABLE public.credit_transactions
ALTER COLUMN dealer_id DROP NOT NULL;
