import { getAllBusinesses, getOwnerStats } from "../services/owner.service.js";
import { User } from "../models/User.js";
import { Business } from "../models/Business.js"; // (Eğer dosya adın Business ise)
// (Eğer User modelin farklı bir klasördeyse yolu ona göre düzenle)

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

    // Use findOne with $or to handle both ObjectId and string business_id
    const business = await Business.findOneAndUpdate(
      { $or: [{ _id: id }, { business_id: id }] },
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

    // Use findOneAndDelete with $or to handle both ObjectId and string business_id
    const business = await Business.findOneAndDelete(
      { $or: [{ _id: id }, { business_id: id }] }
    );

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

    // Use findOneAndUpdate with $or to handle both ObjectId and string business_id
    const business = await Business.findOneAndUpdate(
      { $or: [{ _id: id }, { business_id: id }] },
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
