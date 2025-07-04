
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Button from '@/components/ui/custom/Button';
import GlassCard from '@/components/ui/custom/GlassCard';
import { useToast } from '@/hooks/use-toast';
import { Trash2, AlertTriangle } from 'lucide-react';

const ClearReferralLinks = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { toast } = useToast();

  const clearAllReferralLinks = async () => {
    setIsLoading(true);
    
    try {
      console.log('Starting referral links cleanup...');
      
      // First delete affiliate earnings
      const { error: earningsError } = await supabase
        .from('affiliate_earnings')
        .delete()
        .gte('created_at', '1900-01-01');
      
      if (earningsError) {
        console.error('Error deleting affiliate earnings:', earningsError);
      } else {
        console.log('Affiliate earnings deleted');
      }

      // Then delete sales
      const { error: salesError } = await supabase
        .from('sales')
        .delete()
        .gte('created_at', '1900-01-01');
      
      if (salesError) {
        console.error('Error deleting sales:', salesError);
      } else {
        console.log('Sales deleted');
      }

      // Finally delete referral links
      const { error: linksError } = await supabase
        .from('referral_links')
        .delete()
        .gte('created_at', '1900-01-01');
      
      if (linksError) {
        console.error('Error deleting referral links:', linksError);
        throw linksError;
      }

      console.log('All referral links and related data deleted successfully');
      
      toast({
        title: "Success!",
        description: "All referral links and related data have been cleared.",
      });

    } catch (error) {
      console.error('Error clearing referral links:', error);
      toast({
        title: "Error",
        description: "Failed to clear referral links. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setConfirmed(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/50 flex items-center justify-center">
      <GlassCard className="max-w-md w-full mx-4">
        <div className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
          <h1 className="text-2xl font-bold mb-2">Clear Referral Links</h1>
          <p className="text-muted-foreground mb-6">
            This will permanently delete all referral links, sales, and affiliate earnings data. 
            This action cannot be undone.
          </p>

          {!confirmed ? (
            <div className="space-y-4">
              <Button
                onClick={() => setConfirmed(true)}
                variant="outline"
                className="w-full border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                I understand, proceed
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600 font-medium">
                Are you absolutely sure? This will delete ALL referral data.
              </p>
              <div className="flex space-x-3">
                <Button
                  onClick={() => setConfirmed(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={clearAllReferralLinks}
                  isLoading={isLoading}
                  loadingText="Deleting..."
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All Data
                </Button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default ClearReferralLinks;
