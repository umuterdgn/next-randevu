import { Router } from "express";
import bcrypt from "bcryptjs";
import { Agent } from "../models/Agent.js";
import { Business } from "../models/Business.js";
import { User } from "../models/User.js";
import { NexaFinance } from "../models/NexaFinance.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import { sendWhatsAppMessage } from "../services/whatsapp.service.js";
import { loginAgent } from "../services/auth.service.js";

const router = Router();

// Agent login
router.post("/login", asyncHandler(async (req, res) => {
  try {
    const result = await loginAgent(req.body);

    // Set cross-domain cookie for production
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      data: {
        _id: result.user._id,
        name: result.user.name,
        email: result.user.email,
        commission_rate: result.user.commission_rate,
        token: result.token,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 401).json({
      success: false,
      message: error.message || "Geçersiz email veya şifre"
    });
  }
}));

// Agent register new business
router.post("/register-business", asyncHandler(async (req, res) => {
  try {
    console.log("DEBUG: Register business request received:", req.body);

    const {
      business_name,
      business_sector,
      owner_name,
      owner_email,
      owner_password,
      owner_phone,
      amount,
      payment_method,
      agent_id,
      plan,
    } = req.body;

    console.log("DEBUG: Extracted fields:", {
      business_name,
      business_sector,
      owner_name,
      owner_email,
      owner_password: owner_password ? "****" : "MISSING",
      owner_phone,
      amount,
      payment_method,
      agent_id,
      plan
    });

    // Verify agent exists
    const agent = await Agent.findById(agent_id);
    if (!agent) {
      console.error("ERROR: Agent not found:", agent_id);
      return res.status(404).json({ success: false, message: "Bayi bulunamadı" });
    }
    console.log("DEBUG: Agent found:", agent._id);

    // Generate URL-friendly slug from business name
    const generateSlug = (name) => {
      const turkishMap = {
        'ç': 'c', 'Ç': 'C',
        'ğ': 'g', 'Ğ': 'G',
        'ı': 'i', 'İ': 'I',
        'ö': 'o', 'Ö': 'O',
        'ş': 's', 'Ş': 'S',
        'ü': 'u', 'Ü': 'U'
      };
      return name
        .split('')
        .map(char => turkishMap[char] || char)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
    };

    const slug = generateSlug(business_name);
    console.log("DEBUG: Generated slug:", slug);

    // Determine business status based on payment method
    const isCashPayment = payment_method === 'cash';
    const businessStatus = isCashPayment ? { is_active: true, payment_status: 'paid' } : { is_active: false, payment_status: 'pending' };

    // Create business with plan and agency_id
    const business = await Business.create({
      business_id: `BIZ-${Date.now()}`,
      name: business_name,
      slug: slug,
      sector: business_sector,
      email: owner_email,
      phone: owner_phone,
      theme_color: "#3B82F6",
      plan: plan || "physical",
      extraFeatures: {},
      agency_id: agent._id, // Link business to the agent
      ...businessStatus,
    });
    console.log("DEBUG: Business created successfully:", { _id: business._id, business_id: business.business_id, name: business.name });

    // Create business user
    // IMPORTANT: Role must be "business" for agent-created businesses (Super Admin is "owner")
    // Hash password explicitly with bcrypt
    const hashedPassword = await bcrypt.hash(owner_password, 10);
    console.log("DEBUG: Password hashed successfully");

    const user = await User.create({
      business_id: business.business_id, // Use string business_id, not ObjectId
      business_ref: business._id, // Also store ObjectId reference
      name: owner_name,
      email: owner_email,
      password: hashedPassword,
      phone: owner_phone,
      role: "business_admin", // Use business_admin role for agent-created businesses
    });
    console.log("DEBUG: User created successfully:", { _id: user._id, email: user.email, role: user.role, business_id: user.business_id });

    // Send WhatsApp welcome message to business owner
    try {
      const welcomeMessage = `Merhaba ${business_name}, Nexa platformuna hoş geldiniz! Sisteminiz başarıyla kurulmuştur.`;
      await sendWhatsAppMessage(owner_phone, welcomeMessage);
    } catch (whatsappError) {
      // Don't crash the system if WhatsApp fails, just log the error
      console.error("WhatsApp message sending failed (non-critical):", whatsappError.message);
    }

    // Handle cash vs credit card payment
    if (isCashPayment) {
      // Cash payment: record sale immediately, no payment link
      const commission_amount = amount * agent.commission_rate;
      console.log("DEBUG: Calculating commission:", { amount, commission_rate: agent.commission_rate, commission_amount });

      // Map payment_method to Turkish enum values
      const paymentMethodMap = {
        'cash': 'Nakit',
        'credit_card': 'Kredi Kartı',
        'iban': 'IBAN/EFT'
      };
      const mappedPaymentMethod = paymentMethodMap[payment_method] || 'Nakit';

      let nexaFinance = null;
      try {
        nexaFinance = await NexaFinance.create({
          agent_id: agent._id,
          business_id: business.business_id, // Use string business_id
          amount,
          payment_method: mappedPaymentMethod,
          commission_amount,
          status: "completed",
        });
        console.log("DEBUG: NexaFinance record created successfully:", nexaFinance);
      } catch (financeError) {
        console.error("ERROR: NexaFinance creation failed:", financeError);
      }

      console.log("DEBUG: Sending cash payment success response");
      res.status(201).json({
        success: true,
        message: "Nakit ödeme alındı, hesap aktifleştirildi.",
        data: {
          business,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          nexaFinance,
        },
      });
    } else {
      // Credit card payment: generate payment link, no sale record yet
      const payment_link = `https://tamvaktinde.com.tr/checkout?biz_id=${business._id}&plan=${plan || 'physical'}&agent_id=${agent_id}`;
      console.log("DEBUG: Generated payment link:", payment_link);

      console.log("DEBUG: Sending credit card payment response");
      res.status(201).json({
        success: true,
        data: {
          business,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          payment_link,
        },
      });
    }
  } catch (error) {
    console.error("🔴 REGISTER BUSINESS ERROR DETAILS:", {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack,
      errors: error.errors
    });

    // Handle specific error cases
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern || {})[0] || 'bilinmeyen alan';
      console.error("ERROR: Duplicate key error for field:", field);
      return res.status(400).json({
        success: false,
        message: `Bu ${field} zaten kullanımda. Lütfen farklı bir değer deneyin.`
      });
    }

    if (error.name === 'ValidationError') {
      console.error("ERROR: Validation error:", error.errors);
      return res.status(400).json({
        success: false,
        message: `Doğrulama hatası: ${Object.values(error.errors || {}).map(e => e.message).join(', ')}`
      });
    }

    console.error("ERROR: Unknown error occurred:", error);
    res.status(500).json({ 
      success: false, 
      message: `İşletme kaydı sırasında hata oluştu: ${error.message}` 
    });
  }
}));

// Get agent's sales history
router.get("/sales/:agentId", asyncHandler(async (req, res) => {
  const sales = await NexaFinance.find({ agent_id: req.params.agentId })
    .populate("agent_id", "name email")
    .sort({ createdAt: -1 });

  // Manually fetch business details to avoid ObjectId casting issues
  const businessIds = [...new Set(sales.map(s => s.business_id).filter(Boolean))];
  const businesses = await Business.find({
    business_id: { $in: businessIds }
  });

  const businessMap = new Map();
  businesses.forEach(b => {
    businessMap.set(b._id.toString(), b);
    businessMap.set(b.business_id, b);
  });

  const salesWithBusiness = sales.map(sale => ({
    ...sale.toObject(),
    business: businessMap.get(sale.business_id) || { name: 'Unknown', sector: 'Unknown' }
  }));

  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commission_amount, 0);

  res.json({
    success: true,
    data: {
      sales: salesWithBusiness,
      totalSales,
      totalCommission,
    },
  });
}));

// Super Admin: Get all sales
router.get("/admin/all-sales", asyncHandler(async (req, res) => {
  try {
    const sales = await NexaFinance.find()
      .populate("agent_id", "name email phone")
      .sort({ createdAt: -1 });

    // Manually fetch business details to avoid ObjectId casting issues
    const businessIds = [...new Set(sales.map(s => s.business_id).filter(Boolean))];
    const businesses = await Business.find({
      business_id: { $in: businessIds }
    });

    const businessMap = new Map();
    businesses.forEach(b => {
      businessMap.set(b._id.toString(), b);
      businessMap.set(b.business_id, b);
    });

    const salesWithBusiness = sales.map(sale => ({
      ...sale.toObject(),
      business: businessMap.get(sale.business_id) || { name: 'Unknown', sector: 'Unknown' }
    }));

    console.log("DEBUG: Sales from database:", sales);
    console.log("DEBUG: Sales count:", sales.length);

    const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission_amount, 0);

    console.log("DEBUG: Total sales:", totalSales);
    console.log("DEBUG: Total commission:", totalCommission);

    res.json({
      success: true,
      data: {
        sales,
        totalSales,
        totalCommission,
      },
    });
  } catch (error) {
    console.error("Get all sales error:", error);
    res.status(500).json({ success: false, message: "Satış verileri çekilirken hata oluştu" });
  }
}));

// Super Admin: Get all agents
router.get("/admin/agents", asyncHandler(async (req, res) => {
  try {
    const agents = await Agent.find().select("-password").sort({ createdAt: -1 });
    console.log("DEBUG: Agents from database:", agents);
    console.log("DEBUG: Agents count:", agents.length);
    res.json({ success: true, data: agents });
  } catch (error) {
    console.error("Get all agents error:", error);
    res.status(500).json({ success: false, message: "Bayi listesi çekilirken hata oluştu" });
  }
}));

// Super Admin: Create agent
router.post("/admin/agents", asyncHandler(async (req, res) => {
  try {
    const { name, email, password, phone, commission_rate } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const agent = await Agent.create({
      name,
      email,
      password: hashedPassword,
      phone,
      commission_rate: commission_rate || 0.1,
    });

    res.status(201).json({ success: true, data: agent });
  } catch (error) {
    console.error("Create agent error:", error);
    res.status(500).json({ success: false, message: "Bayi oluşturma sırasında hata oluştu" });
  }
}));

// Super Admin: Update agent
router.put("/admin/agents/:id", asyncHandler(async (req, res) => {
  try {
    const { name, email, phone, commission_rate, is_active } = req.body;
    
    const agent = await Agent.findByIdAndUpdate(
      req.params.id,
      { name, email, phone, commission_rate, is_active },
      { new: true }
    ).select("-password");

    res.json({ success: true, data: agent });
  } catch (error) {
    console.error("Update agent error:", error);
    res.status(500).json({ success: false, message: "Bayi güncelleme sırasında hata oluştu" });
  }
}));

// Super Admin: Delete agent
router.delete("/admin/agents/:id", asyncHandler(async (req, res) => {
  try {
    await Agent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Bayi başarıyla silindi" });
  } catch (error) {
    console.error("Delete agent error:", error);
    res.status(500).json({ success: false, message: "Bayi silme sırasında hata oluştu" });
  }
}));

// Get agent's businesses
router.get("/:agentId/businesses", asyncHandler(async (req, res) => {
  try {
    const { agentId } = req.params;

    // Verify agent exists
    const agent = await Agent.findById(agentId);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Bayi bulunamadı" });
    }

    // Get all businesses linked to this agent
    const businesses = await Business.find({ agency_id: agentId })
      .select("-google_calendar_tokens -whatsapp_token -whatsapp_phone_number_id")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: businesses,
      count: businesses.length
    });
  } catch (error) {
    console.error("Get agent businesses error:", error);
    res.status(500).json({ success: false, message: "Bayi işletmeleri çekilirken hata oluştu" });
  }
}));

export default router;
