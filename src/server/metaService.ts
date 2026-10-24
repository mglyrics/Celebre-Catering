/**
 * Meta (Messenger & WhatsApp Cloud API) Integration Service
 * 
 * Complies with Meta Platform requirements:
 * 1. Webhook Verification: Handles GET requests with hub.mode, hub.verify_token, and hub.challenge
 * 2. Event Ingestion: Handles POST requests for Messenger and WhatsApp webhook events
 * 3. Transparent Status: Reports honestly whether real Meta Graph API credentials are configured
 * 4. Resilient Architecture: Failures in external transmission NEVER cause booking loss or rollbacks
 */

import { Request, Response } from 'express';
import { Booking } from '../types';
import { CELEBRE_CONFIG } from '../data/defaultMeals';

// Read Meta Configuration from environment
export const META_CONFIG = {
  verifyToken: process.env.META_VERIFY_TOKEN || 'celebre_meta_verify_token_2026',
  pageAccessToken: process.env.META_PAGE_ACCESS_TOKEN || '',
  appSecret: process.env.META_APP_SECRET || '',
  phoneNumberId: process.env.META_PHONE_NUMBER_ID || '',
  apiVersion: 'v21.0',
  officialPageUrl: 'https://m.me/celebre.catering',
  officialWhatsAppNumber: CELEBRE_CONFIG.whatsappNumber,
};

// Check if actual credentials are valid (not empty or default placeholders)
export function isMetaAutomatedConfigured(): boolean {
  return Boolean(
    META_CONFIG.pageAccessToken &&
    META_CONFIG.pageAccessToken.length > 25 &&
    !META_CONFIG.pageAccessToken.includes('YOUR_') &&
    !META_CONFIG.pageAccessToken.includes('MY_')
  );
}

/**
 * Handle Meta Webhook Verification (GET /api/webhooks/meta)
 * Required by Meta App Dashboard during Webhook setup
 */
export function handleMetaWebhookVerification(req: Request, res: Response): void {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log(`[Meta Webhook] Verification request received. Mode: ${mode}, Token: ${token ? '***' : 'missing'}`);

  if (mode && token) {
    if (mode === 'subscribe' && token === META_CONFIG.verifyToken) {
      console.log('[Meta Webhook] Verification successful. Responding with challenge.');
      res.status(200).send(challenge);
      return;
    } else {
      console.warn('[Meta Webhook] Verification failed: Token mismatch or invalid mode.');
      res.status(403).json({ error: 'Verification token mismatch' });
      return;
    }
  }

  res.status(400).json({ error: 'Missing hub.mode or hub.verify_token query parameters' });
}

/**
 * Handle Incoming Meta Webhook Events (POST /api/webhooks/meta)
 * Receives messages, deliveries, and postbacks from Messenger and WhatsApp Cloud API
 */
export function handleMetaWebhookEvent(req: Request, res: Response): void {
  try {
    const body = req.body;

    console.log('[Meta Webhook] Event payload received:', JSON.stringify(body, null, 2));

    // Check if event is from a page subscription (Messenger)
    if (body.object === 'page') {
      body.entry?.forEach((entry: any) => {
        const webhookEvent = entry.messaging?.[0];
        if (webhookEvent) {
          const senderPsid = webhookEvent.sender?.id;
          console.log(`[Meta Messenger] Received event from sender PSID: ${senderPsid}`);
          if (webhookEvent.message) {
            console.log(`[Meta Messenger] Message text: ${webhookEvent.message.text}`);
          }
        }
      });
      // Always acknowledge promptly within 20 seconds to satisfy Meta
      res.status(200).send('EVENT_RECEIVED');
      return;
    }

    // Check if event is from WhatsApp Business Account
    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach((entry: any) => {
        entry.changes?.forEach((change: any) => {
          if (change.field === 'messages') {
            const message = change.value?.messages?.[0];
            if (message) {
              console.log(`[Meta WhatsApp] Received message from: ${message.from}, type: ${message.type}`);
            }
          }
        });
      });
      res.status(200).send('EVENT_RECEIVED');
      return;
    }

    // Unrecognized or generic event
    res.status(200).send('EVENT_RECEIVED');
  } catch (err) {
    console.error('[Meta Webhook] Error handling webhook event:', err);
    // Even if an internal logging error happens, return 200 so Meta does not retry incessantly
    res.status(200).send('EVENT_RECEIVED');
  }
}

/**
 * Return transparent diagnostic status of Meta integration
 */
export function getMetaDiagnosticStatus() {
  const isConfigured = isMetaAutomatedConfigured();
  return {
    automatedTransmissionActive: isConfigured,
    environmentMode: isConfigured ? 'PRODUCTION_AUTOMATED' : 'STANDALONE_FALLBACK_ACTIVE',
    webhookVerificationUrl: '/api/webhooks/meta',
    verifyTokenConfigured: Boolean(META_CONFIG.verifyToken),
    pageAccessTokenConfigured: isConfigured,
    directChannels: {
      whatsappNumber: CELEBRE_CONFIG.whatsappNumber,
      whatsappDirectUrl: `https://wa.me/${CELEBRE_CONFIG.whatsappNumber}`,
      messengerPageUrl: 'https://m.me/celebre.catering',
      facebookPage: CELEBRE_CONFIG.socials.facebook,
      hotline: CELEBRE_CONFIG.hotline,
    },
    transparencyNotice: isConfigured
      ? 'تم تهيئة بيانات اعتماد Meta Graph API بنجاح للإرسال الآلي.'
      : 'الإرسال الآلي المباشر يتطلب إدخال META_PAGE_ACCESS_TOKEN رسمي من Meta Developer Portal. التطبيق يعمل بكفاءة 100% عبر روابط الحجز المباشرة (WhatsApp wa.me و Messenger m.me)، وجميع الحجوزات تُحفظ في قاعدة البيانات بصورة فورية ومستقلة تماماً.',
  };
}

/**
 * Build pre-filled Arabic WhatsApp message for booking
 */
export function buildBookingWhatsAppMessage(booking: Booking): { messageText: string; directUrl: string } {
  const itemsSummary = booking.items
    .map((it) => {
      const drinkLabel =
        it.drinkOption === 'no_juice'
          ? 'بدون عصير (-5ج)'
          : it.drinkOption === 'pepsi'
          ? 'بيبسي (+10ج)'
          : 'عصير بخيرة';
      return `• كود: ${it.mealCode} | العدد: ${it.quantity} وجبة | ${drinkLabel} | الإجمالي: ${it.totalDistributorPrice} ج`;
    })
    .join('\n');

  const rawText =
    `*طلب حجز جديد - CÉLÈBRE CATERING*\n` +
    `-----------------------------------------\n` +
    `*رقم الحجز المعتمد:* ${booking.bookingCode}\n` +
    `*رمز التحقق السري:* ${booking.securityCode}\n` +
    `*اسم العميل:* ${booking.customerName}\n` +
    `*رقم الموبايل:* ${booking.customerPhone}\n` +
    `*المناسبة:* ${booking.eventName}\n` +
    `*تاريخ وموعد التسليم:* ${booking.eventDate} الساعة ${booking.deliveryTime}\n` +
    `*مكان التسليم:* ${booking.deliveryGovernorate} - ${booking.deliveryAddress}\n` +
    `-----------------------------------------\n` +
    `*تفاصيل الوجبات المطلوبة:*\n${itemsSummary}\n` +
    `-----------------------------------------\n` +
    `*إجمالي عدد البوكسات:* ${booking.totalMealsCount} بوكس\n` +
    `*إجمالي القيمة التقديرية:* ${booking.totalDistributorPrice} جنيه مصري\n` +
    `*ملاحظات العميل:* ${booking.notes || 'لا يوجد'}\n` +
    `-----------------------------------------\n` +
    `*متابعة حالة الحجز:* https://celebre-eg.com/track?code=${booking.bookingCode}&verify=${booking.securityCode}\n` +
    `*الخط الساخن:* 01284484868\n` +
    `«كل مناسبة.. أحلى مع سيليبري»`;

  const encoded = encodeURIComponent(rawText);
  const directUrl = `https://wa.me/${CELEBRE_CONFIG.whatsappNumber}?text=${encoded}`;

  return {
    messageText: rawText,
    directUrl,
  };
}

/**
 * Dispatch booking notification via Meta Graph API if credentials exist.
 * CRITICAL SAFETY GUARANTEE:
 * Any failure in network, Meta API token expiration, rate limits, or bad credentials
 * is caught and handled safely. It NEVER throws or interferes with database booking creation.
 */
export async function notifyBookingViaMeta(booking: Booking): Promise<{
  attempted: boolean;
  delivered: boolean;
  channel: 'META_GRAPH_API' | 'DIRECT_LINK_FALLBACK';
  note: string;
}> {
  // Check if credentials exist
  if (!isMetaAutomatedConfigured()) {
    console.log(`[Meta Service] Skipping automated API dispatch for ${booking.bookingCode}: Real credentials not set.`);
    return {
      attempted: false,
      delivered: false,
      channel: 'DIRECT_LINK_FALLBACK',
      note: 'حفظ الحجز مؤكد في قاعدة البيانات. روابط الإرسال المباشرة جاهزة للعميل والإدارة.',
    };
  }

  try {
    console.log(`[Meta Service] Attempting Meta Graph API dispatch for booking ${booking.bookingCode}...`);
    // Attempt call to Meta Graph API
    const response = await fetch(`https://graph.facebook.com/${META_CONFIG.apiVersion}/me/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${META_CONFIG.pageAccessToken}`,
      },
      body: JSON.stringify({
        messaging_type: 'MESSAGE_TAG',
        tag: 'CONFIRMED_EVENT_UPDATE',
        recipient: {
          phone_number: booking.customerWhatsapp || booking.customerPhone,
        },
        message: {
          text: `تم استلام حجزك لدى سيليبري كاترينج برقم: ${booking.bookingCode}. رمز التحقق للمتابعة: ${booking.securityCode}. الإجمالي: ${booking.totalDistributorPrice} ج. للتواصل: 01284484868.`,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn(`[Meta Service] Meta Graph API returned non-OK status ${response.status}:`, errText);
      return {
        attempted: true,
        delivered: false,
        channel: 'DIRECT_LINK_FALLBACK',
        note: `تعذر الإرسال التلقائي عبر Meta API (${response.status})، وتم توفير روابط الإرسال الفورية. الحجز محفوظ بأمان.`,
      };
    }

    const data = await response.json();
    console.log(`[Meta Service] Meta Graph API success:`, data);
    return {
      attempted: true,
      delivered: true,
      channel: 'META_GRAPH_API',
      note: 'تم إرسال الإشعار الآلي بنجاح.',
    };
  } catch (err: any) {
    console.warn(`[Meta Service] Network or API error during Meta dispatch (non-blocking):`, err?.message || err);
    return {
      attempted: true,
      delivered: false,
      channel: 'DIRECT_LINK_FALLBACK',
      note: 'فشل الاتصال الخارجي بـ Meta، والحجز محفوظ بالكامل في قاعدة البيانات.',
    };
  }
}
