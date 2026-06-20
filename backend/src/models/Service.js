import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    duration_minutes: { type: Number, required: true, min: 5 },
    price: { type: Number, default: 0, min: 0 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

serviceSchema.index({ business_id: 1, name: 1 }, { unique: true });
serviceSchema.index({ business_id: 1, is_active: 1 });

export const Service = mongoose.model("Service", serviceSchema);
