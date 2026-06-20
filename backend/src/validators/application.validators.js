import { body, param } from "express-validator";

export const createApplicationRules = [
  body("business_name").trim().notEmpty().withMessage("business_name is required"),
  body("phone").trim().notEmpty().withMessage("phone is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("sector").trim().notEmpty().withMessage("sector is required"),
  body("city").optional().isString(),
];

export const updateApplicationStatusRules = [
  param("id").isMongoId().withMessage("Invalid application id"),
  body("status").isIn(["pending", "approved", "rejected"]).withMessage("Invalid status"),
];
