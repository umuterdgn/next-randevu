import { Router } from "express";
import { generateCampaignController, generateImageController } from "../controllers/ai.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateCampaignRules } from "../validators/ai.validators.js";

const router = Router();

router.post(
  "/campaign",
  requireAuth,
  requireRole("admin", "staff", "business", "owner", "business_owner", "superadmin"),
  validate(generateCampaignRules),
  asyncHandler(generateCampaignController)
);

router.post(
  "/campaigns",
  requireAuth,
  requireRole("admin", "staff", "business", "owner", "business_owner", "superadmin"),
  validate(generateCampaignRules),
  asyncHandler(generateCampaignController)
);

router.post(
  "/generate-image",
  requireAuth,
  requireRole("admin", "staff", "business", "owner", "business_owner", "superadmin"),
  asyncHandler(generateImageController)
);

export default router;
