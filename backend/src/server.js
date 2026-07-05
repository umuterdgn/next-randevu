import dotenv from "dotenv";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { User } from "./models/User.js";
import { Business } from "./models/Business.js";
import { Service } from "./models/Service.js";
import bcrypt from "bcryptjs";
import path from "path";
import { fileURLToPath } from "url";
import { startCronJobs } from "./services/cron.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const port = process.env.PORT || 5000;

const bootstrap = async () => {
  // Request logger middleware
  app.use((req, res, next) => {
    if (req.method === 'POST') console.log(`📡 [GLOBAL LOG] İSTEK GELDİ: ${req.method} ${req.url}`);
    next();
  });
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

  // Seed Business - deterministic seeding with upsert
  console.log("📦 Ensuring seed business exists...");
  const nexaStudio = await Business.findOneAndUpdate(
    { business_id: "nexa_studio" },
    {
      business_id: "nexa_studio",
      slug: "kuti",
      name: "Nexa Studio",
      sector: "Kuaför/Güzellik",
      phone: "+905555555555",
      email: "info@nexastudio.com",
      city: "İstanbul",
      wa_phone_number_id: "1120300507841864",
      workingHours: {
        monday: { isClosed: false, open: "09:00", close: "18:00", breaks: [] },
        tuesday: { isClosed: false, open: "09:00", close: "18:00", breaks: [] },
        wednesday: { isClosed: false, open: "09:00", close: "18:00", breaks: [] },
        thursday: { isClosed: false, open: "09:00", close: "18:00", breaks: [] },
        friday: { isClosed: false, open: "09:00", close: "18:00", breaks: [] },
        saturday: { isClosed: false, open: "10:00", close: "15:00", breaks: [] },
        sunday: { isClosed: true, open: "09:00", close: "18:00", breaks: [] },
      },
    },
    { upsert: true, new: true }
  );
  console.log("✅ İşletme hazır. _id:", nexaStudio._id);

  // Sync User business_id with the new Business._id
  console.log("🔄 Kullanıcı business_id senkronizasyonu...");
  const updatedUser = await User.findOneAndUpdate(
    { email: "kuti@gmail.com" },
    { business_id: nexaStudio._id.toString() },
    { new: true }
  );
  if (updatedUser) {
    console.log("✅ Kullanıcı business_id güncellendi:", updatedUser.business_id);
  } else {
    console.log("⚠️ kuti@gmail.com kullanıcısı bulunamadı");
  }

  // Migrate existing services to new businessId
  console.log("🔄 Mevcut servislerin businessId alanı güncelleniyor...");
  const serviceUpdateResult = await Service.updateMany(
    { business_id: "nexa_studio" },
    { businessId: nexaStudio._id }
  );
  console.log(`✅ ${serviceUpdateResult.modifiedCount} servis güncellendi.`);

  // Seed Services for Nexa Studio
  console.log("📦 Checking services for Nexa Studio...");
  const serviceCount = await Service.countDocuments({ business_id: "nexa_studio" });
  if (serviceCount === 0) {
    const svc1 = new Service({
      name: "Saç Kesimi",
      duration: 30,
      price: 300,
      businessId: nexaStudio._id,
      business_id: "nexa_studio"
    });
    const svc2 = new Service({
      name: "Saç Boyama",
      duration: 60,
      price: 800,
      businessId: nexaStudio._id,
      business_id: "nexa_studio"
    });
    await svc1.save();
    await svc2.save();
    console.log("✅ Hizmetler başarıyla eklendi.");
  } else {
    console.log("✅ Hizmetler zaten mevcut, atlanıyor.");
  }

  // Start cron jobs for appointment reminders
  startCronJobs();

  // Only listen to port in non-production (local) environment
  if (process.env.NODE_ENV !== 'production') {
    app.listen(port, () => {
      console.log(`Backend running on http://localhost:${port}`);
    });
  }
};

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

process.on('uncaughtException', (err) => console.error('🔥 ÖLÜMCÜL HATA (Uncaught):', err));
process.on('unhandledRejection', (err) => console.error('🔥 ÖLÜMCÜL HATA (Promise):', err));

// Export app for Vercel serverless functions
export default app;
