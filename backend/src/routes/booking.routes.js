import { Router } from "express";
import { Service } from "../models/Service.js";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { getAvailableSlots } from "../services/availability.service.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Customer } from "../models/Customer.js";

const router = Router();

/**
 * GET /services/:slug
 * İlgili işletmenin aktif hizmetlerini listeler (slug ile)
 */
router.get("/services/:slug", asyncHandler(async (req, res) => {
  const { slug } = req.params;
  console.log("DEBUG: GET /api/booking/services/:slug - slug:", slug);

  // Slug'a göre işletmeyi bul
  const business = await Business.findOne({ slug });
  console.log("DEBUG: Business found:", business);
  if (!business) {
    console.log("DEBUG: Business not found for slug:", slug);
    return res.status(404).json({
      success: false,
      message: "İşletme bulunamadı",
    });
  }

  const services = await Service.find({
    business_id: business.business_id,
    is_active: true,
  }).select("name duration price currency description critical_points process_steps");
  console.log("DEBUG: Services found:", services.length);

  res.json({
    success: true,
    data: services,
  });
}));

/**
 * GET /business/:slug
 * İşletme bilgilerini döndür (slug ile)
 */
router.get("/business/:slug", asyncHandler(async (req, res) => {
  const { slug } = req.params;
  console.log("DEBUG: GET /api/booking/business/:slug - slug:", slug);

  const business = await Business.findOne({ slug }).select("name theme_color sector business_id _id");
  console.log("DEBUG: Business found:", business);
  console.log("DEBUG: Business._id:", business?._id);
  console.log("DEBUG: Business.business_id:", business?.business_id);
  if (!business) {
    console.log("DEBUG: Business not found for slug:", slug);
    return res.status(404).json({
      success: false,
      message: "İşletme bulunamadı",
    });
  }

  // Fetch services for this business - use business._id.toString() to match with User.business_id (String field)
  const services = await Service.find({
    business_id: business._id.toString(),
    is_active: true,
  }).select("name duration price currency description critical_points process_steps");
  console.log("DEBUG: Services found with business._id.toString():", services.length);

  res.json({
    success: true,
    data: {
      business,
      services,
    },
  });
}));

/**
 * GET /availability
 * Query params: slug, date (YYYY-MM-DD), serviceDuration
 * Belirli bir tarih ve hizmet süresi için müsait saat dilimlerini döndürür
 */
router.get("/availability", asyncHandler(async (req, res) => {
  const { slug, date, serviceDuration } = req.query;

  // Parametre validasyonu
  if (!slug || !date || !serviceDuration) {
    return res.status(400).json({
      success: false,
      message: "slug, date ve serviceDuration parametreleri gerekli",
    });
  }

  // Slug'a göre işletmeyi bul
  const business = await Business.findOne({ slug });
  if (!business) {
    return res.status(404).json({
      success: false,
      message: "İşletme bulunamadı",
    });
  }

  // serviceDuration'ı sayıya çevir
  const duration = parseInt(serviceDuration, 10);
  if (isNaN(duration) || duration <= 0) {
    return res.status(400).json({
      success: false,
      message: "serviceDuration geçerli bir sayı olmalı",
    });
  }

  // Müsait saatleri hesapla - use business._id (ObjectId) to match with User.business_id
  const availableSlots = await getAvailableSlots(business._id.toString(), date, duration);

  res.json({
    success: true,
    data: {
      slug,
      date,
      serviceDuration: duration,
      availableSlots,
    },
  });
}));

/**
 * POST /book
 * Yeni bir randevu oluşturur
 * Body: { slug, serviceId, starts_at, ends_at, customer: { firstName, lastName, phone, email } }
 */
router.post("/book", asyncHandler(async (req, res) => {
  const { slug, serviceId, starts_at, ends_at, customer } = req.body;

  // Gerekli alanları kontrol et
  if (!slug || !serviceId || !starts_at || !ends_at || !customer) {
    return res.status(400).json({
      success: false,
      message: "slug, serviceId, starts_at, ends_at ve customer alanları gerekli",
    });
  }

  // Slug'a göre işletmeyi bul
  const business = await Business.findOne({ slug });
  if (!business) {
    return res.status(404).json({
      success: false,
      message: "İşletme bulunamadı",
    });
  }

  console.log("DEBUG: Booking - Business found:", business);
  console.log("DEBUG: Booking - Business._id:", business._id);
  console.log("DEBUG: Booking - Business.business_id:", business.business_id);

  // Müşteri bilgilerini kontrol et
  if (!customer.firstName || !customer.lastName || !customer.phone || !customer.email) {
    return res.status(400).json({
      success: false,
      message: "Müşteri bilgileri eksik (firstName, lastName, phone, email gerekli)",
    });
  }

  // Tarih formatlarını kontrol et
  const startDate = new Date(starts_at);
  const endDate = new Date(ends_at);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "Geçersiz tarih formatı",
    });
  }

  // Müşteri var mı kontrol et, yoksa oluştur
  // Use business._id.toString() to match with User.business_id (String field)
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

  // Randevuyu oluştur
  // Use business._id.toString() to match with User.business_id (String field)
  const appointment = await Appointment.create({
    business_id: business._id.toString(),
    customer_id: existingCustomer._id,
    service_id: serviceId,
    starts_at: startDate,
    ends_at: endDate,
    status: "pending", // Başlangıçta pending, işletme onaylayabilir
  });

  res.status(201).json({
    success: true,
    message: "Randevu talebiniz alındı",
    data: appointment,
  });
}));

/**
 * GET /track/:appointmentId
 * Randevu detaylarını döndür (public endpoint)
 */
router.get("/track/:appointmentId", asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findById(appointmentId)
    .populate("service_id")
    .populate("customer_id");

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Randevu bulunamadı",
    });
  }

  const business = await Business.findOne({ business_id: appointment.business_id });

  res.json({
    success: true,
    data: {
      appointment: {
        id: appointment._id,
        starts_at: appointment.starts_at,
        ends_at: appointment.ends_at,
        status: appointment.status,
      },
      service: {
        name: appointment.service_id?.name,
        duration: appointment.service_id?.duration,
        price: appointment.service_id?.price,
      },
      business: {
        name: business?.name,
        phone: business?.phone,
        slug: business?.slug,
        reward_threshold: business?.reward_threshold || 10,
      },
      customer: {
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

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Randevu bulunamadı",
    });
  }

  res.json({
    success: true,
    message: "Randevu iptal edildi",
    data: appointment,
  });
}));

export default router;
