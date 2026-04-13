import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactNode } from "react";
import { COMPANY_INFO } from "@/config/company";
import { BRAND_THEME } from "@/lib/theme/brand";
import { toAbsoluteUrl } from "@/lib/site-url";

interface PaymentConfirmationEmailProps {
  userName: string;
  summaryLabel: string;
  summaryValue: string;
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

type ModerationDecision = "approved" | "rejected";

interface ModerationDecisionEmailProps {
  userName: string;
  adTitle: string;
  decision: ModerationDecision;
  dashboardUrl: string;
  reviewNote?: string | null;
  supportEmail: string;
}

interface SavedSearchAlertListing {
  title: string;
  priceEur: number;
  locationCity?: string | null;
  href: string;
}

interface SavedSearchAlertEmailProps {
  userName: string;
  label: string;
  resultsPageUrl: string;
  listings: SavedSearchAlertListing[];
}

interface SavedAdAlertEmailProps {
  userName: string;
  adTitle: string;
  adUrl: string;
  priceDropAmount?: number;
  currentPriceEur?: number;
  statusLabel?: string;
}

const EMAIL_BRAND_HOME_URL = toAbsoluteUrl("/");

const styles = {
  body: {
    backgroundColor: "#EEF3EE",
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
    backgroundColor: "#F8FBF7",
    borderRadius: "24px",
    border: "1px solid #D9E3D9",
    overflow: "hidden",
  },
  header: {
    backgroundColor: BRAND_THEME.primary,
    padding: "28px 32px 32px",
    color: BRAND_THEME.primaryForeground,
  },
  headerTopRow: {
    marginBottom: "18px",
  },
  logoCell: {
    width: "72%",
  },
  categoryCell: {
    width: "28%",
    textAlign: "right" as const,
  },
  logoWrap: {
    display: "inline-block",
  },
  brandLabel: {
    margin: "0",
    fontSize: "26px",
    lineHeight: "28px",
    fontWeight: "800",
    color: "#FFFFFF",
  },
  brandAccent: {
    color: BRAND_THEME.accent,
  },
  brandMeta: {
    margin: "6px 0 0",
    fontSize: "11px",
    lineHeight: "16px",
    color: "#D8F4E3",
  },
  categoryBadge: {
    display: "inline-block",
    padding: "8px 12px",
    borderRadius: "999px",
    backgroundColor: BRAND_THEME.mint,
    color: BRAND_THEME.primary,
    fontSize: "12px",
    lineHeight: "12px",
    fontWeight: "700",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
  },
  title: {
    margin: "0",
    fontSize: "32px",
    lineHeight: "38px",
    fontWeight: "700",
    color: BRAND_THEME.mint,
  },
  subtitle: {
    margin: "10px 0 0",
    fontSize: "14px",
    lineHeight: "22px",
    color: "#E5F7ED",
  },
  content: {
    padding: "32px",
  },
  contentPanel: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E4ECE4",
    borderRadius: "20px",
    padding: "28px",
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
    margin: "12px 0 0",
    fontSize: "13px",
    lineHeight: "20px",
    color: "#526257",
  },
  summaryCard: {
    border: "1px solid #D7E2D8",
    borderRadius: "16px",
    backgroundColor: "#F4FAF6",
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
    backgroundColor: BRAND_THEME.accent,
    color: BRAND_THEME.accentForeground,
    borderRadius: "14px",
    padding: "16px 24px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
    fontSize: "16px",
    lineHeight: "16px",
  },
  buttonSecondary: {
    backgroundColor: "#EAF5EE",
    color: BRAND_THEME.primary,
    borderRadius: "14px",
    padding: "16px 24px",
    textDecoration: "none",
    fontWeight: 700,
    display: "inline-block",
    fontSize: "16px",
    lineHeight: "16px",
    border: `1px solid ${BRAND_THEME.primary}`,
  },
  linkCard: {
    border: "1px solid #E7EEE7",
    borderRadius: "14px",
    backgroundColor: "#FBFCFA",
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
  footerBrand: {
    margin: "0 0 8px",
    fontSize: "13px",
    lineHeight: "20px",
    fontWeight: "700",
    color: "#183225",
  },
  footerMeta: {
    margin: "0 0 6px",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#5E6F63",
  },
  footerText: {
    margin: "0 0 6px",
    fontSize: "12px",
    lineHeight: "18px",
    color: "#5E6F63",
  },
  footerLink: {
    fontSize: "12px",
    lineHeight: "20px",
    color: BRAND_THEME.primary,
    textDecoration: "underline",
  },
  listingItem: {
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: "1px solid #E4ECE4",
  },
  listingTitle: {
    margin: 0,
    fontSize: "15px",
    lineHeight: "24px",
    fontWeight: "700",
    color: "#183225",
  },
  listingMeta: {
    margin: "4px 0 0",
    fontSize: "13px",
    lineHeight: "20px",
    color: "#526257",
  },
} as const;

function BrandHeader({
  category,
  title,
  subtitle,
}: {
  category: string;
  title: string;
  subtitle: string;
}) {
  return (
    <Section style={styles.header}>
      <Row style={styles.headerTopRow}>
        <Column style={styles.logoCell}>
          <Link href={EMAIL_BRAND_HOME_URL} style={styles.logoWrap}>
            <Text style={styles.brandLabel}>
              Autobazar<span style={styles.brandAccent}>123</span>
            </Text>
          </Link>
          <Text style={styles.brandMeta}>Marketplace pre autá na Slovensku</Text>
        </Column>
        <Column style={styles.categoryCell}>
          <Text style={styles.categoryBadge}>{category}</Text>
        </Column>
      </Row>
      <Heading as="h1" style={styles.title}>
        {title}
      </Heading>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Section>
  );
}

function EmailLayout({
  category,
  preview,
  title,
  subtitle,
  footerNote,
  children,
}: {
  category: string;
  preview: string;
  title: string;
  subtitle: string;
  footerNote: string;
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
            <BrandHeader category={category} title={title} subtitle={subtitle} />
            <Section style={styles.content}>
              <Section style={styles.contentPanel}>{children}</Section>
            </Section>
            <Section style={styles.footer}>
              <Hr style={styles.footerDivider} />
              <Text style={styles.footerBrand}>Autobazar123</Text>
              <Text style={styles.footerMeta}>{COMPANY_INFO.legalName}</Text>
              <Text style={styles.footerMeta}>
                {COMPANY_INFO.supportEmail} • {COMPANY_INFO.phoneDisplay}
              </Text>
              <Text style={styles.footerText}>{footerNote}</Text>
              <Link href={EMAIL_BRAND_HOME_URL} style={styles.footerLink}>
                autobazar123.sk
              </Link>
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

function formatCurrency(value: number): string {
  return `${value.toLocaleString("sk-SK")} EUR`;
}

function PaymentConfirmationEmail({
  userName,
  summaryLabel,
  summaryValue,
  amount,
  currency,
  invoiceUrl,
  transactionId,
  dashboardUrl,
}: PaymentConfirmationEmailProps) {
  return (
    <EmailLayout
      category="Platby"
      preview="Platba bola úspešne spracovaná."
      title="Platba potvrdená"
      subtitle="Objednávka je potvrdená."
      footerNote="Transakčný e-mail Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>Platba prebehla úspešne.</Paragraph>

      <SummaryCard>
        <Text style={styles.sectionLabel}>Prehľad platby</Text>
        <DetailRow label="Transakcia" value={transactionId} />
        <DetailRow label={summaryLabel} value={summaryValue} />
        <DetailRow
          label="Suma"
          value={`${currency.toUpperCase()} ${amount.toFixed(2)}`}
        />
      </SummaryCard>

      <ActionButton href={dashboardUrl} label="Otvoriť dashboard" />

      {invoiceUrl ? (
        <>
          <MutedText>Faktúra je dostupná aj samostatne.</MutedText>
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
      category="Platby"
      preview="Platba sa nepodarila, môžete ju zopakovať."
      title="Platba sa nepodarila"
      subtitle="Skúste ju znova."
      footerNote="Ak problém trvá, kontaktujte podporu."
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
      <MutedText>Skontrolujte limit karty alebo potvrdenie 3D Secure.</MutedText>
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
      category="Účet"
      preview="Potvrďte registráciu na Autobazar123."
      title="Potvrdenie registrácie"
      subtitle="Účet aktivujete jedným klikom."
      footerNote="Ak ste sa neregistrovali, e-mail ignorujte."
    >
      <Greeting userName={userName} />
      <Paragraph>Potvrďte svoj e-mail.</Paragraph>

      <ActionButton
        href={confirmationUrl}
        label="Potvrdiť e-mail"
        tone="secondary"
      />

      <LinkCard
        label="Ak tlačidlo nefunguje, otvorte priamy odkaz"
        href={confirmationUrl}
      />

      <MutedText>Potom sa môžete prihlásiť.</MutedText>
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
      category="Bezpečnosť"
      preview="Obnovte heslo pre účet Autobazar123."
      title="Obnovenie hesla"
      subtitle="Nastavte nové heslo."
      footerNote="Bezpečnostný e-mail Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>Prijali sme žiadosť o zmenu hesla.</Paragraph>

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
              Nič sa nemení. E-mail ignorujte alebo kontaktujte{" "}
              <Link href={`mailto:${supportEmail}`} style={styles.link}>
                {supportEmail}
              </Link>
              .
            </>
          }
        />
        <DetailRow
          label="Odporúčanie"
          value="Použite iba najnovší odkaz."
        />
      </SummaryCard>

      <LinkCard label="Priamy odkaz na obnovu hesla" href={resetUrl} />
    </EmailLayout>
  );
}

function InvoiceEmail({ userName, invoiceUrl }: InvoiceEmailProps) {
  return (
    <EmailLayout
      category="Faktúra"
      preview="Vaša faktúra je pripravená."
      title="Vaša faktúra"
      subtitle="Faktúra je pripravená."
      footerNote="Ďakujeme, že používate Autobazar123."
    >
      <Greeting userName={userName} />
      <Paragraph>Faktúru otvoríte kliknutím nižšie.</Paragraph>

      <ActionButton href={invoiceUrl} label="Otvoriť faktúru" />
      <LinkCard label="Priamy odkaz na faktúru" href={invoiceUrl} />
    </EmailLayout>
  );
}

function ModerationDecisionEmail({
  userName,
  adTitle,
  decision,
  dashboardUrl,
  reviewNote,
  supportEmail: _supportEmail,
}: ModerationDecisionEmailProps) {
  const approved = decision === "approved";

  return (
    <EmailLayout
      category="Inzerát"
      preview={
        approved
          ? "Váš inzerát bol schválený."
          : "Váš inzerát potrebuje úpravu pred zverejnením."
      }
      title={approved ? "Inzerát schválený" : "Inzerát potrebuje úpravu"}
      subtitle={
        approved
          ? "Inzerát je už aktívny."
          : "Doplňte údaje a odošlite ho znova."
      }
      footerNote="Otázky k moderácii vyrieši naša podpora."
    >
      <Greeting userName={userName} />
      <Paragraph>
        {approved ? (
          <>
            Váš inzerát <strong>{adTitle}</strong> bol schválený a je už aktívny
            na Autobazar123.
          </>
        ) : (
          <>
            Váš inzerát <strong>{adTitle}</strong> zatiaľ neprešiel kontrolou.
            Po úprave ho môžete znovu odoslať na schválenie.
          </>
        )}
      </Paragraph>

      {reviewNote ? (
        <SummaryCard>
          <Text style={styles.sectionLabel}>Poznámka moderácie</Text>
          <Text style={styles.row}>{reviewNote}</Text>
        </SummaryCard>
      ) : null}

      <ActionButton href={dashboardUrl} label="Otvoriť moje inzeráty" />
      <LinkCard label="Správa inzerátov" href={dashboardUrl} />
    </EmailLayout>
  );
}

function SavedSearchAlertEmail({
  userName,
  label,
  resultsPageUrl,
  listings,
}: SavedSearchAlertEmailProps) {
  return (
    <EmailLayout
      category="Upozornenie"
      preview="Našli sme nové inzeráty pre vaše uložené vyhľadávanie."
      title="Nové ponuky pre vyhľadávanie"
      subtitle={label}
      footerNote="Upozornenie na uložené vyhľadávanie."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Našli sme nové inzeráty pre vyhľadávanie <strong>{label}</strong>.
      </Paragraph>

      <SummaryCard>
        <Text style={styles.sectionLabel}>Nové inzeráty</Text>
        {listings.map((listing, index) => (
          <Section
            key={`${listing.href}-${index}`}
            style={index === 0 ? undefined : styles.listingItem}
          >
            <Text style={styles.listingTitle}>
              <Link href={listing.href} style={styles.link}>
                {listing.title}
              </Link>
            </Text>
            <Text style={styles.listingMeta}>
              {formatCurrency(listing.priceEur)}
              {listing.locationCity ? ` • ${listing.locationCity}` : ""}
            </Text>
          </Section>
        ))}
      </SummaryCard>

      <ActionButton href={resultsPageUrl} label="Otvoriť výsledky" />
      <LinkCard label="Priamy odkaz na výsledky" href={resultsPageUrl} />
    </EmailLayout>
  );
}

function SavedAdAlertEmail({
  userName,
  adTitle,
  adUrl,
  priceDropAmount,
  currentPriceEur,
  statusLabel,
}: SavedAdAlertEmailProps) {
  return (
    <EmailLayout
      category="Upozornenie"
      preview="Na uloženom inzeráte nastala zmena."
      title="Zmena na uloženom inzeráte"
      subtitle="Na sledovanom inzeráte nastala zmena."
      footerNote="Upozornenie na sledovaný inzerát."
    >
      <Greeting userName={userName} />
      <Paragraph>
        Na uloženom inzeráte <strong>{adTitle}</strong> sme zaznamenali zmenu.
      </Paragraph>

      <SummaryCard>
        <Text style={styles.sectionLabel}>Aktualizácia</Text>
        {typeof priceDropAmount === "number" && priceDropAmount > 0 ? (
          <DetailRow label="Pokles ceny" value={formatCurrency(priceDropAmount)} />
        ) : null}
        {typeof currentPriceEur === "number" ? (
          <DetailRow label="Aktuálna cena" value={formatCurrency(currentPriceEur)} />
        ) : null}
        {statusLabel ? <DetailRow label="Stav inzerátu" value={statusLabel} /> : null}
      </SummaryCard>

      <ActionButton href={adUrl} label="Otvoriť inzerát" />
      <LinkCard label="Priamy odkaz na inzerát" href={adUrl} />
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

export async function renderModerationDecisionEmail(
  props: ModerationDecisionEmailProps,
): Promise<string> {
  return render(<ModerationDecisionEmail {...props} />);
}

export async function renderSavedSearchAlertEmail(
  props: SavedSearchAlertEmailProps,
): Promise<string> {
  return render(<SavedSearchAlertEmail {...props} />);
}

export async function renderSavedAdAlertEmail(
  props: SavedAdAlertEmailProps,
): Promise<string> {
  return render(<SavedAdAlertEmail {...props} />);
}
