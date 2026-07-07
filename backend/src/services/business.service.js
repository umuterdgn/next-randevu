import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { Customer } from "../models/Customer.js";
import { RewardCode } from "../models/RewardCode.js";
import { Service } from "../models/Service.js";
import { createError } from "../utils/appError.js";

export const getDashboardStats = async (business_id) => {
  // Check if business_id is 'pending' (SSO user without business)
  if (!business_id || business_id === 'pending') {
    const error = createError("İşletme bulunamadı. Lütfen işletmenizi oluşturun.", 404);
    error.require_apply = true;
    throw error;
  }

  const now = new Date();
  const startDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Mongoose $or ObjectId hatasını engellemek için sadece business_id ile arıyoruz
  const business = await Business.findOne({ business_id });

  // If business not found, user needs to create one
  if (!business) {
    const error = createError("İşletme bulunamadı. Lütfen işletmenizi oluşturun.", 404);
    error.require_apply = true;
    throw error;
  }

  const [total, grouped, daily, monthly, topServices, retentionData, appointmentTrend] = await Promise.all([
    Appointment.countDocuments({ business_id }),
    Appointment.aggregate([{ $match: { business_id } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Appointment.countDocuments({ business_id, createdAt: { $gte: startDay } }),
    Appointment.countDocuments({ business_id, createdAt: { $gte: startMonth } }),
    Appointment.aggregate([
      { $match: { business_id, status: "completed" } },
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
    Appointment.aggregate([
      {
        $match: {
          business_id,
          status: { $in: ["completed", "approved"] },
          starts_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$starts_at" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
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
    appointment_trend: appointmentTrend,
    slug: business?.slug || "",
  };
};

export const getServices = async (business_id) => {
  const services = await Service.find({ business_id });
  return services;
};

export const createService = async (business_id, payload) => {
  const business = await Business.findOne({ business_id });
  if (!business) throw createError("Business not found", 404);

  // Feature gating check for is_online
  if (payload.is_online === true) {
    const canUseOnline = business.plan === 'full' || business.plan === 'online' || business.extraFeatures?.onlineUnlocked;
    if (!canUseOnline) {
      throw createError("Bu özellik mevcut paketinizde bulunmamaktadır. Lütfen paketinizi yükseltin.", 403);
    }
  }

  return Service.create({ ...payload, businessId: business._id, business_id: business.business_id });
};

export const updateService = async (business_id, serviceId, payload) => {
  // Feature gating check for is_online
  if (payload.is_online === true) {
    const business = await Business.findOne({ business_id });
    if (!business) throw createError("Business not found", 404);

    const canUseOnline = business.plan === 'full' || business.plan === 'online' || business.extraFeatures?.onlineUnlocked;
    if (!canUseOnline) {
      throw createError("Bu özellik mevcut paketinizde bulunmamaktadır. Lütfen paketinizi yükseltin.", 403);
    }
  }

  const service = await Service.findOneAndUpdate(
    { _id: serviceId, business_id },
    { ...payload },
    { new: true, runValidators: true }
  );
  if (!service) throw createError("Service not found", 404);
  return service;
};

export const deleteService = async (business_id, serviceId) => {
  const service = await Service.findOneAndDelete({ _id: serviceId, business_id });
  if (!service) throw createError("Service not found", 404);
  return service;
};

export const getCustomers = async (business_id) => Customer.find({ business_id }).sort({ createdAt: -1 });

export const createCustomer = async (business_id, payload) => {
  const { phone, name, email } = payload;
  return Customer.findOneAndUpdate(
    { business_id, phone },
    { name, email, business_id },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

export const getAppointments = async (business_id, filters = {}) => {
  const { date, search, status } = filters;
  const query = { business_id };

  if (date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    query.starts_at = { $gte: startOfDay, $lte: endOfDay };
  }

  if (status) {
    query.status = status;
  }

  let appointmentsQuery = Appointment.find(query).populate("service_id").populate("customer_id").sort({ starts_at: 1 });

  if (search) {
    const searchRegex = new RegExp(search, "i");
    appointmentsQuery = appointmentsQuery.populate({
      path: "customer_id",
      match: { name: searchRegex },
    }).populate({
      path: "service_id",
      match: { name: searchRegex },
    });
  }

  const appointments = await appointmentsQuery.exec();

  if (search) {
    return appointments.filter((apt) => apt.customer_id || apt.service_id);
  }

  return appointments;
};

export const createAppointment = async (business_id, payload) => {
  const { customer_id, service_id, starts_at, ends_at, note, status, is_all_day } = payload;

  // Strict date validation before any database operations
  if (!starts_at || isNaN(new Date(starts_at).getTime())) {
    throw createError("Geçersiz başlangıç tarihi formatı", 400);
  }
  if (ends_at && isNaN(new Date(ends_at).getTime())) {
    throw createError("Geçersiz bitiş tarihi formatı", 400);
  }

  // For normal appointments (not blocked), validate customer and service
  if (status !== 'blocked' && customer_id && service_id) {
    const service = await Service.findOne({ _id: service_id, business_id });
    if (!service) throw createError("Service not found", 404);

    const customer = await Customer.findOne({ _id: customer_id, business_id });
    if (!customer) throw createError("Customer not found", 404);

    const start = new Date(starts_at);
    const end = ends_at ? new Date(ends_at) : new Date(start.getTime() + service.duration_minutes * 60000);

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
      status: status || "pending",
      note: note || "",
    });
    return appointment;
  }

  // For blocked appointments (no customer or service required)
  const start = new Date(starts_at);
  const end = ends_at ? new Date(ends_at) : new Date(start.getTime() + 60 * 60000);

  const appointment = await Appointment.create({
    business_id,
    customer_id: customer_id || null,
    service_id: service_id || null,
    starts_at: start,
    ends_at: end,
    status: status || "blocked",
    note: note || "",
    is_all_day: is_all_day || false,
  });
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

export const updateBusinessSettings = async (business_id, settings) => {
  const business = await Business.findOneAndUpdate(
    { business_id },
    settings,
    { returnDocument: 'after' }
  );
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