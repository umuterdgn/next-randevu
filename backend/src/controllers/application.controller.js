import {
  listApplications,
  submitApplication,
  updateApplicationStatus,
} from "../services/application.service.js";
import { logAudit } from "../services/audit.service.js";

export const createApplication = async (req, res) => {
  const app = await submitApplication(req.body);
  await logAudit({
    business_id: req.user?.business_id || "saas_root",
    user_id: req.user?._id || null,
    action: "APPLICATION_CREATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 201,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { application_id: app._id },
  });
  res.status(201).json(app);
};

export const getApplications = async (_req, res) => {
  const apps = await listApplications();
  res.json(apps);
};

export const patchApplicationStatus = async (req, res) => {
  const result = await updateApplicationStatus(req.params.id, req.body.status, req.body.plan);
  await logAudit({
    business_id: req.user?.business_id || "saas_root",
    user_id: req.user?._id || null,
    action: "APPLICATION_STATUS_UPDATED",
    method: req.method,
    path: req.originalUrl,
    status_code: 200,
    ip: req.ip || "",
    user_agent: req.headers["user-agent"] || "",
    meta: { application_id: req.params.id, status: req.body.status, plan: req.body.plan },
  });
  res.json(result);
};
