import { Router } from "express";
import {
  addAppointment,
  addCustomer,
  addService,
  createRewardCode,
  dashboard,
  deleteServiceController,
  listAppointments,
  listCustomers,
  listServices,
  patchAppointmentStatus,
  patchRewardThreshold,
  updateServiceController,
  updateBusinessSettingsController,
  listStaff,
  addStaff,
  updateStaff,
  deleteStaff,
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
router.use(requireAuth, requireRole("admin", "staff", "business"), requireTenant);

router.get("/dashboard", asyncHandler(dashboard));
router.get("/services", asyncHandler(listServices));
router.post("/services", validate(createServiceRules), asyncHandler(addService));
router.put("/services/:id", validate(createServiceRules), asyncHandler(updateServiceController));
router.delete("/services/:id", asyncHandler(deleteServiceController));
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
router.put("/settings", asyncHandler(updateBusinessSettingsController));
router.get("/staff", asyncHandler(listStaff));
router.post("/staff", asyncHandler(addStaff));
router.put("/staff/:id", asyncHandler(updateStaff));
router.delete("/staff/:id", asyncHandler(deleteStaff));

export default router;
