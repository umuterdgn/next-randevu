import { Router } from "express";
import {
  createApplication,
  getApplications,
  patchApplicationStatus,
} from "../controllers/application.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  requireAuth,
  requireRole,
  requireSaasOwner,
} from "../middleware/auth.js"; // requireAuth EKLENDİ
import { validate } from "../middleware/validate.js";
import {
  createApplicationRules,
  updateApplicationStatusRules,
} from "../validators/application.validators.js";

const router = Router();

// 1. BAŞVURU YAPMA (POST) - HERKESE AÇIK
router.post(
  "/",
  validate(createApplicationRules),
  asyncHandler(createApplication),
);

// 2. BAŞVURULARI GÖRÜNTÜLEME (GET) - GİZLİ
// requireAuth eklendi! Önce tokeni çözecek, sonra role bakacak.
router.get(
  "/",
  requireAuth,
  requireRole("owner"),
  requireSaasOwner,
  asyncHandler(getApplications),
);

// 3. BAŞVURU ONAYLAMA/REDDETME (PATCH) - GİZLİ
// requireAuth eklendi!
router.patch(
  "/:id/status",
  requireAuth,
  requireRole("owner"),
  requireSaasOwner,
  validate(updateApplicationStatusRules),
  asyncHandler(patchApplicationStatus),
);

export default router;
