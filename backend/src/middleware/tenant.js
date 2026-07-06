import { createError } from "../utils/appError.js";

export const requireTenant = (req, res, next) => {
  if (!req.user?.business_id) {
    return next(createError("business_id missing in token", 400));
  }

  // Check if business_id is 'pending' (SSO user without business)
  if (req.user.business_id === 'pending') {
    const error = createError("İşletme bulunamadı. Lütfen işletmenizi oluşturun.", 403);
    error.require_apply = true;
    return next(error);
  }

  req.business_id = req.user.business_id;
  return next();
};
