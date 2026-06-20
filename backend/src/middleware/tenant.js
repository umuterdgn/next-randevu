import { createError } from "../utils/appError.js";

export const requireTenant = (req, res, next) => {
  if (!req.user?.business_id) {
    return next(createError("business_id missing in token", 400));
  }
  req.business_id = req.user.business_id;
  return next();
};
