import { SupportTicket } from "../models/SupportTicket.js";
import { Business } from "../models/Business.js";
import { logAudit } from "../services/audit.service.js";
import { sendEmail } from "../utils/sendEmail.js";

export const createSupportTicket = async (req, res) => {
  try {
    const { message } = req.body;
    const businessId = req.business_id || req.user?.business_id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Mesaj gerekli." });
    }

    // Get business name
    const business = await Business.findOne({ business_id: businessId });
    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı." });
    }

    const ticket = await SupportTicket.create({
      business_id: businessId,
      business_name: business.name,
      message: message.trim(),
      status: "pending",
      priority: "medium",
    });

    await logAudit({
      business_id: businessId,
      user_id: req.user?._id || null,
      action: "SUPPORT_TICKET_CREATED",
      method: req.method,
      path: req.originalUrl,
      status_code: 201,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { ticket_id: ticket._id },
    });

    // Send email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'support@nxa.com.tr';
      const subject = `[Nexa Destek] ${business.name} - Yeni Bildirim`;
      const text = `İşletme: ${business.name}\nMesaj: ${message.trim()}`;
      
      await sendEmail({
        email: adminEmail,
        subject: subject,
        message: text,
      });
    } catch (emailError) {
      console.error("Support email sending error:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: "Destek talebi başarıyla oluşturuldu.",
      ticket,
    });
  } catch (error) {
    console.error("Support ticket creation error:", error);
    res.status(500).json({ success: false, message: "Destek talebi oluşturulurken bir hata oluştu." });
  }
};
