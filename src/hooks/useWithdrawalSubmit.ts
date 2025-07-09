
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { BankDetails } from '@/components/withdrawals/types';

export const useWithdrawalSubmit = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const validateWithdrawal = (amount: number, availableBalance: number, bankDetails: BankDetails) => {
    if (amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid withdrawal amount.",
        variant: "destructive",
      });
      return false;
    }

    if (amount > availableBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough balance for this withdrawal.",
        variant: "destructive",
      });
      return false;
    }

    if (amount < 1000) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is ₦1,000.",
        variant: "destructive",
      });
      return false;
    }

    if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountName) {
      toast({
        title: "Missing Bank Details",
        description: "Please fill in all bank details.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const sendNotifications = async (amount: number, bankDetails: BankDetails) => {
    if (!user?.email || !user?.name) {
      console.error('❌ User email or name not available for notifications');
      return;
    }

    try {
      console.log('🔄 Creating notifications for withdrawal request:', {
        userEmail: user.email,
        userName: user.name,
        amount,
        bankDetails
      });

      // Create notification for user
      await supabase.rpc('create_notification', {
        target_user_id: user.id,
        notification_title: 'Withdrawal Request Submitted',
        notification_message: `Your withdrawal request for ₦${amount.toFixed(2)} has been submitted and is under review. Bank: ${bankDetails.bankName}, Account: ${bankDetails.accountNumber} (${bankDetails.accountName})`,
        notification_type: 'withdrawal'
      });

      // Get all admin users and create notifications for them
      const { data: adminUsers, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) {
        console.error('Error fetching admin users:', error);
      } else if (adminUsers && adminUsers.length > 0) {
        // Create notifications for each admin
        const adminNotificationPromises = adminUsers.map(admin => 
          supabase.rpc('create_notification', {
            target_user_id: admin.id,
            notification_title: 'New Withdrawal Request - Action Required',
            notification_message: `${user.name} (${user.email}) has submitted a withdrawal request for ₦${amount.toFixed(2)}. Bank: ${bankDetails.bankName}, Account: ${bankDetails.accountNumber} (${bankDetails.accountName}). Please review in the admin panel.`,
            notification_type: 'withdrawal'
          })
        );

        await Promise.all(adminNotificationPromises);
        console.log(`✅ Created notifications for ${adminUsers.length} admin users`);
      }

      console.log('✅ All notifications created successfully');
      
      // Show success message to user
      toast({
        title: "Request Submitted",
        description: "Your withdrawal request has been submitted. Check your notifications for updates.",
      });
      
    } catch (error) {
      console.error('❌ Error creating notifications:', error);
      toast({
        title: "Notification Error",
        description: "There was an error creating notifications. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return { validateWithdrawal, sendNotifications };
};
