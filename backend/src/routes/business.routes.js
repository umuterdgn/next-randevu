import { Router } from "express";
import {
  addAppointment,
  addCustomer,
  addService,
  createRewardCode,
  dashboard,
  deleteServiceController,
  listAppointments,
  listCustomers,
  listServices,
  patchAppointmentStatus,
  patchRewardThreshold,
  updateServiceController,
  updateBusinessSettingsController,
  listStaff,
  addStaff,
  updateStaff,
  deleteStaff,
  redeemReward,
  uploadLogo,
  createBusinessFromUser,
} from "../controllers/business.controller.js";
import { generateImageController } from "../controllers/ai.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";
import { validate } from "../middleware/validate.js";
import { upload } from "../middleware/upload.js";
import { Customer } from "../models/Customer.js";
import {
  sendWhatsAppNotification,
  sendCampaignMessage,
} from "../utils/whatsapp.util.js";
import {
  createAppointmentRules,
  createCustomerRules,
  createServiceRules,
  generateRewardRules,
  updateAppointmentStatusRules,
  updateThresholdRules,
} from "../validators/business.validators.js";
import { Business } from "../models/Business.js";
import { Appointment } from "../models/Appointment.js";
import { sendCampaignMessageController } from "../controllers/business.controller.js";
const router = Router();

// Route for creating business from SSO user (before tenant middleware)
router.post(
  "/create-from-user",
  requireAuth,
  asyncHandler(createBusinessFromUser),
);

router.post("/campaign/send", verifyToken, sendCampaignMessageController);
// All other routes require tenant
router.use(
  requireAuth,
  requireRole(
    "admin",
    "staff",
    "business",
    "owner",
    "business_owner",
    "superadmin",
  ),
  requireTenant,
);

router.get("/dashboard", asyncHandler(dashboard));
router.get("/services", asyncHandler(listServices));
router.post(
  "/services",
  validate(createServiceRules),
  asyncHandler(addService),
);
router.put(
  "/services/:id",
  validate(createServiceRules),
  asyncHandler(updateServiceController),
);
router.delete("/services/:id", asyncHandler(deleteServiceController));
router.get("/customers", asyncHandler(listCustomers));
router.post(
  "/customers",
  validate(createCustomerRules),
  asyncHandler(addCustomer),
);
router.get("/appointments", asyncHandler(listAppointments));
router.post(
  "/appointments",
  validate(createAppointmentRules),
  asyncHandler(addAppointment),
);
router.patch(
  "/appointments/:id/status",
  validate(updateAppointmentStatusRules),
  asyncHandler(patchAppointmentStatus),
);
router.patch(
  "/loyalty/threshold",
  validate(updateThresholdRules),
  asyncHandler(patchRewardThreshold),
);
router.post(
  "/loyalty/generate/:customerId",
  validate(generateRewardRules),
  asyncHandler(createRewardCode),
);

// DÜZELTİLDİ: $or tuzağı kaldırıldı
router.post(
  "/loyalty/settings",
  asyncHandler(async (req, res) => {
    const { reward_threshold, loyalty_symbol, business_id } = req.body;
    const idToUse = req.business_id || req.user?.business_id || business_id;

    const business = await Business.findOneAndUpdate(
      { business_id: idToUse },
      {
        reward_threshold: reward_threshold,
        loyalty_symbol: loyalty_symbol,
      },
      { new: true },
    );
    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });
    res.json({
      success: true,
      message: "Sadakat ayarları güncellendi",
      data: business,
    });
  }),
);

// DÜZELTİLDİ: $or tuzağı kaldırıldı
router.post(
  "/campaign/send",
  asyncHandler(async (req, res) => {
    const { campaignText, segment } = req.body;
    const idToUse = req.business_id || req.user?.business_id;

    if (!campaignText)
      return res
        .status(400)
        .json({ success: false, message: "Kampanya metni boş olamaz." });

    const business = await Business.findOne({ business_id: idToUse });
    const customers = await Customer.find({ business_id: idToUse.toString() });

    if (customers.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Gönderilecek müşteri bulunamadı." });

    // Use centralized WhatsApp utility
    const { sendCampaignMessage } = await import("../utils/whatsapp.util.js");
    let successCount = 0;

    console.log(
      `\n🚀 KAMPANYA GÖNDERİMİ BAŞLADI! Toplam Müşteri: ${customers.length}`,
    );

    for (const customer of customers) {
      if (customer.phone) {
        try {
          await sendCampaignMessage(
            customer.phone,
            campaignText,
            business?.name,
            business,
          );
          console.log(`✅ BAŞARILI: ${customer.phone}`);
          successCount++;
        } catch (err) {
          console.error(
            `❌ HATA (${customer.phone}):`,
            err.response?.data || err.message,
          );
        }
      }
    }

    console.log(`🏁 KAMPANYA BİTTİ: ${successCount} kişiye ulaştı.\n`);
    res.json({
      success: true,
      message: `${successCount} müşteriye kampanya başarıyla gönderildi.`,
      totalSent: successCount,
    });
  }),
);

// DÜZELTİLDİ: Settings GET Rotasındaki $or tuzağı kaldırıldı
router.get(
  "/settings",
  asyncHandler(async (req, res) => {
    const idToUse = req.business_id || req.user?.business_id;
    const business = await Business.findOne({ business_id: idToUse });

    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });
    res.json(business);
  }),
);

router.put("/settings", asyncHandler(updateBusinessSettingsController));
router.patch("/logo", upload.single("logo"), asyncHandler(uploadLogo));
router.get("/staff", asyncHandler(listStaff));
router.post("/staff", asyncHandler(addStaff));
router.put("/staff/:id", asyncHandler(updateStaff));
router.delete("/staff/:id", asyncHandler(deleteStaff));
router.post("/redeem-reward", asyncHandler(redeemReward));
router.post("/ai/generate-image", asyncHandler(generateImageController));

/**
 * GET /:businessId/calendar.ics
 * Generate ICS feed for all business appointments
 */
router.get("/:businessId/calendar.ics", async (req, res) => {
  try {
    const { businessId } = req.params;

    // DÜZELTİLDİ: Calendar için sadece business_id araması yapıldı.
    const business = await Business.findOne({ business_id: businessId });
    if (!business) {
      return res.status(404).send("Business not found");
    }

    const appointments = await Appointment.find({
      business_id: businessId.toString(),
    })
      .populate("service_id")
      .sort({ starts_at: 1 });

    const icsEvents = appointments
      .map((appt) => {
        const startDate = new Date(appt.starts_at);
        const endDate = new Date(appt.ends_at);

        // Format dates for ICS: YYYYMMDDTHHMMSSZ
        const formatICSDate = (date) => {
          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        const customerPhone = appt.customer_phone || "";
        const serviceName = appt.service_id?.name || "Randevu";

        return [
          "BEGIN:VEVENT",
          `UID:${appt._id}@tamvaktinde.com.tr`,
          `DTSTART:${formatICSDate(startDate)}`,
          `DTEND:${formatICSDate(endDate)}`,
          `SUMMARY:${serviceName}`,
          `DESCRIPTION:Müşteri: ${customerPhone}\\nDurum: ${appt.status}`,
          `LOCATION:${business.address || business.name || ""}`,
          `STATUS:${appt.status === "cancelled" ? "CANCELLED" : "CONFIRMED"}`,
          "END:VEVENT",
        ].join("\r\n");
      })
      .join("\r\n");

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Nexa//Next Randevu//TR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      `X-WR-CALNAME:${business.name}`,
      `X-WR-TIMEZONE:Europe/Istanbul`,
      "BEGIN:VTIMEZONE",
      "TZID:Europe/Istanbul",
      "BEGIN:DAYLIGHT",
      "TZOFFSETFROM:+0200",
      "TZOFFSETTO:+0300",
      "DTSTART:19700329T020000",
      "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
      "TZNAME:EEST",
      "END:DAYLIGHT",
      "BEGIN:STANDARD",
      "TZOFFSETFROM:+0300",
      "TZOFFSETTO:+0200",
      "DTSTART:19701025T030000",
      "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
      "TZNAME:EET",
      "END:STANDARD",
      "END:VTIMEZONE",
      icsEvents,
      "END:VCALENDAR",
    ].join("\r\n");

    res.set("Content-Type", "text/calendar; charset=utf-8");
    res.set(
      "Content-Disposition",
      `attachment; filename="${business.name}_calendar.ics"`,
    );
    res.send(icsContent);
  } catch (error) {
    console.error("Calendar ICS generation error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
