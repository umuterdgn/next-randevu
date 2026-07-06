import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { NexaFinance } from "../models/NexaFinance.js";

export const getAllBusinesses = async () => Business.find().sort({ createdAt: -1 });

export const getOwnerStats = async () => {
  const [totalBusinesses, sectorDistribution, users, aiUsage, salesData] = await Promise.all([
    Business.countDocuments(),
    Business.aggregate([{ $group: { _id: "$sector", count: { $sum: 1 } } }]),
    User.aggregate([{ $group: { _id: "$is_active", count: { $sum: 1 } } }]),
    Business.aggregate([{ $group: { _id: null, total: { $sum: "$ai_usage_count" } } }]),
    NexaFinance.aggregate([
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$amount" },
          totalCommission: { $sum: "$commission_amount" },
          totalTransactions: { $sum: 1 }
        }
      }
    ])
  ]);

  const activeUsers = users.find((x) => x._id === true)?.count || 0;
  const inactiveUsers = users.find((x) => x._id === false)?.count || 0;

  return {
    totalBusinesses,
    sectorDistribution,
    users: { active: activeUsers, inactive: inactiveUsers },
    totalAiUsage: aiUsage[0]?.total || 0,
    sales: {
      totalSales: salesData[0]?.totalSales || 0,
      totalCommission: salesData[0]?.totalCommission || 0,
      totalTransactions: salesData[0]?.totalTransactions || 0
    }
  };
};
