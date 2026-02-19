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

const containerStyle = {
  maxWidth: "620px",
  margin: "0 auto",
  padding: "24px",
  fontFamily:
    "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  color: "#111827",
};

const cardStyle = {
  border: "1px solid #e5e7eb",
  borderRadius: "12px",
  padding: "16px",
  marginTop: "16px",
};

const primaryButtonStyle = {
  backgroundColor: "#111827",
  color: "#ffffff",
  borderRadius: "8px",
  padding: "12px 20px",
  textDecoration: "none",
  display: "inline-block",
};

const secondaryButtonStyle = {
  ...primaryButtonStyle,
  backgroundColor: "#0f766e",
};

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
    <Html>
      <Head />
      <Preview>Your credits are now active on Autobazar123.</Preview>
      <Body style={{ backgroundColor: "#f8fafc", margin: 0 }}>
        <Container style={containerStyle}>
          <Heading as="h1">Payment confirmed</Heading>
          <Text>Hello {userName},</Text>
          <Text>
            Your payment has been processed and your credits are available in your account.
          </Text>

          <Section style={cardStyle}>
            <Text>Transaction ID: {transactionId}</Text>
            <Text>Credits purchased: {credits}</Text>
            <Text>
              Amount paid: {currency.toUpperCase()} {amount.toFixed(2)}
            </Text>
          </Section>

          <Section style={{ marginTop: "20px" }}>
            <Button href={dashboardUrl} style={primaryButtonStyle}>
              Open dashboard
            </Button>
          </Section>

          {invoiceUrl ? (
            <Section style={{ marginTop: "12px" }}>
              <Button href={invoiceUrl} style={primaryButtonStyle}>
                Open invoice
              </Button>
            </Section>
          ) : null}

          <Hr style={{ marginTop: "28px", borderColor: "#e5e7eb" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            Autobazar123 transactional notification
          </Text>
        </Container>
      </Body>
    </Html>
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
    <Html>
      <Head />
      <Preview>Payment attempt failed. Retry available.</Preview>
      <Body style={{ backgroundColor: "#f8fafc", margin: 0 }}>
        <Container style={containerStyle}>
          <Heading as="h1">Payment failed</Heading>
          <Text>Hello {userName},</Text>
          <Text>
            We could not complete your payment of {currency.toUpperCase()}{" "}
            {amount.toFixed(2)}.
          </Text>

          <Section style={cardStyle}>
            <Text>Reason: {reason}</Text>
          </Section>

          <Section style={{ marginTop: "20px" }}>
            <Button href={retryUrl} style={primaryButtonStyle}>
              Retry payment
            </Button>
          </Section>

          <Hr style={{ marginTop: "28px", borderColor: "#e5e7eb" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            Autobazar123 transactional notification
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function RegistrationConfirmationEmail({
  userName,
  confirmationUrl,
  loginUrl,
}: RegistrationConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Potvrdte registraciu na Autobazar123.</Preview>
      <Body style={{ backgroundColor: "#f8fafc", margin: 0 }}>
        <Container style={containerStyle}>
          <Heading as="h1">Potvrdenie registracie</Heading>
          <Text>Ahoj {userName},</Text>
          <Text>
            dakujeme za registraciu na Autobazar123. Kliknite na tlacidlo nizsie
            a potvrdte svoj email.
          </Text>

          <Section style={{ marginTop: "20px" }}>
            <Button href={confirmationUrl} style={secondaryButtonStyle}>
              Potvrdit email
            </Button>
          </Section>

          <Text style={{ marginTop: "16px", fontSize: "14px", color: "#374151" }}>
            Ak tlacidlo nefunguje, skopirujte tento odkaz do prehliadaca:
          </Text>
          <Text style={{ fontSize: "12px", color: "#0f766e", wordBreak: "break-all" }}>
            {confirmationUrl}
          </Text>

          <Section style={{ marginTop: "16px" }}>
            <Button href={loginUrl} style={primaryButtonStyle}>
              Prejst na prihlasenie
            </Button>
          </Section>

          <Hr style={{ marginTop: "28px", borderColor: "#e5e7eb" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            Ak ste sa neregistrovali vy, tento email ignorujte.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

function PasswordResetEmail({
  userName,
  resetUrl,
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Obnovte svoje heslo na Autobazar123.</Preview>
      <Body style={{ backgroundColor: "#f8fafc", margin: 0 }}>
        <Container style={containerStyle}>
          <Heading as="h1">Obnovenie hesla</Heading>
          <Text>Ahoj {userName},</Text>
          <Text>
            obdrzali sme ziadost o zmenu hesla. Kliknite na tlacidlo nizsie a
            nastavte nove heslo.
          </Text>

          <Section style={{ marginTop: "20px" }}>
            <Button href={resetUrl} style={secondaryButtonStyle}>
              Nastavit nove heslo
            </Button>
          </Section>

          <Text style={{ marginTop: "16px", fontSize: "14px", color: "#374151" }}>
            Ak ste ziadost neposlali vy, tento email ignorujte alebo nas
            kontaktujte na {supportEmail}.
          </Text>

          <Text style={{ marginTop: "16px", fontSize: "14px", color: "#374151" }}>
            Priamy odkaz:
          </Text>
          <Text style={{ fontSize: "12px", color: "#0f766e", wordBreak: "break-all" }}>
            {resetUrl}
          </Text>

          <Hr style={{ marginTop: "28px", borderColor: "#e5e7eb" }} />
          <Text style={{ fontSize: "12px", color: "#6b7280" }}>
            Autobazar123 - bezpecnostne upozornenie
          </Text>
        </Container>
      </Body>
    </Html>
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
