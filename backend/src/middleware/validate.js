import { validationResult } from "express-validator";
import { createError } from "../utils/appError.js";

export const validate = (rules) => [
  ...rules,
  (req, _res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(createError("Validation failed", 400, errors.array()));
    }
    return next();
  },
];
