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
    backgroundColor: "#ECF3EC",
    margin: 0,
    padding: "32px 12px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    color: "#183225",
  },
  container: {
    maxWidth: "640px",
    margin: "0 auto",
    width: "100%",
  },
  shell: {
    backgroundColor: "#FBFCFA",
    borderRadius: "22px",
    border: "1px solid #D7E2D8",
    overflow: "hidden",
  },
  header: {
    backgroundColor: BRAND_THEME.primary,
    padding: "28px 32px",
    color: BRAND_THEME.primaryForeground,
  },
  brandLabel: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "16px",
    letterSpacing: "0.1em",
    textTransform: "uppercase" as const,
    color: "#D8F4E3",
  },
  title: {
    margin: "12px 0 0",
    fontSize: "32px",
    lineHeight: "38px",
    fontWeight: "700",
    color: BRAND_THEME.primaryForeground,
  },
  subtitle: {
    margin: "12px 0 0",
    fontSize: "15px",
    lineHeight: "24px",
    color: "#E2F4EA",
  },
  content: {
    padding: "32px",
  },
  greeting: {
    margin: "0 0 16px",
    fontSize: "18px",
    lineHeight: "28px",
    fontWeight: "600",
    color: "#183225",
  },
  paragraph: {
    margin: "0 0 16px",
    fontSize: "16px",
    lineHeight: "26px",
    color: "#183225",
  },
  muted: {
    margin: "0 0 14px",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#526257",
  },
  summaryCard: {
    border: "1px solid #D7E2D8",
    borderRadius: "16px",
    backgroundColor: "#F3F7F2",
    padding: "18px 20px",
    marginTop: "20px",
  },
  sectionLabel: {
    margin: "0 0 12px",
    fontSize: "12px",
    lineHeight: "16px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#5E6F63",
  },
  row: {
    margin: "0 0 10px",
    fontSize: "15px",
    lineHeight: "24px",
    color: "#183225",
  },
  rowLabel: {
    fontWeight: "700",
    color: "#183225",
  },
  actionWrap: {
    marginTop: "24px",
  },
  buttonPrimary: {
    backgroundColor: BRAND_THEME.primary,
    color: BRAND_THEME.primaryForeground,
    borderRadius: "12px",
    padding: "14px 22px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
    fontSize: "16px",
    lineHeight: "16px",
  },
  buttonSecondary: {
    backgroundColor: BRAND_THEME.accent,
    color: BRAND_THEME.accentForeground,
    borderRadius: "12px",
    padding: "14px 22px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
    fontSize: "16px",
    lineHeight: "16px",
  },
  linkCard: {
    border: "1px solid #E7EEE7",
    borderRadius: "14px",
    backgroundColor: "#FFFFFF",
    padding: "16px 18px",
    marginTop: "18px",
  },
  link: {
    fontSize: "13px",
    lineHeight: "22px",
    color: BRAND_THEME.primary,
    textDecoration: "underline",
    wordBreak: "break-all" as const,
  },
  footer: {
    padding: "0 32px 28px",
  },
  footerDivider: {
    margin: "0 0 18px",
    borderColor: "#D7E2D8",
  },
  footerText: {
    margin: 0,
    fontSize: "12px",
    lineHeight: "20px",
    color: "#5E6F63",
  },
} as const;

function BrandHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <Section style={styles.header}>
      <Text style={styles.brandLabel}>Autobazar123</Text>
      <Heading as="h1" style={styles.title}>
        {title}
      </Heading>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Section>
  );
}

function EmailLayout({
  preview,
  title,
  subtitle,
  footer,
  children,
}: {
  preview: string;
  title: string;
  subtitle: string;
  footer: string;
  children: ReactNode;
}) {
  return (
    <Html>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.shell}>
            <BrandHeader title={title} subtitle={subtitle} />
            <Section style={styles.content}>{children}</Section>
            <Section style={styles.footer}>
              <Hr style={styles.footerDivider} />
              <Text style={styles.footerText}>{footer}</Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Greeting({ userName }: { userName: string }) {
  return <Text style={styles.greeting}>Ahoj {userName},</Text>;
}

function Paragraph({ children }: { children: ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

function MutedText({ children }: { children: ReactNode }) {
  return <Text style={styles.muted}>{children}</Text>;
}

function SummaryCard({ children }: { children: ReactNode }) {
  return <Section style={styles.summaryCard}>{children}</Section>;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Text style={styles.row}>
      <span style={styles.rowLabel}>{label}: </span>
      {value}
    </Text>
  );
}

function ActionButton({
  href,
  label,
  tone = "primary",
}: {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <Section style={styles.actionWrap}>
      <Button
        href={href}
        style={tone === "primary" ? styles.buttonPrimary : styles.buttonSecondary}
      >
        {label}
      </Button>
    </Section>
  );
}

function LinkCard({ label, href }: { label: string; href: string }) {
  return (
    <Section style={styles.linkCard}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <Link href={href} style={styles.link}>
        {href}
      </Link>
    </Section>
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
    <EmailLayout
      preview="Platba bola úspešne spracovaná."
      title="Platba potvrdená"
      subtitle="Platbu sme prijali a kredity sú už pripravené vo vašom účte."
      footer="Toto je transakčný e-mail platformy Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Platba prebehla úspešne. Kredity môžete hneď použiť na zvýraznenie alebo
        správu svojich inzerátov.
      </Paragraph>

      <SummaryCard>
        <Text style={styles.sectionLabel}>Prehľad platby</Text>
        <DetailRow label="Transakcia" value={transactionId} />
        <DetailRow label="Kredity" value={credits} />
        <DetailRow
          label="Suma"
          value={`${currency.toUpperCase()} ${amount.toFixed(2)}`}
        />
      </SummaryCard>

      <ActionButton href={dashboardUrl} label="Otvoriť dashboard" />

      {invoiceUrl ? (
        <>
          <MutedText>Faktúru si môžete otvoriť aj samostatne.</MutedText>
          <ActionButton
            href={invoiceUrl}
            label="Otvoriť faktúru"
            tone="secondary"
          />
        </>
      ) : null}
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
    <EmailLayout
      preview="Platba sa nepodarila, môžete ju zopakovať."
      title="Platba sa nepodarila"
      subtitle="Platbu sme nedokončili. Stačí ju skúsiť znova."
      footer="Ak problém pretrváva, odpovedzte na tento e-mail alebo kontaktujte podporu."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Nepodarilo sa dokončiť platbu vo výške {currency.toUpperCase()}{" "}
        {amount.toFixed(2)}.
      </Paragraph>

      <SummaryCard>
        <Text style={styles.sectionLabel}>Čo sa stalo</Text>
        <DetailRow
          label="Suma"
          value={`${currency.toUpperCase()} ${amount.toFixed(2)}`}
        />
        <DetailRow label="Dôvod" value={reason} />
      </SummaryCard>

      <ActionButton href={retryUrl} label="Zopakovať platbu" />
      <MutedText>
        Ak používate bankovú kartu, oplatí sa skontrolovať limit, 3D Secure
        potvrdenie alebo zostatok.
      </MutedText>
    </EmailLayout>
  );
}

function RegistrationConfirmationEmail({
  userName,
  confirmationUrl,
  loginUrl,
}: RegistrationConfirmationEmailProps) {
  return (
    <EmailLayout
      preview="Potvrďte registráciu na Autobazar123."
      title="Potvrdenie registrácie"
      subtitle="Aktivujte účet jedným kliknutím a môžete pokračovať."
      footer="Ak ste sa neregistrovali vy, tento e-mail môžete bezpečne ignorovať."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Ďakujeme za registráciu. Kliknite na tlačidlo nižšie a potvrďte svoj
        e-mail, aby sme mohli aktivovať váš účet.
      </Paragraph>

      <ActionButton
        href={confirmationUrl}
        label="Potvrdiť e-mail"
        tone="secondary"
      />

      <LinkCard
        label="Ak tlačidlo nefunguje, otvorte priamy odkaz"
        href={confirmationUrl}
      />

      <MutedText>
        Po potvrdení sa môžete kedykoľvek prihlásiť a dokončiť profil alebo
        pridať svoj prvý inzerát.
      </MutedText>
      <ActionButton href={loginUrl} label="Prejsť na prihlásenie" />
    </EmailLayout>
  );
}

function PasswordResetEmail({
  userName,
  resetUrl,
  supportEmail,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      preview="Obnovte heslo pre účet Autobazar123."
      title="Obnovenie hesla"
      subtitle="Bezpečne si nastavte nové heslo k účtu."
      footer="Bezpečnostné upozornenie Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Prijali sme žiadosť o zmenu hesla. Použite tlačidlo nižšie a nastavte si
        nové heslo.
      </Paragraph>

      <ActionButton
        href={resetUrl}
        label="Nastaviť nové heslo"
        tone="secondary"
      />

      <SummaryCard>
        <Text style={styles.sectionLabel}>Bezpečnostná poznámka</Text>
        <DetailRow
          label="Akciu ste nezačali vy"
          value={
            <>
              Nič sa nemení. Tento e-mail ignorujte alebo nás kontaktujte na{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.link}>
                {supportEmail}
              </Link>
              .
            </>
          }
        />
        <DetailRow
          label="Odporúčanie"
          value="Použite vždy iba najnovší e-mail na obnovu hesla."
        />
      </SummaryCard>

      <LinkCard label="Priamy odkaz na obnovu hesla" href={resetUrl} />
    </EmailLayout>
  );
}

function InvoiceEmail({ userName, invoiceUrl }: InvoiceEmailProps) {
  return (
    <EmailLayout
      preview="Vaša faktúra je pripravená."
      title="Vaša faktúra"
      subtitle="Faktúra je pripravená na otvorenie alebo stiahnutie."
      footer="Ďakujeme, že používate Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Faktúra je pripravená. Otvoríte ju kliknutím na tlačidlo nižšie.
      </Paragraph>

      <ActionButton href={invoiceUrl} label="Otvoriť faktúru" />
      <LinkCard label="Priamy odkaz na faktúru" href={invoiceUrl} />
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
