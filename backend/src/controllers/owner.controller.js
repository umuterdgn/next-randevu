import { getAllBusinesses, getOwnerStats } from "../services/owner.service.js";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js";
import mongoose from "mongoose";

export const listBusinesses = async (_req, res) => {
  const businesses = await getAllBusinesses();
  res.json(businesses);
};

export const stats = async (_req, res) => {
  const result = await getOwnerStats();
  res.json(result);
};
// DİKKAT: En üstte User modelinin import edildiğinden emin ol
// import { User } from "../models/User.js";

export const updateBusinessStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Check if id is valid ObjectId or string business_id
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { business_id: id };
    const business = await Business.findOneAndUpdate(
      query,
      { is_active },
      { new: true },
    );

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı." });
    }

    res.json({ success: true, message: "İşletme durumu güncellendi." });
  } catch (error) {
    console.error("İşletme durum güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
  }
};

export const deleteBusiness = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is valid ObjectId or string business_id
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { business_id: id };
    const business = await Business.findOneAndDelete(query);

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı." });
    }

    // İPUCU: Gerçek hayatta işletmeyi silince ona ait servisleri ve randevuları da silmek gerekir (Cascade Delete).
    // Şimdilik sadece işletmeyi siliyoruz.
    res.json({ success: true, message: "İşletme tamamen silindi." });
  } catch (error) {
    console.error("İşletme silme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
  }
};

export const updateBusinessPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, extraFeatures } = req.body;

    // Check if id is valid ObjectId or string business_id
    const query = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { business_id: id };
    const business = await Business.findOneAndUpdate(
      query,
      {
        plan: plan || 'physical',
        extraFeatures: extraFeatures || {}
      },
      { new: true }
    );

    if (!business) {
      return res
        .status(404)
        .json({ success: false, message: "İşletme bulunamadı." });
    }

    res.json({ success: true, message: "İşletme planı güncellendi.", data: business });
  } catch (error) {
    console.error("İşletme plan güncelleme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası oluştu." });
  }
};
