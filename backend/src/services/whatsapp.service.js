import axios from "axios";

/**
 * Send WhatsApp message via Meta Cloud API
 * @param {string} to - Phone number with country code (e.g., "905551234567")
 * @param {string} messageText - Message content
 * @returns {Promise<Object>} API response
 */
export const sendWhatsAppMessage = async (to, messageText) => {
  try {
    const url = `https://graph.facebook.com/v18.0/${process.env.WA_PHONE_NUMBER_ID}/messages`;
    
    const payload = {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: {
        body: messageText,
      },
    };

    const headers = {
      Authorization: `Bearer ${process.env.WA_TOKEN}`,
      "Content-Type": "application/json",
    };

    const response = await axios.post(url, payload, { headers });
    
    console.log("WhatsApp message sent successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("WhatsApp message sending failed:", error.response?.data || error.message);
    throw error;
  }
};
