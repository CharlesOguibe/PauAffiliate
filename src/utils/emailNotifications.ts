
// Email notifications utility with Elastic Email API integration

interface EmailNotificationData {
  type: 'withdrawal_request'
  userEmail: string
  userName: string
  data: any
}

const ELASTIC_EMAIL_API_KEY = '62EDB0F2AF30F81A0B559E371544FDFBFF66F0BFCBCEB86D67AB4922CB4F92023EC11BA5F8A97B2139F8D6D92467A5D0';
const ELASTIC_EMAIL_API_URL = 'https://api.elasticemail.com/v2/email/send';

const sendElasticEmail = async (to: string, subject: string, htmlBody: string, textBody?: string) => {
  try {
    const formData = new FormData();
    formData.append('apikey', ELASTIC_EMAIL_API_KEY);
    formData.append('to', to);
    formData.append('from', 'noreply@pauaffiliate.com');
    formData.append('fromName', 'PAU Affiliate System');
    formData.append('subject', subject);
    formData.append('bodyHtml', htmlBody);
    if (textBody) {
      formData.append('bodyText', textBody);
    }

    const response = await fetch(ELASTIC_EMAIL_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.text();
    
    if (response.ok) {
      console.log('Email sent successfully via Elastic Email:', result);
      return { success: true, result };
    } else {
      console.error('Elastic Email API error:', result);
      return { success: false, error: result };
    }
  } catch (error) {
    console.error('Error sending email via Elastic Email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendEmailNotification = async (notificationData: EmailNotificationData) => {
  console.log('Sending email notification via Elastic Email:', notificationData);
  
  if (notificationData.type === 'withdrawal_request') {
    return await sendWithdrawalRequestEmail(
      notificationData.userEmail,
      notificationData.userName,
      notificationData.data
    );
  }
  
  return { success: false, error: 'Unknown notification type' };
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
  console.log('Sending withdrawal request email via Elastic Email:', {
    userEmail,
    userName,
    withdrawalData
  });

  const subject = 'New Withdrawal Request - Action Required';
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">New Withdrawal Request</h2>
        
        <p style="color: #666; margin-bottom: 20px;">A new withdrawal request has been submitted and requires your attention.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Request Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Affiliate:</td>
              <td style="padding: 8px 0; color: #333;">${userName} (${userEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Amount:</td>
              <td style="padding: 8px 0; color: #333;">₦${withdrawalData.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Bank Name:</td>
              <td style="padding: 8px 0; color: #333;">${withdrawalData.bankName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Account Number:</td>
              <td style="padding: 8px 0; color: #333;">${withdrawalData.accountNumber}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666; font-weight: bold;">Account Name:</td>
              <td style="padding: 8px 0; color: #333;">${withdrawalData.accountName}</td>
            </tr>
          </table>
        </div>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #856404;">
            <strong>Action Required:</strong> Please review and process this withdrawal request in the admin panel.
          </p>
        </div>
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate System
        </p>
      </div>
    </div>
  `;

  const textBody = `
New Withdrawal Request

A new withdrawal request has been submitted:

Affiliate: ${userName} (${userEmail})
Amount: ₦${withdrawalData.amount.toFixed(2)}
Bank Name: ${withdrawalData.bankName}
Account Number: ${withdrawalData.accountNumber}
Account Name: ${withdrawalData.accountName}

Please review and process this request in the admin panel.

Best regards,
PAU Affiliate System
  `;

  // Send to admin email
  const adminResult = await sendElasticEmail(
    'cjoguibe@gmail.com',
    subject,
    htmlBody,
    textBody
  );

  // Also send confirmation to user
  const userSubject = 'Withdrawal Request Submitted';
  const userHtmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Withdrawal Request Submitted</h2>
        
        <p style="color: #666;">Hello ${userName},</p>
        
        <p style="color: #666; margin-bottom: 20px;">Your withdrawal request has been submitted successfully and is being processed.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Request Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Amount:</strong> ₦${withdrawalData.amount.toFixed(2)}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Bank Name:</strong> ${withdrawalData.bankName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Number:</strong> ${withdrawalData.accountNumber}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Name:</strong> ${withdrawalData.accountName}</p>
        </div>
        
        <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #155724;">
            <strong>Processing Time:</strong> Withdrawals are typically processed within 24-48 hours. You'll receive email notifications about status updates.
          </p>
        </div>
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate Team
        </p>
      </div>
    </div>
  `;

  const userTextBody = `
Withdrawal Request Submitted

Hello ${userName},

Your withdrawal request has been submitted successfully and is being processed.

Request Details:
Amount: ₦${withdrawalData.amount.toFixed(2)}
Bank Name: ${withdrawalData.bankName}
Account Number: ${withdrawalData.accountNumber}
Account Name: ${withdrawalData.accountName}

Processing Time: Withdrawals are typically processed within 24-48 hours. You'll receive email notifications about status updates.

Best regards,
PAU Affiliate Team
  `;

  const userResult = await sendElasticEmail(
    userEmail,
    userSubject,
    userHtmlBody,
    userTextBody
  );

  console.log('Admin email result:', adminResult);
  console.log('User email result:', userResult);

  return adminResult;
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
  console.log('Sending general notification email via Elastic Email:', {
    userEmail,
    userName,
    notificationData
  });

  const subject = notificationData.title;
  
  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">${notificationData.title}</h2>
        
        <p style="color: #666;">Hello ${userName},</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #333; line-height: 1.6;">${notificationData.message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate Team
        </p>
      </div>
    </div>
  `;

  const textBody = `
${notificationData.title}

Hello ${userName},

${notificationData.message}

Best regards,
PAU Affiliate Team
  `;

  return await sendElasticEmail(userEmail, subject, htmlBody, textBody);
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
  console.log('Sending withdrawal status email via Elastic Email:', {
    userEmail,
    userName,
    statusData
  });

  const statusText = statusData.status === 'approved' ? 'Approved' : 
                    statusData.status === 'rejected' ? 'Rejected' : 
                    statusData.status === 'completed' ? 'Completed' : 'Updated';
  
  const subject = `Withdrawal Request ${statusText}`;
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'completed': return '#17a2b8';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #333; margin-bottom: 20px;">Withdrawal Request ${statusText}</h2>
        
        <p style="color: #666;">Hello ${userName},</p>
        
        <p style="color: #666; margin-bottom: 20px;">Your withdrawal request has been ${statusData.status}.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Request Details:</h3>
          <p style="margin: 5px 0; color: #333;"><strong>Amount:</strong> ₦${statusData.amount.toFixed(2)}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Bank Name:</strong> ${statusData.bankName}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Number:</strong> ${statusData.accountNumber}</p>
          <p style="margin: 5px 0; color: #333;"><strong>Account Name:</strong> ${statusData.accountName}</p>
          <p style="margin: 5px 0; color: ${getStatusColor(statusData.status)}; font-weight: bold;"><strong>Status:</strong> ${statusText}</p>
        </div>
        
        ${statusData.notes ? `
        <div style="background-color: #e9ecef; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #333;"><strong>Notes:</strong> ${statusData.notes}</p>
        </div>
        ` : ''}
        
        <p style="color: #666; margin-top: 30px;">
          Best regards,<br>
          PAU Affiliate Team
        </p>
      </div>
    </div>
  `;

  const textBody = `
Withdrawal Request ${statusText}

Hello ${userName},

Your withdrawal request has been ${statusData.status}.

Request Details:
Amount: ₦${statusData.amount.toFixed(2)}
Bank Name: ${statusData.bankName}
Account Number: ${statusData.accountNumber}
Account Name: ${statusData.accountName}
Status: ${statusText}

${statusData.notes ? `Notes: ${statusData.notes}` : ''}

Best regards,
PAU Affiliate Team
  `;

  return await sendElasticEmail(userEmail, subject, htmlBody, textBody);
};
