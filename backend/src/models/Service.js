import mongoose from "mongoose";

const serviceSchema = new mongoose.Schema(
  {
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: false, index: true },
    business_id: { type: String, required: false },
    name: { type: String, required: true },
    duration: { type: Number, required: true },
    price: { type: Number, required: false },
    currency: { type: String, default: "TRY" },
    description: { type: String, required: false },
    critical_points: { type: String, required: false },
    process_steps: { type: String, required: false },
    is_active: { type: Boolean, default: true },
    is_online: { type: Boolean, default: false },
    consumed_products: [
      {
        product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, required: true },
      }
    ],
  },
  { timestamps: true }
);

serviceSchema.index({ business_id: 1, name: 1 }, { unique: true });
serviceSchema.index({ business_id: 1, is_active: 1 });

export const Service = mongoose.model("Service", serviceSchema);
