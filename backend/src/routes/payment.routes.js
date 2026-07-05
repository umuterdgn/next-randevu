import express from "express";
import { Business } from "../models/Business.js";
import { logAudit } from "../services/audit.service.js";

const router = express.Router();

// POST /api/payment/buy-credits - Generate payment link for AI credits
router.post("/buy-credits", async (req, res) => {
  try {
    const businessId = req.user?.business_id || req.body.business_id;
    
    if (businessId) {
      const business = await Business.findOne({ $or: [{ _id: businessId }, { business_id: businessId }] });
      
      if (!business) {
        return res.status(404).json({
          success: false,
          message: "İşletme bulunamadı"
        });
      }
      
      await logAudit({
        business_id: businessId || "saas_root",
        user_id: req.user?._id || null,
        action: "PAYMENT_LINK_GENERATED",
        method: req.method,
        path: req.originalUrl,
        status_code: 200,
        ip: req.ip || "",
        user_agent: req.headers["user-agent"] || "",
        meta: { type: "ai_credits", package: 50 },
      });
      
      // Generate payment link to nxa.com.tr
      const paymentLink = `https://nxa.com.tr/checkout?biz_id=${business._id}&type=ai_credits&package=50`;
      
      res.json({
        success: true,
        payment_link: paymentLink
      });
    } else {
      res.status(400).json({
        success: false,
        message: "İşletme kimliği bulunamadı"
      });
    }
  } catch (error) {
    console.error("Payment error:", error);
    res.status(500).json({
      success: false,
      message: "Ödeme linki oluşturulurken hata oluştu."
    });
  }
});

export default router;
