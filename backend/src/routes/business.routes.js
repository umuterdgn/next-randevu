import { Router } from "express";
import {
  addAppointment,
  addCustomer,
  addService,
  createRewardCode,
  dashboard,
  listAppointments,
  listCustomers,
  listServices,
  patchAppointmentStatus,
  patchRewardThreshold,
} from "../controllers/business.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";
import { validate } from "../middleware/validate.js";
import {
  createAppointmentRules,
  createCustomerRules,
  createServiceRules,
  generateRewardRules,
  updateAppointmentStatusRules,
  updateThresholdRules,
} from "../validators/business.validators.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "staff"), requireTenant);

router.get("/dashboard", asyncHandler(dashboard));
router.get("/services", asyncHandler(listServices));
router.post("/services", validate(createServiceRules), asyncHandler(addService));
router.get("/customers", asyncHandler(listCustomers));
router.post("/customers", validate(createCustomerRules), asyncHandler(addCustomer));
router.get("/appointments", asyncHandler(listAppointments));
router.post("/appointments", validate(createAppointmentRules), asyncHandler(addAppointment));
router.patch(
  "/appointments/:id/status",
  validate(updateAppointmentStatusRules),
  asyncHandler(patchAppointmentStatus)
);
router.patch("/loyalty/threshold", validate(updateThresholdRules), asyncHandler(patchRewardThreshold));
router.post(
  "/loyalty/generate/:customerId",
  validate(generateRewardRules),
  asyncHandler(createRewardCode)
);

export default router;
