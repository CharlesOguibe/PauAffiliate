
import { supabase } from '@/integrations/supabase/client'

interface EmailNotificationData {
  type: 'withdrawal_request' | 'withdrawal_status' | 'sale_notification' | 'general'
  userEmail: string
  userName: string
  data: any
}

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  try {
    console.log('Sending email notification:', notificationData)
    
    const { data, error } = await supabase.functions.invoke('send-notification-email', {
      body: notificationData
    })

    if (error) {
      console.error('Error sending email notification:', error)
      return { success: false, error }
    }

    console.log('Email notification sent successfully:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Error invoking email function:', error)
    return { success: false, error }
  }
}

// Helper functions for specific notification types
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
  console.log('Sending withdrawal request email to:', userEmail)
  return sendEmailNotification({
    type: 'withdrawal_request',
    userEmail,
    userName,
    data: withdrawalData
  })
}

export const sendWithdrawalStatusEmail = async (
  userEmail: string,
  userName: string,
  statusData: {
    amount: number
    status: 'approved' | 'rejected' | 'completed'
    bankName: string
    accountNumber: string
    accountName: string
    notes?: string
  }
) => {
  console.log('Sending withdrawal status email to:', userEmail)
  return sendEmailNotification({
    type: 'withdrawal_status',
    userEmail,
    userName,
    data: statusData
  })
}

export const sendSaleNotificationEmail = async (
  userEmail: string,
  userName: string,
  saleData: {
    productName: string
    commissionAmount: number
    customerEmail: string
  }
) => {
  console.log('Sending sale notification email to:', userEmail)
  return sendEmailNotification({
    type: 'sale_notification',
    userEmail,
    userName,
    data: saleData
  })
}

export const sendGeneralNotificationEmail = async (
  userEmail: string,
  userName: string,
  notificationData: {
    title: string
    message: string
    notificationType?: 'info' | 'warning' | 'success' | 'error'
  }
) => {
  console.log('Sending general notification email to:', userEmail)
  return sendEmailNotification({
    type: 'general',
    userEmail,
    userName,
    data: notificationData
  })
}
