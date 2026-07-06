import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: "" },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["owner", "admin", "staff", "business", "business_admin"], default: "admin" },
    is_active: { type: Boolean, default: true },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    sso_plan_type: { type: String, default: "physical" }, // Store plan type from SSO
  },
  { timestamps: true }
);

// Pre-save hook removed - passwords must be explicitly hashed before saving
// to avoid double hashing when using bcrypt.hash explicitly in routes

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.getResetPasswordToken = function getResetPasswordToken() {
  const resetToken = crypto.randomBytes(20).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
  return resetToken;
};

userSchema.index({ business_id: 1, email: 1 }, { unique: true });
userSchema.index({ business_id: 1, role: 1, is_active: 1 });

export const User = mongoose.model("User", userSchema);