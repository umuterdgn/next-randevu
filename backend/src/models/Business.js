import mongoose from "mongoose";

const businessSchema = new mongoose.Schema(
  {
    business_id: { type: String, required: true, unique: true, index: true },
    slug: { type: String, unique: true, index: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    city: { type: String, default: "" },
    address: { type: String, default: "" },
    about_text: { type: String, default: "" },
    map_url: { type: String, default: "" },
    reward_threshold: { type: Number, default: 10, min: 1 },
    loyalty_symbol: { type: String, default: '⭐' },
    is_loyalty_enabled: { type: Boolean, default: true },
    theme_color: { type: String, default: "#3B82F6" },
    ai_usage_count: { type: Number, default: 0, min: 0 },
    ai_campaign_credits: { type: Number, default: 5, min: 0 },
    logo_url: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
    whatsapp_token: { type: String, default: "" },
    whatsapp_phone_number_id: { type: String, default: "" },
    wa_phone_number_id: { type: String, trim: true },

    workingHours: {
      monday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      tuesday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      wednesday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      thursday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      friday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      saturday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
      sunday: {
        isClosed: { type: Boolean, default: false },
        open: { type: String, default: "09:00" },
        close: { type: String, default: "18:00" },
        breaks: [{ start: { type: String, default: "12:00" }, end: { type: String, default: "13:00" } }],
      },
    },
    bookingSettings: {
      bufferTime: { type: Number, default: 10 },
      maxConcurrent: { type: Number, default: 1 },
      slotInterval: { type: Number, default: 30 },
      cancellationBuffer: { type: Number, default: 120 }
    },
    auto_approve_appointments: { type: Boolean, default: true },
    integrations: {
      whatsappEnabled: { type: Boolean, default: true },
      googleCalendar: { type: Boolean, default: false },
      appleCalendar: { type: Boolean, default: false }
    },
    google_calendar_tokens: { type: Object },
    plan: {
      type: String,
      enum: ['physical', 'online', 'full'],
      default: 'physical'
    },
    extraFeatures: {
      onlineUnlocked: { type: Boolean, default: false },
      physicalUnlocked: { type: Boolean, default: false }
    }
  },
  { timestamps: true }

);

businessSchema.index({ sector: 1 });
businessSchema.index({ is_active: 1 });
businessSchema.index({ ai_usage_count: -1 });
businessSchema.index({ createdAt: -1 });

export const Business = mongoose.model("Business", businessSchema);
