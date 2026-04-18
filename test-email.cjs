require("dotenv").config({ path: ".env" });
const nodemailer = require("nodemailer");

async function testEmail() {
  console.log("SMTP_HOST:", process.env.SMTP_HOST);
  console.log("SMTP_USER:", process.env.SMTP_USER);

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      logger: true,
      debug: true
    });

    const info = await transporter.sendMail({
      from: '"Test" <test@example.com>',
      to: "user@example.com",
      subject: "Test Ticket Email",
      text: "This is a test ticket email.",
    });

    console.log("SUCCESS:", info.messageId);
  } catch (err) {
    console.error("FAILED:", err);
  }
}

testEmail();
