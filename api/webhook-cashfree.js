// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SHAREKIT — CASHFREE PAYMENT WEBHOOK
// File: api/webhook-cashfree.js
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const crypto = require('crypto');

const PLAN_MAP = {
  'sharekit-pro-monthly':       { plan: 'pro',       duration_days: 30  },
  'sharekit-pro-yearly':        { plan: 'pro',       duration_days: 365 },
  'sharekit-unlimited-monthly': { plan: 'unlimited', duration_days: 30  },
  'sharekit-unlimited-yearly':  { plan: 'unlimited', duration_days: 365 },
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const signature  = req.headers['x-webhook-signature'];
    const timestamp  = req.headers['x-webhook-timestamp'];
    const rawBody    = JSON.stringify(req.body);
    const secret     = process.env.CASHFREE_WEBHOOK_SECRET;

    if (secret && signature) {
      const expectedSig = crypto
        .createHmac('sha256', secret)
        .update(timestamp + rawBody)
        .digest('base64');
      if (signature !== expectedSig) {
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const event = req.body;

    if (event.type !== 'PAYMENT_SUCCESS_WEBHOOK') {
      return res.status(200).json({ received: true, skipped: true });
    }

    const payment = event.data?.payment;
    const order   = event.data?.order;
    if (!payment || !order) {
      return res.status(200).json({ received: true, skipped: 'no payment data' });
    }

    const customerEmail = payment.customer_details?.customer_email || order.customer_details?.customer_email;
    const formCode      = order.order_tags?.form_code || order.order_id?.split('_')[0] || '';

    if (!customerEmail) {
      return res.status(200).json({ received: true, error: 'no email' });
    }

    const planInfo     = PLAN_MAP[formCode];
    const plan         = planInfo?.plan || 'pro';
    const durationDays = planInfo?.duration_days || 30;
    const planExpiry   = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey  = process.env.SUPABASE_SERVICE_KEY;

    if (!serviceKey) {
      return res.status(500).json({ error: 'Server config error' });
    }

    const userRes  = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(customerEmail)}`, {
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey }
    });
    const userData = await userRes.json();
    const user     = userData.users?.[0];

    if (!user) {
      return res.status(200).json({ received: true, note: 'user not found' });
    }

    await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
      method: 'PUT',
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_metadata: { ...user.user_metadata, plan, plan_expiry: planExpiry } })
    });

    await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}`, {
      method: 'PATCH',
      headers: { 'apikey': serviceKey, 'Authorization': 'Bearer ' + serviceKey, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
      body: JSON.stringify({ plan, plan_expiry: planExpiry, updated_at: new Date().toISOString() })
    });

    return res.status(200).json({ success: true, email: customerEmail, plan, expires: planExpiry });

  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};
