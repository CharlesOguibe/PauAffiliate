
-- Allow public access to referral links for referral code lookup
CREATE POLICY "Allow public to view referral links by code" 
  ON public.referral_links 
  FOR SELECT 
  USING (true);

-- Allow public access to products for referral purchases
CREATE POLICY "Allow public to view products for referrals" 
  ON public.products 
  FOR SELECT 
  USING (true);

-- Allow public access to business profiles for referral purchases
CREATE POLICY "Allow public to view business profiles for referrals" 
  ON public.business_profiles 
  FOR SELECT 
  USING (true);

-- Allow public to create sales (for referral purchases)
CREATE POLICY "Allow public to create sales for referrals" 
  ON public.sales 
  FOR INSERT 
  WITH CHECK (true);
