import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["staff", "dealer"], required: true },
    phone: { type: String },
    email: { type: String },
    password: { type: String, required: true },
    working_hours: [
      {
        day: { type: String, enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], required: true },
        start_time: { type: String, required: true }, // Format: "09:00"
        end_time: { type: String, required: true }, // Format: "17:00"
        is_working: { type: Boolean, default: true },
      }
    ],
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

staffSchema.index({ business_id: 1, is_active: 1 });

export const Staff = mongoose.model("Staff", staffSchema);
