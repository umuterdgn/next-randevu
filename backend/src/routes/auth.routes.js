import { Router } from "express";
import { login } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { loginRules } from "../validators/auth.validators.js";

const router = Router();

router.post("/login", validate(loginRules), asyncHandler(login));

export default router;
