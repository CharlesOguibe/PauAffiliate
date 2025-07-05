
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

interface SaleNotificationEmailProps {
  userName: string
  productName: string
  commissionAmount: number
  customerEmail: string
}

export const SaleNotificationEmail = ({
  userName,
  productName,
  commissionAmount,
  customerEmail,
}: SaleNotificationEmailProps) => (
  <Html>
    <Head />
    <Preview>New sale! You earned ₦{commissionAmount.toFixed(2)} commission</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🎉 New Sale!</Heading>
        <Text style={text}>
          Hello {userName},
        </Text>
        <Text style={text}>
          Great news! You just earned a commission from a new sale.
        </Text>
        <div style={detailsBox}>
          <Text style={detail}><strong>Product:</strong> {productName}</Text>
          <Text style={detail}><strong>Commission Earned:</strong> ₦{commissionAmount.toFixed(2)}</Text>
          <Text style={detail}><strong>Customer:</strong> {customerEmail}</Text>
        </div>
        <Text style={text}>
          Your commission has been added to your pending earnings and will be available for withdrawal once the payment is confirmed.
        </Text>
        <Text style={footer}>
          Keep up the great work!<br />
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
  backgroundColor: '#e8f5e8',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #d4edda',
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
