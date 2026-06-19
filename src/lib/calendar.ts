/**
 * TimeVault - ICS Calendar Reminder Generator
 * Pure frontend, zero backend dependency
 */

/**
 * Generate iCalendar format reminder file
 */
export function generateICSReminder(
  unlockTime: Date,
  title: string = 'TimeVault Message Unlock',
  description?: string
): string {
  const now = new Date();

  const formatICalDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const uid = `timevault-${Date.now()}-${Math.random().toString(36).substring(2, 10)}@github.io`;

  const defaultDesc = `Your TimeVault sealed message is now unlockable.

To reveal it:
1. Find your sealed photo (the PNG file you downloaded from TimeVault)
2. Visit https://timevault.online/
3. Upload your photo and enter your 4-digit PIN

Remember: TimeVault stores nothing. If you lose the photo or forget your PIN, the message is gone forever.`;

  const desc = description || defaultDesc;

  const nowTs = now.getTime();
  const unlockTs = unlockTime.getTime();
  const has24hReminder = unlockTs - 24 * 60 * 60 * 1000 > nowTs;
  const has1hReminder = unlockTs - 60 * 60 * 1000 > nowTs;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TimeVault//Reminder//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTAMP:${formatICalDate(now)}
DTSTART:${formatICalDate(unlockTime)}
DTEND:${formatICalDate(new Date(unlockTs + 60 * 60 * 1000))}
SUMMARY:${escapeICalText(title)}
DESCRIPTION:${escapeICalText(desc)}
UID:${uid}
STATUS:CONFIRMED${has24hReminder ? `
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TimeVault Reminder - 24 Hours
TRIGGER:-PT24H
END:VALARM` : ''}${has1hReminder ? `
BEGIN:VALARM
ACTION:DISPLAY
DESCRIPTION:TimeVault Reminder - 1 Hour
TRIGGER:-PT1H
END:VALARM` : ''}
END:VEVENT
END:VCALENDAR`;
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Download ICS reminder file
 */
export function downloadICSReminder(unlockTime: Date, title?: string): void {
  const icsContent = generateICSReminder(unlockTime, title);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `timevault-reminder-${unlockTime.getTime()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar direct link
 */
export function getGoogleCalendarLink(
  unlockTime: Date,
  title: string = 'TimeVault Message Unlock'
): string {
  const formatDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const desc = encodeURIComponent(
    `Your TimeVault sealed message is now unlockable.\n\nVisit https://timevault.online/ to reveal it with your sealed photo and PIN.`
  );

  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${formatDate(unlockTime)}/${formatDate(new Date(unlockTime.getTime() + 60 * 60 * 1000))}` +
    `&details=${desc}`
  );
}
