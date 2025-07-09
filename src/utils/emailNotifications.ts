
import { supabase } from '@/integrations/supabase/client';

interface EmailNotificationData {
  type: 'withdrawal_request' | 'withdrawal_status' | 'sale_notification' | 'general'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('🚀 Sending email notification via Supabase edge function:', notificationData);
    
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: notificationData
    });

    console.log('📧 Edge function response:', { data, error });

    if (error) {
      console.error('❌ Error sending email via edge function:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Email sent successfully via edge function:', data);
    return { success: true, messageId: data?.messageId };
  } catch (error) {
    console.error('❌ Error sending email via edge function:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send email' };
  }
};

// Helper function for withdrawal request emails
export const sendWithdrawalRequestEmail = async (
  userEmail: string,
  userName: string,
  withdrawalData: {
    amount: number
    bankName: string
    accountNumber: string
    accountName: string
  }
) => {
  try {
    console.log('🚀 Sending withdrawal request email:', {
      userEmail,
      userName,
      withdrawalData
    });

    const result = await sendEmailNotification({
      type: 'withdrawal_request',
      userEmail,
      userName,
      data: withdrawalData
    });

    console.log('📧 Withdrawal request email result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending withdrawal request email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send withdrawal request email' };
  }
};

// General notification email function
export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType: string
  }
) => {
  try {
    console.log('🚀 Sending general notification email:', {
      userEmail,
      userName,
      notificationData
    });

    const result = await sendEmailNotification({
      type: 'general',
      userEmail,
      userName,
      data: notificationData
    });

    console.log('📧 General notification email result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending general notification email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send general notification email' };
  }
};

// Withdrawal status email function
export const sendWithdrawalStatusEmail = async (
  userEmail: string,
  userName: string,
  statusData: {
    amount: number
    status: string
    bankName: string
    accountNumber: string
    accountName: string
    notes?: string
  }
) => {
  try {
    console.log('🚀 Sending withdrawal status email:', {
      userEmail,
      userName,
      statusData
    });

    const result = await sendEmailNotification({
      type: 'withdrawal_status',
      userEmail,
      userName,
      data: statusData
    });

    console.log('📧 Withdrawal status email result:', result);
    return result;
  } catch (error) {
    console.error('❌ Error sending withdrawal status email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send withdrawal status email' };
  }
};
