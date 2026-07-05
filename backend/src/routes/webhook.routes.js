import { Router } from "express";
import axios from "axios";
import { generateWhatsAppResponse, clearSession } from "../services/ai.service.js";
import { Business } from "../models/Business.js";

const router = Router();

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook Verification
 * Meta'nın webhook'u doğrulamak için gönderdiği GET isteğini karşılar
 * Query params: hub.mode, hub.verify_token, hub.challenge
 */
router.get("/whatsapp", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  console.log("=== DEBUG: Webhook Verification Request ===");
  console.log("DEBUG: hub.mode:", mode);
  console.log("DEBUG: hub.verify_token:", token);
  console.log("DEBUG: hub.challenge:", challenge);
  console.log("DEBUG: process.env.WA_VERIFY_TOKEN:", process.env.WA_VERIFY_TOKEN);

  // Verify the token from .env - fallback to hardcoded if env not loaded
  const verifyToken = process.env.WA_VERIFY_TOKEN || "nexa_secret_token_2026";

  console.log("DEBUG: Using verifyToken:", verifyToken);
  console.log("DEBUG: Token comparison:", token, "==", verifyToken, "=", token === verifyToken);

  if (mode === "subscribe" && token === verifyToken) {
    console.log("DEBUG: Webhook verified successfully");
    res.status(200).send(challenge);
  } else {
    console.log("DEBUG: Webhook verification failed");
    console.log("DEBUG: Mode check:", mode === "subscribe");
    console.log("DEBUG: Token check:", token === verifyToken);
    res.sendStatus(403);
  }
});

/**
 * POST /api/whatsapp/webhook
 * Meta'dan gelen anlık WhatsApp mesajlarını karşılar
 * Gelen payload'ı konsola loglar
 */
router.post("/whatsapp", async (req, res) => {
  console.log('🟢 WHATSAPP WEBHOOK TETİKLENDİ!');
  console.log('🟢 WHATSAPP MESAJI GELDİ:', JSON.stringify(req.body, null, 2));
  try {
    console.log("DEBUG: Incoming WhatsApp Payload:", JSON.stringify(req.body, null, 2));

    // Payload'dan mesaj bilgilerini çıkar
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("DEBUG: No message found in payload");
      return res.status(200).json({ status: "received" });
    }

    const phoneNumber = message.from;
    const messageText = message.text?.body;

    console.log("📩 Yeni Mesaj:");
    console.log("Telefon:", phoneNumber);
    console.log("Mesaj:", messageText);

    // Dinamik İşletme Tespiti: Meta payload'ından phone_number_id al
    const incomingPhoneId = value?.metadata?.phone_number_id;
    console.log("🔍 Gelen Phone Number ID:", incomingPhoneId);

    if (!incomingPhoneId) {
      console.error("❌ Phone Number ID bulunamadı payload'da");
      return res.status(200).json({ status: "received" });
    }

    // Clear history if user sends cancel/new topic commands
    const cancelKeywords = ['iptal', 'vazgeçtim', 'sil', 'yeni konu', 'başka şey'];
    const shouldClearHistory = cancelKeywords.some(keyword => 
      messageText.toLowerCase().includes(keyword)
    );

    if (shouldClearHistory) {
      clearSession(phoneNumber);
      console.log("🧹 Kullanıcı geçmişi temizlendi");
    }

    // İşletmeyi bul (multi-tenant) - gelen phone_number_id ile
    const business = await Business.findOne({ whatsapp_phone_number_id: incomingPhoneId });
    console.log("🏢 İşletme:", business?.name || "Bulunamadı");

    // Hata Yönetimi: İşletme bulunamazsa sessizce 200 OK dön
    if (!business) {
      console.warn("⚠️ İşletme bulunamadı. phone_number_id:", incomingPhoneId, "- Sessizce geçiliyor");
      return res.status(200).json({ status: "received" });
    }

    // Dinamik Token ve Phone ID kullanımı
    const whatsappToken = business.whatsapp_token;
    const phoneNumberId = business.whatsapp_phone_number_id;

    if (!whatsappToken || !phoneNumberId) {
      console.error("❌ İşletme WhatsApp bilgileri eksik:", business.name);
      return res.status(200).json({ status: "received" });
    }

    // WhatsApp Kill Switch Check
    if (!business.integrations?.whatsappEnabled) {
      console.log("🚫 WhatsApp entegrasyonu kapalı - Kill Switch aktif");
      const replyText = `Merhaba! 🤖 Şu an WhatsApp üzerinden otomatik randevu hizmetimiz geçici olarak kapalıdır. Tüm randevu alma, iptal ve hizmetlerimizi görüntüleme işlemleri için lütfen web sitemizi ziyaret edin: https://nxa.online/booking/${business.slug}`;

      await axios.post(
        `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: phoneNumber,
          text: { body: replyText },
        },
        {
          headers: {
            Authorization: `Bearer ${whatsappToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({ status: "received" });
    }

    // AI ile cevap oluştur
    console.log("🤖 AI yanıt oluşturuluyor...");
    const replyText = await generateWhatsAppResponse(messageText, phoneNumber, business);
    console.log("🤖 AI Yanıtı:", replyText);

    // Guardrail: Check if message should be ignored
    if (replyText === "__IGNORE_MESSAGE__") {
      console.log("⚠️ [Guardrail] Alakasız mesaj algılandı, sessiz geçildi.");
      return res.status(200).json({ status: "received" });
    }

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to: phoneNumber,
        text: { body: replyText },
      },
      {
        headers: {
          Authorization: `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Cevap başarıyla gönderildi:", response.data);

    res.status(200).json({ status: "received" });
  } catch (error) {
    console.error("❌ KRİTİK ÇÖKME DETAYI:", error.response?.data || error.message || error);
    res.status(200).json({ status: "received" }); // Meta'ya 200 dönmek önemli
  }
});

export default router;
