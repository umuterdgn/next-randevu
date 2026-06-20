import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { RewardCode } from "../models/RewardCode.js";
import { Service } from "../models/Service.js";
import { createError } from "../utils/appError.js";

export const getDashboardStats = async (business_id) => {
  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total, grouped, daily, monthly, topServices, retentionData] = await Promise.all([
    Appointment.countDocuments({ business_id }),
    Appointment.aggregate([{ $match: { business_id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.countDocuments({ business_id, createdAt: { $gte: startDay } }),
    Appointment.countDocuments({ business_id, createdAt: { $gte: startMonth } }),
    Appointment.aggregate([
      { $match: { business_id } },
      { $group: { _id: "$service_id", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "services", localField: "_id", foreignField: "_id", as: "service" } },
      { $unwind: "$service" },
      { $project: { _id: 0, service: "$service.name", count: 1 } },
    ]),
    Customer.aggregate([
      { $match: { business_id } },
      { $group: { _id: null, total: { $sum: 1 }, returning: { $sum: { $cond: [{ $gt: ["$visit_count", 1] }, 1, 0] } } } },
    ]),
  ]);

  const statusCounts = { pending: 0, approved: 0, rejected: 0, completed: 0, cancelled: 0 };
  grouped.forEach((item) => {
    statusCounts[item._id] = item.count;
  });

  const retention = retentionData[0]?.total ? (retentionData[0].returning / retentionData[0].total) * 100 : 0;
  return {
    total_appointments: total,
    statuses: statusCounts,
    daily_appointments: daily,
    monthly_appointments: monthly,
    most_used_services: topServices,
    customer_retention_rate: Number(retention.toFixed(2)),
  };
};

export const getServices = async (business_id) => Service.find({ business_id });
export const createService = async (business_id, payload) => Service.create({ ...payload, business_id });

export const getCustomers = async (business_id) => Customer.find({ business_id }).sort({ createdAt: -1 });
export const createCustomer = async (business_id, payload) => Customer.create({ ...payload, business_id });

export const getAppointments = async (business_id) =>
  Appointment.find({ business_id }).populate("service_id").populate("customer_id").sort({ starts_at: 1 });

export const createAppointment = async (business_id, payload) => {
  const { customer_id, service_id, starts_at, note } = payload;
  const service = await Service.findOne({ _id: service_id, business_id });
  if (!service) throw createError("Service not found", 404);

  const customer = await Customer.findOne({ _id: customer_id, business_id });
  if (!customer) throw createError("Customer not found", 404);

  const start = new Date(starts_at);
  if (Number.isNaN(start.getTime())) throw createError("Invalid starts_at date", 400);
  const end = new Date(start.getTime() + service.duration_minutes * 60000);

  const overlap = await Appointment.findOne({
    business_id,
    status: { $in: ["pending", "approved"] },
    starts_at: { $lt: end },
    ends_at: { $gt: start },
  });
  if (overlap) throw createError("Time slot already booked", 409);

  const appointment = await Appointment.create({
    business_id,
    customer_id,
    service_id,
    starts_at: start,
    ends_at: end,
    note: note || "",
  });

  await Customer.updateOne({ _id: customer_id, business_id }, { $inc: { visit_count: 1, loyalty_points: 10 } });
  return appointment;
};

export const updateAppointmentStatus = async (business_id, appointmentId, status) => {
  const appointment = await Appointment.findOneAndUpdate(
    { _id: appointmentId, business_id },
    { status },
    { new: true }
  );
  if (!appointment) throw createError("Appointment not found", 404);
  return appointment;
};

export const updateRewardThreshold = async (business_id, reward_threshold) => {
  const business = await Business.findOneAndUpdate({ business_id }, { reward_threshold }, { new: true });
  if (!business) throw createError("Business not found", 404);
  return business;
};

export const generateRewardCode = async (business_id, customerId) => {
  const business = await Business.findOne({ business_id });
  const customer = await Customer.findOne({ _id: customerId, business_id });
  if (!customer || !business) throw createError("Customer not found", 404);
  if (customer.loyalty_points < business.reward_threshold) {
    throw createError("Insufficient loyalty points", 400);
  }

  const code = `RW-${Date.now().toString(36).toUpperCase()}`;
  const reward = await RewardCode.create({ business_id, customer_id: customer._id, code });
  customer.loyalty_points = 0;
  await customer.save();
  return reward;
};
