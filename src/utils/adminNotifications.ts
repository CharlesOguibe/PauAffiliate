
import { supabase } from '@/integrations/supabase/client';
import { sendGeneralNotificationEmail } from './emailNotifications';

export const notifyAdminsOfWithdrawalRequest = async (
  withdrawalAmount: number,
  affiliateEmail: string,
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  }
) => {
  try {
    // Get all admin users
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('role', 'admin');

    if (error) {
      console.error('Error fetching admin users:', error);
      return;
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found to notify');
      return;
    }

    // Send email notification to each admin
    const emailPromises = adminUsers.map(admin => 
      sendGeneralNotificationEmail(
        admin.email,
        admin.name || 'Admin',
        {
          title: 'New Withdrawal Request - Action Required',
          message: `A new withdrawal request has been submitted by ${affiliateEmail} for ₦${withdrawalAmount.toFixed(2)}.\n\nBank Details:\n• Bank: ${bankDetails.bankName}\n• Account: ${bankDetails.accountNumber}\n• Name: ${bankDetails.accountName}\n\nPlease review and process this request in the admin panel.`,
          notificationType: 'warning'
        }
      )
    );

    await Promise.all(emailPromises);
    console.log(`Withdrawal request notification sent to ${adminUsers.length} admin(s)`);
  } catch (error) {
    console.error('Error notifying admins of withdrawal request:', error);
  }
};
