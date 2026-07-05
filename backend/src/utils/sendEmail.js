import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  // Senin .env dosyasındaki değişken isimleriyle tam eşleşme
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // 587 portu için false kullanılır
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const message = {
    from: `"Next Randevu" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // HTML formatında mail atılmasına karşı garanti önlem:
    html: options.html || options.message, 
  };

  await transporter.sendMail(message);
};