/**
 * Email notification utilities for Autobazar123
 * Uses Resend.com for transactional emails
 */

// Email templates in Slovak
export const EMAIL_TEMPLATES = {
    // New inquiry received
    newInquiry: (data: {
        sellerName: string;
        carTitle: string;
        buyerName: string;
        buyerEmail: string;
        buyerPhone?: string;
        message: string;
        adUrl: string;
    }) => ({
        subject: `Nový dopyt na ${data.carTitle} | Autobazar123`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: bold; }
            .logo span { color: #1a73e8; }
            .content { padding: 30px 0; }
            .card { background: #f9fafb; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Autobazar<span>123</span></div>
            </div>
            <div class="content">
              <h2>Dobrý deň, ${data.sellerName}!</h2>
              <p>Máte nový dopyt na vaše vozidlo:</p>
              
              <div class="card">
                <strong>${data.carTitle}</strong>
              </div>
              
              <h3>Kontaktné údaje záujemcu:</h3>
              <p>
                <strong>Meno:</strong> ${data.buyerName}<br>
                <strong>Email:</strong> ${data.buyerEmail}<br>
                ${data.buyerPhone ? `<strong>Telefón:</strong> ${data.buyerPhone}<br>` : ""}
              </p>
              
              <h3>Správa:</h3>
              <div class="card">
                ${data.message}
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${data.adUrl}" class="button">Zobraziť inzerát</a>
              </p>
            </div>
            <div class="footer">
              <p>Autobazar123 - Prémiová platforma pre predaj áut</p>
              <p><a href="https://autobazar123.sk">autobazar123.sk</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    }),

    // Ad expiring soon (3 days)
    adExpiringSoon: (data: {
        userName: string;
        carTitle: string;
        expiresIn: number;
        adUrl: string;
        prolongUrl: string;
    }) => ({
        subject: `Váš inzerát expiruje o ${data.expiresIn} dni | Autobazar123`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: bold; }
            .logo span { color: #1a73e8; }
            .content { padding: 30px 0; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Autobazar<span>123</span></div>
            </div>
            <div class="content">
              <h2>Dobrý deň, ${data.userName}!</h2>
              
              <div class="warning">
                ⚠️ Váš inzerát <strong>${data.carTitle}</strong> expiruje o <strong>${data.expiresIn} dni</strong>.
              </div>
              
              <p>Po expirácii bude inzerát automaticky stiahnutý z vyhľadávania.</p>
              
              <p>Predĺžte inzerát za <strong>1 kredit</strong> a zostaňte viditeľní pre kupujúcich.</p>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${data.prolongUrl}" class="button">Predĺžiť za 1 kredit</a>
              </p>
              
              <p style="text-align: center; margin-top: 15px;">
                <a href="${data.adUrl}" style="color: #1a73e8;">Zobraziť inzerát</a>
              </p>
            </div>
            <div class="footer">
              <p>Autobazar123 - Prémiová platforma pre predaj áut</p>
            </div>
          </div>
        </body>
      </html>
    `,
    }),

    // Credit balance low
    creditLow: (data: {
        userName: string;
        currentBalance: number;
        buyCreditsUrl: string;
    }) => ({
        subject: `Nízky zostatok kreditov (${data.currentBalance}) | Autobazar123`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: bold; }
            .logo span { color: #1a73e8; }
            .content { padding: 30px 0; }
            .balance { background: #fee2e2; border: 1px solid #ef4444; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .balance-num { font-size: 48px; font-weight: bold; color: #ef4444; }
            .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Autobazar<span>123</span></div>
            </div>
            <div class="content">
              <h2>Dobrý deň, ${data.userName}!</h2>
              
              <p>Váš zostatok kreditov je nízky:</p>
              
              <div class="balance">
                <div class="balance-num">${data.currentBalance}</div>
                <div>kreditov</div>
              </div>
              
              <p>Dobite si kredity, aby ste mohli:</p>
              <ul>
                <li>Zverejňovať nové inzeráty</li>
                <li>Predlžovať existujúce inzeráty</li>
                <li>Topovať a zvýrazňovať ponuky</li>
              </ul>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${data.buyCreditsUrl}" class="button">Kúpiť kredity</a>
              </p>
            </div>
            <div class="footer">
              <p>Autobazar123 - Prémiová platforma pre predaj áut</p>
            </div>
          </div>
        </body>
      </html>
    `,
    }),

    // Price drop alert
    priceDropAlert: (data: {
        userName: string;
        carTitle: string;
        oldPrice: number;
        newPrice: number;
        discount: number;
        adUrl: string;
    }) => ({
        subject: `Cena klesla o ${data.discount}%! ${data.carTitle} | Autobazar123`,
        html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1a1a1a; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; padding: 20px 0; border-bottom: 1px solid #e5e7eb; }
            .logo { font-size: 24px; font-weight: bold; }
            .logo span { color: #1a73e8; }
            .content { padding: 30px 0; }
            .price-drop { background: #dcfce7; border: 1px solid #22c55e; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
            .old-price { font-size: 18px; color: #6b7280; text-decoration: line-through; }
            .new-price { font-size: 36px; font-weight: bold; color: #22c55e; }
            .discount-badge { display: inline-block; background: #22c55e; color: white; padding: 4px 12px; border-radius: 9999px; font-weight: bold; }
            .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; }
            .footer { text-align: center; padding: 20px 0; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Autobazar<span>123</span></div>
            </div>
            <div class="content">
              <h2>Dobrý deň, ${data.userName}!</h2>
              
              <p>Vozidlo, ktoré sledujete, práve zlacnelo!</p>
              
              <h3>${data.carTitle}</h3>
              
              <div class="price-drop">
                <div class="old-price">${data.oldPrice.toLocaleString()} €</div>
                <div class="new-price">${data.newPrice.toLocaleString()} €</div>
                <div style="margin-top: 10px;">
                  <span class="discount-badge">-${data.discount}%</span>
                </div>
              </div>
              
              <p style="text-align: center; margin-top: 30px;">
                <a href="${data.adUrl}" class="button">Zobraziť ponuku</a>
              </p>
            </div>
            <div class="footer">
              <p>Dostávate tento email, pretože máte toto vozidlo v uložených.</p>
              <p>Autobazar123 - Prémiová platforma pre predaj áut</p>
            </div>
          </div>
        </body>
      </html>
    `,
    }),
};

// Send email function (requires Resend API key)
export async function sendEmail(
    to: string,
    template: { subject: string; html: string }
): Promise<{ success: boolean; error?: string }> {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
        console.log("Email skipped (no RESEND_API_KEY):", template.subject);
        return { success: true }; // Silent fail in dev
    }

    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "Autobazar123 <noreply@autobazar123.sk>",
                to,
                subject: template.subject,
                html: template.html,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("Email send failed:", error);
            return { success: false, error };
        }

        return { success: true };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error: String(error) };
    }
}
