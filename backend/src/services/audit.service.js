import { AuditLog } from "../models/AuditLog.js";

const normalizeBusinessId = (businessId) => businessId || "saas_root";

export const logAudit = async ({
  business_id,
  user_id = null,
  action,
  method = "SYSTEM",
  path = "",
  status_code = 200,
  ip = "",
  user_agent = "",
  meta = {},
}) => {
  await AuditLog.create({
    business_id: normalizeBusinessId(business_id),
    user_id,
    action,
    method,
    path,
    status_code,
    ip,
    user_agent,
    meta,
  });
};
