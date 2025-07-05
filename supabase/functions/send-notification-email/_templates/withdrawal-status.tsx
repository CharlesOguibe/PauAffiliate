
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WithdrawalStatusEmailProps {
  userName: string
  amount: number
  status: 'approved' | 'rejected' | 'completed'
  bankName: string
  accountNumber: string
  accountName: string
  notes?: string
}

export const WithdrawalStatusEmail = ({
  userName,
  amount,
  status,
  bankName,
  accountNumber,
  accountName,
  notes,
}: WithdrawalStatusEmailProps) => {
  const getStatusInfo = () => {
    switch (status) {
      case 'approved':
        return {
          title: 'Withdrawal Approved',
          message: 'Great news! Your withdrawal request has been approved and is being processed.',
          color: '#22c55e',
          emoji: '✅'
        }
      case 'rejected':
        return {
          title: 'Withdrawal Request Rejected',
          message: 'Unfortunately, your withdrawal request has been rejected.',
          color: '#ef4444',
          emoji: '❌'
        }
      case 'completed':
        return {
          title: 'Withdrawal Completed',
          message: 'Your withdrawal has been completed and sent to your bank account.',
          color: '#3b82f6',
          emoji: '🎉'
        }
      default:
        return {
          title: 'Withdrawal Update',
          message: 'There has been an update to your withdrawal request.',
          color: '#6b7280',
          emoji: 'ℹ️'
        }
    }
  }

  const statusInfo = getStatusInfo()

  return (
    <Html>
      <Head />
      <Preview>{statusInfo.title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{statusInfo.emoji} {statusInfo.title}</Heading>
          <Text style={text}>
            Hello {userName},
          </Text>
          <Text style={text}>
            {statusInfo.message}
          </Text>
          <div style={{...detailsBox, borderColor: statusInfo.color}}>
            <Text style={detail}><strong>Amount:</strong> ₦{amount.toFixed(2)}</Text>
            <Text style={detail}><strong>Bank Name:</strong> {bankName}</Text>
            <Text style={detail}><strong>Account Number:</strong> {accountNumber}</Text>
            <Text style={detail}><strong>Account Name:</strong> {accountName}</Text>
            <Text style={detail}><strong>Status:</strong> <span style={{color: statusInfo.color, textTransform: 'capitalize'}}>{status}</span></Text>
          </div>
          {notes && (
            <div style={notesBox}>
              <Text style={notesTitle}><strong>Additional Notes:</strong></Text>
              <Text style={notesText}>{notes}</Text>
            </div>
          )}
          {status === 'approved' && (
            <Text style={text}>
              Your funds will be transferred to your bank account shortly. Please allow some time for the transaction to reflect in your account.
            </Text>
          )}
          {status === 'rejected' && (
            <Text style={text}>
              If you have any questions about this decision, please contact our support team for assistance.
            </Text>
          )}
          <Text style={footer}>
            Best regards,<br />
            PAUAffiliate Team
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '20px 0 48px',
  maxWidth: '560px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const text = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '16px 0',
}

const detailsBox = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '2px solid #e5e7eb',
}

const detail = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const notesBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #f59e0b',
}

const notesTitle = {
  color: '#92400e',
  fontSize: '14px',
  fontWeight: 'bold',
  margin: '0 0 8px 0',
}

const notesText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0',
}

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
}
