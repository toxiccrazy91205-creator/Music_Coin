export async function sendEmail(to: string, subject: string, text: string) {
  // In a real application, you would use SendGrid, Postmark, AWS SES, etc.
  console.log(`[Email Simulator] Sending email to ${to}`);
  console.log(`[Email Simulator] Subject: ${subject}`);
  console.log(`[Email Simulator] Body: ${text}`);
  return true;
}
