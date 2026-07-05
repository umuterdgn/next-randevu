import { createError } from "../utils/appError.js";
import { Business } from "../models/Business.js";
import { Appointment } from "../models/Appointment.js";
import { Service } from "../models/Service.js";
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

  // Backend validation: service_type check
  if (!service_type || service_type.trim() === '' || service_type === 'undefined') {
    console.error("❌ HATA: service_type eksik");
    return {
      success: false,
      message: "Randevunuzu oluşturabilmem için lütfen hangi hizmetten (örneğin saç kesimi, bakım vb.) yararlanmak istediğinizi belirtir misiniz?"
    };
  }

  // Backend validation: time check
  if (!time || time.trim() === '') {
    console.error("❌ HATA: time eksik");
    return {
      success: false,
      message: "Lütfen randevu almak istediğiniz saati belirtir misiniz?"
    };
  }

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
        message: "Maalesef seçtiğiniz saat dolu. Başka bir gün veya saat denemek ister misiniz?",
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
      message: `Randevu başarıyla kaydedildi. Müşteriye şu profil linkini mutlaka ilet: https://nxa.online/randevu/${appointment._id}`,
      appointmentId: appointment._id,
    };
  } catch (error) {
    console.error("❌ KRİTİK ÇÖKME DETAYI (bookAppointment):", error.response?.data || error.message || error);
    return {
      success: false,
      message: "Randevu kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.",
    };
  }
}

/**
 * Check appointments for a phone number
 * Returns future appointments for the user
 */
async function checkAppointments(phoneNumber, businessId) {
  console.log("\n");
  console.log("=".repeat(80));
  console.log("🔍 KULLANICI RANDEVULARI SORGULANIYOR:");
  console.log("=".repeat(80));
  console.log("📞 Telefon:", phoneNumber);
  console.log("🏢 İşletme ID:", businessId);
  console.log("=".repeat(80));
  console.log("\n");

  try {
    const now = new Date();
    const appointments = await Appointment.find({
      business_id: businessId,
      customer_phone: phoneNumber,
      starts_at: { $gte: now },
      status: { $in: ["pending", "approved", "confirmed"] }
    }).sort({ starts_at: 1 });

    const formattedAppointments = appointments.map(apt => {
      const date = apt.starts_at.toISOString().split('T')[0];
      const time = apt.starts_at.toTimeString().substring(0, 5);
      return {
        date: date,
        time: time,
        service: apt.service_type || "Randevu"
      };
    });

    console.log("✅ RANDEVULAR BULUNDU:", formattedAppointments);

    // If appointments exist, return message with links
    if (formattedAppointments.length > 0) {
      const appointmentIds = appointments.map(apt => apt._id).join(',');
      return {
        success: true,
        appointments: formattedAppointments,
        message: `Kullanıcının mevcut randevuları var. Onlara şu linki gönder: https://nxa.online/randevu/${appointmentIds}. Başka bir soru sorma, sadece bu linki ilet ve iyi günler dile.`
      };
    }

    return {
      success: true,
      appointments: [],
      message: "Gelecek randevunuz bulunmamaktadır."
    };
  } catch (error) {
    console.error("❌ KRİTİK ÇÖKME DETAYI (checkAppointments):", error.response?.data || error.message || error);
    return {
      success: false,
      appointments: [],
      message: "Randevularınız sorgulanırken bir hata oluştu."
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
  businessId = null,
  segment = "all",
  duration = ""
) => {
  let segmentInstruction = "";
  if (segment === "inactive_1_week") {
    segmentInstruction = " Bu kampanya, son 1 haftadır işletmeye gelmeyen müşterileri geri kazanmak için tasarlanmıştır. 'Sizi özledik', 'Görüşmeyeli 1 hafta oldu', 'Sizi bekliyoruz' gibi geri kazanım temalı mesajlar üret.";
  } else if (segment === "inactive_1_month") {
    segmentInstruction = " Bu kampanya, son 1 aydır işletmeye gelmeyen müşterileri geri kazanmak için tasarlanmıştır. 'Uzun zamandır görüşmeyelim', 'Sizi tekrar görmek isteriz', 'Özel indirim fırsatı' gibi güçlü geri kazanım temalı mesajlar üret.";
  } else if (segment === "loyal") {
    segmentInstruction = " Bu kampanya, sadık ve sık gelen müşterilere teşekkür ve ödüllendirme içindir. 'Sadık müşterimiz olduğunuz için teşekkürler', 'Siz değerlisiniz', 'Özel müşteri avantajı' gibi sadakat temalı mesajlar üret.";
  }

  let durationInstruction = "";
  if (duration) {
    durationInstruction = ` Kampanya süresi: ${duration}. Bu süreye uygun aciliyet (FOMO) hissi yaratan bir kampanya metni yaz.`;
  }

  const systemPrompt = `Sen ödüllü bir Dijital Pazarlama Uzmanı ve Metin Yazarısın (Copywriter). Görevin, verilen işletme bilgilerine göre son derece doğal, akıcı, ikna edici ve YARATICI Türkçe kampanya metinleri oluşturmaktır.

ASLA 'boyanma zamanı', 'satın alın' gibi robotik veya çeviri kokan kelimeler kullanma. Bunun yerine 'Değişim rüzgarı', 'Kendinizi şımartın', 'Işıltınızı yenileyin' gibi sektöre uygun, estetik ve duygusal ifadeler seç.

Girdi Bilgileri:
- Sektör: ${sector}
- Şehir: ${city}
- Hedef Kitle: ${target}
- Kampanya Süresi: ${duration}
- Müşteri Segmenti: ${segment}
${segmentInstruction}${durationInstruction}

KURALLAR:
1. WHATSAPP: Kısa, samimi ve FOMO (Fırsatı Kaçırma Korkusu) yaratacak aciliyet hissine sahip olmalı. Eğer segment "Gelmeyenler/Eski Müşteriler" ise mutlaka "Sizi çok özledik", "Arayı fazla açtık" gibi geri kazanım (retention) cümleleri kullan.
2. INSTAGRAM: Görsel bir platform olduğu için enerjik, bol emojili ve estetik odaklı olmalı. Sonuna sektöre ve ${city} şehrine uygun 5 adet popüler hashtag ekle.
3. FACEBOOK: Daha güven verici, topluluk odaklı ve samimi bir dil kullan.
4. ASLA köşeli parantez (örn: [telefon numarası], [adres]) veya boş yer tutucu kullanma! İletişim için her zaman "Randevu oluşturmak için sitemizdeki linke tıklayabilir veya bize yanıt verebilirsiniz." şeklinde net bir Call to Action (CTA) kullan.

Çıktıyı SADECE geçerli bir JSON formatında ver:
{
  "whatsapp": "...",
  "instagram": "...",
  "facebook": "..."
}`;

  const userPrompt = [
    "Generate multi-platform campaign content.",
    `Sector: ${sector}`,
    `City: ${city}`,
    `Target audience: ${target}`,
    `Segment: ${segment}`,
    `Duration: ${duration || "Not specified"}`,
  ].join("\n");

  if (!process.env.GROQ_API_KEY) {
    if (businessId) {
      await Business.updateOne({ business_id: businessId }, { $inc: { ai_usage_count: 1 } });
    }
    return {
      input: { sector, city, target },
      content: {
        whatsapp: "WhatsApp için kampanya içeriği (demo)",
        instagram: "Instagram için kampanya içeriği #demo #kampanya",
        facebook: "Facebook için kampanya içeriği"
      },
      source: "fallback",
    };
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const response = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      max_tokens: 500,
    });

    const text = response.choices[0]?.message?.content || "{}";
    const cleaned = text.replaceAll("```json", "").replaceAll("```", "").trim();

    let content = {};
    try {
      content = JSON.parse(cleaned);
    } catch {
      // Fallback if JSON parsing fails
      content = {
        whatsapp: "Kampanya içeriği oluşturulamadı.",
        instagram: "Kampanya içeriği oluşturulamadı.",
        facebook: "Kampanya içeriği oluşturulamadı."
      };
    }

    if (businessId) {
      await Business.updateOne({ business_id: businessId }, { $inc: { ai_usage_count: 1 } });
    }

    return {
      input: { sector, city, target },
      content: content,
      source: "groq",
    };
  } catch (error) {
    console.error("Groq API error:", error);
    if (businessId) {
      await Business.updateOne({ business_id: businessId }, { $inc: { ai_usage_count: 1 } });
    }
    return {
      input: { sector, city, target },
      content: {
        whatsapp: "Kampanya içeriği oluşturulamadı.",
        instagram: "Kampanya içeriği oluşturulamadı.",
        facebook: "Kampanya içeriği oluşturulamadı."
      },
      source: "fallback",
    };
  }
};

export const generateCampaignIdeas = async ({ sector, city, target }) =>
  generateCampaign(sector, city, target);

/**
 * WhatsApp AI Response Generator using Groq (Llama 3)
 * Generates natural Turkish responses for WhatsApp messages
 * Maintains conversation history per phone number
 * Uses dynamic business context for multi-tenant support
 */

// Export clearSession function for external use
export const clearSession = (phoneNumber) => {
  userSessions.delete(phoneNumber);
};

export const generateWhatsAppResponse = async (userMessage, phoneNumber, business = null) => {
  if (!process.env.GROQ_API_KEY) {
    console.error("ERROR: GROQ_API_KEY not found in environment variables");
    return "Üzgünüm, şu anda yapay zeka servisi kullanılamıyor. Lütfen daha sonra tekrar deneyin.";
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // Fetch dynamic services for this business
  let availableServices = [];
  if (business) {
    try {
      const services = await Service.find({
        $or: [
          { business_id: business.business_id },
          { businessId: business._id }
        ],
        is_active: true
      }).select('name');
      availableServices = services.map(s => s.name);
    } catch (error) {
      console.error("Error fetching services:", error.message);
    }
  }

  const servicesList = availableServices.length > 0 
    ? availableServices.join(', ') 
    : 'hizmet bilgisi mevcut değil';

  // Build dynamic system prompt with business context
  const bugunStr = new Date().toISOString().split('T')[0];
  let hoursText = '10:00 - 18:00';

  if (business) {
    // Format working hours for the prompt
    const workingHours = business.workingHours || {};
    hoursText = Object.entries(workingHours)
      .map(([day, hours]) => {
        if (hours.isClosed) return `${day}: Kapalı`;
        return `${day}: ${hours.open} - ${hours.close}`;
      })
      .join(", ");
  }

  let systemPrompt = `Sen bu işletmenin akıllı asistanısın. SADECE TÜRKÇE KONUŞ. Başka bir dil veya alfabe (Hintçe, Çince, Vietnamca vb.) ASLA kullanma.
Şu anki kesin tarih: ${bugunStr}.

İŞLETME BİLGİLERİ:
- Mevcut Hizmetler: ${servicesList} (Kullanıcı bu listedeki bir adı veya benzerini söylerse doğrudan kabul et).
- Çalışma Saatleri: ${hoursText}.

KESİN KURALLAR (BUNLARA UYMAZSAN SİSTEM ÇÖKER):
1. ERKEN ÇAĞIRI YASAĞI: Eğer kullanıcı randevu almak istiyorsa ancak HİZMET, TARİH ve SAAT bilgilerinin ÜÇÜNÜ DE net olarak belirtmediyse ASLA 'book_appointment' fonksiyonunu ÇAĞIRMA. Eksik olan bilgiyi (Örn: "Hangi saatte gelmek istersiniz?") düz metin olarak nazikçe sor. Sadece 3 bilgi de tamamsa fonksiyonu çağır.
2. UYDURMA YASAĞI: Kullanıcı saat belirtmediğinde ASLA kafandan 09:00, 12:00 gibi saatler uydurup fonksiyonu çağırma.
3. ZİNCİRLEME: Kullanıcı randevusunu İPTAL ETMEK veya DEĞİŞTİRMEK isterse ve eski saati söylemezse, ÖNCE KESİNLİKLE 'check_appointments' fonksiyonunu çağırıp randevusunu bul. Sonra işlemi yap.
4. KISA CEVAP: book_appointment başarılı olursa "Harika! Randevunuz oluşturuldu." de. update_appointment başarılı olursa "Harika! Randevunuz güncellendi." de. Her iki durumda da SADECE sana tool tarafından verilen o nxa.online profil linkini ilet, asla example.com gibi linkler uydurma.`;

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
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      max_tokens: 200,
      tools: [
        {
          type: "function",
          function: {
            name: "book_appointment",
            description: "Müşterinin randevusunu veritabanına kaydeder. Gerekli randevu bilgilerini girin.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "KESİNLİKLE YYYY-MM-DD formatında olmalı. Örn: 2026-07-01. Asla '1 Temmuz' gibi metin formatı kullanma." },
                time: { type: "string", description: "KESİNLİKLE HH:MM formatında olmalı. Örn: 14:00 veya 15:30. Asla '17' gibi eksik gönderme." },
                service_type: { type: "string", description: "İstenilen hizmet (Örn: saç kesimi). DİKKAT: Kullanıcı mesajında hizmeti AÇIKÇA belirtmediyse ASLA uydurma!" }
              },
              required: ["date", "time", "service_type"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "cancel_appointment",
            description: "Müşterinin randevusunu iptal eder.",
            parameters: {
              type: "object",
              properties: {
                date: { type: "string", description: "KESİNLİKLE YYYY-MM-DD formatında olmalı. Örn: 2026-07-01." },
                time: { type: "string", description: "KESİNLİKLE HH:MM formatında olmalı. Örn: 14:00 veya 15:30. Asla '17' gibi eksik gönderme." }
              },
              required: ["date", "time"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "update_appointment",
            description: "Müşterinin randevusunu yeni tarihe/saate günceller.",
            parameters: {
              type: "object",
              properties: {
                old_date: { type: "string", description: "KESİNLİKLE YYYY-MM-DD formatında olmalı. Örn: 2026-07-01." },
                old_time: { type: "string", description: "KESİNLİKLE HH:MM formatında olmalı. Örn: 14:00 veya 15:30. Asla '17' gibi eksik gönderme." },
                new_date: { type: "string", description: "KESİNLİKLE YYYY-MM-DD formatında olmalı. Örn: 2026-07-01." },
                new_time: { type: "string", description: "KESİNLİKLE HH:MM formatında olmalı. Örn: 14:00 veya 15:30. Asla '17' gibi eksik gönderme." }
              },
              required: ["old_date", "old_time", "new_date", "new_time"]
            }
          }
        },
        {
          type: "function",
          function: {
            name: "check_appointments",
            description: "Kullanıcı mevcut randevularını öğrenmek, sorgulamak veya görmek istediğinde bu fonksiyonu çağır. Parametreye gerek yok, telefon numarasından tanınacak.",
            parameters: {
              type: "object",
              properties: {}
            }
          }
        }
      ],
      tool_choice: "auto",
    });

    const message = response.choices[0]?.message;

    // Check if Groq wants to call a function
    if (message.tool_calls && message.tool_calls.length > 0) {
      const toolCall = message.tool_calls[0];
      const functionName = toolCall.function.name;

      if (functionName === "book_appointment") {
        console.log("🔧 TOOL CALL: book_appointment başlatılıyor");
        const args = JSON.parse(toolCall.function.arguments);
        const businessId = business?.business_id || null;
        const result = await bookAppointment(phoneNumber, args.service_type, args.date, args.time, businessId);
        console.log("✅ TOOL CALL: book_appointment tamamlandı, result:", result);

        // Build messages for second Groq request with correct sequence
        const messages = [
          { role: "system", content: systemPrompt },
          ...history,
          message, // 2. Assistant's tool call request (CRITICAL - this was missing!)
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: result.message
          }
        ];

        console.log("📤 İKİNCİ GROQ İSTEĞİ GÖNDERİLİYOR...");

        // Get final response from Groq after tool call
        const finalResponse = await groq.chat.completions.create({
          messages: messages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 200,
        });

        console.log("✅ İKİNCİ GROQ YANITI ALINDI");

        const aiResponse = finalResponse.choices[0]?.message?.content || (result.success ? "Randevunuz başarıyla oluşturuldu." : "Maalesef o saat dolu, başka bir saate ne dersiniz?");

        // Add appointment tracking link to the final response
        let finalMessage = aiResponse;
        if (result.success && result.appointmentId) {
          finalMessage = aiResponse + `\n\n📅 Randevu detaylarınızı, sadakat puanınızı ve takvim bağlantılarınızı görmek için tıklayın: https://nxa.online/randevu/${result.appointmentId}`;
        }

        // Add final response to history
        history.push({ role: "assistant", content: finalMessage });

        // Clear user history only after successful completion
        if (result.success) {
          userSessions.set(phoneNumber, []);
        }

        return finalMessage.trim();
      }

      if (functionName === "cancel_appointment") {
        console.log("🔧 TOOL CALL: cancel_appointment başlatılıyor");
        const args = JSON.parse(toolCall.function.arguments);
        const businessId = business?.business_id || null;

        // Parse date and time
        const [year, month, day] = args.date.split('-').map(Number);
        const [hour, minute] = args.time.split(':').map(Number);
        const startsAt = new Date(year, month - 1, day, hour, minute);
        const endsAt = new Date(year, month - 1, day, hour + 1, minute);

        // Find and delete appointment
        const deleted = await Appointment.findOneAndDelete({
          business_id: businessId,
          customer_phone: phoneNumber,
          starts_at: startsAt,
          ends_at: endsAt,
        });

        const result = deleted
          ? { success: true, message: "Randevu iptal edildi" }
          : { success: false, message: "Randevu bulunamadı" };

        console.log("✅ TOOL CALL: cancel_appointment tamamlandı, result:", result);

        // Build messages for second Groq request with correct sequence
        const messages = [
          { role: "system", content: systemPrompt },
          ...history,
          message, // 2. Assistant's tool call request (CRITICAL!)
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: result.message
          }
        ];

        console.log("📤 İKİNCİ GROQ İSTEĞİ GÖNDERİLİYOR (cancel)...");

        // Get final response from Groq after tool call
        const finalResponse = await groq.chat.completions.create({
          messages: messages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 200,
        });

        console.log("✅ İKİNCİ GROQ YANITI ALINDI (cancel)");

        const aiResponse = finalResponse.choices[0]?.message?.content || (result.success ? "Randevunuz iptal edildi." : "Randevu bulunamadı.");

        // Add final response to history
        history.push({ role: "assistant", content: aiResponse });

        // Clear user history only after successful completion
        if (result.success) {
          userSessions.set(phoneNumber, []);
        }

        return aiResponse.trim();
      }

      if (functionName === "update_appointment") {
        console.log("🔧 TOOL CALL: update_appointment başlatılıyor");
        const args = JSON.parse(toolCall.function.arguments);
        const businessId = business?.business_id || null;

        // Parse old date/time
        const [oldYear, oldMonth, oldDay] = args.old_date.split('-').map(Number);
        const [oldHour, oldMinute] = args.old_time.split(':').map(Number);
        const oldStartsAt = new Date(oldYear, oldMonth - 1, oldDay, oldHour, oldMinute);
        const oldEndsAt = new Date(oldYear, oldMonth - 1, oldDay, oldHour + 1, oldMinute);

        // Parse new date/time
        const [newYear, newMonth, newDay] = args.new_date.split('-').map(Number);
        const [newHour, newMinute] = args.new_time.split(':').map(Number);
        const newStartsAt = new Date(newYear, newMonth - 1, newDay, newHour, newMinute);
        const newEndsAt = new Date(newYear, newMonth - 1, newDay, newHour + 1, newMinute);

        // Check if new slot is available
        const existingAppointment = await Appointment.findOne({
          business_id: businessId,
          starts_at: { $lt: newEndsAt },
          ends_at: { $gt: newStartsAt },
          status: { $in: ["pending", "approved", "confirmed"] },
        });

        if (existingAppointment) {
          const result = { success: false, message: "Yeni saat dolu, alternatif sun" };
          console.log("✅ TOOL CALL: update_appointment tamamlandı (saat dolu), result:", result);

          // Build messages for second Groq request with correct sequence
          const messages = [
            { role: "system", content: systemPrompt },
            ...history,
            message, // 2. Assistant's tool call request (CRITICAL!)
            {
              role: "tool",
              tool_call_id: toolCall.id,
              name: functionName,
              content: result.message
            }
          ];

          console.log("📤 İKİNCİ GROQ İSTEĞİ GÖNDERİLİYOR (update - saat dolu)...");

          // Get final response from Groq after tool call
          const finalResponse = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 200,
          });

          console.log("✅ İKİNCİ GROQ YANITI ALINDI (update - saat dolu)");

          const aiResponse = finalResponse.choices[0]?.message?.content || "Maalesef yeni saat dolu, başka bir saat deneyin.";

          // Add final response to history
          history.push({ role: "assistant", content: aiResponse });

          // Don't clear history on error - user might want to try another time
          return aiResponse.trim();
        }

        // Update appointment
        const updated = await Appointment.findOneAndUpdate(
          {
            business_id: businessId,
            customer_phone: phoneNumber,
            starts_at: oldStartsAt,
            ends_at: oldEndsAt,
          },
          {
            starts_at: newStartsAt,
            ends_at: newEndsAt,
          }
        );

        const result = updated
          ? {
              success: true,
              message: `Randevunuz başarıyla güncellendi. 📅 Güncel detaylar ve takvim bağlantısı için tıklayın: https://nxa.online/randevu/${updated._id}`
            }
          : {
              success: false,
              message: "Belirtilen tarih ve saatte randevunuz bulunamadı."
            };

        console.log("✅ TOOL CALL: update_appointment tamamlandı, result:", result);

        // Build messages for second Groq request with correct sequence
        const messages = [
          { role: "system", content: systemPrompt },
          ...history,
          message, // 2. Assistant's tool call request (CRITICAL!)
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: result.message
          }
        ];

        console.log("📤 İKİNCİ GROQ İSTEĞİ GÖNDERİLİYOR (update)...");

        // Get final response from Groq after tool call
        const finalResponse = await groq.chat.completions.create({
          messages: messages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 200,
        });

        console.log("✅ İKİNCİ GROQ YANITI ALINDI (update)");

        const aiResponse = finalResponse.choices[0]?.message?.content || (result.success ? "Randevunuz güncellendi." : "Randevu bulunamadı.");

        // Add final response to history
        history.push({ role: "assistant", content: aiResponse });

        // Clear user history only after successful completion
        if (result.success) {
          userSessions.set(phoneNumber, []);
        }

        return aiResponse.trim();
      }

      if (functionName === "check_appointments") {
        console.log("🔧 TOOL CALL: check_appointments başlatılıyor");
        const businessId = business?.business_id || null;
        const result = await checkAppointments(phoneNumber, businessId);
        console.log("✅ TOOL CALL: check_appointments tamamlandı, result:", result);

        // Build messages for second Groq request with correct sequence
        const messages = [
          { role: "system", content: systemPrompt },
          ...history,
          message, // 2. Assistant's tool call request (CRITICAL!)
          {
            role: "tool",
            tool_call_id: toolCall.id,
            name: functionName,
            content: JSON.stringify(result)
          }
        ];

        console.log("📤 İKİNCİ GROQ İSTEĞİ GÖNDERİLİYOR (check_appointments)...");

        // Get final response from Groq after tool call
        const finalResponse = await groq.chat.completions.create({
          messages: messages,
          model: "llama-3.3-70b-versatile",
          temperature: 0.2,
          max_tokens: 200,
        });

        console.log("✅ İKİNCİ GROQ YANITI ALINDI (check_appointments)");

        const aiResponse = finalResponse.choices[0]?.message?.content || result.message;

        // Add final response to history
        history.push({ role: "assistant", content: aiResponse });

        // Don't clear history after checking appointments - user might want to take action
        return aiResponse.trim();
      }
    }

    let aiResponseText = message.content || "Mesajınızı aldım, size yardımcı olmaktan mutluluk duyarım.";
    const toolCalls = message.tool_calls;

    // Eğer AI tool çağırmak yerine metin olarak JSON döndürdüyse yakala:
    if (!toolCalls && aiResponseText.includes('{"date"')) {
      try {
        const jsonMatch = aiResponseText.match(/\{.*\}/s);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('🟢 GİZLİ JSON YAKALANDI, MANUEL ÇALIŞTIRILIYOR:', parsedData);

          // Backend validation: service_type check
          if (!parsedData.service_type || parsedData.service_type.trim() === '') {
            const msg = "Randevunuzu oluşturabilmem için lütfen hangi hizmetten yararlanmak istediğinizi belirtir misiniz?";
            history.push({ role: "assistant", content: msg });
            return msg;
          }

          // Backend validation: time check
          if (!parsedData.time || parsedData.time.trim() === '') {
            const msg = "Lütfen randevu almak istediğiniz saati belirtir misiniz?";
            history.push({ role: "assistant", content: msg });
            return msg;
          }

          // Manuel olarak book_appointment fonksiyonunu çağır
          const businessId = business?.business_id || null;
          const result = await bookAppointment(phoneNumber, parsedData.service_type, parsedData.date, parsedData.time, businessId);

          // Add tool result to history and let Groq paraphrase it
          history.push({ role: "assistant", content: result.message });
          const paraphraseResponse = await groq.chat.completions.create({
            messages: [
              { role: "system", content: systemPrompt },
              ...history,
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.2,
            max_tokens: 200,
          });

          aiResponseText = paraphraseResponse.choices[0]?.message?.content || (result.success ? "Harika! Randevunuz başarıyla planlanmıştır." : result.message);
          
          // Add appointment tracking link if successful
          if (result.success && result.appointmentId) {
            aiResponseText += `\n\n📅 Randevu detaylarınızı, sadakat puanınızı ve takvim bağlantılarınızı görmek için tıklayın: https://nxa.online/randevu/${result.appointmentId}`;
          }
        }
      } catch (e) {
        console.error("JSON Parse Hatası", e);
      }
    }

    // Add bot response to history
    history.push({ role: "assistant", content: aiResponseText });

    // Limit history again after adding bot response
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }

    return aiResponseText.trim();
  } catch (error) {
    console.error("❌ KRİTİK ÇÖKME DETAYI:", error.response?.data || error.message || error);
    // Fallback response for system failures
    return "Şu an sistemimde kısa süreli bir güncelleme yapılıyor. Lütfen birkaç dakika sonra tekrar deneyin.";
  }
};
