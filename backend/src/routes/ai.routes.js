import { Router } from "express";
import { generateCampaignController } from "../controllers/ai.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { generateCampaignRules } from "../validators/ai.validators.js";

const router = Router();

router.post(
  "/campaign",
  requireAuth,
  requireRole("owner", "admin"),
  validate(generateCampaignRules),
  asyncHandler(generateCampaignController)
);

router.post(
  "/campaigns",
  requireAuth,
  requireRole("owner", "admin"),
  validate(generateCampaignRules),
  asyncHandler(generateCampaignController)
);

export default router;
