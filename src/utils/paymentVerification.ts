
import { supabase } from '@/integrations/supabase/client';

interface ManualVerificationParams {
  transactionId: string;
  txRef: string;
}

export const manuallyVerifyAndProcessPayment = async ({ transactionId, txRef }: ManualVerificationParams) => {
  console.log('Starting manual verification for:', { transactionId, txRef });
  
  try {
    // Call our edge function to verify and process the payment
    const { data, error } = await supabase.functions.invoke('verify-flutterwave-payment', {
      body: {
        transaction_id: transactionId,
        tx_ref: txRef
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw new Error(`Verification failed: ${error.message}`);
    }

    if (!data.success) {
      console.error('Verification failed:', data);
      throw new Error('Payment verification failed');
    }

    console.log('Payment verified and processed successfully:', data);
    return data;

  } catch (error) {
    console.error('Error in manual verification:', error);
    throw error;
  }
};
