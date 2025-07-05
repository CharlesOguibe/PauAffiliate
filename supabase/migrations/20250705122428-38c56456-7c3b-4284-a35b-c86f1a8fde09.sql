
-- Add admin policy for withdrawal_requests table to allow admin operations
CREATE POLICY "Admins can update withdrawal requests" 
  ON public.withdrawal_requests 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Add admin policy for reading all withdrawal requests
CREATE POLICY "Admins can view all withdrawal requests" 
  ON public.withdrawal_requests 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to process withdrawal approval with wallet deduction
CREATE OR REPLACE FUNCTION public.process_withdrawal_approval(
  request_id UUID,
  admin_id UUID,
  approve BOOLEAN,
  admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  withdrawal_record public.withdrawal_requests%ROWTYPE;
  wallet_record public.wallets%ROWTYPE;
  result JSONB;
BEGIN
  -- Get withdrawal request details
  SELECT * INTO withdrawal_record 
  FROM public.withdrawal_requests 
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Withdrawal request not found or already processed');
  END IF;
  
  -- Get user's wallet
  SELECT * INTO wallet_record 
  FROM public.wallets 
  WHERE user_id = withdrawal_record.affiliate_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User wallet not found');
  END IF;
  
  IF approve THEN
    -- Check if user has sufficient balance
    IF wallet_record.balance < withdrawal_record.amount THEN
      RETURN jsonb_build_object('success', false, 'error', 'Insufficient wallet balance');
    END IF;
    
    -- Deduct amount from wallet
    UPDATE public.wallets 
    SET balance = balance - withdrawal_record.amount, 
        updated_at = now()
    WHERE user_id = withdrawal_record.affiliate_id;
    
    -- Create wallet transaction record
    INSERT INTO public.wallet_transactions (
      wallet_id, 
      amount, 
      transaction_type, 
      description
    ) VALUES (
      wallet_record.id,
      -withdrawal_record.amount,
      'withdrawal',
      'Withdrawal approved - Request ID: ' || request_id
    );
    
    -- Update withdrawal request to approved
    UPDATE public.withdrawal_requests
    SET status = 'approved',
        processed_at = now(),
        processed_by = admin_id,
        notes = admin_notes
    WHERE id = request_id;
    
    -- Create notification for user
    PERFORM public.create_notification(
      withdrawal_record.affiliate_id,
      'Withdrawal Approved',
      format('Your withdrawal request for ₦%.2f has been approved and is being processed.', withdrawal_record.amount),
      'withdrawal'
    );
    
    result := jsonb_build_object('success', true, 'message', 'Withdrawal approved successfully');
  ELSE
    -- Reject withdrawal request
    UPDATE public.withdrawal_requests
    SET status = 'rejected',
        processed_at = now(),
        processed_by = admin_id,
        notes = admin_notes
    WHERE id = request_id;
    
    -- Create notification for user
    PERFORM public.create_notification(
      withdrawal_record.affiliate_id,
      'Withdrawal Rejected',
      format('Your withdrawal request for ₦%.2f has been rejected. %s', 
             withdrawal_record.amount, 
             COALESCE('Reason: ' || admin_notes, '')),
      'withdrawal'
    );
    
    result := jsonb_build_object('success', true, 'message', 'Withdrawal rejected');
  END IF;
  
  RETURN result;
END;
$$;

-- Create function to mark approved withdrawal as completed
CREATE OR REPLACE FUNCTION public.complete_withdrawal(
  request_id UUID,
  admin_id UUID,
  completion_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  withdrawal_record public.withdrawal_requests%ROWTYPE;
  result JSONB;
BEGIN
  -- Get withdrawal request details
  SELECT * INTO withdrawal_record 
  FROM public.withdrawal_requests 
  WHERE id = request_id AND status = 'approved';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Approved withdrawal request not found');
  END IF;
  
  -- Update withdrawal request to completed
  UPDATE public.withdrawal_requests
  SET status = 'completed',
      notes = COALESCE(notes || ' | ', '') || 'Completed: ' || COALESCE(completion_notes, 'Payout processed')
  WHERE id = request_id;
  
  -- Create notification for user
  PERFORM public.create_notification(
    withdrawal_record.affiliate_id,
    'Withdrawal Completed',
    format('Your withdrawal of ₦%.2f has been completed and sent to your bank account.', withdrawal_record.amount),
    'withdrawal'
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Withdrawal marked as completed');
END;
$$;
