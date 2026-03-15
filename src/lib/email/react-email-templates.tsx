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
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactNode } from "react";
import { BRAND_THEME } from "@/lib/theme/brand";

interface PaymentConfirmationEmailProps {
  userName: string;
  credits: number;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  transactionId: string;
  dashboardUrl: string;
}

interface PaymentFailureEmailProps {
  userName: string;
  amount: number;
  currency: string;
  reason: string;
  retryUrl: string;
}

interface RegistrationConfirmationEmailProps {
  userName: string;
  confirmationUrl: string;
  loginUrl: string;
}

interface PasswordResetEmailProps {
  userName: string;
  resetUrl: string;
  supportEmail: string;
}

interface InvoiceEmailProps {
  userName: string;
  invoiceUrl: string;
}

const styles = {
  body: {
    backgroundColor: BRAND_THEME.softSurface,
    margin: 0,
    padding: "24px 0",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: BRAND_THEME.accentForeground,
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
    backgroundColor: BRAND_THEME.primaryForeground,
    borderRadius: "16px",
    border: `1px solid ${BRAND_THEME.accentSubtle}`,
    overflow: "hidden",
  },
  header: {
    background: `linear-gradient(135deg, ${BRAND_THEME.primary} 0%, ${BRAND_THEME.primaryHover} 100%)`,
    padding: "24px 28px",
    color: BRAND_THEME.primaryForeground,
  },
  content: {
    padding: "24px 28px",
  },
  summaryCard: {
    border: `1px solid ${BRAND_THEME.accentSubtle}`,
    borderRadius: "12px",
    backgroundColor: BRAND_THEME.softSurface,
    padding: "16px",
    marginTop: "16px",
  },
  row: {
    margin: "0 0 8px",
    fontSize: "14px",
    lineHeight: "20px",
    color: BRAND_THEME.accentForeground,
  },
  buttonPrimary: {
    backgroundColor: BRAND_THEME.primary,
    color: BRAND_THEME.primaryForeground,
    borderRadius: "10px",
    padding: "12px 18px",
    textDecoration: "none",
    fontWeight: 600,
    display: "inline-block",
  },
  buttonSecondary: {
    backgroundColor: BRAND_THEME.accent,
    color: BRAND_THEME.accentForeground,
    borderRadius: "10px",
    padding: "12px 18px",
    textDecoration: "none",
    fontWeight: 600,
    display: "inline-block",
  },
  footerText: {
    fontSize: "12px",
    lineHeight: "18px",
    color: BRAND_THEME.primaryHover,
  },
} as const;

function BrandHeader({ title }: { title: string }) {
  return (
    <Section style={styles.header}>
      <Text style={{ margin: 0, fontSize: "12px", opacity: 0.9 }}>Autobazar123</Text>
      <Heading
        as="h1"
        style={{ margin: "8px 0 0", fontSize: "26px", color: BRAND_THEME.primaryForeground }}
      >
        {title}
      </Heading>
    </Section>
  );
}

function EmailLayout({
  preview,
  title,
  children,
}: {
  preview: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <BrandHeader title={title} />
          <Section style={styles.content}>{children}</Section>
        </Container>
      </Body>
    </Html>
  );
}

function PaymentConfirmationEmail({
  userName,
  credits,
  amount,
  currency,
  invoiceUrl,
  transactionId,
  dashboardUrl,
}: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout preview="Platba bola úspešne spracovana." title="Platba potvrdena">
      <Text>Ahoj {userName},</Text>
      <Text>
        tvoja platba prebehla úspešne a kredity sú už pripísané na účte.
      </Text>

      <Section style={styles.summaryCard}>
        <Text style={styles.row}>Transakcia: {transactionId}</Text>
        <Text style={styles.row}>Kredity: {credits}</Text>
        <Text style={styles.row}>
          Suma: {currency.toUpperCase()} {amount.toFixed(2)}
        </Text>
      </Section>

      <Section style={{ marginTop: "20px" }}>
        <Button href={dashboardUrl} style={styles.buttonPrimary}>
          Otvorit dashboard
        </Button>
      </Section>

      {invoiceUrl ? (
        <Section style={{ marginTop: "12px" }}>
          <Button href={invoiceUrl} style={styles.buttonSecondary}>
            Otvorit fakturu
          </Button>
        </Section>
      ) : null}

      <Hr style={{ marginTop: "26px", borderColor: BRAND_THEME.accentSubtle }} />
      <Text style={styles.footerText}>
        Toto je transakcny email platformy Autobazar123.
      </Text>
    </EmailLayout>
  );
}

function PaymentFailureEmail({
  userName,
  amount,
  currency,
  reason,
  retryUrl,
}: PaymentFailureEmailProps) {
  return (
    <EmailLayout preview="Platba sa nepodarila, môžete ju zopakovat." title="Platba sa nepodarila">
      <Text>Ahoj {userName},</Text>
      <Text>
        nepodarilo sa dokoncit platbu vo vyske {currency.toUpperCase()}{" "}
        {amount.toFixed(2)}.
      </Text>

      <Section style={styles.summaryCard}>
        <Text style={styles.row}>Dovod: {reason}</Text>
      </Section>

      <Section style={{ marginTop: "20px" }}>
        <Button href={retryUrl} style={styles.buttonPrimary}>
          Zopakovat platbu
        </Button>
      </Section>

      <Hr style={{ marginTop: "26px", borderColor: BRAND_THEME.accentSubtle }} />
      <Text style={styles.footerText}>
        Ak problém pretrvava, kontaktujte nasu podporu.
      </Text>
    </EmailLayout>
  );
}

function RegistrationConfirmationEmail({
  userName,
  confirmationUrl,
  loginUrl,
}: RegistrationConfirmationEmailProps) {
  return (
    <EmailLayout preview="Potvrďte registráciu na Autobazar123." title="Potvrdenie registrácie">
      <Text>Ahoj {userName},</Text>
      <Text>
        dakujeme za registraciu. Kliknite na tlacidlo nižšie a aktivujte svoj účet.
      </Text>

      <Section style={{ marginTop: "20px" }}>
        <Button href={confirmationUrl} style={styles.buttonSecondary}>
          Potvrdiť email
        </Button>
      </Section>

      <Text style={{ marginTop: "16px", fontSize: "14px", color: BRAND_THEME.accentForeground }}>
        Ak tlacidlo nefunguje, skopirujte tento odkaz:
      </Text>
      <Text style={{ fontSize: "12px", color: BRAND_THEME.primary, wordBreak: "break-all" }}>
        {confirmationUrl}
      </Text>

      <Section style={{ marginTop: "16px" }}>
        <Button href={loginUrl} style={styles.buttonPrimary}>
          Prejst na prihlásenie
        </Button>
      </Section>

      <Hr style={{ marginTop: "26px", borderColor: BRAND_THEME.accentSubtle }} />
      <Text style={styles.footerText}>
        Ak ste sa neregistrovali vy, tento email ignorujte.
      </Text>
    </EmailLayout>
  );
}

function PasswordResetEmail({
  userName,
  resetUrl,
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Obnovte heslo pre účet Autobazar123." title="Obnovenie heslá">
      <Text>Ahoj {userName},</Text>
      <Text>
        prijali sme žiadosť o zmenu heslá. Pre pokracovanie kliknite na tlacidlo:
      </Text>

      <Section style={{ marginTop: "20px" }}>
        <Button href={resetUrl} style={styles.buttonSecondary}>
          Nastaviť nove heslo
        </Button>
      </Section>

      <Text style={{ marginTop: "16px", fontSize: "14px", color: BRAND_THEME.accentForeground }}>
        Ak ste ziadost neposlali vy, email ignorujte alebo kontaktujte podporu:
        {" "}
        {supportEmail}
      </Text>

      <Text style={{ marginTop: "16px", fontSize: "14px", color: BRAND_THEME.accentForeground }}>
        Priamy odkaz:
      </Text>
      <Text style={{ fontSize: "12px", color: BRAND_THEME.primary, wordBreak: "break-all" }}>
        {resetUrl}
      </Text>

      <Hr style={{ marginTop: "26px", borderColor: BRAND_THEME.accentSubtle }} />
      <Text style={styles.footerText}>
        Bezpecnostne upozornenie Autobazar123.
      </Text>
    </EmailLayout>
  );
}

function InvoiceEmail({ userName, invoiceUrl }: InvoiceEmailProps) {
  return (
    <EmailLayout preview="Vasa faktura je pripravena." title="Vasa faktura">
      <Text>Ahoj {userName},</Text>
      <Text>
        faktura je pripravljena na stiahnutie. Otvorite ju kliknutim na tlacidlo.
      </Text>

      <Section style={{ marginTop: "20px" }}>
        <Button href={invoiceUrl} style={styles.buttonPrimary}>
          Otvorit fakturu
        </Button>
      </Section>

      <Text style={{ marginTop: "16px", fontSize: "14px", color: BRAND_THEME.accentForeground }}>
        Priamy odkaz:
      </Text>
      <Text style={{ fontSize: "12px", color: BRAND_THEME.primary, wordBreak: "break-all" }}>
        {invoiceUrl}
      </Text>

      <Hr style={{ marginTop: "26px", borderColor: BRAND_THEME.accentSubtle }} />
      <Text style={styles.footerText}>Dakujeme, že používate Autobazar123.</Text>
    </EmailLayout>
  );
}

export async function renderPaymentConfirmationEmail(
  props: PaymentConfirmationEmailProps,
): Promise<string> {
  return render(<PaymentConfirmationEmail {...props} />);
}

export async function renderPaymentFailureEmail(
  props: PaymentFailureEmailProps,
): Promise<string> {
  return render(<PaymentFailureEmail {...props} />);
}

export async function renderRegistrationConfirmationEmail(
  props: RegistrationConfirmationEmailProps,
): Promise<string> {
  return render(<RegistrationConfirmationEmail {...props} />);
}

export async function renderPasswordResetEmail(
  props: PasswordResetEmailProps,
): Promise<string> {
  return render(<PasswordResetEmail {...props} />);
}

export async function renderInvoiceEmail(
  props: InvoiceEmailProps,
): Promise<string> {
  return render(<InvoiceEmail {...props} />);
}
