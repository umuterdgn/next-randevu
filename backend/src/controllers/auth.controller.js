import { loginUser } from "../services/auth.service.js";
import { logAudit } from "../services/audit.service.js";

export const login = async (req, res) => {
  try {
    const result = await loginUser(req.body);
    
    await logAudit({
      business_id: result.user.business_id,
      // Mongoose'da ID genelde _id olarak döner, bu yüzden .id yoksa ._id alsın diye garantiye alıyoruz
      user_id: result.user._id || result.user.id, 
      action: "LOGIN_SUCCESS",
      method: req.method,
      path: req.originalUrl,
      status_code: 200,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
    });
    
    res.json(result);
  } catch (error) {
    await logAudit({
      business_id: "saas_root",
      action: "LOGIN_FAILED",
      method: req.method,
      path: req.originalUrl,
      status_code: error.statusCode || 401,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { email: req.body?.email || "" },
    });
    
    // Hatanın çözüldüğü nokta: 'throw error' YERİNE frontend'e hata cevabı (response) dönüyoruz!
    res.status(error.statusCode || 401).json({ 
      success: false, 
      message: error.message || "E-posta veya şifre hatalı!" 
    });
  }
};