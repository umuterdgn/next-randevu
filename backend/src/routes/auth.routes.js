import { Router } from "express";
import { login, forgotPassword, resetPassword } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { loginRules } from "../validators/auth.validators.js";

const router = Router();

router.post("/login", validate(loginRules), asyncHandler(login));
router.post("/forgot-password", asyncHandler(forgotPassword));
router.put("/reset-password/:token", asyncHandler(resetPassword));

export default router;
