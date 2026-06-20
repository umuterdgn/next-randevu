import { createError } from "../utils/appError.js";
import { Business } from "../models/Business.js";

const normalizeIdeas = (ideas, sector, city) => {
  const fallbackPool = [
    `${city} neighborhood referral week for ${sector} customers`,
    `${sector} seasonal bundle with limited-time discount`,
    `Instagram before-after stories + online booking CTA for ${city}`,
  ];

  const cleaned = (ideas || []).map((x) => String(x).trim()).filter(Boolean);
  const unique = [...new Set(cleaned)];
  const merged = [...unique, ...fallbackPool.filter((x) => !unique.includes(x))];
  return merged.slice(0, 3);
};

export const generateCampaign = async (
  sector,
  city,
  target = "local customers",
  businessId = null
) => {
  const prompt = [
    "Generate exactly 3 concise campaign ideas.",
    `Sector: ${sector}`,
    `City: ${city}`,
    `Target audience: ${target}`,
    "Respond as a JSON array of strings only.",
  ].join("\n");

  if (!process.env.GEMINI_API_KEY) {
    if (businessId) {
      await Business.updateOne({ business_id: businessId }, { $inc: { ai_usage_count: 1 } });
    }
    return {
      input: { sector, city, target },
      ideas: normalizeIdeas([], sector, city),
      source: "fallback",
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );

  if (!response.ok) {
    throw createError("Gemini API request failed", 502);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
  const cleaned = text.replaceAll("```json", "").replaceAll("```", "").trim();

  let ideas = [];
  try {
    ideas = JSON.parse(cleaned);
  } catch {
    ideas = cleaned
      .split("\n")
      .map((line) => line.replace(/^[-*\d.\s]+/, "").trim())
      .filter(Boolean);
  }

  if (businessId) {
    await Business.updateOne({ business_id: businessId }, { $inc: { ai_usage_count: 1 } });
  }

  return {
    input: { sector, city, target },
    ideas: normalizeIdeas(ideas, sector, city),
    source: "gemini",
  };
};

export const generateCampaignIdeas = async ({ sector, city, target }) =>
  generateCampaign(sector, city, target);
