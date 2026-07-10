import { User } from "../models/User.js";
import { Staff } from "../models/Staff.js";
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
    console.error("[AUTH ERROR] Token Doğrulama Hatası:", err.message);
    throw createError("Invalid or expired token", 401);
  }

  const userId = decoded.id || decoded._id || decoded.sub;
  const userRole = decoded.role;

  if (!userId) {
    throw createError("Token içinde kullanıcı ID'si bulunamadı", 401);
  }

  // Fetch user from appropriate model based on role
  let user;
  if (userRole === 'staff' || userRole === 'cashier' || userRole === 'dealer') {
    user = await Staff.findById(userId).lean();
  } else {
    user = await User.findById(userId).lean();
  }

  if (!user) {
    console.error(`[401 BLOCKED] Veritabanında kullanıcı bulunamadı. ID: ${userId}, Role: ${userRole}`);
    throw createError("User not found", 401);
  }

  // Check if user is active (both User and Staff models have is_active)
  if (!user.is_active) {
    console.error(`[403 BLOCKED] Kullanıcı hesabı pasif (is_active: false). E-posta: ${user.email}`);
    throw createError("User is inactive", 403);
  }

  req.user = user;
  next();
});

// KRİTİK DÜZELTME BURASI: Rol kontrolünü esnetiyoruz
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    console.error("[403 BLOCKED] req.user bulunamadı!");
    return next(createError("Forbidden", 403));
  }

  // Esnek Rol Mantığı: Eğer rota 'business' istiyorsa, 'owner' ve 'business_admin' olanlar da girebilsin.
  let allowedRoles = [...roles];
  if (allowedRoles.includes('business')) {
    allowedRoles.push('business_admin', 'owner');
  }

  // Yine de eşleşmiyorsa tam olarak nedenini konsola bas
  if (!allowedRoles.includes(req.user.role)) {
    console.error(`[403 ROLE BLOCKED] Giriş Reddedildi! Kullanıcının Rolü: ${req.user.role}, İstenen Roller: ${allowedRoles}`);
    return next(createError("Forbidden: Yetkisiz rol", 403));
  }

  return next();
};

export const requireSaasOwner = (req, _res, next) => {
  if (!req.user || req.user.role !== "owner" || req.user.business_id !== "saas_root") {
    console.error(`[403 SAAS BLOCKED] SaaS Owner yetkisi yok. Rol: ${req.user?.role}, Business ID: ${req.user?.business_id}`);
    return next(createError("SaaS owner access required", 403));
  }
  return next();
};