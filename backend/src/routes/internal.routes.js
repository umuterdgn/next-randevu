import { Router } from "express";
import { activateAccount } from "../controllers/internal.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

const router = Router();

// Secret key middleware
router.use((req, res, next) => {
  const secretKey = req.headers['x-nxa-secret-key'];
  if (secretKey !== process.env.NXA_SECRET_KEY) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  next();
});

// Activate account endpoint
router.post("/activate-account", asyncHandler(activateAccount));

export default router;
