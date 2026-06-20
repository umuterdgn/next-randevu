import { Router } from "express";
import { listBusinesses, stats } from "../controllers/owner.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole, requireSaasOwner } from "../middleware/auth.js";
import {
  updateBusinessStatus,
  deleteBusiness,
} from "../controllers/owner.controller.js";

const router = Router();

router.use(requireRole("owner"), requireSaasOwner);

router.get("/businesses", asyncHandler(listBusinesses));

router.get("/stats", asyncHandler(stats));

router.patch("/businesses/:id/status", updateBusinessStatus);
router.delete("/businesses/:id", asyncHandler(deleteBusiness));

export default router;
