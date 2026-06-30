import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    type: { type: String, enum: ["income", "expense"], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    payment_method: { type: String, enum: ["Nakit", "Kredi Kartı", "IBAN/EFT"], default: "Nakit" },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
  },
  { timestamps: true }
);

transactionSchema.index({ business_id: 1, createdAt: -1 });

export const Transaction = mongoose.model("Transaction", transactionSchema);
