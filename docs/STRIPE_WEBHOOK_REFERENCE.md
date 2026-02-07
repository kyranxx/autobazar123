# Stripe Webhook Implementation Reference

## Overview
Complete webhook implementation for Stripe payment processing with invoice tracking, email notifications, and idempotency protection.

## Webhook Endpoint
```
POST /api/stripe/webhook
```

**Headers Required**:
- `stripe-signature`: Verified against `STRIPE_WEBHOOK_SECRET`

## Event Types Handled

### 1. `checkout.session.completed`
**When**: Customer completes Stripe checkout

**Processing**:
1. Validates metadata (userId, packId, credits)
2. Checks idempotency (stripe_session_id)
3. Fetches user profile for credits and email
4. Updates credit balance atomically
5. Records transaction with invoice URL
6. Sends confirmation email with invoice link
7. Logs webhook event for audit trail

**Success Response**: `200 { received: true }`

**Database Changes**:
```sql
-- Profile updated
UPDATE profiles SET credit_balance = newBalance
WHERE id = userId;

-- Transaction recorded
INSERT INTO credit_transactions (
  user_id, action_type, amount, stripe_session_id,
  stripe_payment_id, invoice_url, payment_status
) VALUES (...)

-- Email notification logged
INSERT INTO payment_notifications (
  transaction_id, notification_type, user_email
) VALUES (...)

-- Webhook event logged
INSERT INTO stripe_webhook_logs (
  event_id, event_type, status, metadata
) VALUES (...)
```

### 2. `checkout.session.expired`
**When**: Customer abandons checkout (24h timeout)

**Processing**:
1. Marks transaction as `failed`
2. Sets failure reason: "Checkout session expired"
3. Logs event for tracking

### 3. `payment_intent.succeeded`
**When**: Payment confirmed by Stripe (backup event)

**Processing**:
1. Logs event (already handled by checkout.session.completed)

### 4. `payment_intent.payment_failed`
**When**: Payment declined or failed

**Processing**:
1. Fetches transaction for user info
2. Updates status to `failed`
3. Stores failure reason from Stripe
4. Sends failure notification email
5. Logs event for investigation

## Idempotency Implementation

### Multi-Layer Protection

```typescript
// Layer 1: Check existing transaction by session ID
const { data: existingTx } = await supabaseAdmin
  .from("credit_transactions")
  .select("id, payment_status")
  .eq("stripe_session_id", session.id)
  .maybeSingle();

if (existingTx) {
  console.log("Payment already processed, skipping");
  break; // Immediate exit
}

// Layer 2: Database unique constraint
ALTER TABLE credit_transactions
ADD CONSTRAINT unique_stripe_session UNIQUE (stripe_session_id);

// Layer 3: Immediate 200 response
return NextResponse.json({ received: true });
```

### Key Points
- ✅ Returns `200 OK` immediately (tells Stripe to stop retrying)
- ✅ Logs duplicate attempts in `stripe_webhook_logs`
- ✅ Prevents race conditions with row-level locking
- ✅ Uses `stripe_session_id` as primary idempotency key

## Database Schema Changes

### New Columns on `credit_transactions`

```sql
-- Payment status tracking
ALTER TABLE credit_transactions 
ADD COLUMN payment_status TEXT DEFAULT 'pending';
-- Values: 'pending' | 'succeeded' | 'failed'

-- Invoice URL from Stripe
ALTER TABLE credit_transactions 
ADD COLUMN invoice_url TEXT;

-- Failure details
ALTER TABLE credit_transactions 
ADD COLUMN failure_reason TEXT;

-- Stripe session ID (unique, for idempotency)
ALTER TABLE credit_transactions 
ADD COLUMN stripe_session_id TEXT UNIQUE;
```

### New Tables

#### `stripe_webhook_logs`
```sql
CREATE TABLE stripe_webhook_logs (
  id UUID PRIMARY KEY,
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  session_id TEXT,
  user_id UUID REFERENCES profiles(id),
  status TEXT NOT NULL, -- 'processing' | 'processed' | 'failed' | 'skipped'
  error_message TEXT,
  metadata JSONB, -- Full Stripe event
  processed_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_stripe_webhook_logs_event_id`
- `idx_stripe_webhook_logs_session_id`
- `idx_stripe_webhook_logs_processed_at`

#### `payment_notifications`
```sql
CREATE TABLE payment_notifications (
  id UUID PRIMARY KEY,
  transaction_id UUID REFERENCES credit_transactions(id),
  notification_type TEXT NOT NULL, -- 'confirmation' | 'failure' | 'invoice'
  user_email TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes**:
- `idx_payment_notifications_transaction_id`
- `idx_payment_notifications_email_status`
- `idx_payment_notifications_user_email`

## Email Notifications

### Confirmation Email
Sent when `checkout.session.completed` succeeds

**Data Included**:
- ✅ Customer name
- ✅ Credits purchased
- ✅ Payment amount
- ✅ Transaction ID
- ✅ Invoice download link
- ✅ Support contact

**Template**: `HTML` with branded design

### Failure Email
Sent when `payment_intent.payment_failed`

**Data Included**:
- ✅ Failure reason
- ✅ Attempted amount
- ✅ Transaction ID
- ✅ Retry instructions
- ✅ Support contact

### Invoice Email
Sent when invoice URL available

**Data Included**:
- ✅ Direct invoice link (Stripe hosted)
- ✅ Transaction details

## Email Provider Setup

### Implementation Location
```typescript
src/lib/email/send-payment-confirmation.ts
```

### Supported Functions

```typescript
// Send confirmation email with invoice
await sendPaymentConfirmationEmail({
  userEmail: "user@example.com",
  userName: "John Doe",
  credits: 100,
  amount: 35.00,
  currency: "eur",
  invoiceUrl: "https://...",
  transactionId: "uuid"
});

// Send failure notification
await sendPaymentFailureEmail({
  userEmail: "user@example.com",
  userName: "John Doe",
  amount: 35.00,
  currency: "eur",
  failureReason: "Card declined",
  transactionId: "uuid"
});

// Send invoice directly
await sendInvoiceEmail(
  "user@example.com",
  "John Doe",
  "https://invoice-url",
  "uuid"
);
```

### Current Status
- 🟡 **Stub implementation** - logs to database
- 🟢 Ready for provider integration

### To Integrate Email Provider

1. **Choose Provider**:
   - SendGrid (bulk emails, good reputation)
   - Resend (modern, Next.js optimized)
   - Mailgun (flexible, good docs)
   - AWS SES (cheap at scale)

2. **Install Package**:
   ```bash
   npm install resend  # or sendgrid, mailgun, etc.
   ```

3. **Update Functions** in `src/lib/email/send-payment-confirmation.ts`:
   ```typescript
   // Example: Resend
   import { Resend } from "resend";
   
   const resend = new Resend(process.env.RESEND_API_KEY);
   
   const { error } = await resend.emails.send({
     from: "payments@autobazar123.sk",
     to: data.userEmail,
     subject: "Potvrdenie platby",
     html: buildPaymentConfirmationTemplate(data),
   });
   ```

4. **Update `.env.local`**:
   ```
   RESEND_API_KEY=re_xxx...
   # or
   SENDGRID_API_KEY=SG.xxx...
   ```

## Credit Deduction Function

### RPC Function
```sql
SELECT deduct_credits_with_transaction(
  p_user_id := user_id,
  p_credits_needed := 5,
  p_action_type := 'publish',
  p_description := 'Publish ad',
  p_ad_id := ad_id
);
```

### Response - Success
```json
{
  "success": true,
  "new_balance": 45,
  "transaction_id": "550e8400-e29b-41d4-a716-446655440000",
  "credits_deducted": 5
}
```

### Response - Insufficient Funds
```json
{
  "success": false,
  "error": "Insufficient credits",
  "current_balance": 2,
  "credits_needed": 5,
  "shortage": 3
}
```

### Features
- ✅ Row-level locking (prevents race conditions)
- ✅ Atomic operation (credit deduction + transaction in one operation)
- ✅ Blocking (returns error if insufficient)
- ✅ Logged (creates transaction record automatically)

## Monitoring & Debugging

### Query: Recent Payments
```sql
SELECT 
  ct.id,
  ct.user_id,
  p.email,
  ct.amount,
  ct.payment_status,
  ct.invoice_url,
  ct.created_at
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.id
WHERE ct.action_type = 'top_up'
ORDER BY ct.created_at DESC
LIMIT 20;
```

### Query: Failed Payments
```sql
SELECT 
  ct.id,
  ct.user_id,
  p.email,
  ct.payment_status,
  ct.failure_reason,
  ct.created_at
FROM credit_transactions ct
JOIN profiles p ON ct.user_id = p.id
WHERE ct.payment_status = 'failed'
ORDER BY ct.created_at DESC;
```

### Query: Webhook Events
```sql
SELECT 
  event_id,
  event_type,
  status,
  error_message,
  processed_at
FROM stripe_webhook_logs
ORDER BY processed_at DESC
LIMIT 50;
```

### Query: Email Status
```sql
SELECT 
  pn.notification_type,
  pn.email_status,
  pn.user_email,
  pn.error_message,
  pn.sent_at
FROM payment_notifications pn
WHERE pn.email_status IN ('pending', 'failed')
ORDER BY pn.sent_at DESC;
```

## Testing Checklist

### Test Cases

- [ ] **Successful Payment**
  - [ ] User buys credits
  - [ ] Webhook received
  - [ ] Credits added to account
  - [ ] Invoice saved
  - [ ] Confirmation email logged
  - [ ] Transaction recorded with "succeeded" status

- [ ] **Duplicate Payment (Idempotency)**
  - [ ] Simulate duplicate webhook event
  - [ ] Verify credits NOT added twice
  - [ ] Verify 200 OK returned
  - [ ] Check webhook_logs shows "skipped"

- [ ] **Payment Failure**
  - [ ] Trigger failed payment in Stripe test mode
  - [ ] Verify webhook received
  - [ ] Check transaction status = "failed"
  - [ ] Verify failure_reason logged
  - [ ] Confirm failure email logged

- [ ] **Session Expiration**
  - [ ] Let checkout session expire (24h)
  - [ ] Verify transaction marked as "failed"
  - [ ] Check failure_reason = "Checkout session expired"

- [ ] **Credit Deduction Blocking**
  - [ ] User has 2 credits
  - [ ] Try to deduct 5 credits
  - [ ] Verify error response with shortage
  - [ ] Verify balance unchanged

- [ ] **Invoice Download**
  - [ ] Get transaction with invoice_url
  - [ ] Verify URL is valid Stripe hosted invoice
  - [ ] Test download works

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...

# Email Provider (choose one)
RESEND_API_KEY=re_...
# or
SENDGRID_API_KEY=SG.xxx
# or
MAILGUN_API_KEY=mg-xxx

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Error Handling

### Webhook Errors
All errors logged to `stripe_webhook_logs` with:
- Event ID (for reference)
- Event type
- Error message
- Status ("failed", "skipped", "processing")
- Full metadata (for debugging)

### Email Errors
Logged to `payment_notifications` with:
- Transaction reference
- Notification type
- Email address
- Error message
- Retry count (for retry logic)

### Credit Deduction Errors
RPC function returns structured response:
```json
{
  "success": false,
  "error": "Description",
  "current_balance": 2,
  "credits_needed": 5,
  "shortage": 3
}
```

## Production Deployment

### Pre-Deployment Checklist
- [ ] Email provider configured
- [ ] Webhook secret configured in Stripe
- [ ] Endpoint URL verified: `https://yourdomain.com/api/stripe/webhook`
- [ ] Test webhook in Stripe dashboard
- [ ] Database migrations run
- [ ] Environment variables set
- [ ] Logging monitored

### Post-Deployment Monitoring
- [ ] Monitor webhook logs daily
- [ ] Check failed payment alerts
- [ ] Verify email delivery
- [ ] Track payment success rate
- [ ] Monitor credit balance accuracy
