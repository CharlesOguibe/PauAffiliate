
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { sendWithdrawalRequestEmail, sendGeneralNotificationEmail } from '@/utils/emailNotifications';
import { notifyAdminsOfWithdrawalRequest } from '@/utils/adminNotifications';
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
      console.error('User email or name not available for notifications');
      return;
    }

    try {
      console.log('Starting notification process for withdrawal request:', {
        userEmail: user.email,
        userName: user.name,
        amount,
        bankDetails
      });

      // Send email notification to user
      console.log('Sending withdrawal request email to user...');
      const userEmailResult = await sendWithdrawalRequestEmail(user.email, user.name, {
        amount,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName
      });
      
      if (userEmailResult.success) {
        console.log('User notification email sent successfully');
      } else {
        console.error('Failed to send user notification email:', userEmailResult.error);
      }

      // Send copy to monitoring email
      console.log('Sending copy to monitoring email...');
      const monitoringEmailResult = await sendWithdrawalRequestEmail('cjoguibe@gmail.com', 'Admin (Copy)', {
        amount,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName
      });
      
      if (monitoringEmailResult.success) {
        console.log('Monitoring email sent successfully');
      } else {
        console.error('Failed to send monitoring email:', monitoringEmailResult.error);
      }

      // Send general notification to user
      console.log('Sending general notification to user...');
      const generalNotificationResult = await sendGeneralNotificationEmail(user.email, user.name, {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for ₦${amount.toFixed(2)} has been submitted and is under review. You will be notified once it's processed.`,
        notificationType: 'info'
      });
      
      if (generalNotificationResult.success) {
        console.log('General notification sent successfully');
      } else {
        console.error('Failed to send general notification:', generalNotificationResult.error);
      }

      // Notify admin users
      console.log('Notifying admin users...');
      await notifyAdminsOfWithdrawalRequest(amount, user.email, bankDetails);
      
      console.log('All notification processes completed');
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  return { validateWithdrawal, sendNotifications };
};
