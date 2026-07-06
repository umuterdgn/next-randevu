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

    // Verify agent exists
    const agent = await Agent.findById(agent_id);
    if (!agent) {
      return res.status(404).json({ success: false, message: "Bayi bulunamadı" });
    }

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

    // Determine business status based on payment method
    const isCashPayment = payment_method === 'cash';
    const businessStatus = isCashPayment ? { is_active: true, payment_status: 'paid' } : { is_active: false, payment_status: 'pending' };

    // Create business with plan
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
      ...businessStatus,
    });

    // Create business user
    // IMPORTANT: Role must be "business" for agent-created businesses (Super Admin is "owner")
    // Hash password explicitly with bcrypt
    const hashedPassword = await bcrypt.hash(owner_password, 10);
    const user = await User.create({
      business_id: business._id,
      name: owner_name,
      email: owner_email,
      password: hashedPassword,
      phone: owner_phone,
      role: "business",
    });
    console.log("DEBUG: User created successfully:", { _id: user._id, email: user.email, role: user.role });

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
      let nexaFinance = null;
      try {
        nexaFinance = await NexaFinance.create({
          agent_id: agent._id,
          business_id: business._id,
          amount,
          payment_method,
          commission_amount,
          status: "completed",
        });
        console.log("DEBUG: NexaFinance record created successfully:", nexaFinance);
      } catch (financeError) {
        console.error("ERROR: NexaFinance creation failed:", financeError);
      }

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
      const payment_link = `https://nxa.com.tr/checkout?biz_id=${business._id}&plan=${plan || 'physical'}&agent_id=${agent_id}`;

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
    console.error("Register business error:", error);
    res.status(500).json({ success: false, message: "İşletme kaydı sırasında hata oluştu" });
  }
}));

// Get agent's sales history
router.get("/sales/:agentId", asyncHandler(async (req, res) => {
  const sales = await NexaFinance.find({ agent_id: req.params.agentId })
    .populate("agent_id", "name email")
    .populate("business_id", "name sector")
    .sort({ createdAt: -1 });
  
  const totalSales = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commission_amount, 0);

  res.json({
    success: true,
    data: {
      sales,
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
      .populate("business_id", "name sector")
      .sort({ createdAt: -1 });

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

export default router;
