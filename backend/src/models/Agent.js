import mongoose from "mongoose";

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    commission_rate: {
      type: Number,
      default: 0.1, // 10% default commission
    },
  },
  {
    timestamps: true,
  }
);

agentSchema.index({ email: 1 });

export const Agent = mongoose.model("Agent", agentSchema);
