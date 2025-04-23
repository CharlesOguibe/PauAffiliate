
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReferralTracking = (code: string | null) => {
  useEffect(() => {
    const trackReferralClick = async () => {
      if (!code) return;
      
      try {
        // First get the current clicks value
        const { data, error: fetchError } = await supabase
          .from('referral_links')
          .select('clicks')
          .eq('code', code)
          .single();
          
        if (fetchError) throw fetchError;
        
        // Then update with the incremented value
        const { error } = await supabase
          .from('referral_links')
          .update({ clicks: (data?.clicks || 0) + 1 })
          .eq('code', code);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error tracking referral click:', error);
      }
    };

    trackReferralClick();
  }, [code]);
};
