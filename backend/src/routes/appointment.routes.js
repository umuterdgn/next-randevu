import { Router } from "express";
import { Appointment } from "../models/Appointment.js";
import { Business } from "../models/Business.js";
import { createEvents } from "ics";
import axios from "axios";

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

/**
 * PUT /api/appointments/:id/cancel
 * Cancel an appointment
 */
router.put("/:id/cancel", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { status: "cancelled" },
      { new: true }
    );

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Randevu bulunamadı"
      });
    }

    res.json({
      success: true,
      message: "Randevu başarıyla iptal edildi",
      data: appointment
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Randevu iptal edilirken bir hata oluştu",
      error: error.message,
    });
  }
});

/**
 * PUT /:id/reschedule
 * Reschedule an appointment with new date and time
 */
router.put("/:id/reschedule", async (req, res) => {
  try {
    const { id } = req.params;
    const { newDate, newTime } = req.body;

    if (!newDate || !newTime) {
      return res.status(400).json({
        success: false,
        message: "newDate and newTime are required"
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Randevu bulunamadı"
      });
    }

    // Parse new date and time
    const [hours, minutes] = newTime.split(':');
    const newStartDateTime = new Date(newDate);
    newStartDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Calculate end time based on service duration
    const durationMs = appointment.ends_at - appointment.starts_at;
    const newEndDateTime = new Date(newStartDateTime.getTime() + durationMs);

    // Update appointment
    const updatedAppointment = await Appointment.findByIdAndUpdate(
      id,
      {
        starts_at: newStartDateTime,
        ends_at: newEndDateTime,
        status: "pending" // Reset to pending for business approval
      },
      { new: true }
    );

    res.json({
      success: true,
      message: "Randevu başarıyla ertelendi",
      data: updatedAppointment
    });
  } catch (error) {
    console.error("Error rescheduling appointment:", error.message);
    res.status(500).json({
      success: false,
      message: "Randevu ertelenirken bir hata oluştu",
      error: error.message,
    });
  }
});

/**
 * GET /:id/ics
 * Download appointment as ICS file
 */
router.get("/:id/ics", async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).send("Appointment not found");
    }

    const business = await Business.findOne({ business_id: appointment.business_id });
    if (!business) {
      return res.status(404).send("Business not found");
    }

    const startDate = new Date(appointment.starts_at);
    const endDate = new Date(appointment.ends_at);

    const event = {
      start: [
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        startDate.getDate(),
        startDate.getHours(),
        startDate.getMinutes()
      ],
      duration: { minutes: Math.round((endDate - startDate) / (1000 * 60)) },
      title: `${business.name} - ${appointment.service_type || "Randevu"}`,
      description: `Müşteri: ${appointment.customer_phone}\nRandevu ID: ${appointment._id}`,
      location: business.address || business.name || "",
      status: appointment.status === "completed" ? "CONFIRMED" : "TENTATIVE",
      organizer: {
        name: business.name,
        email: business.email || "noreply@tamvaktinde.com.tr"
      }
    };

    const { error, value } = createEvents([event]);
    if (error) {
      console.error("ICS creation error:", error);
      return res.status(500).send("Error creating calendar file");
    }

    res.set("Content-Type", "text/calendar");
    res.set("Content-Disposition", `attachment; filename="randevu_${id}.ics"`);
    res.send(value);
  } catch (error) {
    console.error("Appointment ICS download error:", error);
    res.status(500).send("Server error");
  }
});

export default router;
