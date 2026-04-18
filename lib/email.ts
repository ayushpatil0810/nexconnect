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

export async function sendTicketEmail(to: string, userName: string, eventTitle: string, ticketId: string, eventDate: string, eventLocation: string) {
  let transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT) || 2525;
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000,
    });
  } else {
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

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticketId)}`;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 10px; text-align: center;">
      <h2 style="color: #333; margin-bottom: 5px;">Your Event Ticket</h2>
      <p style="color: #666; margin-top: 0;">${eventTitle}</p>
      
      <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">TICKET ID</p>
        <h3 style="margin: 0 0 20px 0; color: #000; letter-spacing: 2px;">${ticketId}</h3>
        
        <img src="${qrUrl}" alt="Ticket QR Code" style="width: 150px; height: 150px; border: 4px solid #fff; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);" />
      </div>

      <div style="text-align: left; margin-top: 20px;">
        <p><strong>Name:</strong> ${userName}</p>
        <p><strong>Date:</strong> ${eventDate}</p>
        <p><strong>Location:</strong> ${eventLocation}</p>
      </div>
      
      <p style="margin-top: 30px; font-size: 12px; color: #999;">Please present this QR code or Ticket ID at the event entrance.</p>
    </div>
  `;

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM_EMAIL || '"NexConnect Events" <events@nexconnect.app>',
    to,
    subject: `Your Ticket: ${eventTitle}`,
    html: htmlContent,
  });

  // Since SMTP might be blocked by local ISPs during development, always log the ticket link so it's accessible.
  console.log("\n=======================================================");
  console.log(`🎫 TICKET GENERATED FOR: ${to}`);
  console.log(`🔗 VIEW TICKET: http://localhost:3000/events/ticket/${ticketId}`);
  console.log("=======================================================\n");

  if (!process.env.SMTP_HOST) {
    console.log("💌 [DEV MODE] Preview your ticket email here: %s", nodemailer.getTestMessageUrl(info));
  }

  return info;
}
