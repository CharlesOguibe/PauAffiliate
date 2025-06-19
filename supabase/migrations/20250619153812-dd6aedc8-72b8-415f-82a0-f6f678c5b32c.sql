
-- Delete all data related to business users and affiliates
-- This will cascade and remove all related data

-- First, delete all payment transactions (these reference sales)
DELETE FROM public.payment_transactions;

-- Delete all wallet transactions
DELETE FROM public.wallet_transactions;

-- Delete all affiliate earnings
DELETE FROM public.affiliate_earnings;

-- Delete all sales
DELETE FROM public.sales;

-- Delete all referral links
DELETE FROM public.referral_links;

-- Delete all products
DELETE FROM public.products;

-- Delete all wallets
DELETE FROM public.wallets;

-- Delete all business profiles
DELETE FROM public.business_profiles;

-- Delete all user profiles (this includes both business users and affiliates)
DELETE FROM public.profiles;

-- Finally, delete all users from auth.users (this requires admin privileges)
-- Note: This will permanently delete all user accounts
DELETE FROM auth.users;
