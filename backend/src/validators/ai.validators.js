import { body } from "express-validator";

export const generateCampaignRules = [
  body("sector").trim().notEmpty().withMessage("sector is required"),
  body("city").trim().notEmpty().withMessage("city is required"),
  body("target").optional().trim().isLength({ min: 2 }).withMessage("target must be at least 2 chars"),
];
