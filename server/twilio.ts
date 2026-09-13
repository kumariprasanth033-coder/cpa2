/**
 * CPA Twilio Real SMS & WhatsApp Dispatch Provider
 * Production-ready REST integration for real OTP delivery
 */

function cleanCredential(val: string | undefined | null): string | null {
  if (!val) return null;
  let cleaned = String(val).trim();
  cleaned = cleaned.replace(/^[A-Z0-9_]+\s*=\s*/i, '');
  cleaned = cleaned.replace(/^["']|["']$/g, '').trim();

  if (
    !cleaned ||
    cleaned.includes('REPLACE_WITH_') ||
    cleaned.includes('YOUR_KEY') ||
    cleaned.includes('YOUR_SECRET') ||
    cleaned.includes('YOUR_TWILIO') ||
    cleaned.toLowerCase() === 'dummy' ||
    cleaned.toLowerCase() === 'placeholder' ||
    cleaned.length < 8
  ) {
    return null;
  }
  return cleaned;
}

export interface TwilioServiceConfig {
  accountSid: string | null;
  authToken: string | null;
  phoneNumber: string | null;
  whatsappNumber: string | null;
  isSmsConfigured: boolean;
  isWhatsAppConfigured: boolean;
}

export function getTwilioConfig(): TwilioServiceConfig {
  const accountSid = cleanCredential(process.env.TWILIO_ACCOUNT_SID);
  const authToken = cleanCredential(process.env.TWILIO_AUTH_TOKEN);
  const phoneNumber = cleanCredential(process.env.TWILIO_PHONE_NUMBER);
  const rawWa = cleanCredential(process.env.TWILIO_WHATSAPP_NUMBER);
  const whatsappNumber = rawWa || phoneNumber;

  const isSmsConfigured = Boolean(accountSid && authToken && phoneNumber);
  const isWhatsAppConfigured = Boolean(accountSid && authToken && whatsappNumber);

  return {
    accountSid,
    authToken,
    phoneNumber,
    whatsappNumber,
    isSmsConfigured,
    isWhatsAppConfigured,
  };
}

export interface TwilioSendResult {
  success: boolean;
  messageId?: string;
  status?: string;
  error?: string;
  code?: string;
}

export async function sendTwilioOtpMessage(params: {
  to: string; // E.164 normalized e.g. "+919876543210"
  otp: string; // 6 digits
  channel: 'sms' | 'whatsapp';
}): Promise<TwilioSendResult> {
  const config = getTwilioConfig();

  if (params.channel === 'whatsapp') {
    if (!config.isWhatsAppConfigured) {
      return {
        success: false,
        code: 'REQUIRES_CONFIGURATION',
        error: 'WhatsApp verification requires configuration.',
      };
    }
  } else {
    if (!config.isSmsConfigured) {
      return {
        success: false,
        code: 'REQUIRES_CONFIGURATION',
        error: 'SMS service requires configuration.',
      };
    }
  }

  const accountSid = config.accountSid!;
  const authToken = config.authToken!;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`;
  const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;

  const messageText = `Your CPA verification code is ${params.otp}. It expires in 5 minutes. Do not share this code with anyone.`;

  const bodyParams = new URLSearchParams();

  if (params.channel === 'whatsapp') {
    const fromWa = config.whatsappNumber!.startsWith('whatsapp:')
      ? config.whatsappNumber!
      : `whatsapp:${config.whatsappNumber!}`;
    const toWa = params.to.startsWith('whatsapp:')
      ? params.to
      : `whatsapp:${params.to}`;

    bodyParams.append('From', fromWa);
    bodyParams.append('To', toWa);
    bodyParams.append('Body', messageText);
  } else {
    bodyParams.append('From', config.phoneNumber!);
    bodyParams.append('To', params.to);
    bodyParams.append('Body', messageText);
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: bodyParams.toString(),
    });

    const data = (await res.json().catch(() => null)) as any;

    if (!res.ok || !data || data.error_code) {
      console.error(`[Twilio ${params.channel.toUpperCase()} Dispatch Error]:`, {
        status: res.status,
        code: data?.code,
        message: data?.message,
      });

      return {
        success: false,
        code: data?.code ? String(data.code) : 'TWILIO_FAILED',
        error: 'Unable to send OTP. Please check your phone number and try again.',
      };
    }

    // Twilio accepted the message!
    const deliveryStatus = data.status ? String(data.status).toUpperCase() : 'SENT';
    return {
      success: true,
      messageId: data.sid,
      status: deliveryStatus,
    };
  } catch (netErr: any) {
    console.error(`[Twilio ${params.channel.toUpperCase()} Network Error]:`, netErr.message);
    return {
      success: false,
      code: 'NETWORK_ERROR',
      error: 'Unable to send OTP. Please check your phone number and try again.',
    };
  }
}
