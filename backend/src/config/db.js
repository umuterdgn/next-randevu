import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI is required");

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB_NAME || "saas_appointments",
  });
};
