import { generateCampaign } from "../services/ai.service.js";
import { logAudit } from "../services/audit.service.js";
import { Business } from "../models/Business.js";
import Groq from "groq-sdk";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const generateCampaignController = async (req, res) => {
  const { sector, city, target, segment, duration } = req.body;
  const businessId = req.user?.business_id || null;

  if (businessId) {
    const business = await Business.findOne({ business_id: businessId });
    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });

    if (business.ai_campaign_credits <= 0) {
      return res
        .status(402)
        .json({
          success: false,
          message: "Krediniz bitmiştir. Lütfen paket yükseltin.",
          creditsRemaining: 0,
        });
    }
  }

  const data = await generateCampaign(
    sector,
    city,
    target,
    businessId,
    segment,
    duration,
  );

  if (businessId) {
    await Business.updateOne(
      { business_id: businessId },
      { $inc: { ai_campaign_credits: -1 } },
    );
    const business = await Business.findOne({ business_id: businessId });
    data.creditsRemaining = Math.max(0, business?.ai_campaign_credits || 0);
  }

  await logAudit({
    business_id: businessId || "saas_root",
    user_id: req.user?._id || null,
    action: "AI_CAMPAIGN_GENERATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { sector, city, target, segment, duration, source: data.source },
  });

  res.json(data);
};

export const generateImageController = async (req, res) => {
  const { prompt, format = "post" } = req.body;
  const businessId = req.user?.business_id || null;

  if (businessId) {
    const business = await Business.findOne({ business_id: businessId });
    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });

    if (business.ai_campaign_credits <= 0) {
      return res
        .status(403)
        .json({
          success: false,
          message: "Yetersiz kredi. Lütfen kredi yükleyin.",
          creditsRemaining: 0,
        });
    }
  }

  let size = "1024x1024";
  switch (format) {
    case "story":
      size = "1024x1792";
      break;
    case "banner":
      size = "1792x1024";
      break;
    case "post":
    default:
      size = "1024x1024";
      break;
  }

  let enhancedPrompt = prompt;
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const enhancementResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content:
              'You are an expert designer. Convert the user\'s Turkish request into an English prompt for a professional image generation model (DALL-E 3). IF the user wants text on the image, DO NOT translate the text to English, keep it in its original form and specify it in quotes. For example: featuring the exact text "YAZA ÖZEL %20 İNDİRİM" written in bold, clean, highly legible, modern typography. Return ONLY the English prompt, no explanations.',
          },
          { role: "user", content: prompt },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 200,
      });
      enhancedPrompt =
        enhancementResponse.choices[0]?.message?.content || prompt;
    } catch (error) {
      enhancedPrompt = prompt;
    }
  }

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: size,
      quality: "standard",
    });

    const imageUrl = response.data[0].url;

    if (businessId) {
      await Business.updateOne(
        { business_id: businessId },
        { $inc: { ai_campaign_credits: -1, ai_usage_count: 1 } },
      );

      const business = await Business.findOne({ business_id: businessId });
      const remainingCredits = Math.max(0, business?.ai_campaign_credits || 0);

      await logAudit({
        business_id: businessId || "saas_root",
        user_id: req.user?._id || null,
        action: "AI_IMAGE_GENERATED_DALLE",
        method: req.method,
        path: req.originalUrl,
        status_code: 200,
        ip: req.ip || "",
        user_agent: req.headers["user-agent"] || "",
        meta: { prompt, source: imageUrl },
      });

      res.json({ success: true, imageUrl, remainingCredits });
    } else {
      res.json({ success: true, imageUrl, remainingCredits: null });
    }
  } catch (error) {
    console.error("DALL-E Error:", error);
    res.status(500).json({ success: false, message: "Görsel üretilemedi." });
  }
};