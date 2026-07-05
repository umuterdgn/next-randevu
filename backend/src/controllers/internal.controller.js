import { Business } from "../models/Business.js";
import { Agent } from "../models/Agent.js";
import { NexaFinance } from "../models/NexaFinance.js";

export const activateAccount = async (req, res) => {
  try {
    const { business_id, plan, amount, payment_method, agent_id, type, credits_amount } = req.body;

    // Find business
    const business = await Business.findById(business_id);
    if (!business) {
      return res.status(404).json({ success: false, message: "İşletme bulunamadı" });
    }

    // Handle AI Credits purchase
    if (type === 'ai_credits') {
      const creditsToAdd = credits_amount || 50; // Default 50 credits
      business.ai_campaign_credits += creditsToAdd;
      await business.save();

      return res.status(200).json({ 
        success: true, 
        message: `${creditsToAdd} kredi başarıyla yüklendi`,
        creditsAdded: creditsToAdd,
        currentCredits: business.ai_campaign_credits
      });
    }

    // Handle subscription activation (default behavior)
    business.is_active = true;
    business.payment_status = "paid";
    business.plan = plan || business.plan;
    await business.save();

    // Process agent commission if agent_id is provided
    if (agent_id) {
      const agent = await Agent.findById(agent_id);
      if (!agent) {
        return res.status(404).json({ success: false, message: "Bayi bulunamadı" });
      }

      const commission_amount = amount * agent.commission_rate;

      // Create sale record
      await NexaFinance.create({
        agent_id: agent._id,
        business_id: business._id,
        amount,
        payment_method,
        commission_amount,
        status: "completed",
      });
    }

    res.status(200).json({ success: true, message: "Hesap başarıyla aktifleştirildi" });
  } catch (error) {
    console.error("Activate account error:", error);
    res.status(500).json({ success: false, message: "Hesap aktivasyonu sırasında hata oluştu" });
  }
};
