import dotenv from 'dotenv';
dotenv.config();
import { google } from 'googleapis';

export const getGoogleAuthUrl = (businessId) => {
  // Eğer env okunamazsa hata atmasın diye kontrol ekle
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback';

  if (!clientId) {
    console.error("KRİTİK: GOOGLE_CLIENT_ID .env dosyasında bulunamadı!");
    return "#error_client_id_missing";
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/calendar.events'],
    state: businessId.toString()
  });
};

export const createGoogleEvent = async (tokens, appointment) => {
  console.log('[Google API] createGoogleEvent called');
  console.log('[Google API] Appointment data:', appointment);

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/calendar/callback';

  console.log('[Google API] Setting up OAuth2 client...');
  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  oauth2Client.setCredentials(tokens);
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const event = {
    summary: `Nexa: ${appointment.serviceName}`,
    description: `Müşteri Telefon: ${appointment.phone}`,
    start: { dateTime: appointment.starts_at, timeZone: 'Europe/Istanbul' },
    end: { dateTime: appointment.ends_at, timeZone: 'Europe/Istanbul' },
    conferenceDataVersion: 1,
    conferenceData: {
      createRequest: {
        requestId: 'req-' + Date.now(),
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  };

  console.log('[Google API] Event object to be sent:', JSON.stringify(event, null, 2));

  console.log('[Google API] Calling calendar.events.insert with conferenceDataVersion parameter...');
  const response = await calendar.events.insert({
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: event
  });

  console.log('[Google API] Insert response received');
  console.log('[Google API] Response data:', JSON.stringify(response.data, null, 2));

  return response;
};
