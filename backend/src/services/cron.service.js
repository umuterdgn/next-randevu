import cron from 'node-cron';
import { Appointment } from '../models/Appointment.js';
import { Business } from '../models/Business.js';
import axios from 'axios';

/**
 * Start the reminder cron job
 * Runs every minute to check for appointments that need reminders
 */
export const startCronJobs = () => {
  console.log('🕐 Cron job başlatılıyor: Randevu hatırlatıcı sistemi aktif...');

  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      const fortyMinutesLater = new Date(now.getTime() + 40 * 60 * 1000);
      const fortyOneMinutesLater = new Date(now.getTime() + 41 * 60 * 1000);

      console.log('🔍 Randevu hatırlatıcı kontrolü çalışıyor...');

      // Find appointments that are 40-41 minutes away and are confirmed/pending
      const appointments = await Appointment.find({
        starts_at: { $gte: fortyMinutesLater, $lte: fortyOneMinutesLater },
        status: { $in: ['confirmed', 'pending'] },
        reminder_sent: { $ne: true } // Only send if reminder not already sent
      });

      console.log(`📊 ${appointments.length} randevu için hatırlatıcı gönderilecek.`);

      for (const appointment of appointments) {
        try {
          // Manually fetch business to avoid ObjectId casting issues
          const business = await Business.findOne({
            $or: [
              { _id: appointment.business_id },
              { business_id: appointment.business_id }
            ]
          });
          if (!business) continue;

          // Format phone number
          let cleanPhone = appointment.customer_phone.replace(/[^0-9]/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = '90' + cleanPhone.substring(1);

          const msg = `Merhaba! ⏳ Hatırlatma: ${business.name} işletmesindeki randevunuzun başlamasına yaklaşık 40 dakika kalmıştır. Sizi bekliyoruz!\n\nDetaylar: https://tamvaktinde.com.tr/randevu/${appointment._id}`;

          await axios.post(
            `https://graph.facebook.com/v17.0/${process.env.WA_PHONE_NUMBER_ID}/messages`,
            {
              messaging_product: 'whatsapp',
              to: cleanPhone,
              type: 'text',
              text: { body: msg }
            },
            {
              headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` }
            }
          );

          console.log(`✅ Hatırlatıcı gönderildi: ${appointment._id} - ${cleanPhone}`);

          // Mark reminder as sent
          await Appointment.findByIdAndUpdate(appointment._id, { reminder_sent: true });
        } catch (err) {
          console.error(`❌ Hatırlatıcı gönderme hatası (${appointment._id}):`, err.response?.data || err.message);
        }
      }
    } catch (error) {
      console.error('❌ Cron job hatası:', error);
    }
  });

  console.log('✅ Cron job başarıyla başlatıldı.');
};
