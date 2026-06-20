import { body, param } from "express-validator";

export const createServiceRules = [
  body("name").trim().notEmpty().withMessage("Service name is required"),
  body("duration_minutes").isInt({ min: 5 }).withMessage("duration_minutes must be >= 5"),
  body("price").optional().isFloat({ min: 1 }),
];

export const createCustomerRules = [
  body("name").trim().notEmpty().withMessage("Customer name is required"),
  body("phone").trim().notEmpty().withMessage("Phone is required"),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("Email must be valid"),
];

export const createAppointmentRules = [
  body("customer_id").isMongoId().withMessage("Invalid customer_id"),
  body("service_id").isMongoId().withMessage("Invalid service_id"),
  body("starts_at").isISO8601().withMessage("starts_at must be a valid date"),
  body("note").optional().isString(),
];

export const updateAppointmentStatusRules = [
  param("id").isMongoId().withMessage("Invalid appointment id"),
  body("status")
    .isIn(["pending", "approved", "rejected", "completed", "cancelled"])
    .withMessage("Invalid status"),
];

export const updateThresholdRules = [
  body("reward_threshold")
    .isInt({ min: 1 })
    .withMessage("reward_threshold must be an integer >= 1"),
];

export const generateRewardRules = [param("customerId").isMongoId().withMessage("Invalid customer id")];
