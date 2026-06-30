import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  type: { type: String, enum: ["debt", "payment"], required: true },
  description: { type: String, required: true },
  remaining_amount: { type: Number, default: 0 },
  payment_method: { type: String, enum: ["Nakit", "Kredi Kartı", "IBAN/EFT", "cash", "credit_card", "transfer"], default: "Nakit" },
  staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
});

const cariSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    entity_type: { type: String, enum: ["customer", "supplier"], required: true, index: true },
    entity_id: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    total_debt: { type: Number, default: 0 },
    total_paid: { type: Number, default: 0 },
    total_balance: { type: Number, default: 0 },
    transactions: [transactionSchema],
  },
  { timestamps: true }
);

cariSchema.index({ business_id: 1, entity_id: 1 }, { unique: true });
cariSchema.index({ business_id: 1, total_balance: -1 });

export const Cari = mongoose.model("Cari", cariSchema);
