import { Business } from "../models/Business.js";
import { Appointment } from "../models/Appointment.js";

/**
 * Belirli bir tarih ve hizmet süresi için işletmenin müsait saat dilimlerini hesaplar
 * @param {string} businessId - İşletme ID'si
 * @param {string|Date} date - Randevu tarihi (ISO string veya Date objesi)
 * @param {number} serviceDuration - Hizmet süresi (dakika cinsinden)
 * @returns {Promise<string[]>} Müsait saat dilimleri listesi (örn: ["09:00", "09:45", "10:30"])
 */
export async function getAvailableSlots(businessId, date, serviceDuration) {
  // Tarihi Date objesine çevir
  const targetDate = new Date(date);
  const dayName = targetDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

  // İşletmenin çalışma saatlerini getir - try both _id and business_id
  let business = await Business.findOne({ _id: businessId });
  if (!business) {
    business = await Business.findOne({ business_id: businessId });
  }

  // Fallback working hours if business or workingHours not found
  const defaultWorkingHours = {
    monday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    tuesday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    wednesday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    thursday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    friday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    saturday: { isClosed: false, open: "09:00", close: "18:00", breaks: [{ start: "12:00", end: "13:00" }] },
    sunday: { isClosed: true, open: "09:00", close: "18:00", breaks: [] },
  };

  const workingHours = business?.workingHours || defaultWorkingHours;

  if (!workingHours || !workingHours[dayName]) {
    return [];
  }

  const daySchedule = workingHours[dayName];

  // Eğer dükkan kapalıysa boş array döndür
  if (daySchedule.isClosed) {
    return [];
  }

  // Tarihin başlangıç ve bitiş saatlerini oluştur (sadece tarih kısmı)
  const dateStart = new Date(targetDate);
  dateStart.setHours(0, 0, 0, 0);
  const dateEnd = new Date(targetDate);
  dateEnd.setHours(23, 59, 59, 999);

  // O tarihteki mevcut randevuları getir (onaylanmış, bekleyen veya engellenmiş)
  // Use the actual business_id from the business object for appointment query
  const actualBusinessId = business?.business_id || businessId;
  const existingAppointments = await Appointment.find({
    business_id: actualBusinessId,
    starts_at: { $gte: dateStart, $lte: dateEnd },
    status: { $in: ["pending", "approved", "blocked"] },
  });

  // Çalışma saatlerini dakika cinsinden hesapla
  const openMinutes = timeToMinutes(daySchedule.open);
  const closeMinutes = timeToMinutes(daySchedule.close);

  // Molaları dakika cinsinden hesapla
  const breakRanges = daySchedule.breaks.map((breakTime) => ({
    start: timeToMinutes(breakTime.start),
    end: timeToMinutes(breakTime.end),
  }));

  // Mevcut randevuları dakika cinsinden aralıklara çevir
  const appointmentRanges = existingAppointments.map((apt) => ({
    start: dateToMinutes(apt.starts_at),
    end: dateToMinutes(apt.ends_at),
  }));

  const availableSlots = [];

  // Açılış saatinden kapanış saatine kadar slot oluştur
  for (let currentMinutes = openMinutes; currentMinutes + serviceDuration <= closeMinutes; currentMinutes += 15) {
    const slotEnd = currentMinutes + serviceDuration;

    // Slotun molalarla çakışıp çakışmadığını kontrol et
    const overlapsWithBreak = breakRanges.some((breakRange) => {
      return hasOverlap(currentMinutes, slotEnd, breakRange.start, breakRange.end);
    });

    // Slotun mevcut randevularla çakışıp çakışmadığını kontrol et
    const overlapsWithAppointment = appointmentRanges.some((aptRange) => {
      return hasOverlap(currentMinutes, slotEnd, aptRange.start, aptRange.end);
    });

    // Çakışma yoksa müsait slot olarak ekle
    if (!overlapsWithBreak && !overlapsWithAppointment) {
      availableSlots.push(minutesToTime(currentMinutes));
    }
  }

  return availableSlots;
}

/**
 * "HH:MM" formatındaki zamanı gün başından itibaren dakika cinsinden çevirir
 * @param {string} timeStr - "09:00" formatında zaman
 * @returns {number} Dakika cinsinden değer (örn: 540)
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Dakika değerini "HH:MM" formatına çevirir
 * @param {number} minutes - Dakika cinsinden değer
 * @returns {string} "HH:MM" formatında zaman
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

/**
 * Date objesini gün başından itibaren dakika cinsinden çevirir
 * @param {Date} date - Date objesi
 * @returns {number} Dakika cinsinden değer
 */
function dateToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * İki zaman aralığının çakışıp çakışmadığını kontrol eder
 * @param {number} start1 - İlk aralığın başlangıcı (dakika)
 * @param {number} end1 - İlk aralığın bitişi (dakika)
 * @param {number} start2 - İkinci aralığın başlangıcı (dakika)
 * @param {number} end2 - İkinci aralığın bitişi (dakika)
 * @returns {boolean} Çakışma varsa true
 */
function hasOverlap(start1, end1, start2, end2) {
  // Çakışma varsa: (start1 < end2) && (end1 > start2)
  return start1 < end2 && end1 > start2;
}
