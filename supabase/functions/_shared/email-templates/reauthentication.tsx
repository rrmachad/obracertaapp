/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação do Obra Certa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src="https://obracertaapp.lovable.app/favicon.png" width="40" height="40" alt="Obra Certa" style={logoImg} />
          <Text style={logoText}>Obra Certa</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Código de verificação</Heading>
        <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
        <Section style={codeSection}>
          <Text style={codeStyle}>{token}</Text>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Este código expira em breve. Se você não solicitou, ignore este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#F07316', margin: '0' }
const divider = { borderColor: '#E8E0D8', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7E756F', lineHeight: '1.6', margin: '0 0 20px' }
const codeSection = { textAlign: 'center' as const, margin: '0 0 24px' }
const codeStyle = { fontFamily: "'Courier New', Courier, monospace", fontSize: '28px', fontWeight: 'bold' as const, color: '#F07316', letterSpacing: '4px', margin: '0' }
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
