import mongoose from "mongoose";
import { Business } from "../src/models/Business.js";
import dotenv from "dotenv";

dotenv.config();

const updateCredits = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nexa");
    console.log("✅ Veritabanına bağlandı");

    // Update all businesses to have 5 AI credits
    const result = await Business.updateMany({}, { $set: { ai_campaign_credits: 5 } });
    console.log(`✅ ${result.modifiedCount} işletmenin kredisi başarıyla 5 olarak güncellendi`);

    // Close connection and exit
    await mongoose.disconnect();
    console.log("✅ Veritabanı bağlantısı kapatıldı");
    process.exit(0);
  } catch (error) {
    console.error("❌ Hata oluştu:", error);
    process.exit(1);
  }
};

updateCredits();
