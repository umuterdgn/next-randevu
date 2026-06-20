import { logAudit } from "../services/audit.service.js";

export const apiUsageLogger = (req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const isApi = req.originalUrl?.startsWith("/api/");
    if (!isApi) return;

    void logAudit({
      business_id: req.user?.business_id || "saas_root",
      user_id: req.user?._id || null,
      action: "API_USAGE",
      method: req.method,
      path: req.originalUrl,
      status_code: res.statusCode,
      ip: req.ip || "",
      user_agent: req.headers["user-agent"] || "",
      meta: { duration_ms: Date.now() - startedAt },
    }).catch(() => {});
  });
  next();
};
