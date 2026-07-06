import { Router } from "express";
import { listBusinesses, stats } from "../controllers/owner.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireRole, requireSaasOwner } from "../middleware/auth.js";
import {
  updateBusinessStatus,
  deleteBusiness,
  updateBusinessPlan,
} from "../controllers/owner.controller.js";
import { getSales } from "../services/owner.service.js";

const router = Router();

router.use(requireRole("owner"), requireSaasOwner);

router.get("/businesses", asyncHandler(listBusinesses));

router.get("/stats", asyncHandler(stats));

router.get("/sales", asyncHandler(async (req, res) => {
  try {
    const sales = await getSales();
    res.json({ success: true, data: sales });
  } catch (error) {
    console.error("Owner API Error - sales:", error.message, error.stack);
    res.status(500).json({ success: false, message: "Satış verileri çekilirken hata oluştu." });
  }
}));

router.patch("/businesses/:id/status", updateBusinessStatus);
router.patch("/businesses/:id/plan", asyncHandler(updateBusinessPlan));
router.delete("/businesses/:id", asyncHandler(deleteBusiness));

export default router;
