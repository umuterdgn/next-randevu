import mongoose from "mongoose";

const customerSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    visit_count: { type: Number, default: 0 },
    loyalty_points: { type: Number, default: 0 },
  },
  { timestamps: true }
);

customerSchema.index({ business_id: 1, phone: 1 }, { unique: true });
customerSchema.index(
  { business_id: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string", $ne: "" } } }
);
customerSchema.index({ business_id: 1, visit_count: -1 });

export const Customer = mongoose.model("Customer", customerSchema);
