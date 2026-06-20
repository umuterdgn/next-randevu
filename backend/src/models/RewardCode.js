import mongoose from "mongoose";

const rewardCodeSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, index: true },
    business_ref: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null,
      index: true,
    },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    code: { type: String, required: true },
    used_at: { type: Date, default: null },
  },
  { timestamps: true }
);

rewardCodeSchema.index({ business_id: 1, code: 1 }, { unique: true });
rewardCodeSchema.index({ business_id: 1, customer_id: 1, createdAt: -1 });
rewardCodeSchema.index({ business_id: 1, used_at: 1 });

export const RewardCode = mongoose.model("RewardCode", rewardCodeSchema);
