import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { apiUsageLogger } from "./middleware/apiUsageLogger.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/auth.routes.js";
import appRoutes from "./routes/applications.routes.js";
import ownerRoutes from "./routes/owner.routes.js";
import businessRoutes from "./routes/business.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import financeRoutes from "./routes/finance.routes.js";
import agentRoutes from "./routes/agent.routes.js";
import webhookRoutes from "./routes/webhook.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));

// Body parser'ı önce tanımla (webhook için gerekli)
app.use(express.json({ limit: "100kb" }));

// Morgan logger'ı webhook'tan önce tanımla ki loglar görünsün
app.use(morgan("dev"));

// Webhook rotasını helmet'ten önce tanımla
app.use("/api/whatsapp", webhookRoutes);

app.use(helmet());
app.use(apiUsageLogger);

// Herkese Açık (Public) Rotalar
app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// KARIŞIK ROTA: Hem public (Başvuru) hem gizli (Onaylama) işlemleri var.
// O yüzden kilidi burada değil, dosyanın kendi içinde uygulayacağız.
app.use("/api/applications", appRoutes);

// TAMAMEN GİZLİ ROTALAR (requireAuth'u sadece bunlara veriyoruz)
app.use("/api/owner", requireAuth, ownerRoutes);
app.use("/api/business", requireAuth, businessRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/business", requireAuth, financeRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
