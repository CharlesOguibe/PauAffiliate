
import { supabase } from '@/integrations/supabase/client';
import { sendGeneralNotificationEmail, sendWithdrawalStatusEmail } from './emailNotifications';

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
    console.log('Fetching admin users for withdrawal notification...')
    
    // Get all admin users
    const { data: adminUsers, error } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('role', 'admin');

    if (error) {
      console.error('Error fetching admin users:', error);
      return;
    }

    // Always send a notification to the monitoring email
    console.log('Sending admin notification to monitoring email');
    await sendGeneralNotificationEmail(
      'cjoguibe@gmail.com', // Send to monitoring email
      'Admin',
      {
        title: 'New Withdrawal Request - Action Required',
        message: `A new withdrawal request has been submitted by ${affiliateEmail} for ₦${withdrawalAmount.toFixed(2)}.\n\nBank Details:\n• Bank: ${bankDetails.bankName}\n• Account: ${bankDetails.accountNumber}\n• Name: ${bankDetails.accountName}\n\nPlease review and process this request in the admin panel.`,
        notificationType: 'warning'
      }
    );

    if (!adminUsers || adminUsers.length === 0) {
      console.log('No admin users found to notify');
      return;
    }

    console.log(`Found ${adminUsers.length} admin users to notify:`, adminUsers)

    // Send email notification to each admin
    const emailPromises = adminUsers.map(async (admin) => {
      console.log(`Sending notification to admin: ${admin.email}`)
      
      if (!admin.email) {
        console.log('Admin has no email, skipping...')
        return { success: false, error: 'No email' }
      }

      return sendGeneralNotificationEmail(
        admin.email,
        admin.name || 'Admin',
        {
          title: 'New Withdrawal Request - Action Required',
          message: `A new withdrawal request has been submitted by ${affiliateEmail} for ₦${withdrawalAmount.toFixed(2)}.\n\nBank Details:\n• Bank: ${bankDetails.bankName}\n• Account: ${bankDetails.accountNumber}\n• Name: ${bankDetails.accountName}\n\nPlease review and process this request in the admin panel.`,
          notificationType: 'warning'
        }
      )
    });

    const results = await Promise.allSettled(emailPromises);
    
    // Log results
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          console.log(`Successfully sent notification to admin ${index + 1}`);
        } else {
          console.error(`Failed to send notification to admin ${index + 1}:`, result.value.error);
        }
      } else {
        console.error(`Failed to send notification to admin ${index + 1}:`, result.reason);
      }
    });

    console.log(`Withdrawal request notification process completed for ${adminUsers.length} admin(s)`);
  } catch (error) {
    console.error('Error notifying admins of withdrawal request:', error);
  }
};

export const notifyAffiliateOfWithdrawalStatus = async (
  affiliateId: string,
  withdrawalAmount: number,
  status: 'approved' | 'rejected' | 'completed',
  bankDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  },
  notes?: string
) => {
  try {
    console.log('Fetching affiliate details for status notification...')
    
    // Get affiliate details
    const { data: affiliate, error } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', affiliateId)
      .single();

    if (error || !affiliate) {
      console.error('Error fetching affiliate details:', error);
      return;
    }

    if (!affiliate.email) {
      console.error('Affiliate has no email address');
      return;
    }

    console.log(`Sending withdrawal status email to affiliate: ${affiliate.email}`)

    // Send withdrawal status email to affiliate
    const result = await sendWithdrawalStatusEmail(
      affiliate.email,
      affiliate.name || 'User',
      {
        amount: withdrawalAmount,
        status,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        notes
      }
    );

    // Also send a copy to monitoring email
    await sendWithdrawalStatusEmail(
      'cjoguibe@gmail.com',
      'Admin (Copy)',
      {
        amount: withdrawalAmount,
        status,
        bankName: bankDetails.bankName,
        accountNumber: bankDetails.accountNumber,
        accountName: bankDetails.accountName,
        notes: `Copy of notification to ${affiliate.email} - ${notes || ''}`
      }
    );

    if (result.success) {
      console.log(`Withdrawal status email sent successfully to affiliate: ${affiliate.email}`);
    } else {
      console.error(`Failed to send withdrawal status email:`, result.error);
    }
  } catch (error) {
    console.error('Error notifying affiliate of withdrawal status:', error);
  }
};
