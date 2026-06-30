import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: false },
    email: { type: String, required: false },
    address: { type: String, required: false },
    note: { type: String, required: false },
  },
  { timestamps: true }
);

supplierSchema.index({ business_id: 1, name: 1 });

export const Supplier = mongoose.model("Supplier", supplierSchema);
