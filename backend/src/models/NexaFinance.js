import mongoose from "mongoose";

const nexaFinanceSchema = new mongoose.Schema(
  {
    agent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Agent",
      required: true,
    },
    business_id: {
      type: String, // Changed from ObjectId to String to avoid casting issues
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    payment_method: {
      type: String,
      enum: ["Nakit", "Kredi Kartı", "IBAN/EFT"],
      default: "Nakit",
    },
    commission_amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "completed",
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

nexaFinanceSchema.index({ agent_id: 1 });
nexaFinanceSchema.index({ business_id: 1 });
nexaFinanceSchema.index({ createdAt: -1 });

export const NexaFinance = mongoose.model("NexaFinance", nexaFinanceSchema);
