export interface EmailResult {
  success: boolean;
  messageId: string;
  timestamp: number;
}

/**
 * Mock SEND_EMAIL activity
 */
export async function sendEmail(
  to: string,
  subject: string,
  body: string
): Promise<EmailResult> {
  console.log(`📧 Mock sending email to ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body: ${body}`);
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    messageId: 'mock-message-id',
    timestamp: Date.now()
  };
}

/**
 * WAIT activity (can be called, but workflow can also use Temporal timers)
 */
export async function wait(seconds: number) {
  console.log(`⏱ Waiting for ${seconds} seconds`);
  // No-op; workflow will use Temporal sleep timer
}