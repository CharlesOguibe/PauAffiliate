
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useReferralTracking = (code: string | null) => {
  useEffect(() => {
    const trackReferralClick = async () => {
      if (!code) return;
      
      try {
        const { error } = await supabase
          .from('referral_links')
          .update({ clicks: sql`clicks + 1` })
          .eq('code', code);
          
        if (error) throw error;
      } catch (error) {
        console.error('Error tracking referral click:', error);
      }
    };

    trackReferralClick();
  }, [code]);
};
