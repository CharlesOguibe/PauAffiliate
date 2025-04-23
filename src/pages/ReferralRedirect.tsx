
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useReferralTracking } from '@/hooks/useReferralTracking';

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  
  useReferralTracking(code);

  useEffect(() => {
    const redirectToProduct = async () => {
      if (!code) {
        setError('Invalid referral link');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('referral_links')
          .select('product_id')
          .eq('code', code)
          .single();

        if (error) throw error;
        if (!data) {
          setError('Invalid referral link');
          return;
        }

        // Store referral info in localStorage
        localStorage.setItem('referral_code', code);
        
        // Redirect to product page
        navigate(`/products/${data.product_id}`);
      } catch (error) {
        console.error('Error processing referral:', error);
        setError('Error processing referral link');
      }
    };

    redirectToProduct();
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/50">
        <div className="text-center">
          <h1 className="text-2xl font-medium text-destructive mb-4">{error}</h1>
          <p className="text-muted-foreground">
            The referral link you followed appears to be invalid.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/50">
      <div className="animate-pulse text-center">
        <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
};

export default ReferralRedirect;
