import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    action: { type: String, required: true, trim: true, index: true },
    method: { type: String, required: true, trim: true },
    path: { type: String, required: true, trim: true, index: true },
    status_code: { type: Number, required: true, min: 100, max: 599, index: true },
    ip: { type: String, default: "" },
    user_agent: { type: String, default: "" },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

auditLogSchema.index({ business_id: 1, createdAt: -1 });
auditLogSchema.index({ user_id: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
