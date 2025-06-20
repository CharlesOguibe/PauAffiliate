
-- First, drop the existing check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add a new check constraint that includes 'admin' as a valid role
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('business', 'affiliate', 'admin'));

-- Now update your user role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'cjoguibe@gmail.com';
