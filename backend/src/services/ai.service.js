import { createError } from "../utils/appError.js";
import { Business } from "../models/Business.js";
import { Appointment } from "../models/Appointment.js";
import Groq from "groq-sdk";

// In-memory session storage for conversation history
const userSessions = new Map();

/**
 * Book appointment with availability check
 * Checks if the slot is available and saves to database if so
 */
async function bookAppointment(phoneNumber, service_type, date, time, businessId) {
  console.log("\n");
  console.log("=".repeat(80));
  console.log("✅ YAPAY ZEKA RANDEVUYU ONAYLADI:");
  console.log("=".repeat(80));
  console.log("📞 Telefon:", phoneNumber);
  console.log("💇 Hizmet Türü:", service_type);
  console.log("📅 Tarih (YYYY-MM-DD):", date);
  console.log("⏰ Saat (HH:MM):", time);
  console.log("🏢 İşletme ID:", businessId);
  console.log("=".repeat(80));
  console.log("\n");

  try {
    // Parse date and time to create starts_at and ends_at
    const [year, month, day] = date.split('-').map(Number);
    const [hour, minute] = time.split(':').map(Number);

    const startsAt = new Date(year, month - 1, day, hour, minute);
    const endsAt = new Date(year, month - 1, day, hour + 1, minute); // Assume 1 hour duration

    // Check for existing appointment at the same time
    const existingAppointment = await Appointment.findOne({
      business_id: businessId,
      starts_at: { $lt: endsAt },
      ends_at: { $gt: startsAt },
      status: { $in: ["pending", "approved", "confirmed"] },
    });

    if (existingAppointment) {
      console.log("❌ SAAT DOLU - Randevu kaydedilemedi");
      return {
        success: false,
        message: "Bu saat dolu. Lütfen müşteriye bunu belirtip farklı bir saat (örneğin 1 saat sonrası veya öncesi) teklif et.",
      };
    }

    // Save the appointment
    const appointment = new Appointment({
      business_id: businessId,
      customer_phone: phoneNumber,
      service_type: service_type,
      starts_at: startsAt,
      ends_at: endsAt,
      status: "confirmed",
    });

    await appointment.save();

    console.log("✅ RANDEVU BAŞARIYLA KAYDEDİLDİ");
    return {
      success: true,
      message: "Randevu başarıyla kaydedildi",
    };
  } catch (error) {
    console.error("❌ Randevu kaydedilirken hata:", error.message);
    return {
      success: false,
      message: "Randevu kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}


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

/**
 * WhatsApp AI Response Generator using Groq (Llama 3)
 * Generates natural Turkish responses for WhatsApp messages
 * Maintains conversation history per phone number
 * Uses dynamic business context for multi-tenant support
 */
export const generateWhatsAppResponse = async (userMessage, phoneNumber, business = null) => {
  if (!process.env.GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY not found in environment variables");
    return "Üzgünüm, şu anda yapay zeka servisi kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Build dynamic system prompt with business context
  let systemPrompt = "Sen Nexa için çalışan, anadili Türkçe olan profesyonel ve kibar bir müşteri temsilcisisin. Asla robotik veya çeviri kokan kelimeler kullanma. Kısa ve net ol. Görevin müşteriden sadece şu 3 bilgiyi almak: 1) Hizmet türü, 2) Tarih/Gün, 3) Saat. Bu bilgileri aynı anda değil, doğal bir sohbet akışında tek tek sor. Bilgiler tamamlandığında ASLA \"Randevuyu ayarladım\" deme. Bunun yerine sadece \"Talebinizi aldım, takvimi kontrol ediyorum...\" de.";

  if (business) {
    // Add business context
    const businessName = business.name || "İşletme";
    const sector = business.sector || "Hizmet";
    const workingHours = business.workingHours || {};

    // Format working hours for the prompt
    const hoursText = Object.entries(workingHours)
      .map(([day, hours]) => {
        if (hours.isClosed) return `${day}: Kapalı`;
        return `${day}: ${hours.open} - ${hours.close}`;
      })
      .join(", ");

    systemPrompt = `Sen ${businessName} isimli ${sector} işletmesinin müşteri temsilcisisin. İşletmenin çalışma saatleri: ${hoursText}. Müşteriye saat önerirken KESİNLİKLE sadece bu saatler içinde teklif sun. Kapalı olunan saatler için randevu verme. Eğer müşteri kapalı saat talep ederse, nazikçe reddet ve işletmenin açık olduğu saatlerden alternatif sun. Bilgiler tamamlandığında ASLA \"Randevuyu ayarladım\" deme. Bunun yerine sadece \"Talebinizi aldım, takvimi kontrol ediyorum...\" de.`;
  }

  // Get or create session history for this phone number
  if (!userSessions.has(phoneNumber)) {
    userSessions.set(phoneNumber, []);
  }
  const history = userSessions.get(phoneNumber);

  // Add user message to history
  history.push({ role: "user", content: userMessage });

  // Limit history to 10 messages (5 user + 5 bot)
  if (history.length > 10) {
    history.splice(0, history.length - 10);
  }

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        ...history,
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
      max_tokens: 200,
      tools: [
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Randevuyu veritabanına kaydet. Müşteriden hizmet türü, tarih ve saat bilgileri tamamlandığında çağrılır.",
            parameters: {
              type: "object",
              properties: {
                phoneNumber: {
                  type: "string",
                  description: "Müşterinin telefon numarası",
                },
                service_type: {
                  type: "string",
                  description: "Randevu için istenen hizmet türü (örn: saç kesimi, manikür, masaj)",
                },
                date: {
                  type: "string",
                  description: "Randevu tarihi YYYY-MM-DD formatında (örn: 2024-07-15)",
                },
                time: {
                  type: "string",
                  description: "Randevu saati HH:MM formatında (örn: 14:00)",
                },
              },
              required: ["phoneNumber", "service_type", "date", "time"],
            },
          },
        },
      ],
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;

    // Check if Groq wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;

      if (functionName === "book_appointment") {
        const args = JSON.parse(toolCall.function.arguments);
        const businessId = business?.business_id || null;
        const result = await bookAppointment(args.phoneNumber, args.service_type, args.date, args.time, businessId);

        // Add tool call to history
        history.push({ role: "assistant", tool_calls: [toolCall] });

        // Add tool response to history with success/failure info
        history.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: result.message,
        });

        // Get final response from Groq after tool call
        const finalResponse = await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemPrompt },
            ...history,
          ],
          model: "llama-3.1-8b-instant",
          temperature: 0.7,
          max_tokens: 200,
        });

        const aiResponse = finalResponse.choices[0]?.message?.content || (result.success ? "Randevunuz başarıyla oluşturuldu." : "Maalesef o saat dolu, başka bir saate ne dersiniz?");

        // Add final response to history
        history.push({ role: "assistant", content: aiResponse });

        // Limit history
        if (history.length > 10) {
          history.splice(0, history.length - 10);
        }

        return aiResponse.trim();
      }
    }

    const aiResponse = message.content || "Mesajınızı aldım, size yardımcı olmaktan mutluluk duyarım.";

    // Add bot response to history
    history.push({ role: "assistant", content: aiResponse });

    // Limit history again after adding bot response
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    return aiResponse.trim();
  } catch (error) {
    console.error("Groq Detaylı Hata:", error.message);
    // Eskiden burada "Üzgünüm bir hata oluştu..." yazıyordu.
    // Şimdi hatanın gerçek sebebini WhatsApp'a göndereceğiz:
    return "Sistem Hatası: " + error.message;
  }
};
