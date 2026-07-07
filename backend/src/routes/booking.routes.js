import dotenv from "dotenv";
import { Router } from "express";
import { Service } from "../models/Service.js";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { RewardCode } from "../models/RewardCode.js";
import { getAvailableSlots } from "../services/availability.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  sendWhatsAppNotification,
  sendRewardNotification,
  sendWhatsAppTemplate,
} from "../utils/whatsapp.util.js";
import { createGoogleEvent } from "../utils/google.util.js";

dotenv.config();

console.log("TOKEN KONTROL:", !!process.env.WA_TOKEN);

const router = Router();

/**
 * GET /services/:slug
 * İlgili işletmenin aktif hizmetlerini listeler (slug ile)
 */
router.get(
  "/services/:slug",
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const business = await Business.findOne({ slug });

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });
    }

    // DÜZELTME: Sadece business_id (String) kullanıldı.
    const services = await Service.find({
      business_id: business.business_id,
      is_active: true,
    }).select(
      "name duration price currency description critical_points process_steps",
    );

    res.json({ success: true, data: services });
  }),
);

/**
 * GET /business/:slug
 * İşletme bilgilerini döndür (slug ile)
 */
router.get(
  "/business/:slug",
  asyncHandler(async (req, res) => {
    const business = await Business.findOne({ slug: req.params.slug });
    if (!business) return res.status(404).json({ error: "İşletme bulunamadı" });

    // DÜZELTME: $or tuzağı temizlendi, sadece business_id araması yapılıyor.
    const services = await Service.find({ business_id: business.business_id });

    res.json({ business, services });
  }),
);

/**
 * GET /availability
 * Müsait saat dilimlerini döndürür
 */
router.get(
  "/availability",
  asyncHandler(async (req, res) => {
    const { slug, date, serviceDuration } = req.query;

    if (!slug || !date || !serviceDuration) {
      return res
        .status(400)
        .json({ success: false, message: "Parametreler eksik" });
    }

    const business = await Business.findOne({ slug });
    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });

    const duration = parseInt(serviceDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "serviceDuration geçerli olmalı" });
    }

    const availableSlots = await getAvailableSlots(
      business._id,
      date,
      duration,
    );

    res.json({
      success: true,
      data: { slug, date, serviceDuration: duration, availableSlots },
    });
  }),
);

/**
 * POST /book
 * Yeni bir randevu oluşturur
 */
router.post(
  "/book",
  asyncHandler(async (req, res) => {
    const { slug, serviceId, starts_at, ends_at, customer, is_online } =
      req.body;

    if (!slug || !serviceId || !starts_at || !ends_at || !customer) {
      return res
        .status(400)
        .json({ success: false, message: "Eksik parametre" });
    }

    const business = await Business.findOne({ slug });
    if (!business)
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı" });

    if (
      !customer.firstName ||
      !customer.lastName ||
      !customer.phone ||
      !customer.email
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Müşteri bilgileri eksik" });
    }

    const startDate = new Date(starts_at);
    const endDate = new Date(ends_at);

    if (
      isNaN(startDate.getTime()) ||
      isNaN(endDate.getTime()) ||
      startDate < new Date()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Geçersiz veya geçmiş tarih" });
    }

    const maxAllowed = business?.bookingSettings?.maxConcurrent || 1;
    const activeAppointmentsCount = await Appointment.countDocuments({
      business_id: business.business_id, // DÜZELTME
      starts_at: { $lt: endDate },
      ends_at: { $gt: startDate },
      status: { $ne: "cancelled" },
    });

    if (activeAppointmentsCount >= maxAllowed) {
      return res
        .status(400)
        .json({ success: false, message: "Seçilen saat doludur" });
    }

    let existingCustomer = await Customer.findOne({
      business_id: business.business_id, // DÜZELTME
      email: customer.email,
      phone: customer.phone,
    });

    if (!existingCustomer) {
      existingCustomer = await Customer.create({
        business_id: business.business_id, // DÜZELTME
        name: `${customer.firstName} ${customer.lastName}`,
        phone: customer.phone,
        email: customer.email,
      });
    }

    let appointment;
    try {
      const appointmentStatus =
        business.auto_approve_appointments !== false ? "approved" : "pending";

      appointment = await Appointment.create({
        business_id: business.business_id, // DÜZELTME
        customer_id: existingCustomer._id,
        customer_phone: customer.phone,
        service_id: serviceId,
        starts_at: startDate,
        ends_at: endDate,
        status: appointmentStatus,
      });
    } catch (error) {
      console.error("Appointment creation error:", error);
      return res.status(400).json({ success: false, message: error.message });
    }

    try {
      const dateStr = startDate.toISOString().split("T")[0];
      const timeStr = startDate.toTimeString().substring(0, 5);

      if (appointment.status === "approved") {
        const approvedMsg = `Merhaba ${customer.firstName} ${customer.lastName}, ${business.name} işletmesinden ${dateStr} - ${timeStr} için randevunuz başarıyla oluşturulmuş ve onaylanmıştır. Bizi tercih ettiğiniz için teşekkür ederiz.\n\nDetaylar, iptal ve takvim için tıklayın: https://tamvaktinde.com.tr/randevu/${appointment._id}`;
        await sendWhatsAppNotification(
          customer.phone,
          appointment._id.toString(),
          business.name || "İşletme",
          dateStr,
          timeStr,
          business,
          approvedMsg,
        );
      } else {
        const pendingMsg = `Merhaba ${customer.firstName} ${customer.lastName}, ${business.name} işletmesinden ${dateStr} - ${timeStr} için randevu talebiniz alınmıştır. İşletme onayladığında size tekrar bilgi verilecektir.\n\nDetaylar, iptal ve takvim için tıklayın: https://tamvaktinde.com.tr/randevu/${appointment._id}`;
        await sendWhatsAppNotification(
          customer.phone,
          appointment._id.toString(),
          business.name || "İşletme",
          dateStr,
          timeStr,
          business,
          pendingMsg,
        );
      }
    } catch (err) {
      console.error("WhatsApp bildirim hatası:", err);
    }

    try {
      if (is_online && business.google_calendar_tokens) {
        const service = await Service.findById(serviceId);
        const googleResponse = await createGoogleEvent(
          business.google_calendar_tokens,
          {
            serviceName: service?.name || "Randevu",
            phone: customer.phone,
            starts_at: startDate.toISOString(),
            ends_at: endDate.toISOString(),
          },
        );

        if (googleResponse?.data?.hangoutLink) {
          appointment.meet_url = googleResponse.data.hangoutLink;
          await appointment.save();
        }
      }
    } catch (err) {}

    try {
      if (
        business.integrations?.whatsappEnabled &&
        business.whatsapp_token &&
        business.whatsapp_phone_number_id &&
        business.phone
      ) {
        const service = await Service.findById(serviceId);
        const dateStr = startDate.toLocaleDateString("tr-TR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
        const timeStr = startDate.toLocaleTimeString("tr-TR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        const parameters = [
          `${customer.firstName} ${customer.lastName}`,
          service?.name || "Randevu",
          `${dateStr} - ${timeStr}`,
        ];
        if (appointment.meet_url) parameters.push(appointment.meet_url);

        await sendWhatsAppTemplate(
          business.phone,
          "yeni_randevu_bildirimi",
          parameters,
          business,
        );
      }
    } catch (err) {}

    return res
      .status(201)
      .json({ success: true, message: "Randevu alındı", data: appointment });
  }),
);

/**
 * GET /track/:appointmentId
 */
router.get(
  "/track/:appointmentId",
  asyncHandler(async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const appointment = await Appointment.findById(appointmentId);

      if (!appointment)
        return res
          .status(404)
          .json({ success: false, message: "Randevu bulunamadı" });

      // DÜZELTME: Sadece business_id araması
      const business = await Business.findOne({
        business_id: appointment.business_id,
      });

      let service = null;
      if (appointment.service_id) {
        service = await Service.findById(appointment.service_id);
      }

      let customer = null;
      if (appointment.customer_id) {
        customer = await Customer.findById(appointment.customer_id);
      }

      res.json({
        success: true,
        data: {
          appointment: {
            id: appointment._id,
            starts_at: appointment.starts_at,
            ends_at: appointment.ends_at,
            status: appointment.status,
            business_id: appointment.business_id,
            meet_url: appointment.meet_url || "",
          },
          service: service
            ? {
                id: service._id,
                name: service.name,
                duration: service.duration_minutes || service.duration,
                price: service.price,
              }
            : null,
          business: {
            name: business?.name || "İşletme",
            phone: business?.phone || "",
            slug: business?.slug || "",
            theme_color: business?.theme_color || "",
            reward_threshold: business?.reward_threshold || 10,
            bookingSettings: business?.bookingSettings || {
              cancellationBuffer: 120,
            },
            address: business?.address || "",
            map_url: business?.map_url || "",
            about_text: business?.about_text || "",
            logo_url: business?.logo_url || "",
            is_loyalty_enabled: business?.is_loyalty_enabled !== false,
          },
          customer: customer
            ? {
                _id: customer._id,
                name: customer.name,
                phone: customer.phone,
                loyalty_points: customer.loyalty_points || 0,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Track appointment error:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }),
);

router.patch(
  "/track/:appointmentId/cancel",
  asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "cancelled" },
      { new: true },
    );
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Randevu bulunamadı" });
    res.json({
      success: true,
      message: "Randevu iptal edildi",
      data: appointment,
    });
  }),
);

router.patch(
  "/track/:appointmentId/update",
  asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { starts_at, ends_at } = req.body;

    if (!starts_at || !ends_at)
      return res.status(400).json({ success: false, message: "Tarih gerekli" });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res
        .status(404)
        .json({ success: false, message: "Randevu bulunamadı" });

    const existing = await Appointment.findOne({
      business_id: appointment.business_id,
      _id: { $ne: appointmentId },
      starts_at: { $lt: new Date(ends_at) },
      ends_at: { $gt: new Date(starts_at) },
      status: { $in: ["pending", "approved", "confirmed"] },
    });

    if (existing)
      return res.status(400).json({ success: false, message: "Saat doludur." });

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      { starts_at: new Date(starts_at), ends_at: new Date(ends_at) },
      { new: true },
    );

    res.json({ success: true, message: "Güncellendi.", data: updated });
  }),
);

router.get(
  "/customer/:phone",
  asyncHandler(async (req, res) => {
    const { phone } = req.params;
    const phoneVariants = [
      phone,
      phone.replace(/\D/g, ""),
      phone.startsWith("0") ? "90" + phone.substring(1) : phone,
      phone.startsWith("+90") ? phone.substring(3) : phone,
    ];

    const appointments = await Appointment.find({
      customer_phone: { $in: phoneVariants },
    })
      .populate("service_id")
      .sort({ starts_at: -1 });

    res.json({ success: true, count: appointments.length, data: appointments });
  }),
);

router.patch(
  "/:appointmentId/complete",
  asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { status: "completed" },
      { new: true },
    );

    if (!appointment)
      return res.status(404).json({ success: false, message: "Bulunamadı" });

    // DÜZELTME: Sadece business_id araması
    let business = await Business.findOne({
      business_id: appointment.business_id,
    });
    let customer = await Customer.findById(appointment.customer_id);

    if (business && customer) {
      customer.loyalty_points = (customer.loyalty_points || 0) + 1;
      const threshold = business.reward_threshold || 10;

      if (customer.loyalty_points >= threshold) {
        const codeString = `NXA-WIN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        await RewardCode.create({
          business_id: business.business_id || business._id.toString(),
          customer_id: customer._id,
          code: codeString,
          discount_amount: 20,
          is_used: false,
        });
        customer.loyalty_points = 0;
        await sendRewardNotification(customer.phone, business.name, codeString);
      }
      await customer.save();
    }

    res.json({ success: true, message: "Tamamlandı", data: appointment });
  }),
);

export default router;
