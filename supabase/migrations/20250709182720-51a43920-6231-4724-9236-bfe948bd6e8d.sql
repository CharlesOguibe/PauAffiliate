
-- Create a function to handle business verification that bypasses RLS
CREATE OR REPLACE FUNCTION public.verify_business_profile(
  business_id uuid, 
  admin_id uuid, 
  approve boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role text;
  business_record public.business_profiles%ROWTYPE;
  result jsonb;
BEGIN
  -- Check if the caller is an admin
  SELECT role INTO admin_role 
  FROM public.profiles 
  WHERE id = admin_id;
  
  IF admin_role != 'admin' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Only admins can verify businesses');
  END IF;
  
  -- Get the business profile
  SELECT * INTO business_record 
  FROM public.business_profiles 
  WHERE id = business_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Business profile not found');
  END IF;
  
  -- Update the business verification status
  UPDATE public.business_profiles
  SET 
    verified = approve,
    verified_at = CASE WHEN approve THEN now() ELSE NULL END,
    verified_by = CASE WHEN approve THEN admin_id ELSE NULL END
  WHERE id = business_id;
  
  -- Create notification for the business owner
  PERFORM public.create_notification(
    business_id,
    CASE WHEN approve THEN 'Business Verified' ELSE 'Business Verification Rejected' END,
    CASE 
      WHEN approve THEN 'Congratulations! Your business has been verified and is now live on the platform.'
      ELSE 'Your business verification request has been rejected. Please contact support for more details.'
    END,
    'info'
  );
  
  RETURN jsonb_build_object(
    'success', true, 
    'message', CASE WHEN approve THEN 'Business verified successfully' ELSE 'Business verification rejected' END
  );
END;
$$;
