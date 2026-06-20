import jwt from "jsonwebtoken";
import { createError } from "./appError.js";

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw createError("JWT_SECRET must be set and at least 32 characters", 500);
  }
  return process.env.JWT_SECRET;
};

export const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    issuer: process.env.JWT_ISSUER || "saas-appointments",
    audience: process.env.JWT_AUDIENCE || "saas-appointments-client",
    algorithm: "HS256",
  });

export const verifyToken = (token) =>
  jwt.verify(token, getJwtSecret(), {
    issuer: process.env.JWT_ISSUER || "saas-appointments",
    audience: process.env.JWT_AUDIENCE || "saas-appointments-client",
    algorithms: ["HS256"],
  });
