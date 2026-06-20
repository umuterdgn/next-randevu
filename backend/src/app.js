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

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json({ limit: "100kb" }));
app.use(apiUsageLogger);

// Herkese Açık (Public) Rotalar
app.use("/api/auth", authRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// KARIŞIK ROTA: Hem public (Başvuru) hem gizli (Onaylama) işlemleri var.
// O yüzden kilidi burada değil, dosyanın kendi içinde uygulayacağız.
app.use("/api/applications", appRoutes);

// TAMAMEN GİZLİ ROTALAR (requireAuth'u sadece bunlara veriyoruz)
app.use("/api/owner", requireAuth, ownerRoutes);
app.use("/api/business", requireAuth, businessRoutes);
app.use("/api/ai", requireAuth, aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
