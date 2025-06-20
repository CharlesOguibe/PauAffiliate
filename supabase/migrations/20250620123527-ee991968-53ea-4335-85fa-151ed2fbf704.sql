
-- Update your user profile to have admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'cjoguibe@gmail.com';

-- Remove admin role from any other users to ensure you're the only admin
UPDATE public.profiles 
SET role = 'affiliate' 
WHERE role = 'admin' AND email != 'cjoguibe@gmail.com';
