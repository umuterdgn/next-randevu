import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, default: "" },
    reward_threshold: { type: Number, default: 100, min: 1 },
    ai_usage_count: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

businessSchema.index({ sector: 1 });
businessSchema.index({ is_active: 1 });
businessSchema.index({ ai_usage_count: -1 });
businessSchema.index({ createdAt: -1 });

export const Business = mongoose.model("Business", businessSchema);
