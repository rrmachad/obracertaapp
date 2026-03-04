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
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'

import { translations, getLangTag, type EmailLocale } from './i18n.ts'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
  locale?: EmailLocale
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
  locale = 'pt',
}: RecoveryEmailProps) => {
  const t = translations.recovery[locale]
  return (
    <Html lang={getLangTag(locale)} dir="ltr">
      <Head />
      <Preview>{t.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Img src="https://obracertaapp.lovable.app/favicon.png" width="40" height="40" alt={t.brandName} style={logoImg} />
            <Text style={logoText}>{t.brandName}</Text>
          </Section>
          <Hr style={divider} />
          <Heading style={h1}>{t.heading}</Heading>
          <Text style={text}>{t.body}</Text>
          <Section style={buttonSection}>
            <Button style={button} href={confirmationUrl}>
              {t.button}
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>{t.footer}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default RecoveryEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '32px 24px', maxWidth: '480px', margin: '0 auto' }
const headerSection = { textAlign: 'center' as const, marginBottom: '8px' }
const logoImg = { display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' } as const
const logoText = { fontSize: '24px', fontWeight: 'bold' as const, color: '#F07316', margin: '0', display: 'inline-block', verticalAlign: 'middle' }
const divider = { borderColor: '#E8E0D8', margin: '16px 0' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#1C1917', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#7E756F', lineHeight: '1.6', margin: '0 0 20px' }
const buttonSection = { textAlign: 'center' as const, margin: '8px 0 24px' }
const button = { backgroundColor: '#F07316', color: '#ffffff', fontSize: '15px', fontWeight: '600' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
