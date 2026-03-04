/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface EmailChangeEmailProps {
  siteName: string
  email: string
  newEmail: string
  confirmationUrl: string
}

export const EmailChangeEmail = ({
  siteName,
  email,
  newEmail,
  confirmationUrl,
}: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme a alteração do seu e-mail no Obra Certa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={logoText}>🏗️ Obra Certa</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Confirme a alteração de e-mail</Heading>
        <Text style={text}>
          Você solicitou a alteração do e-mail da sua conta no Obra Certa de{' '}
          <Link href={`mailto:${email}`} style={link}>
            {email}
          </Link>{' '}
          para{' '}
          <Link href={`mailto:${newEmail}`} style={link}>
            {newEmail}
          </Link>
          .
        </Text>
        <Text style={text}>
          Clique no botão abaixo para confirmar esta alteração:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Confirmar Alteração
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Se você não solicitou esta alteração, proteja sua conta imediatamente.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#F07316', margin: '0' }
const divider = { borderColor: '#E8E0D8', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7E756F', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#F07316', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = { backgroundColor: '#F07316', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
