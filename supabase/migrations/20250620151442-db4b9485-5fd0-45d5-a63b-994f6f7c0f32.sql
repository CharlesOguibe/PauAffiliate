
-- Check if there are any RLS policies on referral_links table
SELECT * FROM pg_policies WHERE tablename = 'referral_links';

-- Check if RLS is enabled on referral_links table
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'referral_links';

-- Try to see all referral links without any restrictions (as admin)
SELECT COUNT(*) as total_referral_links FROM public.referral_links;

-- Check the structure of the referral_links table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'referral_links' AND table_schema = 'public';
