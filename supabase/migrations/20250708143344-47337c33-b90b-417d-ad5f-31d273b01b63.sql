
-- Fix any remaining format() function calls that might be causing issues
-- The error suggests there are still some format() calls with problematic format specifiers

-- Let's check and fix the notification functions that might be using format()
CREATE OR REPLACE FUNCTION public.notify_affiliate_of_sale()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affiliate_user_id UUID;
  product_name TEXT;
BEGIN
  -- Get affiliate ID and product name
  SELECT rl.affiliate_id, p.name 
  INTO affiliate_user_id, product_name
  FROM public.referral_links rl
  JOIN public.products p ON p.id = NEW.product_id
  WHERE rl.id = NEW.referral_link_id;
  
  -- Create notification for the affiliate (fixed format function)
  PERFORM public.create_notification(
    affiliate_user_id,
    'New Sale!',
    'You earned ₦' || NEW.commission_amount || ' commission from selling ' || product_name,
    'commission'
  );
  
  RETURN NEW;
END;
$$;

-- Also ensure the update_affiliate_earnings function doesn't have format issues
CREATE OR REPLACE FUNCTION public.update_affiliate_earnings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affiliate_user_id UUID;
BEGIN
  -- Get the affiliate ID from the referral link
  SELECT affiliate_id INTO affiliate_user_id
  FROM public.referral_links
  WHERE id = NEW.referral_link_id;
  
  -- Create an affiliate earnings record
  INSERT INTO public.affiliate_earnings (affiliate_id, sale_id, amount, status)
  VALUES (affiliate_user_id, NEW.id, NEW.commission_amount, NEW.status);
  
  -- Update the affiliate's total earnings if the sale is completed
  IF NEW.status = 'completed' THEN
    UPDATE public.profiles
    SET earnings = COALESCE(earnings, 0) + NEW.commission_amount
    WHERE id = affiliate_user_id;
    
    -- Add to wallet when sale is completed
    PERFORM public.add_to_wallet(
      affiliate_user_id,
      NEW.commission_amount,
      NEW.id,
      'commission',
      'Commission earned from sale #' || NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;
