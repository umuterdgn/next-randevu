import {
  createAppointment,
  createCustomer,
  createService,
  generateRewardCode,
  getAppointments,
  getCustomers,
  getDashboardStats,
  getServices,
  updateAppointmentStatus,
  updateRewardThreshold,
} from "../services/business.service.js";
import { logAudit } from "../services/audit.service.js";

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
    // 1. Veritabanına kaydet (Zaten burası kusursuz çalışıyor)
    const data = await createService(req.business_id, req.body);
    
    // 2. Log Tutma İşlemi (Hata çıkarırsa sistemi çökertmemesi için try-catch içine aldık)
    try {
      await logAudit({
        business_id: req.business_id,
        user_id: req.user?._id || req.user?.id || null, // .id veya ._id ikisini de kabul etsin
        action: "SERVICE_CREATED",
        method: req.method,
        path: req.originalUrl,
        status_code: 201,
        ip: req.ip || "",
        user_agent: req.headers["user-agent"] || "",
        meta: { service_id: data?._id, name: data?.name },
      });
    } catch (auditError) {
      // Eğer log tutamazsa sadece terminale yazsın, kullanıcıya hata göstermesin!
      console.error("Log Tutma Hatası (Önemsiz):", auditError.message);
    }
    
    // 3. Frontend'e Başarı Cevabını Dön (Sayfa yenilemeye gerek kalmadan listeye düşecek)
    res.status(201).json(data);

  } catch (error) {
    if (error.code === 11000) {
       return res.status(400).json({
         success: false,
         message: `'${req.body.name}' adında bir hizmet zaten kayıtlı! Lütfen farklı bir isim deneyin.`
       });
    }
    console.error("HİZMET KAYIT HATASI:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
  }
};

export const listCustomers = async (req, res) => {
  const data = await getCustomers(req.business_id);
  res.json(data);
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
  const data = await getAppointments(req.business_id);
  res.json(data);
};

export const addAppointment = async (req, res) => {
  const data = await createAppointment(req.business_id, req.body);
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
  const data = await updateAppointmentStatus(req.business_id, req.params.id, req.body.status);
  await logAudit({
    business_id: req.business_id,
    user_id: req.user?._id || null,
    action: "APPOINTMENT_STATUS_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { appointment_id: req.params.id, status: req.body.status },
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
