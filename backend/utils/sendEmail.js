const nodemailer = require("nodemailer");

/**
 * Sends an email if SMTP credentials are configured in .env.
 * Otherwise, falls back to logging the email content to the console
 * (useful for local development/testing of password reset flows).
 */
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    console.log("=================== EMAIL (DEV MODE) ===================");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Body:", html);
    console.log("==========================================================");
    return { simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { simulated: false };
};

module.exports = sendEmail;
