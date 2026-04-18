import { sendVerificationEmail } from "./lib/email";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

async function testEmail() {
  try {
    console.log("Using SMTP_HOST:", process.env.SMTP_HOST);
    console.log("Using SMTP_USER:", process.env.SMTP_USER);
    
    await sendVerificationEmail("test@example.com", "http://localhost:3000/verify/work-email?token=123");
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

testEmail();
