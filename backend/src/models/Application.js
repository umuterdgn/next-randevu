import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    business_id: {
      type: String,
      required: true,
      default: "saas_root",
      index: true,
    },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    business_name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    
    // YENİ EKLENEN KISIM: Kullanıcının belirlediği şifreyi tutacağımız alan
    password: { type: String, required: true }, 
    
    sector: { type: String, required: true, trim: true },
    city: { type: String, default: "" },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ business_id: 1, status: 1, createdAt: -1 });
applicationSchema.index({ business_id: 1, email: 1 });
applicationSchema.index({ business_id: 1, sector: 1 });

export const Application = mongoose.model("Application", applicationSchema);