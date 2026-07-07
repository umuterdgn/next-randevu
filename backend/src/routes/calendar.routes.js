import express from "express";
import { createEvents } from "ics";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { getGoogleAuthUrl } from "../utils/google.util.js";

const router = express.Router();

router.get("/auth", async (req, res) => {
  try {
    const { businessId } = req.query;
    if (!businessId)
      return res
        .status(400)
        .json({ success: false, message: "businessId required" });

    const authUrl = getGoogleAuthUrl(businessId);
    if (authUrl.includes("#error")) {
      return res
        .status(500)
        .send(
          "Google Client ID eksik. Lütfen .env dosyasında GOOGLE_CLIENT_ID değerini kontrol edin.",
        );
    }
    res.redirect(authUrl);
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/callback", async (req, res) => {
  try {
    const { code, state: businessId } = req.query;
    if (!code || !businessId)
      return res.status(400).send("Geçersiz istek: Kod veya İşletme ID eksik.");

    const { google } = await import("googleapis");
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    const { tokens } = await oauth2Client.getToken(code);

    // DÜZELTİLDİ: $or tuzağı temizlendi
    const business = await Business.findOneAndUpdate(
      { business_id: businessId },
      { google_calendar_tokens: tokens },
      { new: true },
    );

    if (!business) return res.status(404).send("İşletme bulunamadı.");

    res.send(`
      <html>
        <body style="font-family: system-ui, -apple-system, sans-serif; text-align: center; padding-top: 100px; background-color: #f8fafc;">
          <div style="background: white; max-width: 400px; margin: 0 auto; padding: 40px 20px; border-radius: 16px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #16a34a; margin-bottom: 10px;">✅ Başarıyla Bağlandı!</h2>
            <p style="color: #475569; line-height: 1.5;">Nexa Studio Google Takvim entegrasyonu tamamlandı.</p>
            <p style="color: #94a3b8; font-size: 14px;">Bu sekmeyi kapatıp panele geri dönebilirsiniz.</p>
          </div>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send("Google Takvim bağlanırken bir sunucu hatası oluştu.");
  }
});

router.get("/:businessId/feed.ics", async (req, res) => {
  try {
    const { businessId } = req.params;

    // DÜZELTİLDİ: $or tuzağı temizlendi
    const business = await Business.findOne({ business_id: businessId });
    if (!business) return res.status(404).send("Business not found");

    const appointments = await Appointment.find({
      business_id: businessId,
      status: { $in: ["approved", "pending", "completed"] },
    }).populate("service_id");

    const events = appointments.map((apt) => {
      const startDate = new Date(apt.date);
      const endDate = new Date(
        startDate.getTime() + (apt.service_id?.duration || 30) * 60000,
      );

      return {
        start: [
          startDate.getFullYear(),
          startDate.getMonth() + 1,
          startDate.getDate(),
          startDate.getHours(),
          startDate.getMinutes(),
        ],
        duration: { minutes: apt.service_id?.duration || 30 },
        title: `${business.name} - ${apt.service_id?.name || "Randevu"}`,
        description: `Müşteri: ${apt.customer_name}\nTelefon: ${apt.customer_phone}\nNot: ${apt.notes || ""}`,
        location: business.address || "",
        status: apt.status === "completed" ? "CONFIRMED" : "TENTATIVE",
        organizer: {
          name: business.name,
          email: business.email || "noreply@tamvaktinde.com.tr",
        },
      };
    });

    const { error, value } = createEvents(events);
    if (error) return res.status(500).send("Error creating calendar feed");

    res.set("Content-Type", "text/calendar");
    res.set(
      "Content-Disposition",
      `attachment; filename="${business.name.replace(/\s+/g, "_")}_feed.ics"`,
    );
    res.send(value);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

router.get("/appointment/:id/download.ics", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id).populate("service_id");
    if (!appointment) return res.status(404).send("Appointment not found");

    // DÜZELTİLDİ: $or tuzağı temizlendi
    const business = await Business.findOne({
      business_id: appointment.business_id,
    });
    if (!business) return res.status(404).send("Business not found");

    const service = appointment.service_id;
    const startDate = new Date(appointment.date);
    const endDate = new Date(
      startDate.getTime() + (service?.duration || 30) * 60000,
    );

    const event = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes(),
      ],
      duration: { minutes: service?.duration || 30 },
      title: `${business.name} - ${service?.name || "Randevu"}`,
      description: `Müşteri: ${appointment.customer_name}\nTelefon: ${appointment.customer_phone}\nNot: ${appointment.notes || ""}`,
      location: business.address || "",
      status: appointment.status === "completed" ? "CONFIRMED" : "TENTATIVE",
      organizer: {
        name: business.name,
        email: business.email || "noreply@tamvaktinde.com.tr",
      },
    };

    const { error, value } = createEvents([event]);
    if (error) return res.status(500).send("Error creating calendar file");

    res.set("Content-Type", "text/calendar");
    res.set("Content-Disposition", `attachment; filename="randevu_${id}.ics"`);
    res.send(value);
  } catch (error) {
    res.status(500).send("Server error");
  }
});

export default router;
