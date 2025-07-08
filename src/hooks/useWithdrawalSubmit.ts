
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
    if (!user?.email || !user?.name) return;

    try {
      // Send email notification to user
      await sendWithdrawalRequestEmail(user.email, user.name, {
        amount,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName
      });

      // Send copy to monitoring email
      await sendWithdrawalRequestEmail('cjoguibe@gmail.com', 'Admin (Copy)', {
        amount,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName
      });

      // Send general notification to user
      await sendGeneralNotificationEmail(user.email, user.name, {
        title: 'Withdrawal Request Submitted',
        message: `Your withdrawal request for ₦${amount.toFixed(2)} has been submitted and is under review. You will be notified once it's processed.`,
        notificationType: 'info'
      });

      // Notify admin users
      await notifyAdminsOfWithdrawalRequest(amount, user.email, bankDetails);
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  return { validateWithdrawal, sendNotifications };
};
