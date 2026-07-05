import { generateCampaign } from "../services/ai.service.js";
import { logAudit } from "../services/audit.service.js";
import { Business } from "../models/Business.js";
import Groq from "groq-sdk";

export const generateCampaignController = async (req, res) => {
  const { sector, city, target, segment, duration } = req.body;
  const businessId = req.user?.business_id || null;

  // Check credits BEFORE AI generation
  if (businessId) {
    const business = await Business.findOne({ $or: [{ _id: businessId }, { business_id: businessId }] });
    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı" });
    }
    
    if (business.ai_campaign_credits <= 0) {
      return res.status(402).json({ 
        success: false, 
        message: "Krediniz bitmiştir. Lütfen paket yükseltin.",
        creditsRemaining: 0
      });
    }
  }

  // Generate AI campaign content
  const data = await generateCampaign(sector, city, target, businessId, segment, duration);
  
  // Deduct credit AFTER successful generation
  if (businessId) {
    await Business.updateOne(
      { $or: [{ _id: businessId }, { business_id: businessId }] },
      { $inc: { ai_campaign_credits: -1 } }
    );
    
    // Get updated credit count for response
    const business = await Business.findOne({ $or: [{ _id: businessId }, { business_id: businessId }] });
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

  // Check credits BEFORE image generation
  if (businessId) {
    const business = await Business.findOne({ $or: [{ _id: businessId }, { business_id: businessId }] });
    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı" });
    }

    if (business.ai_campaign_credits <= 0) {
      return res.status(403).json({
        success: false,
        message: "Yetersiz kredi. Lütfen kredi yükleyin.",
        creditsRemaining: 0
      });
    }
  }

  // Determine dimensions based on format
  let width, height;
  switch (format) {
    case "story":
      width = 1080;
      height = 1920;
      break;
    case "banner":
      width = 1920;
      height = 1080;
      break;
    case "post":
    default:
      width = 1080;
      height = 1080;
      break;
  }

  // Enhance prompt using GROQ (Silent Prompt Enhancer with Typography Engineering)
  let enhancedPrompt = prompt;
  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const enhancementResponse = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert designer. Convert the user's Turkish request into an English prompt for a professional image generation model (Flux). IF the user wants text on the image, DO NOT translate the text to English, keep it in its original form and specify it in quotes. For example: featuring the exact text \"YAZA ÖZEL %20 İNDİRİM\" written in bold, clean, highly legible, modern typography. Poster design, professional layout. Return ONLY the English prompt, no explanations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        max_tokens: 200,
      });
      enhancedPrompt = enhancementResponse.choices[0]?.message?.content || prompt;
      console.log("🎨 Prompt enhanced:", enhancedPrompt);
    } catch (error) {
      console.error("Prompt enhancement failed, using original:", error.message);
      enhancedPrompt = prompt;
    }
  }

  // Generate image URL using Pollinations.ai with quality parameters and flux model
  const qualityParams = "high quality, professional photography, cinematic lighting, 8k, highly detailed";
  const finalPrompt = `${enhancedPrompt}, ${qualityParams}`;
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=${width}&height=${height}&nologo=true&model=flux`;

  // Add artificial delay for realistic AI generation feel (5-6 seconds for enhanced processing)
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Deduct credit AFTER successful generation
  if (businessId) {
    await Business.updateOne(
      { $or: [{ _id: businessId }, { business_id: businessId }] },
      { $inc: { ai_campaign_credits: -1, ai_usage_count: 1 } }
    );

    // Get updated credit count for response
    const business = await Business.findOne({ $or: [{ _id: businessId }, { business_id: businessId }] });
    const remainingCredits = Math.max(0, business?.ai_campaign_credits || 0);

    await logAudit({
      business_id: businessId || "saas_root",
      user_id: req.user?._id || null,
      action: "AI_IMAGE_GENERATED",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { prompt, source: imageUrl },
    });

    res.json({
      success: true,
      imageUrl,
      remainingCredits,
    });
  } else {
    res.json({
      success: true,
      imageUrl,
      remainingCredits: null,
    });
  }
};
