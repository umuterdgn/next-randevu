import { Router } from "express";
import { createSupportTicket } from "../controllers/support.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";

const router = Router();

router.post("/", requireAuth, requireTenant, asyncHandler(createSupportTicket));

export default router;
