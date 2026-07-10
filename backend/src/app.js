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
import calendarRoutes from "./routes/calendar.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import internalRoutes from "./routes/internal.routes.js";
import supportRoutes from "./routes/support.routes.js";

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://tamvaktinde.com.tr',
  'https://www.tamvaktinde.com.tr',
  'https://nxa.com.tr',
  'http://localhost:5173',
  'http://localhost:5174'
];

app.use(cors({
  origin: function (origin, callback) {
    // Eğer origin yoksa (Postman vb.), listede varsa VEYA bir Vercel test linkiyse izin ver
    if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation at origin: ' + origin));
    }
  },
  credentials: true
}));

// Body parser'ı önce tanımla (webhook için gerekli)
app.use(express.json({ limit: "100kb" }));

// Morgan logger'ı webhook'tan önce tanımla ki loglar görünsün
app.use(morgan("dev"));

// Webhook rotasını helmet'ten önce tanımla
app.use("/api/webhook", webhookRoutes);

// Internal S2S routes (no auth, secret key validation in route)
app.use("/api/internal", internalRoutes);

app.use(helmet());
app.use(apiUsageLogger);

// Herkese Açık (Public) Rotalar
app.use("/api/auth", authRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/calendar", calendarRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// KARIŞIK ROTA: Hem public (Başvuru) hem gizli (Onaylama) işlemleri var.
// O yüzden kilidi burada değil, dosyanın kendi içinde uygulayacağız.
app.use("/api/applications", appRoutes);

// TAMAMEN GİZLİ ROTALAR (requireAuth'u sadece bunlara veriyoruz)
app.use("/api/owner", requireAuth, ownerRoutes);
app.use("/api/business", requireAuth, businessRoutes);
app.use("/api/ai", requireAuth, aiRoutes);
app.use("/api/business", requireAuth, financeRoutes);
app.use("/api/payment", requireAuth, paymentRoutes);
app.use("/api/support", supportRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
