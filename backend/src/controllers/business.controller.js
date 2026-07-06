import {
  createAppointment,
  createCustomer,
  createService,
  deleteService,
  generateRewardCode,
  getAppointments,
  getCustomers,
  getDashboardStats,
  getServices,
  updateAppointmentStatus,
  updateRewardThreshold,
  updateService,
  updateBusinessSettings,
} from "../services/business.service.js";
import { logAudit } from "../services/audit.service.js";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { Cari } from "../models/Cari.js";
import { Transaction } from "../models/Transaction.js";
import { Service } from "../models/Service.js";
import { Staff } from "../models/Staff.js";
import { User } from "../models/User.js";
import crypto from "crypto";

export const dashboard = async (req, res) => {
  const data = await getDashboardStats(req.business_id);
  res.json(data);
};

export const listServices = async (req, res) => {
  const data = await getServices(req.business_id);
  res.json(data);
};

export const addService = async (req, res) => {
  try {
    const data = await createService(req.business_id, req.body);
    await logAudit({
      business_id: req.business_id,
      user_id: req.user?._id || null,
      action: "SERVICE_CREATED",
      method: req.method,
      path: req.originalUrl,
      status_code: 201,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { service_id: data._id, name: data.name },
    });
    res.status(201).json(data);
  } catch (error) {
    console.error("Service creation error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: "Bu isimde bir servis zaten mevcut." });
    }
    res.status(400).json({ success: false, message: error.message || "Servis eklenirken hata oluştu." });
  }
};

export const updateServiceController = async (req, res) => {
  const data = await updateService(req.business_id, req.params.id, req.body);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "SERVICE_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { service_id: req.params.id },
  });
  res.json(data);
};

export const deleteServiceController = async (req, res) => {
  const data = await deleteService(req.business_id, req.params.id);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "SERVICE_DELETED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { service_id: req.params.id },
  });
  res.json(data);
};

export const listCustomers = async (req, res) => {
  const data = await getCustomers(req.business_id);
  const business = await Business.findOne({ $or: [{ _id: req.business_id }, { business_id: req.business_id }] });
  const reward_threshold = business?.reward_threshold || 10;
  res.json({ customers: data, reward_threshold });
};

export const addCustomer = async (req, res) => {
  const data = await createCustomer(req.business_id, req.body);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "CUSTOMER_CREATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { customer_id: data._id, name: data.name },
  });
  res.status(201).json(data);
};

export const listAppointments = async (req, res) => {
  const filters = {
    date: req.query.date,
    search: req.query.search,
    status: req.query.status,
  };
  const data = await getAppointments(req.business_id, filters);
  res.json(data);
};

export const addAppointment = async (req, res) => {
  console.log('🔴 DİKKAT: ADMIN RANDEVU İSTEĞİ BURAYA GELDİ!', req.body);

  const data = await createAppointment(req.business_id, req.body);

  console.log("🚀 ADMIN RANDEVU OLUŞTU, WHATSAPP TETİKLENİYOR...", data._id);

  // WhatsApp notification for admin bookings
  try {
    const { Customer } = await import('../models/Customer.js');
    const { Business } = await import('../models/Business.js');
    const { sendWhatsAppNotification } = await import('../utils/whatsapp.util.js');

    const customer = await Customer.findById(req.body.customer_id);
    const business = await Business.findById(req.business_id);

    if (customer?.phone && business) {
      const appointmentDate = new Date(data.date).toLocaleDateString('tr-TR');
      const appointmentTime = data.time || '';

      await sendWhatsAppNotification(
        customer.phone,
        data._id,
        business.name,
        appointmentDate,
        appointmentTime,
        business
      );
      console.log("✅ ADMIN WA BAŞARILI");
    }
  } catch (waError) {
    console.error("❌ ADMIN WHATSAPP HATASI:", waError?.response?.data || waError.message);
  }

  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "APPOINTMENT_CREATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { appointment_id: data._id },
  });
  res.status(201).json(data);
};

export const patchAppointmentStatus = async (req, res) => {
  const oldAppointment = await Appointment.findById(req.params.id);
  const data = await updateAppointmentStatus(req.business_id, req.params.id, req.body.status);

  if (req.body.status === 'completed' && oldAppointment.status !== 'completed') {
    // Update customer loyalty points - use business_id to ensure correct customer
    const customer = await Customer.findOneAndUpdate(
      { _id: data.customer_id, business_id: req.business_id },
      { $inc: { loyalty_points: 1, visit_count: 1 } },
      { new: true }
    );
    console.log("DEBUG: Customer loyalty points updated:", customer?.loyalty_points);
  }

  // Handle payment_status and Cari accounting
  if (req.body.status === 'completed' && req.body.payment_status) {
    const service = await Service.findById(data.service_id);
    const amount = service ? service.price : 0;

    if (req.body.payment_status === 'unpaid' && amount > 0) {
      // Record debt to Cari
      let cari = await Cari.findOne({
        business_id: req.business_id,
        entity_type: "customer",
        entity_id: data.customer_id
      });
      if (!cari) {
        cari = await Cari.create({
          business_id: req.business_id,
          entity_type: "customer",
          entity_id: data.customer_id,
          total_debt: 0,
          total_paid: 0,
          total_balance: 0,
          transactions: [],
        });
      }
      cari.total_debt += amount;
      cari.total_balance = cari.total_debt - cari.total_paid;
      cari.transactions.push({
        date: new Date(),
        amount,
        type: "debt",
        description: `Randevu ödemesi - ${service?.name || 'Hizmet'}`,
        remaining_amount: amount,
      });
      await cari.save();
    } else if (req.body.payment_status === 'paid' && amount > 0) {
      // Handle immediate cash payment - record both debt and payment
      let cari = await Cari.findOne({
        business_id: req.business_id,
        entity_type: "customer",
        entity_id: data.customer_id
      });
      if (!cari) {
        cari = await Cari.create({
          business_id: req.business_id,
          entity_type: "customer",
          entity_id: data.customer_id,
          total_debt: 0,
          total_paid: 0,
          total_balance: 0,
          transactions: [],
        });
      }

      // Record debt
      cari.total_debt += amount;
      cari.transactions.push({
        date: new Date(),
        amount,
        type: "debt",
        description: `Randevu ödemesi - ${service?.name || 'Hizmet'}`,
        remaining_amount: amount,
      });

      // Record payment immediately
      cari.total_paid += amount;
      cari.total_balance = cari.total_debt - cari.total_paid;
      cari.transactions.push({
        date: new Date(),
        amount,
        type: "payment",
        description: `Nakit ödeme - ${service?.name || 'Hizmet'}`,
      });
      await cari.save();

      // Record income to Transaction
      await Transaction.create({
        business_id: req.business_id,
        type: "income",
        amount,
        description: `Randevu ödemesi - ${service?.name || 'Hizmet'}`,
      });
    }

    // Update appointment payment_status
    await Appointment.findByIdAndUpdate(req.params.id, { payment_status: req.body.payment_status });
  }

  // TODO: WhatsApp Meta API - Durum güncellendiğinde müşteriye mesaj at
  // if (req.body.status === 'approved') {
  //   await sendWhatsAppMessage(data.customer_id.phone, `Randevunuz onaylandı: ${data.starts_at}`);
  // }

  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "APPOINTMENT_STATUS_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { appointment_id: req.params.id, status: req.body.status, payment_status: req.body.payment_status },
  });
  res.json(data);
};

export const patchRewardThreshold = async (req, res) => {
  const data = await updateRewardThreshold(req.business_id, req.body.reward_threshold);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "LOYALTY_THRESHOLD_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { reward_threshold: req.body.reward_threshold },
  });
  res.json(data);
};

export const updateBusinessSettingsController = async (req, res) => {
  // Gelen ham veriyi terminalde görmek için bu logu ekle:
  console.log("🔴 FRONTEND'DEN GELEN HAM BODY:", req.body);

  const { name, phone, address, theme_color, logo_url, reward_threshold, is_loyalty_enabled, bookingSettings, integrations, whatsapp_token, whatsapp_phone_number_id, auto_approve_appointments } = req.body;

  // Hem about_text hem aboutText ihtimalini yakala:
  const final_about_text = req.body.about_text !== undefined ? req.body.about_text : (req.body.aboutText !== undefined ? req.body.aboutText : "");
  const final_map_url = req.body.map_url !== undefined ? req.body.map_url : (req.body.mapUrl !== undefined ? req.body.mapUrl : "");

  const existingBusiness = await Business.findOne({ $or: [{ _id: req.business_id }, { business_id: req.business_id }] });

  const updateData = {
    name,
    phone,
    address,
    theme_color,
    logo_url,
    reward_threshold,
    about_text: final_about_text || (existingBusiness?.about_text || ""),
    map_url: final_map_url || (existingBusiness?.map_url || ""),
    is_loyalty_enabled,
    bookingSettings,
    integrations,
    whatsapp_token: whatsapp_token !== undefined ? whatsapp_token : (existingBusiness?.whatsapp_token || ""),
    whatsapp_phone_number_id: whatsapp_phone_number_id !== undefined ? whatsapp_phone_number_id : (existingBusiness?.whatsapp_phone_number_id || ""),
    auto_approve_appointments: auto_approve_appointments !== undefined ? auto_approve_appointments : (existingBusiness?.auto_approve_appointments ?? true)
  };

  console.log("📦 VERİTABANINA GÖNDERİLEN NET DATA:", updateData);

  const data = await updateBusinessSettings(req.business_id, updateData);

  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "BUSINESS_SETTINGS_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { settings: updateData },
  });

  res.json(data);
};

export const createRewardCode = async (req, res) => {
  const data = await generateRewardCode(req.business_id, req.params.customerId);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "REWARD_CODE_CREATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { reward_code_id: data._id, customer_id: req.params.customerId },
  });
  res.status(201).json(data);
};

export const listStaff = async (req, res) => {
  const staff = await Staff.find({ business_id: req.business_id }).sort({ createdAt: -1 });
  res.json(staff);
};

export const addStaff = async (req, res) => {
  const { name, role, phone, email } = req.body;
  const staff = await Staff.create({
    business_id: req.business_id,
    name,
    role,
    phone,
    email,
  });
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "STAFF_CREATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { staff_id: staff._id, name, role },
  });
  res.status(201).json(staff);
};

export const updateStaff = async (req, res) => {
  const { name, role, phone, email, is_active } = req.body;
  const staff = await Staff.findOneAndUpdate(
    { _id: req.params.id, business_id: req.business_id },
    { name, role, phone, email, is_active },
    { new: true, runValidators: true }
  );
  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "STAFF_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { staff_id: staff._id, name, role },
  });
  res.json(staff);
};

export const deleteStaff = async (req, res) => {
  const staff = await Staff.findOneAndDelete({ _id: req.params.id, business_id: req.business_id });
  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "STAFF_DELETED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { staff_id: staff._id, name: staff.name },
  });
  res.json({ success: true });
};

export const redeemReward = async (req, res) => {
  try {
    const { reward_code, customer_id } = req.body;
    const business_id = req.business_id;

    // Find the business to get reward_threshold
    const business = await Business.findOne({ $or: [{ _id: business_id }, { business_id: business_id }] });
    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı" });
    }

    // Find the customer
    const customer = await Customer.findOne({ _id: customer_id, business_id });
    if (!customer) {
      return res.status(404).json({ success: false, message: "Müşteri bulunamadı" });
    }

    // Check if customer has enough points
    if (customer.loyalty_points < business.reward_threshold) {
      return res.status(400).json({ success: false, message: "Müşterinin yeterli sadakat puanı yok" });
    }

    // Deduct the reward_threshold from customer's points
    customer.loyalty_points -= business.reward_threshold;
    await customer.save();

    await logAudit({
      business_id: req.business_id,
      user_id: req.user?._id || null,
      action: "REWARD_REDEEMED",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { customer_id: customer._id, reward_code, points_deducted: business.reward_threshold },
    });

    res.json({ success: true, message: "Ödül başarıyla kullanıldı ve puanlar güncellendi", new_points: customer.loyalty_points });
  } catch (error) {
    console.error("Ödül kullanım hatası:", error);
    res.status(500).json({ success: false, message: "Ödül kullanılırken hata oluştu" });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Lütfen bir dosya seçin." });
    }

    const idToUse = req.business_id || req.user?.business_id;

    if (!idToUse) {
      return res.status(401).json({ success: false, message: "Yetkisiz işlem: İşletme kimliği bulunamadı." });
    }

    const business = await Business.findOneAndUpdate(
      { $or: [{ _id: idToUse }, { business_id: idToUse }] },
      { logo_url: req.file.path }, 
      { new: true }
    );

    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı." });
    }

    res.json({
      success: true,
      message: "Logo başarıyla yüklendi!",
      data: { logo_url: business.logo_url }
    });

  } catch (error) {
    console.error("Logo yükleme controller hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
  }
};

export const createBusinessFromUser = async (req, res) => {
  try {
    const { business_name, phone, email, sector, city } = req.body;
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Yetkisiz işlem" });
    }

    // Get the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Kullanıcı bulunamadı" });
    }

    // Check if user already has a business
    if (user.business_id && user.business_id !== 'pending') {
      return res.status(400).json({ success: false, message: "Kullanıcı zaten bir işletmeye sahip" });
    }

    // Generate business_id and slug
    const businessId = crypto.randomBytes(16).toString('hex');
    const slug = business_name?.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + businessId.substring(0, 8) || 'business-' + businessId.substring(0, 8);

    // Create Business
    const business = await Business.create({
      business_id: businessId,
      slug: slug,
      name: business_name,
      sector: sector || 'Diğer',
      phone: phone || user.phone || '',
      email: email || user.email,
      city: city || '',
      address: '',
      about_text: '',
      theme_color: '#3B82F6',
      is_active: true
    });

    // Update User with new business_id
    user.business_id = business.business_id;
    user.business_ref = business._id;
    await user.save();

    // Log audit
    await logAudit({
      business_id: business.business_id,
      user_id: user._id,
      action: "BUSINESS_CREATED_FROM_SSO",
      method: req.method,
      path: req.originalUrl,
      status_code: 201,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
    });

    user.password = undefined;

    res.status(201).json({
      success: true,
      user,
      business
    });
  } catch (error) {
    console.error("Create business from user error:", error);
    res.status(500).json({ success: false, message: "İşletme oluşturulurken bir hata oluştu" });
  }
};
