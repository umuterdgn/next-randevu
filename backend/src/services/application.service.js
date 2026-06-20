import { Application } from "../models/Application.js";
import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { createError } from "../utils/appError.js";

// Başvuru kaydetme işlemi (Formdan gelen password de burada kaydedilir)
export const submitApplication = async (payload) => Application.create(payload);

export const listApplications = async () => Application.find().sort({ createdAt: -1 });

export const updateApplicationStatus = async (applicationId, status) => {
  const app = await Application.findById(applicationId);
  if (!app) throw createError("Application not found", 404);

  app.status = status;
  await app.save();

  // Onaylanmadıysa sadece durumu güncelleyip dönüyoruz
  if (status !== "approved") return { application: app };

  // Onaylandıysa İşletmeyi oluştur
  const business_id = `biz_${app._id.toString().slice(-8)}`;
  let business = await Business.findOne({ business_id });
  if (!business) {
    business = await Business.create({
      business_id,
      name: app.business_name,
      phone: app.phone,
      email: app.email,
      sector: app.sector,
      city: app.city || "",
    });
  }

  // Onaylandıysa Kullanıcıyı oluştur
  const existing = await User.findOne({ business_id, email: app.email });
  if (!existing) {
    await User.create({
      business_id,
      name: app.business_name, // (İstersen burayı `${app.business_name} Yetkilisi` yapabilirsin)
      email: app.email,
      phone: app.phone,
      
      // KRİTİK DEĞİŞİKLİK: Artık sabit "Admin123!" yerine başvuranın kendi şifresini alıyoruz.
      password: app.password, 
      
      role: "admin",
    });
  }

  // İşletme ID'sini başvuruya referans olarak kaydet
  app.business_ref = business._id;
  await app.save();

  return { application: app, business };
};