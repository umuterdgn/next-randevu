import { Router } from "express";
import axios from "axios";
import { generateWhatsAppResponse } from "../services/ai.service.js";
import { Business } from "../models/Business.js";

const router = Router();

/**
 * GET /api/whatsapp/webhook
 * Meta Webhook Verification
 * Meta'nın webhook'u doğrulamak için gönderdiği GET isteğini karşılar
 * Query params: hub.mode, hub.verify_token, hub.challenge
 */
router.get("/webhook", (req, res) => {
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
router.post("/webhook", async (req, res) => {
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

    // WhatsApp Cloud API ile cevap gönder
    const whatsappToken = process.env.WA_TOKEN;
    const phoneNumberId = process.env.WA_PHONE_NUMBER_ID;

    if (!whatsappToken || !phoneNumberId) {
      console.error("ERROR: WA_TOKEN or WA_PHONE_NUMBER_ID not configured");
      return res.status(200).json({ status: "received" });
    }

    // İşletmeyi bul (multi-tenant)
    const business = await Business.findOne({ wa_phone_number_id: phoneNumberId });
    console.log("🏢 İşletme:", business?.name || "Bulunamadı");

    // AI ile cevap oluştur
    console.log("🤖 AI yanıt oluşturuluyor...");
    const replyText = await generateWhatsAppResponse(messageText, phoneNumber, business);
    console.log("🤖 AI Yanıtı:", replyText);

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
    console.error("❌ Webhook işleme hatası:", error.message);
    console.error("Hata detayları:", error.response?.data || error);
    res.status(200).json({ status: "received" }); // Meta'ya 200 dönmek önemli
  }
});

export default router;
