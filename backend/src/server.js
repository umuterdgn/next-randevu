import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const port = process.env.PORT || 5000;

const bootstrap = async () => {
  await connectDB();

  const ownerEmail = process.env.SAAS_OWNER_EMAIL || "owner@saas.com";
  const existing = await User.findOne({ email: ownerEmail });
  if (!existing) {
    const hashedPassword = await bcrypt.hash(process.env.SAAS_OWNER_PASSWORD || "Owner123!", 10);
    await User.create({
      business_id: "saas_root",
      name: "SaaS Owner",
      email: ownerEmail,
      password: hashedPassword,
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
