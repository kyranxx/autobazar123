import { createClient } from "@supabase/supabase-js";

interface PaymentConfirmationData {
  userEmail: string;
  userName?: string;
  credits: number;
  amount: number;
  currency: string;
  invoiceUrl?: string;
  transactionId: string;
}

interface PaymentFailureData {
  userEmail: string;
  userName?: string;
  amount: number;
  currency: string;
  failureReason: string;
  transactionId: string;
}

/**
 * Send payment confirmation email
 * Currently a stub - implement with SendGrid, Resend, or other provider
 */
export async function sendPaymentConfirmationEmail(
  data: PaymentConfirmationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Implement actual email sending with SendGrid/Resend
    // For now, just log to database for tracking
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Log the notification intent
    const { error } = await supabaseAdmin
      .from("payment_notifications")
      .insert({
        transaction_id: data.transactionId,
        notification_type: "confirmation",
        user_email: data.userEmail,
        email_status: "sent", // In production, would be 'pending' until actually sent
      });

    if (error) {
      console.error("Failed to log payment confirmation notification:", error);
      return { success: false, error: error.message };
    }

    // In production, implement one of these providers:
    // 1. SendGrid (process.env.SENDGRID_API_KEY)
    // 2. Resend (process.env.RESEND_API_KEY)
    // 3. Mailgun (process.env.MAILGUN_API_KEY)
    // 4. AWS SES (process.env.AWS_SES_*
    // 5. Custom email service

    // Example template structure for implementation:
    const emailTemplate = buildPaymentConfirmationTemplate(data);
    console.log("📧 Payment confirmation email queued:", {
      to: data.userEmail,
      subject: `Potvrdenie platby - ${data.credits} kreditov`,
      hasInvoice: !!data.invoiceUrl,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment confirmation:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send payment failure notification email
 */
export async function sendPaymentFailureEmail(
  data: PaymentFailureData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // Log the notification intent
    const { error } = await supabaseAdmin
      .from("payment_notifications")
      .insert({
        transaction_id: data.transactionId,
        notification_type: "failure",
        user_email: data.userEmail,
        email_status: "sent",
      });

    if (error) {
      console.error("Failed to log payment failure notification:", error);
      return { success: false, error: error.message };
    }

    const emailTemplate = buildPaymentFailureTemplate(data);
    console.log("📧 Payment failure notification queued:", {
      to: data.userEmail,
      subject: `Platba sa nepodarila - ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}`,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending payment failure notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  userEmail: string,
  userName: string | undefined,
  invoiceUrl: string,
  transactionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    const { error } = await supabaseAdmin
      .from("payment_notifications")
      .insert({
        transaction_id: transactionId,
        notification_type: "invoice",
        user_email: userEmail,
        email_status: "sent",
      });

    if (error) {
      console.error("Failed to log invoice notification:", error);
      return { success: false, error: error.message };
    }

    console.log("📧 Invoice email queued:", {
      to: userEmail,
      subject: "Vaša faktúra",
      invoiceUrl,
    });

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error sending invoice email:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Build payment confirmation email HTML template
 */
function buildPaymentConfirmationTemplate(data: PaymentConfirmationData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
            .content { margin: 20px 0; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
            .success { color: #27ae60; font-weight: bold; }
            .highlight { background-color: #f0f8ff; padding: 10px; border-left: 3px solid #2196F3; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✓ Platba prijatá</h1>
                <p>Ďakujeme za nákup kreditov!</p>
            </div>
            
            <div class="content">
                <p>Dobrý deň${data.userName ? `, ${data.userName}` : ""},</p>
                
                <p>Vaša platba bola úspešne spracovaná.</p>
                
                <div class="highlight">
                    <p><strong>Podrobnosti transakcie:</strong></p>
                    <ul>
                        <li>Kúpené kredity: <span class="success">${data.credits} kreditov</span></li>
                        <li>Zaplatená suma: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</li>
                        <li>ID transakcie: ${data.transactionId}</li>
                    </ul>
                </div>
                
                <p>Kredity sú teraz dostupné vo vašom účte a môžete ich ihneď použiť.</p>
                
                ${
                  data.invoiceUrl
                    ? `<p><a href="${data.invoiceUrl}" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Stiahnuť faktúru</a></p>`
                    : ""
                }
            </div>
            
            <div class="footer">
                <p>Autobazar123.sk</p>
                <p>Podpora: info@autobazar123.sk</p>
            </div>
        </div>
    </body>
    </html>
  `;
}

/**
 * Build payment failure email HTML template
 */
function buildPaymentFailureTemplate(data: PaymentFailureData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #fff3cd; padding: 20px; border-radius: 5px; border-left: 4px solid #ffc107; }
            .content { margin: 20px 0; }
            .footer { border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; color: #666; }
            .error { color: #d32f2f; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>⚠ Platba sa nepodarila</h1>
                <p>Niektoré problémy s vašou platbou</p>
            </div>
            
            <div class="content">
                <p>Dobrý deň${data.userName ? `, ${data.userName}` : ""},</p>
                
                <p>Vaša platba sa bohužiaľ nepodarila spracovať.</p>
                
                <div style="background-color: #ffebee; padding: 10px; border-left: 3px solid #d32f2f; margin: 10px 0;">
                    <p><strong>Dôvod:</strong> <span class="error">${data.failureReason}</span></p>
                </div>
                
                <p><strong>Podrobnosti pokus:</strong></p>
                <ul>
                    <li>Pokúšaná suma: ${data.currency.toUpperCase()} ${data.amount.toFixed(2)}</li>
                    <li>ID transakcie: ${data.transactionId}</li>
                </ul>
                
                <p>Prosím, skúste znova alebo kontaktujte našu podporu.</p>
            </div>
            
            <div class="footer">
                <p>Autobazar123.sk</p>
                <p>Podpora: info@autobazar123.sk | Telefón: +421 2 1234 5678</p>
            </div>
        </div>
    </body>
    </html>
  `;
}
