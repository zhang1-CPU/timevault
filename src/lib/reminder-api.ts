/**
 * TimeVault Email Reminder Service - Frontend API
 * 
 * Set a reminder email that will be sent 24 hours and 1 hour before unlock time.
 * Backend stores ONLY email and unlock time. No message content, no photo, no PIN.
 */

// Update this to your Cloudflare Worker URL after deployment
const API_BASE = 'https://timevault-reminders.YOUR_SUBDOMAIN.workers.dev';

/**
 * Set an email reminder for a time-locked message.
 * @param email User's email address
 * @param unlockTime When the message becomes unlockable
 */
export async function setEmailReminder(
  email: string,
  unlockTime: Date
): Promise<{ success: boolean; message: string }> {
  if (!isReminderConfigured()) {
    return {
      success: false,
      message: 'Email reminder service not yet configured. Please use the calendar reminders instead.',
    };
  }

  try {
    const response = await fetch(`${API_BASE}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.trim(),
        unlockTime: Math.floor(unlockTime.getTime() / 1000),
      }),
    });

    const data = await response.json().catch(() => ({ error: 'Invalid server response' }));

    if (!response.ok) {
      throw new Error(data.error || 'Failed to set reminder');
    }

    return data;
  } catch (err) {
    throw new Error(err instanceof Error ? err.message : 'Network error - please try again');
  }
}

/**
 * Check if the reminder API is configured
 */
export function isReminderConfigured(): boolean {
  return !API_BASE.includes('YOUR_SUBDOMAIN');
}
