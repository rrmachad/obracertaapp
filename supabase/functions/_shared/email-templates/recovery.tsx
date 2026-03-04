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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Redefinir sua senha no Obra Certa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Text style={logoText}>🏗️ Obra Certa</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Redefinir sua senha</Heading>
        <Text style={text}>
          Recebemos uma solicitação para redefinir a senha da sua conta no Obra Certa.
          Clique no botão abaixo para criar uma nova senha.
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Redefinir Senha
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Se você não solicitou a redefinição de senha, ignore este e-mail. Sua senha não será alterada.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#F07316', margin: '0' }
const divider = { borderColor: '#E8E0D8', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7E756F', lineHeight: '1.6', margin: '0 0 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = { backgroundColor: '#F07316', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
