
import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Button from '@/components/ui/custom/Button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const TestFundsButton = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const addTestFunds = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Add ₦5,000 test funds to the wallet using 'commission' as transaction type
      const { error } = await supabase.rpc('add_to_wallet', {
        user_id: user.id,
        amount: 5000,
        sale_id: null,
        transaction_type: 'commission',
        description: 'Test funds for withdrawal testing'
      });

      if (error) throw error;

      toast({
        title: "Test Funds Added",
        description: "₦5,000 has been added to your wallet for testing purposes.",
      });

      // Refresh the page to update balance
      window.location.reload();
    } catch (error) {
      console.error('Error adding test funds:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add test funds.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={addTestFunds}
      isLoading={loading}
      variant="outline"
      size="sm"
    >
      <Plus className="h-4 w-4 mr-2" />
      Add Test Funds (₦5,000)
    </Button>
  );
};

export default TestFundsButton;
