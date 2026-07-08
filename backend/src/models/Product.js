import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true },
    name: { type: String, required: true }, 
    stock: { type: Number, required: true, default: 0 }, 
    unit: { type: String, required: true, default: "adet" },
  },
  { timestamps: true }
);

export const Product = mongoose.model("Product", productSchema);
