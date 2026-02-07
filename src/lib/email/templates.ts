/**
 * Email templates for transactional emails
 */

const brandColor = '#c49a3e'; // Warm gold from design system

export interface TemplateVariables {
  [key: string]: string | number | boolean | null;
}

/**
 * Payment Confirmation Email
 */
export function paymentConfirmationTemplate(vars: {
  userName: string;
  credits: number;
  amount: number;
  currency: string;
  invoiceUrl: string;
  transactionId: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f7f4; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
        .content { margin-bottom: 30px; }
        .success-badge { background: ${brandColor}; color: white; padding: 12px 20px; border-radius: 8px; display: inline-block; font-weight: 600; }
        .details { background: #f0eeea; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e2dc; }
        .detail-row:last-child { border-bottom: none; }
        .detail-label { color: #4a4a4a; }
        .detail-value { font-weight: 600; color: #1a1a1a; }
        .button { background: ${brandColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { color: #717171; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e2dc; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #1a1a1a;">Platba potvrdená! ✅</h1>
          <p style="margin: 10px 0 0 0; color: #4a4a4a;">Ďakujeme za vašu nákup</p>
        </div>

        <div class="content">
          <p>Ahoj ${vars.userName},</p>
          <p>Vaša platba bola úspešne spracovaná. Vaše kredity sú teraz dostupné na vašom účte.</p>

          <div class="details">
            <div class="detail-row">
              <span class="detail-label">Transakcia č.:</span>
              <span class="detail-value">${vars.transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Kúpené kredity:</span>
              <span class="detail-value">${vars.credits} Kr</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Zaplatená suma:</span>
              <span class="detail-value">${vars.amount.toFixed(2)} ${vars.currency}</span>
            </div>
          </div>

          <p>Kredity sú ihneď dostupné na vašom účte a možete ich používať na:</p>
          <ul style="color: #4a4a4a;">
            <li>Pridanie nových inzerátov</li>
            <li>Topovanie vašich inzerátov</li>
            <li>Zvýraznenie inzerátov</li>
            <li>Predĺženie platnosti inzerátov</li>
          </ul>

          <div style="text-align: center;">
            <a href="${vars.invoiceUrl}" class="button">Zobraziť faktúru</a>
          </div>
        </div>

        <div class="footer">
          <p>Ak máte nejaké otázky, <a href="mailto:support@autobazar123.sk" style="color: ${brandColor}; text-decoration: none;">kontaktujte nás</a></p>
          <p>&copy; 2026 Autobazar123. Všetky práva vyhradené.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Payment Failed Email
 */
export function paymentFailedTemplate(vars: {
  userName: string;
  amount: number;
  currency: string;
  reason: string;
  retryUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fdeaea; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #d14343; }
        .header h1 { color: #d14343; margin: 0; }
        .content { margin-bottom: 30px; }
        .details { background: #f0eeea; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; }
        .button { background: #d14343; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { color: #717171; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e2dc; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Platba zlyhala</h1>
          <p style="margin: 10px 0 0 0; color: #4a4a4a;">Niečo sa pokazilo pri spracovaní vašej platby</p>
        </div>

        <div class="content">
          <p>Ahoj ${vars.userName},</p>
          <p>Vaša platba vo výške <strong>${vars.amount.toFixed(2)} ${vars.currency}</strong> zlyhala.</p>

          <div class="details">
            <div class="detail-row">
              <span style="color: #4a4a4a;">Dôvod:</span>
              <span style="font-weight: 600;">${vars.reason}</span>
            </div>
          </div>

          <p style="color: #4a4a4a;">Prosím skúste znova pomocou nasledujúceho tlačidla alebo kontaktujte nás pre pomoc.</p>

          <div style="text-align: center;">
            <a href="${vars.retryUrl}" class="button">Skúsiť znova</a>
          </div>
        </div>

        <div class="footer">
          <p>Ak máte nejaké otázky, <a href="mailto:support@autobazar123.sk" style="color: ${brandColor}; text-decoration: none;">kontaktujte nás</a></p>
          <p>&copy; 2026 Autobazar123. Všetky práva vyhradené.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Password Reset Email
 */
export function passwordResetTemplate(vars: {
  userName: string;
  resetUrl: string;
  expiresIn: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f7f4; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
        .button { background: ${brandColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin: 20px 0; }
        .warning { background: #fdf6e8; padding: 15px; border-radius: 8px; border-left: 4px solid #c9922a; color: #4a4a4a; margin: 20px 0; }
        .footer { color: #717171; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e2dc; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #1a1a1a;">Resetovanie hesla</h1>
        </div>

        <div class="content" style="margin-bottom: 30px;">
          <p>Ahoj ${vars.userName},</p>
          <p>Obdržali ste túto správu, pretože ste požiadali o resetovanie vášho hesla. Ak ste to neboli vy, môžete túto správu ignorovať.</p>

          <div style="text-align: center;">
            <a href="${vars.resetUrl}" class="button">Resetovať heslo</a>
          </div>

          <div class="warning">
            <strong>Bezpečnostná poznámka:</strong> Tento odkaz vyprší za ${vars.expiresIn}. Ak si chcete heslo resetovať neskôr, budete si musieť požiadať o nový odkaz.
          </div>

          <p>Ak máte problém s kliknutím na tlačidlo, skopírujte a vložte tento odkaz do vášho prehliadača:</p>
          <p style="color: #717171; word-break: break-all; font-size: 12px;">${vars.resetUrl}</p>
        </div>

        <div class="footer">
          <p>Ak máte nejaké otázky, <a href="mailto:support@autobazar123.sk" style="color: ${brandColor}; text-decoration: none;">kontaktujte nás</a></p>
          <p>&copy; 2026 Autobazar123. Všetky práva vyhradené.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Welcome Email
 */
export function welcomeTemplate(vars: {
  userName: string;
  dashboardUrl: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f7f4; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; }
        .features { list-style: none; padding: 0; }
        .features li { padding: 10px 0; padding-left: 30px; position: relative; color: #4a4a4a; }
        .features li:before { content: "✓"; position: absolute; left: 0; color: ${brandColor}; font-weight: 600; }
        .button { background: ${brandColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { color: #717171; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e2dc; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #1a1a1a;">Vitajte v Autobazar123!</h1>
          <p style="margin: 10px 0 0 0; color: #4a4a4a;">Najväčší autobazar na Slovensku</p>
        </div>

        <div class="content" style="margin-bottom: 30px;">
          <p>Ahoj ${vars.userName},</p>
          <p>Vitajte na Autobazar123! Sme radi, že ste sa k nám pripojili.</p>

          <p>Čo teraz?</p>
          <ul class="features">
            <li>Prehľadávajte tisíce kvalitných vozidiel</li>
            <li>Uložte si svoje obľúbené inzeráty</li>
            <li>Kontaktujte predajcov priamo v aplikácii</li>
            <li>Sledujte ceny vozidiel na ktoré vás zaujímajú</li>
          </ul>

          <div style="text-align: center;">
            <a href="${vars.dashboardUrl}" class="button">Prejsť na môj účet</a>
          </div>
        </div>

        <div class="footer">
          <p>Ak máte nejaké otázky, <a href="mailto:support@autobazar123.sk" style="color: ${brandColor}; text-decoration: none;">kontaktujte nás</a></p>
          <p>&copy; 2026 Autobazar123. Všetky práva vyhradené.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Ad Posted Confirmation
 */
export function adPostedTemplate(vars: {
  userName: string;
  adTitle: string;
  adUrl: string;
  expiresAt: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #edf8f3; padding: 30px; text-align: center; border-radius: 12px; margin-bottom: 30px; border-left: 4px solid #2a9d6e; }
        .header h1 { color: #2a9d6e; margin: 0; }
        .details { background: #f0eeea; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e2dc; }
        .button { background: ${brandColor}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 20px; }
        .footer { color: #717171; font-size: 12px; text-align: center; margin-top: 40px; border-top: 1px solid #e5e2dc; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">Váš inzerát bol zverejnený! ✅</h1>
        </div>

        <div class="content" style="margin-bottom: 30px;">
          <p>Ahoj ${vars.userName},</p>
          <p>Váš inzerát <strong>"${vars.adTitle}"</strong> bol úspešne zverejnený a je teraz viditeľný pre kupujúcich.</p>

          <div class="details">
            <div class="detail-row">
              <span style="color: #4a4a4a;">Platnosť do:</span>
              <span style="font-weight: 600;">${vars.expiresAt}</span>
            </div>
          </div>

          <p>Vaš inzerát teraz vídí potenciálni kupujúci. Môžete:</p>
          <ul style="color: #4a4a4a;">
            <li>Zobraziť podrobnosti o vašom inzeráte</li>
            <li>Spravovať fotografie a popis</li>
            <li>Sledovať počet zobrazení a dopyty</li>
            <li>Topovať inzerát, aby bol viditeľnejší</li>
          </ul>

          <div style="text-align: center;">
            <a href="${vars.adUrl}" class="button">Zobraziť môj inzerát</a>
          </div>
        </div>

        <div class="footer">
          <p>Ak máte nejaké otázky, <a href="mailto:support@autobazar123.sk" style="color: ${brandColor}; text-decoration: none;">kontaktujte nás</a></p>
          <p>&copy; 2026 Autobazar123. Všetky práva vyhradené.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
