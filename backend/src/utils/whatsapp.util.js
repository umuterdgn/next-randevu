import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

export const sendWhatsAppNotification = async (phone, appointmentId, businessName, date, time, business = null) => {
  try {
    console.log("📞 WHATSAPP BİLDİRİM BAŞLATILIYOR...");
    console.log("Orijinal telefon:", phone);

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    console.log("Temizlenmiş telefon (sadece rakamlar):", cleanPhone);

    if (cleanPhone.startsWith('0')) {
      cleanPhone = '90' + cleanPhone.substring(1);
      console.log("Başında 0 vardı, 90 eklendi:", cleanPhone);
    } else if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) {
      cleanPhone = '90' + cleanPhone;
      console.log("10 haneli numara, 90 eklendi:", cleanPhone);
    }

    // Use business-specific credentials or fallback to env
    const tokenToUse = business?.whatsapp_token || process.env.WA_TOKEN;
    const phoneIdToUse = business?.whatsapp_phone_number_id || process.env.WA_PHONE_NUMBER_ID;

    if (!tokenToUse || !phoneIdToUse) {
      console.error("❌ WhatsApp credentials missing - token or phone ID not found");
      return;
    }

    console.log("Meta'ya gönderilecek telefon:", cleanPhone);
    console.log("WA Token mevcut mu:", tokenToUse ? "Evet" : "Hayır");
    console.log("WA Phone Number ID:", phoneIdToUse);

    const msg = `Merhaba! 📅 ${businessName} işletmesindeki randevunuz ${date} saat ${time} için onaylanmıştır.\n\nDetaylar, iptal ve takvim için tıklayın: https://nxa.online/randevu/${appointmentId}`;

    console.log("Mesaj içeriği:", msg);

    const response = await axios.post(
      `https://graph.facebook.com/v17.0/${phoneIdToUse}/messages`,
      {
        messaging_product: 'whatsapp',
        to: cleanPhone,
        type: 'text',
        text: { body: msg }
      },
      {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      }
    );

    console.log("✅ WEB RANDEVUSU WA MESAJI GİTTİ!");
    console.log("Meta API Response:", response.data);
  } catch (error) {
    console.error("❌ WHATSAPP UTIL DETAYLI HATA:");
    console.error("Hata mesajı:", error.message);
    console.error("Meta API Response:", error.response?.data);
    console.error("Status Code:", error.response?.status);
    console.error("Full Error:", error);
  }
};

export const sendRewardNotification = async (phone, businessName, rewardCode, business = null) => {
  try {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);
    
    // Use business-specific credentials or fallback to env
    const tokenToUse = business?.whatsapp_token || process.env.WA_TOKEN;
    const phoneIdToUse = business?.whatsapp_phone_number_id || process.env.WA_PHONE_NUMBER_ID;

    if (!tokenToUse || !phoneIdToUse) {
      console.error("❌ WhatsApp credentials missing - token or phone ID not found");
      return;
    }

    const msg = `🎉 Tebrikler! ${businessName} işletmesindeki ziyaretlerinizle hedef puana ulaştınız!\n\nBir sonraki hizmetinizde kullanabileceğiniz indirim kodunuz: *${rewardCode}*\n\nBizi tercih ettiğiniz için teşekkür ederiz.`;

    await axios.post(
      `https://graph.facebook.com/v17.0/${phoneIdToUse}/messages`,
      { messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: msg } },
      { headers: { Authorization: `Bearer ${tokenToUse}` } }
    );
    console.log("✅ ÖDÜL KAZANILDI, WHATSAPP MESAJI GİTTİ!");
  } catch (error) {
    console.error("❌ WHATSAPP ÖDÜL BİLDİRİM HATASI:", error.response?.data || error.message);
  }
};

export const sendCampaignMessage = async (phone, campaignText, businessName, business = null) => {
  try {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) cleanPhone = '90' + cleanPhone;

    // Use business-specific credentials or fallback to env
    const tokenToUse = business?.whatsapp_token || process.env.WA_TOKEN;
    const phoneIdToUse = business?.whatsapp_phone_number_id || process.env.WA_PHONE_NUMBER_ID;

    if (!tokenToUse || !phoneIdToUse) {
      console.error("❌ WhatsApp credentials missing - token or phone ID not found");
      return;
    }

    const msg = `📢 *${businessName || 'İşletme'} Özel Kampanya!*\n\n${campaignText}\n\nRandevu almak için sitemizi ziyaret edebilir veya bu mesaja yanıt verebilirsiniz.`;

    await axios.post(
      `https://graph.facebook.com/v17.0/${phoneIdToUse}/messages`,
      { messaging_product: 'whatsapp', to: cleanPhone, type: 'text', text: { body: msg } },
      { headers: { Authorization: `Bearer ${tokenToUse}` } }
    );
    console.log(`✅ Kampanya mesajı gönderildi: ${cleanPhone}`);
  } catch (error) {
    console.error(`❌ Kampanya gönderim hatası (${cleanPhone}):`, error.response?.data || error.message);
  }
};

/**
 * Send WhatsApp template message via Meta Cloud API
 * @param {string} phone - Phone number (will be cleaned to include country code)
 * @param {string} templateName - Template name (must be approved in Meta)
 * @param {Array} parameters - Array of parameter objects for the template
 * @param {Object} business - Business object with whatsapp_token and whatsapp_phone_number_id
 */
export const sendWhatsAppTemplate = async (phone, templateName, parameters = [], business = null) => {
  try {
    console.log('[WhatsApp Template] Sending template message...');
    console.log('[WhatsApp Template] Template name:', templateName);
    console.log('[WhatsApp Template] Parameters:', parameters);

    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);
    else if (!cleanPhone.startsWith('90') && cleanPhone.length === 10) cleanPhone = '90' + cleanPhone;

    console.log('[WhatsApp Template] Cleaned phone:', cleanPhone);

    // Use business-specific credentials or fallback to env
    const tokenToUse = business?.whatsapp_token || process.env.WA_TOKEN;
    const phoneIdToUse = business?.whatsapp_phone_number_id || process.env.WA_PHONE_NUMBER_ID;

    if (!tokenToUse || !phoneIdToUse) {
      console.error('[WhatsApp Template] ❌ WhatsApp credentials missing - token or phone ID not found');
      return;
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: cleanPhone,
      type: 'template',
      template: {
        name: templateName,
        language: { code: 'tr' },
        components: [
          {
            type: 'body',
            parameters: parameters.map(param => ({
              type: 'text',
              text: param
            }))
          }
        ]
      }
    };

    console.log('[WhatsApp Template] Payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneIdToUse}/messages`,
      payload,
      { headers: { Authorization: `Bearer ${tokenToUse}` } }
    );

    console.log('[WhatsApp Template] ✅ Template message sent successfully');
    console.log('[WhatsApp Template] Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp Template] ❌ Error sending template message');
    console.error('[WhatsApp Template] Error:', error.message);
    console.error('[WhatsApp Template] Meta API Response:', error.response?.data);
    throw error;
  }
};
