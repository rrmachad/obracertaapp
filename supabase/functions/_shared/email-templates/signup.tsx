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
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu e-mail para o Obra Certa</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={headerSection}>
          <Img src="https://obracertaapp.lovable.app/favicon.png" width="40" height="40" alt="Obra Certa" style={logoImg} />
          <Text style={logoText}>Obra Certa</Text>
        </Section>
        <Hr style={divider} />
        <Heading style={h1}>Confirme seu e-mail</Heading>
        <Text style={text}>
          Obrigado por se cadastrar no{' '}
          <Link href={siteUrl} style={link}>
            <strong>Obra Certa</strong>
          </Link>
          ! Estamos felizes em ter você conosco.
        </Text>
        <Text style={text}>
          Para ativar sua conta, confirme seu e-mail (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) clicando no botão abaixo:
        </Text>
        <Section style={buttonSection}>
          <Button style={button} href={confirmationUrl}>
            Verificar E-mail
          </Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>
          Se você não criou uma conta no Obra Certa, pode ignorar este e-mail com segurança.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' } as const
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#F07316', margin: '0', display: 'inline-block', verticalAlign: 'middle' }
const divider = { borderColor: '#E8E0D8', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7E756F', lineHeight: '1.6', margin: '0 0 20px' }
const link = { color: '#F07316', textDecoration: 'underline' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = { backgroundColor: '#F07316', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
