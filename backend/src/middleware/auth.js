import { User } from "../models/User.js";
import { createError } from "../utils/appError.js";
import { verifyToken } from "../utils/jwt.js";
import { asyncHandler } from "./asyncHandler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    throw createError("Missing Bearer token", 401);
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    throw createError("Missing token", 401);
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    // Hata detayını terminalde görmek için ekledik (Süresi mi dolmuş, şifre mi yanlış anlarız)
    console.error("Token Doğrulama Hatası:", err.message); 
    throw createError("Invalid or expired token", 401);
  }

  // KRİTİK DÜZELTME: Token içindeki ID farklı bir isimle kaydedilmiş olabilir.
  // Sırasıyla id, _id veya sub parametrelerine bakıyoruz.
  const userId = decoded.id || decoded._id || decoded.sub;

  if (!userId) {
    throw createError("Token içinde kullanıcı ID'si bulunamadı", 401);
  }

  const user = await User.findById(userId).lean();
  
  if (!user) throw createError("User not found", 401);
  if (!user.is_active) throw createError("User is inactive", 403);

  req.user = user;
  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return next(createError("Forbidden", 403));
  }
  return next();
};

export const requireSaasOwner = (req, _res, next) => {
  if (!req.user || req.user.role !== "owner" || req.user.business_id !== "saas_root") {
    return next(createError("SaaS owner access required", 403));
  }
  return next();
};