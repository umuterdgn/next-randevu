import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: false },
    customer_phone: { type: String, trim: true },
    service_id: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: false },
    service_type: { type: String, trim: true },
    staff_id: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },
    starts_at: { type: Date, required: true, index: true },
    ends_at: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "cancelled", "blocked", "confirmed"],
      default: "pending",
    },
    note: { type: String, default: "" },
    is_all_day: { type: Boolean, default: false },
    payment_status: {
      type: String,
      enum: ["paid", "unpaid"],
      default: "unpaid",
    },
    meet_url: { type: String, default: "" },
  },
  { timestamps: true }
);

appointmentSchema.index({ business_id: 1, starts_at: 1, ends_at: 1 });
appointmentSchema.index({ business_id: 1, status: 1, starts_at: 1 });
appointmentSchema.index({ business_id: 1, customer_id: 1, createdAt: -1 });
appointmentSchema.index({ business_id: 1, service_id: 1, createdAt: -1 });

export const Appointment = mongoose.model("Appointment", appointmentSchema);
