
-- Add foreign key relationships that don't exist yet
DO $$ 
BEGIN
    -- Add foreign key constraints only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_referral_links_product') THEN
        ALTER TABLE referral_links ADD CONSTRAINT fk_referral_links_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_referral_links_affiliate') THEN
        ALTER TABLE referral_links ADD CONSTRAINT fk_referral_links_affiliate FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_products_business') THEN
        ALTER TABLE products ADD CONSTRAINT fk_products_business FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sales_product') THEN
        ALTER TABLE sales ADD CONSTRAINT fk_sales_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sales_referral_link') THEN
        ALTER TABLE sales ADD CONSTRAINT fk_sales_referral_link FOREIGN KEY (referral_link_id) REFERENCES referral_links(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_wallets_user') THEN
        ALTER TABLE wallets ADD CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_wallet_transactions_wallet') THEN
        ALTER TABLE wallet_transactions ADD CONSTRAINT fk_wallet_transactions_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_affiliate_earnings_affiliate') THEN
        ALTER TABLE affiliate_earnings ADD CONSTRAINT fk_affiliate_earnings_affiliate FOREIGN KEY (affiliate_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_affiliate_earnings_sale') THEN
        ALTER TABLE affiliate_earnings ADD CONSTRAINT fk_affiliate_earnings_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on tables that don't have it yet
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- Add missing RLS policies only
DO $$
BEGIN
    -- Business profiles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Business users can view and manage their own profile') THEN
        EXECUTE 'CREATE POLICY "Business users can view and manage their own profile" ON business_profiles FOR ALL USING (auth.uid() = id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Everyone can view verified business profiles') THEN
        EXECUTE 'CREATE POLICY "Everyone can view verified business profiles" ON business_profiles FOR SELECT USING (verified = true)';
    END IF;
    
    -- Products policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Business users can manage their own products') THEN
        EXECUTE 'CREATE POLICY "Business users can manage their own products" ON products FOR ALL USING (auth.uid() = business_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Everyone can view products from verified businesses') THEN
        EXECUTE 'CREATE POLICY "Everyone can view products from verified businesses" ON products FOR SELECT USING (EXISTS (SELECT 1 FROM business_profiles WHERE business_profiles.id = products.business_id AND business_profiles.verified = true))';
    END IF;
    
    -- Referral links policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_links' AND policyname = 'Affiliates can manage their own referral links') THEN
        EXECUTE 'CREATE POLICY "Affiliates can manage their own referral links" ON referral_links FOR ALL USING (auth.uid() = affiliate_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referral_links' AND policyname = 'Business users can view referral links for their products') THEN
        EXECUTE 'CREATE POLICY "Business users can view referral links for their products" ON referral_links FOR SELECT USING (EXISTS (SELECT 1 FROM products WHERE products.id = referral_links.product_id AND products.business_id = auth.uid()))';
    END IF;
    
    -- Sales policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Users can view related sales') THEN
        EXECUTE 'CREATE POLICY "Users can view related sales" ON sales FOR SELECT USING (EXISTS (SELECT 1 FROM referral_links WHERE referral_links.id = sales.referral_link_id AND referral_links.affiliate_id = auth.uid()) OR EXISTS (SELECT 1 FROM products WHERE products.id = sales.product_id AND products.business_id = auth.uid()))';
    END IF;
    
    -- Wallets policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallets' AND policyname = 'Users can manage their own wallet') THEN
        EXECUTE 'CREATE POLICY "Users can manage their own wallet" ON wallets FOR ALL USING (auth.uid() = user_id)';
    END IF;
    
    -- Wallet transactions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Users can view their own wallet transactions') THEN
        EXECUTE 'CREATE POLICY "Users can view their own wallet transactions" ON wallet_transactions FOR SELECT USING (EXISTS (SELECT 1 FROM wallets WHERE wallets.id = wallet_transactions.wallet_id AND wallets.user_id = auth.uid()))';
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_links_affiliate_id ON referral_links(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_product_id ON referral_links(product_id);
CREATE INDEX IF NOT EXISTS idx_referral_links_code ON referral_links(code);
CREATE INDEX IF NOT EXISTS idx_sales_referral_link_id ON sales(referral_link_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_products_business_id ON products(business_id);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);

-- Set business profiles to be verified for testing
UPDATE business_profiles SET verified = true WHERE verified = false;
