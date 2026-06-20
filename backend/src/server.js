import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";

dotenv.config();

const port = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();

  const ownerEmail = process.env.SAAS_OWNER_EMAIL || "owner@saas.com";
  const existing = await User.findOne({ email: ownerEmail });
  if (!existing) {
    await User.create({
      business_id: "saas_root",
      name: "SaaS Owner",
      email: ownerEmail,
      password: process.env.SAAS_OWNER_PASSWORD || "Owner123!",
      role: "owner",
    });
  }

  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
};

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
