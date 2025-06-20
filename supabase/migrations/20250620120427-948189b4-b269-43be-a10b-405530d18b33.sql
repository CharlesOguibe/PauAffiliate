
-- Create withdrawal_requests table for tracking withdrawal requests
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  affiliate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES public.profiles(id),
  notes TEXT
);

-- Create notifications table for system notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('sale', 'commission', 'withdrawal', 'info')),
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add business verification status to business_profiles
ALTER TABLE public.business_profiles 
ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Enable RLS on new tables
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for withdrawal_requests
CREATE POLICY "Users can view their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (affiliate_id = auth.uid());

CREATE POLICY "Users can create their own withdrawal requests" 
  ON public.withdrawal_requests 
  FOR INSERT 
  WITH CHECK (affiliate_id = auth.uid());

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (user_id = auth.uid());

-- Create function to create notification
CREATE OR REPLACE FUNCTION public.create_notification(
  target_user_id UUID,
  notification_title TEXT,
  notification_message TEXT,
  notification_type TEXT DEFAULT 'info'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (target_user_id, notification_title, notification_message, notification_type)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Create trigger to notify affiliates of new sales
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
  
  -- Create notification for the affiliate
  PERFORM public.create_notification(
    affiliate_user_id,
    'New Sale!',
    format('You earned ₦%.2f commission from selling %s', NEW.commission_amount, product_name),
    'commission'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on sales table
CREATE TRIGGER notify_affiliate_on_sale
  AFTER INSERT ON public.sales
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_affiliate_of_sale();
