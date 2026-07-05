import dotenv from "dotenv";
import { Router } from "express";
import { Service } from "../models/Service.js";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { RewardCode } from "../models/RewardCode.js";
import { getAvailableSlots } from "../services/availability.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sendWhatsAppNotification, sendRewardNotification, sendWhatsAppTemplate } from "../utils/whatsapp.util.js";
import { createGoogleEvent } from "../utils/google.util.js";

dotenv.config();

console.log('TOKEN KONTROL:', !!process.env.WA_TOKEN);

const router = Router();

/**
 * GET /services/:slug
 * İlgili işletmenin aktif hizmetlerini listeler (slug ile)
 */
router.get("/services/:slug", asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const business = await Business.findOne({ slug });

  if (!business) {
    return res.status(404).json({ success: false, message: "İşletme bulunamadı" });
  }

  const services = await Service.find({
    business_id: business._id,
    is_active: true,
  }).select("name duration price currency description critical_points process_steps");

  res.json({ success: true, data: services });
}));

/**
 * GET /business/:slug
 * İşletme bilgilerini döndür (slug ile)
 */
router.get("/business/:slug", asyncHandler(async (req, res) => {
  const business = await Business.findOne({ slug: req.params.slug });
  if (!business) return res.status(404).json({ error: 'İşletme bulunamadı' });

  const services = await Service.find({
    $or: [
      { business: business._id },
      { businessId: business._id },
      { business_id: business.business_id }
    ]
  });

  res.json({ business, services });
}));

/**
 * GET /availability
 * Müsait saat dilimlerini döndürür
 */
router.get("/availability", asyncHandler(async (req, res) => {
  const { slug, date, serviceDuration } = req.query;

  if (!slug || !date || !serviceDuration) {
    return res.status(400).json({ success: false, message: "Parametreler eksik" });
  }

  const business = await Business.findOne({ slug });
  if (!business) return res.status(404).json({ success: false, message: "İşletme bulunamadı" });

  const duration = parseInt(serviceDuration, 10);
  if (isNaN(duration) || duration <= 0) {
    return res.status(400).json({ success: false, message: "serviceDuration geçerli olmalı" });
  }

  const availableSlots = await getAvailableSlots(business._id, date, duration);

  res.json({
    success: true,
    data: { slug, date, serviceDuration: duration, availableSlots },
  });
}));

/**
 * POST /book
 * Yeni bir randevu oluşturur
 */
router.post("/book", asyncHandler(async (req, res) => {
  const { slug, serviceId, starts_at, ends_at, customer, is_online } = req.body;

  if (!slug || !serviceId || !starts_at || !ends_at || !customer) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }

  const business = await Business.findOne({ slug });
  if (!business) return res.status(404).json({ success: false, message: "İşletme bulunamadı" });

  if (!customer.firstName || !customer.lastName || !customer.phone || !customer.email) {
    return res.status(400).json({ success: false, message: "Müşteri bilgileri eksik" });
  }

  const startDate = new Date(starts_at);
  const endDate = new Date(ends_at);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate < new Date()) {
    return res.status(400).json({ success: false, message: "Geçersiz veya geçmiş tarih" });
  }

  const maxAllowed = business?.bookingSettings?.maxConcurrent || 1;
  const activeAppointmentsCount = await Appointment.countDocuments({
    business_id: business._id.toString(),
    starts_at: { $lt: endDate },
    ends_at: { $gt: startDate },
    status: { $ne: 'cancelled' }
  });

  if (activeAppointmentsCount >= maxAllowed) {
    return res.status(400).json({ success: false, message: "Seçilen saat doludur" });
  }

  let existingCustomer = await Customer.findOne({
    business_id: business._id.toString(),
    email: customer.email,
    phone: customer.phone,
  });

  if (!existingCustomer) {
    existingCustomer = await Customer.create({
      business_id: business._id.toString(),
      name: `${customer.firstName} ${customer.lastName}`,
      phone: customer.phone,
      email: customer.email,
    });
  }

  const appointment = await Appointment.create({
    business_id: business._id.toString(),
    customer_id: existingCustomer._id,
    customer_phone: customer.phone,
    service_id: serviceId,
    starts_at: startDate,
    ends_at: endDate,
    status: "pending",
  });

  try {
    const dateStr = startDate.toISOString().split('T')[0];
    const timeStr = startDate.toTimeString().substring(0, 5);
    await sendWhatsAppNotification(
      customer.phone,
      appointment._id.toString(),
      business.name || 'İşletme',
      dateStr,
      timeStr
    );
  } catch (err) {
    console.error("WhatsApp bildirim hatası:", err);
  }

  try {
    // Only create Google Meet link if service is online and business has Google tokens
    console.log('[Google Meet] Checking conditions for Meet link creation...');
    console.log('[Google Meet] is_online:', is_online);
    console.log('[Google Meet] business.google_calendar_tokens exists:', !!business.google_calendar_tokens);

    if (is_online && business.google_calendar_tokens) {
      console.log('[Google Meet] Conditions met, fetching service...');
      const service = await Service.findById(serviceId);
      console.log('[Google Meet] Service found:', service?.name, 'is_online:', service?.is_online);

      console.log('[Google Meet] Calling createGoogleEvent...');
      const googleResponse = await createGoogleEvent(business.google_calendar_tokens, {
        serviceName: service?.name || 'Randevu',
        phone: customer.phone,
        starts_at: startDate.toISOString(),
        ends_at: endDate.toISOString()
      });

      console.log('[Google Meet] Google API response received');
      console.log('[Google Meet] Response data:', JSON.stringify(googleResponse?.data, null, 2));

      // Save Google Meet link if available
      if (googleResponse?.data?.hangoutLink) {
        console.log('[Google Meet] hangoutLink found:', googleResponse.data.hangoutLink);
        appointment.meet_url = googleResponse.data.hangoutLink;
        await appointment.save();
        console.log('[Google Meet] meet_url saved to appointment');
      } else {
        console.log('[Google Meet] No hangoutLink in response');
      }
    } else {
      console.log('[Google Meet] Conditions not met for Meet link creation');
    }
  } catch (err) {
    console.error('[Google Meet] Google API Error:', err);
    console.error('[Google Meet] Error details:', err.message);
    if (err.response) {
      console.error('[Google Meet] Google API response error:', err.response.data);
    }
  }

  // Send WhatsApp notification to business owner
  try {
    console.log('[WhatsApp Business] Checking business WhatsApp settings...');
    console.log('[WhatsApp Business] integrations.whatsappEnabled:', business.integrations?.whatsappEnabled);
    console.log('[WhatsApp Business] whatsapp_token exists:', !!business.whatsapp_token);
    console.log('[WhatsApp Business] whatsapp_phone_number_id exists:', !!business.whatsapp_phone_number_id);
    console.log('[WhatsApp Business] business.phone:', business.phone);

    if (business.integrations?.whatsappEnabled && business.whatsapp_token && business.whatsapp_phone_number_id && business.phone) {
      console.log('[WhatsApp Business] Conditions met, preparing template message...');

      const service = await Service.findById(serviceId);
      const dateStr = startDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      const timeStr = startDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      // Build template parameters
      const parameters = [
        `${customer.firstName} ${customer.lastName}`,
        service?.name || 'Randevu',
        `${dateStr} - ${timeStr}`
      ];

      // Add Google Meet link if appointment is online and meet_url exists
      if (appointment.meet_url) {
        parameters.push(appointment.meet_url);
        console.log('[WhatsApp Business] Meet link added to parameters:', appointment.meet_url);
      }

      console.log('[WhatsApp Business] Template parameters:', parameters);

      await sendWhatsAppTemplate(
        business.phone,
        'yeni_randevu_bildirimi',
        parameters,
        business
      );

      console.log('[WhatsApp Business] ✅ Business notification sent successfully');
    } else {
      console.log('[WhatsApp Business] Conditions not met for business notification');
    }
  } catch (err) {
    console.error('[WhatsApp Business] ❌ WhatsApp notification error:', err);
    console.error('[WhatsApp Business] Error details:', err.message);
    if (err.response) {
      console.error('[WhatsApp Business] Meta API response error:', err.response.data);
    }
    // Don't throw error - appointment should still be created
  }

  return res.status(201).json({ success: true, message: "Randevu alındı", data: appointment });
}));

/**
 * GET /track/:appointmentId
 * Randevu detaylarını döndür (DÜZELTİLMİŞ POPULATE VE VİTRİN BİLGİSİ)
 */
router.get("/track/:appointmentId", asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  // Sadece referansı kesin olanları populate ediyoruz
  const appointment = await Appointment.findById(appointmentId)
    .populate("service_id")
    .populate("customer_id");

  if (!appointment) {
    return res.status(404).json({ success: false, message: "Randevu bulunamadı" });
  }

  // 🔥 İki farklı ID sorununu çözen o hassas sorgu (Mongoose ID veya Auth String ID)
  const business = await Business.findOne({
    $or: [
      { _id: appointment.business_id },
      { business_id: appointment.business_id }
    ]
  });

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
      service: {
        id: appointment.service_id?._id,
        name: appointment.service_id?.name,
        duration: appointment.service_id?.duration_minutes || appointment.service_id?.duration,
        price: appointment.service_id?.price,
      },
      business: {
        name: business?.name || "İşletme",
        phone: business?.phone || "",
        slug: business?.slug || "",
        theme_color: business?.theme_color || "",
        reward_threshold: business?.reward_threshold || 10,
        bookingSettings: business?.bookingSettings || { cancellationBuffer: 120 },
        address: business?.address || "",
        map_url: business?.map_url || "",
        about_text: business?.about_text || "",
        logo_url: business?.logo_url || "",
        is_loyalty_enabled: business?.is_loyalty_enabled !== false
      },
      customer: {
        _id: appointment.customer_id?._id,
        name: appointment.customer_id?.name,
        phone: appointment.customer_id?.phone,
        loyalty_points: appointment.customer_id?.loyalty_points || 0,
      },
    },
  });
}));

/**
 * PATCH /track/:appointmentId/cancel
 * Randevuyu iptal eder (public endpoint)
 */
router.patch("/track/:appointmentId/cancel", asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    { status: "cancelled" },
    { new: true }
  );

  if (!appointment) return res.status(404).json({ success: false, message: "Randevu bulunamadı" });
  res.json({ success: true, message: "Randevu iptal edildi", data: appointment });
}));

/**
 * PATCH /track/:appointmentId/update
 * Randevuyu yeni bir tarihe günceller (public endpoint)
 */
router.patch("/track/:appointmentId/update", asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { starts_at, ends_at } = req.body;

  if (!starts_at || !ends_at) {
    return res.status(400).json({ success: false, message: "Tarih gerekli" });
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) return res.status(404).json({ success: false, message: "Randevu bulunamadı" });

  const existing = await Appointment.findOne({
    business_id: appointment.business_id,
    _id: { $ne: appointmentId },
    starts_at: { $lt: new Date(ends_at) },
    ends_at: { $gt: new Date(starts_at) },
    status: { $in: ["pending", "approved", "confirmed"] }
  });

  if (existing) return res.status(400).json({ success: false, message: "Saat doludur." });

  const updated = await Appointment.findByIdAndUpdate(
    appointmentId,
    { starts_at: new Date(starts_at), ends_at: new Date(ends_at) },
    { new: true }
  );

  res.json({ success: true, message: "Güncellendi.", data: updated });
}));

/**
 * GET /customer/:phone
 * Müşterinin tüm randevuları
 */
router.get("/customer/:phone", asyncHandler(async (req, res) => {
  const { phone } = req.params;
  const phoneVariants = [
    phone,
    phone.replace(/\D/g, ''),
    phone.startsWith('0') ? '90' + phone.substring(1) : phone,
    phone.startsWith('+90') ? phone.substring(3) : phone,
  ];

  const appointments = await Appointment.find({ customer_phone: { $in: phoneVariants } })
    .populate("service_id")
    .sort({ starts_at: -1 });

  res.json({ success: true, count: appointments.length, data: appointments });
}));

/**
 * PATCH /:appointmentId/complete
 * Randevuyu tamamla ve puan ver
 */
router.patch("/:appointmentId/complete", asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const appointment = await Appointment.findByIdAndUpdate(appointmentId, { status: "completed" }, { new: true });

  if (!appointment) return res.status(404).json({ success: false, message: "Bulunamadı" });

  let business = await Business.findById(appointment.business_id) || await Business.findOne({ business_id: appointment.business_id });
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
        is_used: false
      });
      customer.loyalty_points = 0;
      await sendRewardNotification(customer.phone, business.name, codeString);
    }
    await customer.save();
  }

  res.json({ success: true, message: "Tamamlandı", data: appointment });
}));

export default router;