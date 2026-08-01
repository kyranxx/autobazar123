import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { render } from "@react-email/render";
import type { ReactNode } from "react";
import { COMPANY_INFO } from "@/config/company";
import { getMarketConfig } from "@/config/markets";
import { BRAND_THEME } from "@/lib/theme/brand";
import {
  getEmailBrandName,
  getEmailMarketCode,
  getEmailUrl,
} from "@/lib/email/email-market";

const EMAIL_BRAND_NAME = getEmailBrandName();

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

const EMAIL_MASCOT_PATH =
  "/brand/autoninja/mascot-leaning-key-optimized.webp";

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
    padding: "24px 24px 28px",
    color: BRAND_THEME.primaryForeground,
  },
  headerTopRow: {
    marginBottom: "14px",
  },
  logoCell: {
    width: "72%",
  },
  mascotCell: {
    width: "28%",
    textAlign: "right" as const,
  },
  mascotImage: {
    display: "block",
    width: "72px",
    height: "92px",
    margin: "0 0 0 auto",
    objectFit: "contain" as const,
  },
  logoWrap: {
    display: "inline-block",
  },
  brandLabel: {
    margin: "0",
    fontSize: "30px",
    lineHeight: "32px",
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
  categoryWrap: {
    margin: "0 0 16px",
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
    padding: "24px",
  },
  contentPanel: {
    backgroundColor: "#FFFFFF",
    border: "1px solid #E4ECE4",
    borderRadius: "20px",
    padding: "24px",
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
  detailRow: {
    marginBottom: "12px",
  },
  detailRowLabel: {
    margin: "0 0 2px",
    fontSize: "13px",
    lineHeight: "18px",
    fontWeight: "700",
    color: "#183225",
  },
  detailRowValue: {
    margin: "0",
    fontSize: "15px",
    lineHeight: "24px",
    color: "#183225",
  },
  actionWrap: {
    marginTop: "24px",
  },
  buttonPrimary: {
    backgroundColor: BRAND_THEME.accent,
    color: BRAND_THEME.accentForeground,
    borderRadius: "14px",
    padding: "15px 20px",
    textDecoration: "none",
    fontWeight: 700,
    display: "block",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
    width: "100%",
    fontSize: "16px",
    lineHeight: "16px",
  },
  buttonSecondary: {
    backgroundColor: "#EAF5EE",
    color: BRAND_THEME.primary,
    borderRadius: "14px",
    padding: "15px 20px",
    textDecoration: "none",
    fontWeight: 700,
    display: "block",
    textAlign: "center" as const,
    boxSizing: "border-box" as const,
    width: "100%",
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
  fallbackText: {
    margin: "18px 0 0",
    fontSize: "13px",
    lineHeight: "20px",
    color: "#526257",
  },
  securityText: {
    margin: "0",
    fontSize: "13px",
    lineHeight: "20px",
    color: "#526257",
  },
  footer: {
    padding: "0 24px 24px",
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
  const market = getMarketConfig(getEmailMarketCode());
  const brandMeta =
    market.code === "RO"
      ? "Platformă auto pentru România"
      : "Marketplace pre autá na Slovensku";
  const mascotAlt =
    market.code === "RO" ? "Mascota AutoNinja" : "Maskot AutoNinja";

  return (
    <Section style={styles.header}>
      <Row style={styles.headerTopRow}>
        <Column style={styles.logoCell}>
          <Link href={getEmailUrl("/")} style={styles.logoWrap}>
            <Text style={styles.brandLabel}>
              Auto<span style={styles.brandAccent}>{getEmailBrandName().slice(4)}</span>
            </Text>
          </Link>
          <Text style={styles.brandMeta}>{brandMeta}</Text>
        </Column>
        <Column style={styles.mascotCell}>
          <Img
            src={getEmailUrl(EMAIL_MASCOT_PATH)}
            alt={mascotAlt}
            width={72}
            height={92}
            style={styles.mascotImage}
          />
        </Column>
      </Row>
      <Section style={styles.categoryWrap}>
        <Text style={styles.categoryBadge}>{category}</Text>
      </Section>
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
  const market = getMarketConfig(getEmailMarketCode());
  const footerEmail =
    market.code === "SK" ? COMPANY_INFO.supportEmail : market.contact.email;
  const contactLine = [footerEmail, market.contact.phoneDisplay]
    .filter(Boolean)
    .join(" • ");

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
              <Text style={styles.footerBrand}>{getEmailBrandName()}</Text>
              <Text style={styles.footerMeta}>{COMPANY_INFO.legalName}</Text>
              {contactLine ? <Text style={styles.footerMeta}>{contactLine}</Text> : null}
              <Text style={styles.footerText}>{footerNote}</Text>
              <Link href={getEmailUrl("/")} style={styles.footerLink}>
                {market.domain}
              </Link>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function Greeting({ userName }: { userName: string }) {
  const greeting = getEmailMarketCode() === "RO" ? "Bună" : "Ahoj";
  return <Text style={styles.greeting}>{greeting} {userName},</Text>;
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
    <Section style={styles.detailRow}>
      <Text style={styles.detailRowLabel}>{label}</Text>
      <Text style={styles.detailRowValue}>{value}</Text>
    </Section>
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

function FallbackLink({
  label,
  href,
  linkLabel,
}: {
  label: string;
  href: string;
  linkLabel?: string;
}) {
  return (
    <Text style={styles.fallbackText}>
      {label}{" "}
      <Link href={href} style={styles.footerLink}>
        {linkLabel ?? (getEmailMarketCode() === "RO" ? "Deschideți linkul" : "Otvoriť odkaz")}
      </Link>
    </Text>
  );
}

function SupportEmailLink({ email }: { email: string }) {
  return (
    <Link href={`mailto:${email}`} style={styles.link}>
      {email}
    </Link>
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
      footerNote={`Transakčný e-mail ${EMAIL_BRAND_NAME}.`}
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
  const isRomanian = getEmailMarketCode() === "RO";

  return (
    <EmailLayout
      category={isRomanian ? "Cont" : "Účet"}
      preview={
        isRomanian
          ? `Confirmați înregistrarea pe ${EMAIL_BRAND_NAME}.`
          : `Potvrďte registráciu na ${EMAIL_BRAND_NAME}.`
      }
      title={isRomanian ? "Confirmarea înregistrării" : "Potvrdenie registrácie"}
      subtitle={
        isRomanian
          ? "Activați-vă contul dintr-un singur clic."
          : "Účet aktivujete jedným klikom."
      }
      footerNote={
        isRomanian
          ? "Dacă nu v-ați înregistrat, ignorați acest e-mail."
          : "Ak ste sa neregistrovali, e-mail ignorujte."
      }
    >
      <Greeting userName={userName} />
      <Paragraph>
        {isRomanian ? "Confirmați-vă adresa de e-mail." : "Potvrďte svoj e-mail."}
      </Paragraph>

      <ActionButton
        href={confirmationUrl}
        label={isRomanian ? "Confirmați e-mailul" : "Potvrdiť e-mail"}
      />

      <LinkCard
        label={
          isRomanian
            ? "Dacă butonul nu funcționează, deschideți linkul direct"
            : "Ak tlačidlo nefunguje, otvorte priamy odkaz"
        }
        href={confirmationUrl}
      />

      <MutedText>
        {isRomanian ? "Apoi vă puteți autentifica." : "Potom sa môžete prihlásiť."}
      </MutedText>
      <ActionButton
        href={loginUrl}
        label={isRomanian ? "Accesați autentificarea" : "Prejsť na prihlásenie"}
      />
    </EmailLayout>
  );
}

function PasswordResetEmail({
  userName,
  resetUrl,
  supportEmail,
}: PasswordResetEmailProps) {
  const isRomanian = getEmailMarketCode() === "RO";

  return (
    <EmailLayout
      category={isRomanian ? "Securitate" : "Bezpečnosť"}
      preview={
        isRomanian
          ? `Resetați parola pentru contul ${EMAIL_BRAND_NAME}.`
          : `Obnovte heslo pre účet ${EMAIL_BRAND_NAME}.`
      }
      title={isRomanian ? "Resetarea parolei" : "Obnovenie hesla"}
      subtitle={isRomanian ? "Setați o parolă nouă." : "Nastavte nové heslo."}
      footerNote={
        isRomanian
          ? `E-mail de securitate ${EMAIL_BRAND_NAME}.`
          : `Bezpečnostný e-mail ${EMAIL_BRAND_NAME}.`
      }
    >
      <Greeting userName={userName} />
      <Paragraph>
        {isRomanian
          ? "Am primit o solicitare de schimbare a parolei."
          : "Prijali sme žiadosť o zmenu hesla."}
      </Paragraph>

      <ActionButton
        href={resetUrl}
        label={isRomanian ? "Setați o parolă nouă" : "Nastaviť nové heslo"}
      />

      <SummaryCard>
        <Text style={styles.sectionLabel}>
          {isRomanian ? "Securitate" : "Bezpečnosť"}
        </Text>
        <Text style={styles.securityText}>
          {isRomanian
            ? "Dacă nu ați solicitat schimbarea, ignorați acest e-mail. Pentru întrebări, contactați "
            : "Ak ste o zmenu nežiadali, e-mail ignorujte. V prípade otázok kontaktujte "}
          <SupportEmailLink email={supportEmail} />.
        </Text>
      </SummaryCard>

      <FallbackLink
        label={isRomanian ? "Dacă butonul nu funcționează," : "Ak tlačidlo nefunguje,"}
        href={resetUrl}
      />
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
      footerNote={`Ďakujeme, že používate ${EMAIL_BRAND_NAME}.`}
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
            na {EMAIL_BRAND_NAME}.
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
            key={listing.href}
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
