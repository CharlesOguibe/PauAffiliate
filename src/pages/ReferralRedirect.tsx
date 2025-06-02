
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const ReferralRedirect = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleReferral = async () => {
      console.log('Processing referral code:', code);
      
      if (!code) {
        setError('No referral code provided');
        setIsLoading(false);
        return;
      }

      try {
        // Check if referral link exists and get product info
        const { data: referralLink, error: referralError } = await supabase
          .from('referral_links')
          .select('id, product_id, clicks')
          .eq('code', code)
          .maybeSingle();

        if (referralError) {
          console.error('Database error:', referralError);
          setError('Error checking referral link');
          setIsLoading(false);
          return;
        }

        if (!referralLink) {
          console.log('Referral link not found for code:', code);
          setError('Invalid referral code');
          setIsLoading(false);
          return;
        }

        console.log('Found referral link:', referralLink);

        // Update click count
        const { error: updateError } = await supabase
          .from('referral_links')
          .update({ clicks: (referralLink.clicks || 0) + 1 })
          .eq('code', code);

        if (updateError) {
          console.error('Error updating clicks:', updateError);
          // Don't fail the redirect for this
        }

        // Store referral info
        localStorage.setItem('referral_code', code);
        console.log('Stored referral code in localStorage');
        
        // Redirect to product page
        navigate(`/products/${referralLink.product_id}`);
        
      } catch (error) {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred');
        setIsLoading(false);
      }
    };

    handleReferral();
  }, [code, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-8 w-8 mx-auto mb-4 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-gray-600">Processing referral...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Referral Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ReferralRedirect;
