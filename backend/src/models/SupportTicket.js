import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_name: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "resolved", "closed"],
      default: "pending",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
  },
  { timestamps: true }
);

supportTicketSchema.index({ business_id: 1, status: 1, createdAt: -1 });

export const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
