
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'
import * as React from 'npm:react@18.3.1'

interface WithdrawalRequestEmailProps {
  userName: string
  amount: number
  bankName: string
  accountNumber: string
  accountName: string
}

export const WithdrawalRequestEmail = ({
  userName,
  amount,
  bankName,
  accountNumber,
  accountName,
}: WithdrawalRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>Withdrawal request submitted successfully</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Withdrawal Request Submitted</Heading>
        <Text style={text}>
          Hello {userName},
        </Text>
        <Text style={text}>
          Your withdrawal request has been submitted successfully and is being processed. Here are the details:
        </Text>
        <div style={detailsBox}>
          <Text style={detail}><strong>Amount:</strong> ₦{amount.toFixed(2)}</Text>
          <Text style={detail}><strong>Bank Name:</strong> {bankName}</Text>
          <Text style={detail}><strong>Account Number:</strong> {accountNumber}</Text>
          <Text style={detail}><strong>Account Name:</strong> {accountName}</Text>
        </div>
        <Text style={text}>
          Your withdrawal will be processed within 24-48 hours. You'll receive another email once the payment has been completed.
        </Text>
        <Text style={footer}>
          Best regards,<br />
          PAUAffiliate Team
        </Text>
      </Container>
    </Body>
  </Html>
)

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
  backgroundColor: '#f4f4f4',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
}

const detail = {
  color: '#333',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '8px 0',
}

const footer = {
  color: '#666',
  fontSize: '12px',
  lineHeight: '16px',
  marginTop: '32px',
}
