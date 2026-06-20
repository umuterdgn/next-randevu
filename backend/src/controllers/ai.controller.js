import { generateCampaign } from "../services/ai.service.js";
import { logAudit } from "../services/audit.service.js";

export const generateCampaignController = async (req, res) => {
  const { sector, city, target } = req.body;
  const data = await generateCampaign(sector, city, target, req.user?.business_id || null);
  await logAudit({
    business_id: req.user?.business_id || "saas_root",
    user_id: req.user?._id || null,
    action: "AI_CAMPAIGN_GENERATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { sector, city, target, source: data.source },
  });
  res.json(data);
};
