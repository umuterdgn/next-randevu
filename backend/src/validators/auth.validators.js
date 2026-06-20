import { body } from "express-validator";

export const loginRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 chars"),
];
