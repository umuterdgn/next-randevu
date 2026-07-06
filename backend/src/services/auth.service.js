import { User } from "../models/User.js";
import { Agent } from "../models/Agent.js";
import { createError } from "../utils/appError.js";
import { signToken } from "../utils/jwt.js";
import bcrypt from "bcryptjs";

// 1. Normal Kullanıcı (Owner / Business) Girişi
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  const token = signToken({
    id: user._id,
    role: user.role,
    business_id: user.business_id,
  });

  user.password = undefined;

  return { user, token };
};

// 2. Bayi (Agent) Girişi
export const loginAgent = async ({ email, password }) => {
  const agent = await Agent.findOne({ email, is_active: true }).select("+password");

  if (!agent) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  const isMatch = await bcrypt.compare(password, agent.password);
  if (!isMatch) {
    throw createError("E-posta veya şifre hatalı!", 401);
  }

  const token = signToken({
    id: agent._id,
    role: "agent",
    business_id: agent.business_id || null,
  });

  agent.password = undefined;

  return { user: agent, token };
};
