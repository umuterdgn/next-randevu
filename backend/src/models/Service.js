import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: false },
    currency: { type: String, default: "TRY" },
    description: { type: String, required: false },
    critical_points: { type: String, required: false },
    process_steps: { type: String, required: false },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ business_id: 1, name: 1 }, { unique: true });
serviceSchema.index({ business_id: 1, is_active: 1 });

export const Service = mongoose.model("Service", serviceSchema);
