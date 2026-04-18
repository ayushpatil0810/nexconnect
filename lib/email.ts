import nodemailer from "nodemailer";

export async function sendVerificationEmail(to: string, magicLink: string) {
  let transporter;

  // Use environment variables if provided (Production)
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT) || 2525;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // Port 465 = implicit SSL (secure:true), everything else = STARTTLS (secure:false)
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Needed on Windows where OpenSSL may reject Mailtrap's self-signed cert
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      logger: true,
      debug: true,
    });
  } else {
    // Fallback: Generate a testing account on Ethereal (Development)
    console.warn("⚠️ No SMTP credentials found. Using Ethereal Email for testing.");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-w-md mx-auto p-6 bg-white border rounded shadow-sm">
      <h2 style="color: #333;">Verify your Corporate Email</h2>
      <p>Hello,</p>
      <p>You requested to verify your work email address for NexConnect. This will increase your identity confidence and trust score across the network.</p>
      <div style="margin: 30px 0; text-align: center;">
        <a href="${magicLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Verify Email Address
        </a>
      </div>
      <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="font-size: 12px; color: #666; word-break: break-all;">${magicLink}</p>
      <p style="font-size: 12px; color: #999; margin-top: 40px;">This link expires in 15 minutes.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || '"NexConnect Verification" <verify@nexconnect.app>',
    to,
    subject: "Verify your NexConnect Work Email",
    html: htmlContent,
  });

  // If using ethereal, log the URL to view the email
  if (!process.env.SMTP_HOST) {
    console.log("💌 [DEV MODE] Preview your verification email here: %s", nodemailer.getTestMessageUrl(info));
  }

  return info;
}
