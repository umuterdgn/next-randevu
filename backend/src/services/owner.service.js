import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { NexaFinance } from "../models/NexaFinance.js";

export const getAllBusinesses = async () => {
  try {
    // Get businesses as plain JSON objects
    const businesses = await Business.find().lean().sort({ createdAt: -1 });

    // Get business IDs
    const businessIds = businesses.map(b => b.business_id);

    // Get users (owners) for these businesses
    const users = await User.find({ business_id: { $in: businessIds } }).lean();

    // Manually join businesses with their owners
    const formattedBusinesses = businesses.map(biz => {
      const owner = users.find(u => u.business_id === biz.business_id);
      return {
        ...biz,
        ownerDetails: owner || null
      };
    });

    return formattedBusinesses;
  } catch (error) {
    console.error("Owner Service Error - getAllBusinesses:", error.message, error.stack);
    throw error;
  }
};

export const getOwnerStats = async () => {
  try {
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
  } catch (error) {
    console.error("Owner Service Error - getOwnerStats:", error.message, error.stack);
    throw error;
  }
};

export const getSales = async () => {
  try {
    // Get sales as plain JSON objects
    const sales = await NexaFinance.find().lean().sort({ createdAt: -1 });

    // Get business IDs from sales
    const salesBusinessIds = sales.map(s => s.business_id).filter(Boolean);

    // Get related businesses
    const relatedBusinesses = await Business.find({ business_id: { $in: salesBusinessIds } }).lean();

    // Manually join sales with businesses
    const formattedSales = sales.map(sale => {
      const biz = relatedBusinesses.find(b => b.business_id === sale.business_id);
      return {
        ...sale,
        businessDetails: biz || null
      };
    });

    return formattedSales;
  } catch (error) {
    console.error("Owner Service Error - getSales:", error.message, error.stack);
    throw error;
  }
};
