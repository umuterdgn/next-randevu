import { Router } from "express";
import { Appointment } from "../models/Appointment.js";

const router = Router();

/**
 * GET /api/appointments/:businessId
 * Get all appointments for a specific business
 * Sorted by date and time (nearest first)
 */
router.get("/:businessId", async (req, res) => {
  try {
    const { businessId } = req.params;

    const appointments = await Appointment.find({ business_id: businessId })
      .sort({ starts_at: 1 })
      .exec();

    res.json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({
      success: false,
      message: "Randevular getirilirken bir hata oluştu",
      error: error.message,
    });
  }
});

export default router;
