
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

interface GeneralNotificationEmailProps {
  userName: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
}

export const GeneralNotificationEmail = ({
  userName,
  title,
  message,
  type,
}: GeneralNotificationEmailProps) => {
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return { backgroundColor: '#e8f5e8', borderColor: '#d4edda', emoji: '✅' }
      case 'warning':
        return { backgroundColor: '#fff3cd', borderColor: '#ffeaa7', emoji: '⚠️' }
      case 'error':
        return { backgroundColor: '#f8d7da', borderColor: '#f5c6cb', emoji: '❌' }
      default:
        return { backgroundColor: '#e3f2fd', borderColor: '#bbdefb', emoji: 'ℹ️' }
    }
  }

  const typeStyles = getTypeStyles()

  return (
    <Html>
      <Head />
      <Preview>{title}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{typeStyles.emoji} {title}</Heading>
          <Text style={text}>
            Hello {userName},
          </Text>
          <div style={{ ...messageBox, backgroundColor: typeStyles.backgroundColor, borderColor: typeStyles.borderColor }}>
            <Text style={messageText}>
              {message}
            </Text>
          </div>
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

const messageBox = {
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid',
}

const messageText = {
  color: '#333',
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
