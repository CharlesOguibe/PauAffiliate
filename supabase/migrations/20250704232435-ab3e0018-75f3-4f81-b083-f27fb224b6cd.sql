
-- Delete all referral links to restart the payment gateway setup
DELETE FROM public.referral_links;

-- Also delete related sales records that reference these referral links
DELETE FROM public.sales;

-- Delete affiliate earnings records
DELETE FROM public.affiliate_earnings;

-- Delete payment transactions
DELETE FROM public.payment_transactions;

-- Delete wallet transactions
DELETE FROM public.wallet_transactions;

-- Reset wallet balances to zero
UPDATE public.wallets SET balance = 0, updated_at = now();
