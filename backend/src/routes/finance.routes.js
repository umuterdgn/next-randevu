import { Router } from "express";
import mongoose from "mongoose";
import { Transaction } from "../models/Transaction.js";
import { Cari } from "../models/Cari.js";
import { Customer } from "../models/Customer.js";
import { Supplier } from "../models/Supplier.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { requireTenant } from "../middleware/tenant.js";

const router = Router();
router.use(requireAuth, requireRole("admin", "staff", "business"), requireTenant);

router.get("/finance", asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ business_id: req.business_id }).sort({ createdAt: -1 });
  res.json(transactions);
}));

router.post("/finance", asyncHandler(async (req, res) => {
  const { type, amount, description, payment_method, staff_id } = req.body;
  const transaction = await Transaction.create({
    business_id: req.business_id,
    type,
    amount,
    description,
    payment_method: payment_method || "Nakit",
    staff_id: staff_id || null,
  });
  res.status(201).json(transaction);
}));

// Supplier routes
router.get("/suppliers", asyncHandler(async (req, res) => {
  const suppliers = await Supplier.find({ business_id: req.business_id }).sort({ createdAt: -1 });
  res.json(suppliers);
}));

router.post("/suppliers", asyncHandler(async (req, res) => {
  const { name, phone, email, address, note } = req.body;
  const supplier = await Supplier.create({
    business_id: req.business_id,
    name,
    phone,
    email,
    address,
    note,
  });
  res.status(201).json(supplier);
}));

router.delete("/suppliers/:id", asyncHandler(async (req, res) => {
  await Supplier.findOneAndDelete({ _id: req.params.id, business_id: req.business_id });
  res.json({ success: true });
}));

// Cari routes
router.get("/cari", asyncHandler(async (req, res) => {
  const cari = await Cari.find({ business_id: req.business_id }).sort({ total_balance: -1 });
  res.json(cari);
}));

router.get("/cari/:entityType/:entityId", asyncHandler(async (req, res) => {
  const { entityType, entityId } = req.params;
  const cari = await Cari.findOne({ 
    business_id: req.business_id, 
    entity_type: entityType, 
    entity_id: entityId 
  });
  if (!cari) {
    return res.json({ 
      total_debt: 0, 
      total_paid: 0, 
      total_balance: 0, 
      transactions: [],
      entity_type: entityType,
      entity_id: entityId
    });
  }
  res.json(cari);
}));

router.post("/cari/debt", asyncHandler(async (req, res) => {
  // Temporary cleanup: Drop old index if it exists
  try {
    await mongoose.model('Cari').collection.dropIndex('business_id_1_customer_id_1');
  } catch (e) {
    // Index doesn't exist or other error, ignore
  }

  const { entity_type, entity_id, amount, description } = req.body;

  // Validate required fields
  if (!entity_type || !entity_id) {
    return res.status(400).json({
      error: "ValidationError",
      message: "entity_type and entity_id are required",
      received: { entity_type, entity_id }
    });
  }

  let cari = await Cari.findOne({
    business_id: req.business_id,
    entity_type,
    entity_id
  });
  if (!cari) {
    cari = await Cari.create({
      business_id: req.business_id,
      entity_type,
      entity_id,
      total_debt: 0,
      total_paid: 0,
      total_balance: 0,
      transactions: [],
    });
  }

  cari.total_debt += amount;
  cari.total_balance = cari.total_debt - cari.total_paid;
  cari.transactions.push({
    date: new Date(),
    amount,
    type: "debt",
    description: description || "Borç kaydı",
    remaining_amount: amount,
  });
  await cari.save();

  res.json(cari);
}));

router.post("/cari/payment", asyncHandler(async (req, res) => {
  const { entity_type, entity_id, amount, payment_method, description, debt_date, target_debt_id, staff_id } = req.body;

  // Validate required fields
  if (!entity_type || !entity_id) {
    return res.status(400).json({
      error: "ValidationError",
      message: "entity_type and entity_id are required",
      received: { entity_type, entity_id }
    });
  }

  let cari = await Cari.findOne({
    business_id: req.business_id,
    entity_type,
    entity_id
  });
  if (!cari) {
    cari = await Cari.create({
      business_id: req.business_id,
      entity_type,
      entity_id,
      total_debt: 0,
      total_paid: 0,
      total_balance: 0,
      transactions: [],
    });
  }

  // Build description based on whether this is a debt payment
  let paymentDescription = description;
  if (debt_date) {
    const dateObj = new Date(debt_date);
    const formattedDate = dateObj.toLocaleDateString('tr-TR');
    paymentDescription = `${formattedDate} tarihli borç ödemesi`;
  } else {
    paymentDescription = description || `Ödeme alındı - ${payment_method}`;
  }

  // If target_debt_id is provided, deduct from that specific debt's remaining_amount
  if (target_debt_id) {
    const targetDebt = cari.transactions.id(target_debt_id);
    if (targetDebt && targetDebt.type === 'debt') {
      targetDebt.remaining_amount -= amount;
      if (targetDebt.remaining_amount < 0) {
        targetDebt.remaining_amount = 0;
      }
    }
  }

  cari.total_paid += amount;
  cari.total_balance = cari.total_debt - cari.total_paid;
  cari.transactions.push({
    date: new Date(),
    amount,
    type: "payment",
    description: paymentDescription,
    payment_method: payment_method || "Nakit",
    staff_id,
  });
  await cari.save();

  await Transaction.create({
    business_id: req.business_id,
    type: entity_type === "supplier" ? "expense" : "income",
    amount,
    description: paymentDescription,
    payment_method: payment_method || "Nakit",
    staff_id,
  });

  res.json(cari);
}));

router.delete("/cari/transaction/:cariId/:transactionId", asyncHandler(async (req, res) => {
  const { cariId, transactionId } = req.params;
  
  const cari = await Cari.findOne({ 
    _id: cariId, 
    business_id: req.business_id 
  });
  
  if (!cari) {
    return res.status(404).json({ 
      error: "NotFound", 
      message: "Cari record not found" 
    });
  }

  // Find the transaction to get its details before deletion
  const transaction = cari.transactions.id(transactionId);
  
  if (!transaction) {
    return res.status(404).json({ 
      error: "NotFound", 
      message: "Transaction not found" 
    });
  }

  // Store transaction details
  const transactionType = transaction.type;
  const transactionAmount = transaction.amount;

  // Remove the transaction from the array
  cari.transactions.pull(transactionId);

  // Update totals based on transaction type
  if (transactionType === "debt") {
    cari.total_debt -= transactionAmount;
  } else if (transactionType === "payment") {
    cari.total_paid -= transactionAmount;
  }

  // Recalculate balance
  cari.total_balance = cari.total_debt - cari.total_paid;

  await cari.save();

  res.json(cari);
}));

export default router;
